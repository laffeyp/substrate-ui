#!/usr/bin/env bash
# Deterministic Electron + server restart. Every change goes down and
# back up as one atomic operation — no half-alive processes, no stale
# window fooling the developer.
#
# Why this exists: electron/main.js calls
# app.requestSingleInstanceLock() (line 196). A stray Electron process
# from an earlier launch holds the lock; a new `npm run electron` then
# fails the lock and exits, leaving the old window. This script kills
# every Electron and every substrate-ui server.py rooted at THIS
# repo's node_modules path (not any other Electron app on the box),
# waits for the ports to clear, then launches one fresh instance.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
ELECTRON_PATH="$REPO/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
SERVER_PATH="$REPO/server.py"
LOG="/tmp/substrate-ui-electron.log"

echo "[relaunch] repo: $REPO"

# 1. Kill every process rooted at THIS repo.
kill_matching() {
  local pattern="$1"
  local pids
  pids="$(pgrep -f "$pattern" || true)"
  if [ -n "$pids" ]; then
    echo "[relaunch] killing pattern='$pattern' pids: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
}

kill_matching "$ELECTRON_PATH"
kill_matching "$SERVER_PATH"
kill_matching "npm exec electron"
kill_matching "electron/cli.js"

# 2. Wait for everything to actually be gone.
for i in $(seq 1 30); do
  if ! pgrep -f "$ELECTRON_PATH" >/dev/null 2>&1 \
     && ! pgrep -f "$SERVER_PATH" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

REMAIN_E="$( { pgrep -f "$ELECTRON_PATH" 2>/dev/null || true; } | wc -l | tr -d ' ')"
REMAIN_S="$( { pgrep -f "$SERVER_PATH" 2>/dev/null || true; } | wc -l | tr -d ' ')"
if [ "$REMAIN_E" != "0" ] || [ "$REMAIN_S" != "0" ]; then
  echo "[relaunch] FAILED to kill all: electron=$REMAIN_E server=$REMAIN_S" >&2
  pgrep -fla "$ELECTRON_PATH" 2>&1 || true
  pgrep -fla "$SERVER_PATH" 2>&1 || true
  exit 1
fi
echo "[relaunch] clean state confirmed"

# 3. Launch fresh. Redirect all output to the log; disown so the shell
#    returns immediately. Boot-scan runs in the background inside
#    server.py, so the window paints within ~500ms of this line.
: > "$LOG"
cd "$REPO"
nohup npm run electron > "$LOG" 2>&1 < /dev/null &
disown
echo "[relaunch] launched; log: $LOG"

# 4. Wait for the port readback so a subsequent `open` won't race.
for i in $(seq 1 100); do
  if grep -q "server up on http" "$LOG" 2>/dev/null; then
    grep "port=" "$LOG" | head -1
    echo "[relaunch] up"
    exit 0
  fi
  sleep 0.1
done
echo "[relaunch] server did not come up within 10s — see $LOG" >&2
tail -20 "$LOG" >&2 || true
exit 1
