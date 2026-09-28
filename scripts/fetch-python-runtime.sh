#!/usr/bin/env bash
# Sprint 088 — fetch a self-contained Python runtime for the packaged
# .app. Downloads a pinned python-build-standalone release from
# github.com/astral-sh/python-build-standalone, extracts under
# build/python/, and installs substrate + its runtime deps into a
# venv inside the runtime tree. The .app's `Contents/Resources/python/`
# is a copy of this tree, referenced by electron/main.js at spawn
# time.
#
# The download tag is pinned. Bumping the runtime is a deliberate
# step — edit the PY_TAG below and rerun. `install_only_stripped`
# is the smallest published shape and excludes tests/debug symbols.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO/build/python"

PY_TAG="20250918"
PY_VER="3.13.7"
ARCH="aarch64-apple-darwin"
FLAVOR="install_only_stripped"
ASSET="cpython-${PY_VER}+${PY_TAG}-${ARCH}-${FLAVOR}.tar.gz"
URL="https://github.com/astral-sh/python-build-standalone/releases/download/${PY_TAG}/${ASSET}"

# Sprint 088c — pin the substrate dependency to a published PyPI wheel.
# No sibling checkout needed; anyone building the .dmg only needs the
# substrate-ui repo. Bumping the substrate release is a two-step
# ritual: `python -m build && twine upload` in the substrate repo,
# then edit SUBSTRATE_VERSION here and rerun.
SUBSTRATE_VERSION="1.1.0"

echo "[fetch-python-runtime] target: $OUT"
echo "[fetch-python-runtime] runtime: $ASSET"
echo "[fetch-python-runtime] substrate: substrate-kernel==${SUBSTRATE_VERSION}"

# 1. Fresh tree — bundling reproducibly needs no leftover state.
rm -rf "$OUT"
mkdir -p "$OUT"

# 2. Download + extract.
TARBALL="$(mktemp -t pbs-XXXXXX).tar.gz"
trap 'rm -f "$TARBALL"' EXIT
echo "[fetch-python-runtime] fetching $URL"
curl -fL --retry 3 --retry-delay 2 -o "$TARBALL" "$URL"
tar -xzf "$TARBALL" -C "$OUT" --strip-components=1

PY="$OUT/bin/python3"
if [ ! -x "$PY" ]; then
  echo "[fetch-python-runtime] extracted tree missing bin/python3" >&2
  ls -la "$OUT/bin" >&2 || true
  exit 1
fi

# 3. Install substrate into the runtime's site-packages from PyPI. No
#    separate venv — python-build-standalone binaries are relocatable
#    and already isolated from the host's Python. Pinning the wheel
#    from PyPI (not the sibling source tree) makes the .dmg build
#    reproducible: everyone who runs this script installs the same
#    bytes.
echo "[fetch-python-runtime] installing substrate-kernel==${SUBSTRATE_VERSION} + deps"
"$PY" -m pip install --upgrade pip
"$PY" -m pip install "substrate-kernel==${SUBSTRATE_VERSION}"
# `msgspec` is a substrate runtime dep and ships a .so for arm64.
# The install above pulls it in; the .so lives in
# lib/python3.13/site-packages/msgspec/*.so and gets codesigned by
# electron-builder because osx-sign walks every binary under
# Contents/Resources/.

# 4. Slim: drop obvious dead weight to shrink the .app.
find "$OUT" -type d -name "__pycache__" -prune -exec rm -rf {} +
find "$OUT" -type d -name "tests" -prune -exec rm -rf {} +
find "$OUT" -type d -name "test" -prune -exec rm -rf {} +

SIZE="$(du -sh "$OUT" | awk '{print $1}')"
echo "[fetch-python-runtime] runtime ready — $SIZE at $OUT"
