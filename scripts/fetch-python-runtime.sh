#!/usr/bin/env bash
# Sprint 089 — fetch and consolidate the Python runtime for the packaged .app.
#
# Design anchor:
#   process/planning/RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md
#   process/sprints/sprint-089-mac-packaging-per-apple-rules.md
#
# The script:
#   1. Downloads a pinned python-build-standalone release.
#   2. Builds the kernel wheel from ../substrate and installs it into site-packages
#      (Sprint 100: from the commit, never from PyPI).
#   3. Consolidates the stdlib into a single lib/python${PY_NODOT}.zip archive
#      via CPython's default zipimport convention (Apple docs on
#      minimizing file count; local test 2026-09-28 confirmed CPython
#      puts <prefix>/lib/python${PY_NODOT}.zip on sys.path).
#   4. Keeps every .so extension module where Python's import
#      machinery expects it — accepting Apple's "dylibs live in
#      Contents/Frameworks" placement deviation for the first pass
#      (Sprint 089 B2). Symlink relocation is the follow-up if a
#      specific notary or codesign error demands it.
#
# The runtime lands at build/python/. electron-builder copies that
# tree into Contents/Resources/python/ inside the .app.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO/build/python"

# The bundled interpreter matches the one source mode runs
# (`uv run python` in ../substrate resolves CPython 3.14.4). Review
# 2026-09-28 § F3: the packaged backend ran 3.13.7 while source ran
# 3.14.4. Bump PY_VER together with the dev interpreter, never alone.
PY_TAG="20260414"
PY_VER="3.14.4"
PY_MINOR="${PY_VER%.*}"            # 3.14
PY_NODOT="${PY_MINOR/./}"          # 314
ARCH="aarch64-apple-darwin"
FLAVOR="install_only_stripped"
ASSET="cpython-${PY_VER}+${PY_TAG}-${ARCH}-${FLAVOR}.tar.gz"
URL="https://github.com/astral-sh/python-build-standalone/releases/download/${PY_TAG}/${ASSET}"

# The substrate checkout source mode runs against. Its uv.lock is the
# dependency set the packaged runtime installs (review § F3).
SUBSTRATE_REPO="$(cd "$REPO/../substrate" && pwd)"

DEV_PY_VER="$(cd "$SUBSTRATE_REPO" && uv run --frozen python -c 'import platform; print(platform.python_version())')"
if [ "$DEV_PY_VER" != "$PY_VER" ]; then
  echo "[fetch-python-runtime] source mode runs Python $DEV_PY_VER; this script bundles $PY_VER. Update PY_VER/PY_TAG to match." >&2
  exit 1
fi

# Sprint 100: the kernel comes from the ../substrate commit, not from PyPI. Sprint 089 pinned
# substrate-kernel==<version> from PyPI, so the app could only be built, tested and installed
# with kernel code that had already been published: testing waited on a release. Humble &
# Farley, Continuous Delivery (2010), ch. 5: the deployment pipeline starts from version
# control, and publishing is a later, separate step. PyPI is how other people get the kernel
# library; it is not an input to this app.
#
#   clean ../substrate (src/ and pyproject.toml): the wheel is built from `git archive HEAD`,
#     so it holds exactly the committed kernel. Releasable.
#   uncommitted kernel edits: the wheel is built from the working tree, so a packaged build of
#     work in progress can be tested; the runtime is marked VERIFICATION_BUILD and
#     scripts/release.sh refuses it.
KERNEL_COMMIT="$(git -C "$SUBSTRATE_REPO" rev-parse HEAD)"
KERNEL_VERSION="$(grep -E '^version = ' "$SUBSTRATE_REPO/pyproject.toml" | cut -d'"' -f2)"
KERNEL_DIRTY="$(git -C "$SUBSTRATE_REPO" status --porcelain -- src/ pyproject.toml)"
WHEEL_TMP="$(mktemp -d -t substrate-wheel-XXXXXX)"
if [ -z "$KERNEL_DIRTY" ]; then
  mkdir -p "$WHEEL_TMP/src"
  git -C "$SUBSTRATE_REPO" archive --format=tar HEAD | tar -x -C "$WHEEL_TMP/src"
  ( cd "$WHEEL_TMP/src" && uv build --wheel --quiet -o "$WHEEL_TMP/dist" )
  KERNEL_RELEASABLE=true
