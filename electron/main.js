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
const { installMenu } = require("./menu");

// Sprint 079: --port 0 asks server.py to bind an ephemeral port.
// The bound value comes back as the first stdout line matching
// /^substrate-ui port=(\d+)$/. main() waits up to READBACK_TIMEOUT_MS
// for that line before polling the health endpoint on the parsed port.
const READBACK_TIMEOUT_MS = 5_000;
const HEALTH_TIMEOUT_MS = 15_000;
const HEALTH_POLL_MS = 200;
const KILL_GRACE_MS = 3_000;
const PORT_READBACK_RE = /^substrate-ui port=(\d+)$/m;

// substrate-ui/ sits next to substrate/. The uv workspace lives in
// substrate/; we launch from there so `uv run python` resolves
// the substrate venv.
const SUBSTRATE_ROOT = path.resolve(__dirname, "..", "..", "substrate");
const SERVER_PATH = path.resolve(__dirname, "..", "server.py");

let mainWindow = null;
let serverProc = null;
let serverPort = null;
let stdoutBuf = "";

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
  log("spawning server: uv run python " + SERVER_PATH + " --port 0");
  serverProc = spawn("uv", ["run", "python", SERVER_PATH, "--port", "0"], {
    cwd: SUBSTRATE_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
  serverProc.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    process.stderr.write("[server] " + text);
    if (serverPort === null) {
      stdoutBuf += text;
      const match = stdoutBuf.match(PORT_READBACK_RE);
      if (match) serverPort = Number(match[1]);
    }
  });
  serverProc.stderr.on("data", (chunk) => process.stderr.write("[server-stderr] " + chunk));
  serverProc.on("exit", (code, signal) => {
    log("server exited code=" + code + " signal=" + signal);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("server:dead", { code, signal });
    }
  });
}

function waitForPortReadback(deadline) {
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (serverPort !== null) resolve(serverPort);
      else if (Date.now() > deadline) reject(new Error("port readback timed out after " + READBACK_TIMEOUT_MS + "ms"));
      else setTimeout(tick, 50);
    };
    tick();
  });
}

function pollHealth(port, deadline) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: "127.0.0.1", port, path: "/", timeout: 500 }, (res) => {
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
  mainWindow.loadURL("http://127.0.0.1:" + serverPort + "/?atom-transcript=1");
  if (process.env.SUBSTRATE_UI_DEBUG === "1") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(async () => {
  spawnServer();
  try {
    const port = await waitForPortReadback(Date.now() + READBACK_TIMEOUT_MS);
    log("server bound port=" + port);
    await pollHealth(port, Date.now() + HEALTH_TIMEOUT_MS);
    log("server up on http://127.0.0.1:" + port);
  } catch (err) {
    log("startup failed: " + err.message);
    log("check that `uv` and `substrate` are on PATH (see README)");
    killServerGroup();
    app.quit();
    return;
  }
  createWindow();
  installMenu(() => mainWindow);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  killServerGroup();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", killServerGroup);
