#!/usr/bin/env bash
# Sprint 089 — fetch and consolidate the Python runtime for the packaged .app.
#
# Design anchor:
#   process/planning/RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md
#   process/sprints/sprint-089-mac-packaging-per-apple-rules.md
#
# The script:
#   1. Downloads a pinned python-build-standalone release.
#   2. Installs substrate-kernel==1.1.0 from PyPI into site-packages.
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

SUBSTRATE_VERSION="1.1.0"
# The substrate checkout source mode runs against. Its uv.lock is the
# dependency set the packaged runtime installs (review § F3).
SUBSTRATE_REPO="$(cd "$REPO/../substrate" && pwd)"

DEV_PY_VER="$(cd "$SUBSTRATE_REPO" && uv run --frozen python -c 'import platform; print(platform.python_version())')"
if [ "$DEV_PY_VER" != "$PY_VER" ]; then
  echo "[fetch-python-runtime] source mode runs Python $DEV_PY_VER; this script bundles $PY_VER. Update PY_VER/PY_TAG to match." >&2
  exit 1
fi
# The PyPI wheel must be the code source mode runs. Source mode imports
# ../substrate/src; refuse to bundle v$SUBSTRATE_VERSION if that tree
# has moved past the tag.
DRIFT="$(git -C "$SUBSTRATE_REPO" rev-list --count "v${SUBSTRATE_VERSION}..HEAD" -- src/)"
if [ "$DRIFT" != "0" ]; then
  echo "[fetch-python-runtime] ../substrate/src has $DRIFT commit(s) past v${SUBSTRATE_VERSION}; source mode runs code the PyPI wheel lacks. Release and bump SUBSTRATE_VERSION first." >&2
  exit 1
fi

echo "[fetch-python-runtime] target: $OUT"
echo "[fetch-python-runtime] runtime: $ASSET"
echo "[fetch-python-runtime] substrate: substrate-kernel==${SUBSTRATE_VERSION}"

# 1. Fresh tree.
rm -rf "$OUT"
mkdir -p "$OUT"

# 2. Download + extract python-build-standalone.
TARBALL="$(mktemp -t pbs-XXXXXX).tar.gz"
trap 'rm -f "$TARBALL"' EXIT
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
"$PY" -m pip install --no-cache-dir --no-deps "substrate-kernel==${SUBSTRATE_VERSION}"
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