else
  echo "[fetch-python-runtime] VERIFICATION BUILD: ../substrate has uncommitted kernel changes; building from the working tree. Not releasable:" >&2
  echo "$KERNEL_DIRTY" >&2
  ( cd "$SUBSTRATE_REPO" && uv build --wheel --quiet -o "$WHEEL_TMP/dist" )
  KERNEL_RELEASABLE=false
fi
KERNEL_WHEEL="$(ls "$WHEEL_TMP"/dist/*.whl)"

echo "[fetch-python-runtime] target: $OUT"
echo "[fetch-python-runtime] runtime: $ASSET"
echo "[fetch-python-runtime] substrate: kernel $KERNEL_VERSION at ${KERNEL_COMMIT:0:12} (releasable: $KERNEL_RELEASABLE)"

# 1. Fresh tree.
rm -rf "$OUT"
mkdir -p "$OUT"

# 2. Download + extract python-build-standalone.
TARBALL="$(mktemp -t pbs-XXXXXX).tar.gz"
trap 'rm -rf "$TARBALL" "$WHEEL_TMP"' EXIT
curl -fL --retry 3 --retry-delay 2 -o "$TARBALL" "$URL"
tar -xzf "$TARBALL" -C "$OUT" --strip-components=1

PY="$OUT/bin/python3"
[ -x "$PY" ] || { echo "[fetch-python-runtime] extracted tree missing bin/python3" >&2; exit 1; }

# 3. Install the locked runtime dependencies, then the kernel, both
#    with --no-deps so pip resolves nothing on its own. The lock export
#    is substrate's runtime set plus the `openai-compat` extra: that
#    extra carries httpx, which substrate/adapters/models.py:345
#    imports unconditionally on the first live-driver turn (found by
#    the packaged smoke 2026-09-28). Before this, `pip install
#    substrate-kernel httpx` resolved whatever PyPI served on build
#    day — python-ulid 4.0.1 against source mode's locked 3.1.0.
REQS="$(mktemp -t substrate-reqs-XXXXXX).txt"
( cd "$SUBSTRATE_REPO" && uv export --frozen --no-dev --no-emit-project \
    --extra openai-compat --no-hashes --format requirements-txt ) > "$REQS"
echo "[fetch-python-runtime] locked requirements: $(grep -c '==' "$REQS") pins from $SUBSTRATE_REPO/uv.lock"
"$PY" -m pip install --no-cache-dir --no-deps -r "$REQS"
"$PY" -m pip install --no-cache-dir --no-deps "$KERNEL_WHEEL"
# Provenance travels inside the bundle (Contents/Resources/python/KERNEL_SOURCE);
# electron-builder.config.js copies it into Info.plist.
printf '{"commit": "%s", "version": "%s", "releasable": %s}\n' \
  "$KERNEL_COMMIT" "$KERNEL_VERSION" "$KERNEL_RELEASABLE" > "$OUT/KERNEL_SOURCE"
if [ "$KERNEL_RELEASABLE" != true ]; then
  echo "verification build: uncommitted kernel changes on top of $KERNEL_COMMIT" > "$OUT/VERIFICATION_BUILD"
fi
"$PY" -m pip check
rm -f "$REQS"

# 4. Purge install-only content and byte-caches.
SP="$OUT/lib/python${PY_MINOR}/site-packages"
rm -rf "$SP/pip" "$SP"/pip-*.dist-info
find "$OUT" -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null
find "$OUT" -type d \( -name "tests" -o -name "test" \) -prune -exec rm -rf {} + 2>/dev/null

