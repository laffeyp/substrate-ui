#!/usr/bin/env bash
# Sprint 098 — one release command: build once, test that build, install that build.
#
# Humble & Farley, Continuous Delivery (2010), ch. 5: "only build your binaries once" and
# promote the same artifact through every stage. Apple TN2206: a change to a signed bundle
# breaks its seal, so nothing here edits a bundle after it is signed.
#
#   scripts/release.sh                 build + sign + gates (no notarization, no install)
#   scripts/release.sh --notarize      ... and submit to Apple's notary
#   scripts/release.sh --install       ... and replace /Applications/Substrate.app with this build
#
# Stages, each a hard gate:
#   1. both trees clean (substrate-ui; substrate/src)
#   2. tests: substrate-ui pytest, generated envelope kinds current, tsc + eslint + vite build,
#      client unit specs (test:unit)
#   3. bundled runtime (scripts/fetch-python-runtime.sh: Python + the kernel wheel built from
#      ../substrate's HEAD; sprint 100: no PyPI release needed to build, test or install)
#   4. electron-builder: sign (and notarize with --notarize); commits recorded in Info.plist
#   5. codesign --verify --deep --strict on the built bundle
#   6. smoke:packaged (real-model turn, Structure, quit), shakeout:packaged (Axis A) and the
#      lifecycle gates (close/Dock-click, deep link, startup-failure dialog) and the transcript
#      scroll gate (follow / read / resume / view switch) against THAT bundle
#   7. --install: quit the running app, move the old bundle to the Trash, copy this one in,
#      verify its signature where it landed
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
KERNEL="$(cd "$REPO/../substrate" && pwd)"
APP="$REPO/dist-electron/mac-arm64/Substrate.app"
NOTARIZE=false
INSTALL=false
for arg in "$@"; do
  case "$arg" in
    --notarize) NOTARIZE=true ;;
    --install) INSTALL=true ;;
    *) echo "release: unknown argument $arg" >&2; exit 2 ;;
  esac
done
say() { echo "[release] $*"; }
LOG_DIR="$REPO/runs/packaged"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"

say "1/7 clean trees"
# runs/packaged/ and captures/ hold this script's own logs and gate reports, not source
UI_DIRTY="$(git -C "$REPO" status --porcelain -- . ':!runs/packaged' ':!captures')"
K_DIRTY="$(git -C "$KERNEL" status --porcelain -- src/ pyproject.toml)"
if [ -n "$UI_DIRTY" ] || [ -n "$K_DIRTY" ]; then
  echo "[release] refusing: a release builds from commits, not a working tree." >&2
  [ -n "$UI_DIRTY" ] && { echo "  substrate-ui:" >&2; echo "$UI_DIRTY" | sed 's/^/    /' >&2; }
  [ -n "$K_DIRTY" ] && { echo "  substrate (src/, pyproject.toml):" >&2; echo "$K_DIRTY" | sed 's/^/    /' >&2; }
  exit 1
fi
export SUBSTRATE_UI_COMMIT="$(git -C "$REPO" rev-parse HEAD)"
KERNEL_COMMIT="$(git -C "$KERNEL" rev-parse HEAD)"
say "    substrate-ui $SUBSTRATE_UI_COMMIT, kernel $KERNEL_COMMIT"

say "2/7 tests and web build"
(cd "$REPO" && uv run --project "$KERNEL" python scripts/gen_kinds.py --check)
(cd "$REPO" && uv run --project "$KERNEL" python -m pytest tests/ -q -p no:cacheprovider)
(cd "$REPO" && npm run build)
(cd "$REPO" && npm run test:unit)  # UI sprint 101: the client specs had no gate

say "3/7 bundled runtime"
(cd "$REPO" && bash scripts/fetch-python-runtime.sh) > "$LOG_DIR/release-$STAMP-runtime.log" 2>&1 \
  || { tail -20 "$LOG_DIR/release-$STAMP-runtime.log" >&2; exit 1; }

