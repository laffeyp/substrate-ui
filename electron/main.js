// electron/main.js
// Sprint 078 — spawn-and-load skeleton.
//
// The main process spawns server.py in a detached process group,
// polls http://127.0.0.1:8765/ until it returns 200 or a 15s
// timeout, then creates a BrowserWindow with titleBarStyle:
// hiddenInset and loadURLs the reveal shell. On window-all-closed
// or before-quit, SIGTERM the whole process group (uv + python
// together), then SIGKILL after 3s if anything survives.
//
// Sprint 079 replaces the hard-coded 8765 with --port 0 + readback.

const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const PORT = 8765;
const HEALTH_TIMEOUT_MS = 15_000;
const HEALTH_POLL_MS = 200;
const KILL_GRACE_MS = 3_000;

// substrate-ui/ sits next to substrate/. The uv workspace lives in
// substrate/; we launch from there so `uv run python` resolves
// the substrate venv.
const SUBSTRATE_ROOT = path.resolve(__dirname, "..", "..", "substrate");
const SERVER_PATH = path.resolve(__dirname, "..", "server.py");

let mainWindow = null;
let serverProc = null;

function log(...args) { process.stderr.write("[electron] " + args.join(" ") + "\n"); }

function killServerGroup() {
  if (!serverProc || serverProc.killed || !serverProc.pid) return;
  const pid = serverProc.pid;
  try {
    // Negative pid targets the process group. detached: true at
    // spawn made this child the group leader; uv run python + its
    // python child come down together. Matches the pattern at
    // harness/shakeout/lib/server.ts:22-45.
    process.kill(-pid, "SIGTERM");
    setTimeout(() => {
      if (serverProc && !serverProc.killed) {
        try { process.kill(-pid, "SIGKILL"); } catch (_) { /* already gone */ }
      }
    }, KILL_GRACE_MS);
  } catch (_) { /* already gone */ }
}

function spawnServer() {
  log("spawning server: uv run python " + SERVER_PATH);
  serverProc = spawn("uv", ["run", "python", SERVER_PATH], {
    cwd: SUBSTRATE_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
  serverProc.stdout.on("data", (chunk) => process.stderr.write("[server] " + chunk));
  serverProc.stderr.on("data", (chunk) => process.stderr.write("[server-stderr] " + chunk));
  serverProc.on("exit", (code, signal) => {
    log("server exited code=" + code + " signal=" + signal);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("server:dead", { code, signal });
    }
  });
}

function pollHealth(deadline) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: "127.0.0.1", port: PORT, path: "/", timeout: 500 }, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else retry();
      });
      req.on("error", retry);
      req.on("timeout", () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() > deadline) reject(new Error("server health-check timed out after " + HEALTH_TIMEOUT_MS + "ms"));
      else setTimeout(attempt, HEALTH_POLL_MS);
    };
    attempt();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "substrate",
    backgroundColor: "#212327",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  mainWindow.loadURL("http://127.0.0.1:" + PORT + "/?atom-transcript=1");
  if (process.env.SUBSTRATE_UI_DEBUG === "1") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(async () => {
  spawnServer();
  try {
    await pollHealth(Date.now() + HEALTH_TIMEOUT_MS);
    log("server up on http://127.0.0.1:" + PORT);
  } catch (err) {
    log("health-check failed: " + err.message);
    log("check that `uv` and `substrate` are on PATH (see README)");
    killServerGroup();
    app.quit();
    return;
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  killServerGroup();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", killServerGroup);