# 5. Consolidate the stdlib into a single python${PY_NODOT}.zip archive.
#    CPython's default site.py picks up <install>/lib/python${PY_NODOT}.zip
#    on sys.path automatically. Preserve directory structure inside
#    the zip; exclude site-packages (handled below), lib-dynload
#    (contains .so files that zipimport cannot load), tests, idlelib,
#    turtledemo.
STDLIB="$OUT/lib/python${PY_MINOR}"
# Precompile before zipping (UI sprint 097). The packaged backend recompiled every module on every
# launch: no .pyc shipped and PYTHONDONTWRITEBYTECODE forbids writing one (Apple: a write inside the
# bundle breaks the seal). Measured 0.52 s to port readback packaged vs 0.10 s in source. zipimport
# only reads LEGACY .pyc files sitting beside their source (-b); unchecked-hash = no mtime checks.
"$PY" -m compileall -q -b -j 0 --invalidation-mode unchecked-hash -x "/(test|tests|idlelib|turtledemo)/" "$STDLIB" >/dev/null || true
( cd "$STDLIB" && zip -q -r "$OUT/lib/python${PY_NODOT}.zip" . \
    -x "site-packages/*" "lib-dynload/*" "*__pycache__/*" \
       "test/*" "tests/*" "idlelib/*" "turtledemo/*" )
# Remove the .py sources that just got archived; preserve
# site-packages/ and lib-dynload/ (each stays loose on disk).
for d in $(ls -1 "$STDLIB" | grep -v "^site-packages$" | grep -v "^lib-dynload$"); do
  rm -rf "$STDLIB/$d"
done
find "$STDLIB" -maxdepth 1 -type f -name "*.py" -delete 2>/dev/null

# 6. Consolidate pure-Python site-packages into a single _bundle.zip
#    inside site-packages/, added to sys.path via a .pth file. Two
#    packages stay LOOSE on disk:
#
#      - msgspec: ships a .so C-extension; zipimport cannot dlopen .so
#        files, so it has to be a real directory.
#      - substrate: ships role prompts and other package-data .md
#        files that the runtime reads via
#        `Path(substrate.__file__).parent / "topologies/session/prompts/..."`.
#        `pathlib.Path` cannot descend into a zip archive, so the
#        lookup fails with `no role prompt found for --role 'default'`
#        the moment the packaged .app tries to open a live session.
#        Found 2026-09-28 via packaged_app_smoke: POST /api/session
#        returned 400 with the "Looked in: .../_bundle.zip/substrate/
#        topologies/session/prompts/" message. Keep substrate loose
#        until it grows an importlib.resources-based prompt loader.
KEEP="$(mktemp -d)"
mv "$SP/msgspec" "$KEEP/msgspec"
mv "$SP"/msgspec-*.dist-info "$KEEP/"
mv "$SP/substrate" "$KEEP/substrate"
mv "$SP"/substrate_kernel-*.dist-info "$KEEP/"
"$PY" -m compileall -q -b -j 0 --invalidation-mode unchecked-hash "$SP" >/dev/null || true
( cd "$SP" && zip -q -r ./_bundle.zip . -x "_bundle.zip" )
for entry in $(ls -1 "$SP" | grep -v "^_bundle.zip$"); do
  rm -rf "$SP/$entry"
done
mv "$KEEP/msgspec" "$SP/msgspec"
mv "$KEEP"/msgspec-*.dist-info "$SP/"
mv "$KEEP/substrate" "$SP/substrate"
mv "$KEEP"/substrate_kernel-*.dist-info "$SP/"
rmdir "$KEEP"
echo "_bundle.zip" > "$SP/_bundle.pth"

# 7. Report + smoke.
SIZE="$(du -sh "$OUT" | awk '{print $1}')"
COUNT="$(find "$OUT" -type f | wc -l | tr -d ' ')"
echo "[fetch-python-runtime] ready — $SIZE, $COUNT files at $OUT"
"$PY" -c "import substrate, msgspec, rich, click, pygments; import ulid; from markdown_it import MarkdownIt; import rfc8785; print('imports ok:', substrate.__file__)"

# 8. Reachable-import gate. Every adapter module in the bundled runtime
#    must import cleanly against the bundled site-packages — this is the
#    check that would have caught the 2026-09-28 httpx-under-extras trap
#    at pack time instead of at packaged-smoke time. `substrate.adapters`
#    is the module the live-driver turn crosses first; if any of its
#    files raise ImportError against this runtime, the packaged .app's
#    daemon will 500 on the first turn and the transcript stays empty.
#    Fail loudly here; the packaged smoke is the last line of defense,
#    not the first.
PYTHONDONTWRITEBYTECODE=1 "$PY" -c "
import importlib, pkgutil, substrate.adapters, sys
failed = []
for m in pkgutil.walk_packages(substrate.adapters.__path__, substrate.adapters.__name__ + '.'):
    try:
        importlib.import_module(m.name)
    except Exception as e:
        failed.append((m.name, type(e).__name__ + ': ' + str(e)))
