// harness/electron_spike/main.js
//
// The Sprint 077 Electron spike's tiny app. Proves the shape Phase 9
// needs before Sprint 078 rewrites electron/main.js in earnest:
//
//   - Electron main can spawn a long-running subprocess in a detached
//     process group and clean-kill the whole group on window-close.
//   - Playwright's _electron.launch can drive the app and observe the
//     window and the subprocess lifecycle.
//
// The subprocess here is `sleep 30`. The plan (Sprint 078) replaces
// it with `uv run python server.py --port 0`. Everything else in the
// spawn/kill shape is the same.

const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");

let win = null;
let child = null;

function killChildGroup() {
  if (!child || child.killed) return;
  try {
    // Negative pid signals the whole process group. Matches the
    // pattern harness/shakeout/lib/server.ts:22-45 uses to take
    // down `uv run python` plus its Python child together.
    process.kill(-child.pid, "SIGTERM");
    setTimeout(() => {
      if (child && !child.killed) {
        try { process.kill(-child.pid, "SIGKILL"); } catch (_) { /* already gone */ }
      }
    }, 3000);
  } catch (_) { /* already gone */ }
}

app.whenReady().then(() => {
  child = spawn("sleep", ["30"], { detached: true, stdio: "ignore" });
  // Print the child PID to stdout so the driver can `ps -p` it.
  process.stdout.write("spike child_pid=" + child.pid + "\n");

  win = new BrowserWindow({
    width: 400,
    height: 200,
    show: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  win.loadURL("data:text/html;charset=utf-8," +
    encodeURIComponent("<!doctype html><meta charset='utf-8'><title>Spike</title><body style='background:#212327;color:#e2e5e9;font:14px system-ui;margin:0;padding:16px'>Electron spike window — spawned child, waiting for close.</body>"));
});

app.on("window-all-closed", () => {
  killChildGroup();
  app.quit();
});

app.on("before-quit", killChildGroup);