[ -f "$REPO/build/python/VERIFICATION_BUILD" ] && { echo "[release] refusing: build/python is a verification build ($(cat "$REPO/build/python/VERIFICATION_BUILD"))" >&2; exit 1; }
grep -q "\"commit\": \"$KERNEL_COMMIT\"" "$REPO/build/python/KERNEL_SOURCE" \
  || { echo "[release] build/python/KERNEL_SOURCE does not name kernel $KERNEL_COMMIT" >&2; exit 1; }
say "4/7 electron-builder (notarize=$NOTARIZE)"
(cd "$REPO" && npx electron-builder --mac --config electron-builder.config.js -c.mac.notarize="$NOTARIZE") \
  > "$LOG_DIR/release-$STAMP-build.log" 2>&1 || { tail -30 "$LOG_DIR/release-$STAMP-build.log" >&2; exit 1; }

say "5/7 signature"
codesign --verify --deep --strict "$APP"
/usr/libexec/PlistBuddy -c "Print SubstrateUICommit" "$APP/Contents/Info.plist" | grep -qx "$SUBSTRATE_UI_COMMIT" \
  || { echo "[release] Info.plist does not record commit $SUBSTRATE_UI_COMMIT" >&2; exit 1; }
/usr/libexec/PlistBuddy -c "Print SubstrateKernelCommit" "$APP/Contents/Info.plist" | grep -qx "$KERNEL_COMMIT" \
  || { echo "[release] Info.plist does not record kernel commit $KERNEL_COMMIT" >&2; exit 1; }

say "6/7 gates against the built bundle"
(cd "$REPO" && SMOKE_APP="$APP" npx tsx harness/shakeout/packaged_app_smoke.ts) | tee "$LOG_DIR/release-$STAMP-smoke.log"
PORT="$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()')"
(cd "$REPO" && SHAKEOUT_APP="$APP" SHAKEOUT_PORT="$PORT" SHAKEOUT_AXIS=A SHAKEOUT_RUNS="${SHAKEOUT_RUNS:-1}" \
  SHAKEOUT_OUT_DIR="$LOG_DIR/release-$STAMP-shakeout" \
  npx tsx harness/shakeout/run.ts) > "$LOG_DIR/release-$STAMP-shakeout.log" 2>&1 \
  || { tail -30 "$LOG_DIR/release-$STAMP-shakeout.log" >&2; exit 1; }
(cd "$REPO" && LIFECYCLE_APP="$APP" npx tsx harness/shakeout/lifecycle_gates.ts) | tee "$LOG_DIR/release-$STAMP-lifecycle.log"
(cd "$REPO" && SCROLL_APP="$APP" npx tsx harness/shakeout/transcript_follow.ts) | tee "$LOG_DIR/release-$STAMP-scroll.log"
codesign --verify --deep --strict "$APP"  # the gates must not have written into the bundle

if [ "$INSTALL" != true ]; then
  say "7/7 skipped (no --install). Built and gated: $APP"
  exit 0
fi

say "7/7 install"
osascript -e 'tell application "Substrate" to quit' >/dev/null 2>&1 || true
for _ in $(seq 1 120); do pgrep -f "/Applications/Substrate.app/Contents/MacOS/Substrate" >/dev/null || break; sleep 0.5; done
if [ -d /Applications/Substrate.app ]; then
  OLD="$(/usr/libexec/PlistBuddy -c 'Print CFBundleVersion' /Applications/Substrate.app/Contents/Info.plist 2>/dev/null || echo unknown)"
  mv /Applications/Substrate.app "$HOME/.Trash/Substrate-$OLD-replaced-$STAMP.app"
fi
ditto "$APP" /Applications/Substrate.app
codesign --verify --deep --strict /Applications/Substrate.app
say "installed $(/usr/libexec/PlistBuddy -c 'Print CFBundleVersion' /Applications/Substrate.app/Contents/Info.plist) from $SUBSTRATE_UI_COMMIT"