if failed:
    sys.stderr.write('[fetch-python-runtime] REACHABLE-IMPORT GATE FAILED:\n')
    for name, err in failed:
        sys.stderr.write('  ' + name + ' -> ' + err + '\n')
    sys.exit(1)
print('[fetch-python-runtime] adapters import gate ok (' + str(sum(1 for _ in pkgutil.walk_packages(substrate.adapters.__path__, substrate.adapters.__name__ + '.'))) + ' modules)')
"

# 9. Final __pycache__ sweep. The earlier prune (step 4) ran before
# the import-gate imports, which write .pyc files back into the tree
# (unless PYTHONDONTWRITEBYTECODE is set at INTERPRETER LEVEL — the
# smoke-import above sets it and does not write, but the initial pip
# install + the metadata-only imports do). Second sweep guarantees
# the bundle ships without .pyc files, so the code signature covers
# the exact bytes Python will read at first run. Review 2026-09-28
# § F10 bundle hygiene.
find "$OUT" -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true

# 10. Bytecode for the packages that stay loose on disk (substrate, msgspec), written AFTER the
# sweep so it survives. __pycache__ layout (their .py files are present), unchecked-hash so Python
# never rewrites them; the code signature then covers exactly these files.
PYTHONDONTWRITEBYTECODE=1 "$PY" -m compileall -q -j 0 --invalidation-mode unchecked-hash "$SP/substrate" "$SP/msgspec" >/dev/null
echo "[fetch-python-runtime] precompiled: $(find "$OUT" -name '*.pyc' | wc -l | tr -d ' ') .pyc files (plus those inside the zips)"

# 11. Code placement per Apple's "Placing Content in a Bundle" (review 2026-09-28 F10; quoted in
# process/planning/RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md): Mach-O
# code does not belong in Contents/Resources. Tcl/Tk (tkinter only; nothing here imports it) is
# dropped. Every remaining Mach-O file moves to build/python-native/ (shipped to
# Contents/Frameworks/python-native/), with bin/ and lib/ kept as siblings so the interpreter's
# @rpath (@executable_path/../lib) still finds libpython, and no dotted directory names (codesign
# treats `name.ext` directories as bundles). A relative symlink stays at each old path, so Python's
# import system is unchanged. electron/main.js sets PYTHONHOME to Resources/python because the
# interpreter, resolved through its symlink, now lives elsewhere.
NATIVE="$REPO/build/python-native"
rm -rf "$NATIVE"
find "$OUT/lib" -maxdepth 1 \( -name 'libtcl*' -o -name 'libtk*' -o -name 'tcl9*' -o -name 'tk9*' -o -name 'thread*' -o -name 'itcl*' -o -name 'tcl8*' -o -name 'tk8*' \) -exec rm -rf {} +
find "$OUT" -name '_tkinter*.so' -delete
"$PY" - "$OUT" "$NATIVE" <<'PYEOF'
import os, re, subprocess, sys
from pathlib import Path
out, native = Path(sys.argv[1]), Path(sys.argv[2])
moved = 0
for f in sorted(p for p in out.rglob("*") if p.is_file() and not p.is_symlink()):
    head = f.open("rb").read(4)
    if head not in (b"\xcf\xfa\xed\xfe", b"\xca\xfe\xba\xbe", b"\xfe\xed\xfa\xcf"):  # Mach-O magics
        continue
    rel = f.relative_to(out)
    # flatten lib/pythonX.Y/... (a dotted directory) to lib-dynload/ or site-packages/
    nrel = Path(re.sub(r"^lib/python\d+\.\d+/", "", rel.as_posix()))
    dest = native / nrel
    dest.parent.mkdir(parents=True, exist_ok=True)
    os.replace(f, dest)
    # link from Contents/Resources/python/<rel> to Contents/Frameworks/python-native/<nrel>
    link_dir = Path("Contents/Resources/python") / rel.parent
    target = os.path.relpath(Path("Contents/Frameworks/python-native") / nrel, link_dir)
    os.symlink(target, f)
    moved += 1
print(f"[fetch-python-runtime] moved {moved} Mach-O files to build/python-native (symlinked from Resources)")
PYEOF
