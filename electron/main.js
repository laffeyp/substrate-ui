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

const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
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
// Sprint 081 — buffered-pending dispatch for deep-links that fire
// before the renderer is ready. Reuses the pattern the 2026-09-12
// electron/main.js:51-72 used (see _deprecated/electron-bridge-
// 2026-09-12/main.js). rendererReady flips true on did-finish-load;
// pending deep-links flush in order at that moment.
let rendererReady = false;
const pendingDeepLinks = [];

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

function forwardDeepLink(url) {
  if (rendererReady && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("deep-link", url);
  } else {
    pendingDeepLinks.push(url);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "substrate",
    backgroundColor: "#212327",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 13 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  mainWindow.webContents.on("did-finish-load", () => {
    rendererReady = true;
    if (pendingDeepLinks.length > 0) {
      log("flushing " + pendingDeepLinks.length + " buffered deep-link(s)");
      for (const url of pendingDeepLinks) mainWindow.webContents.send("deep-link", url);
      pendingDeepLinks.length = 0;
    }
  });
  // Sprint 085b follow-up: route external links to the OS default browser
  // instead of spawning a new Electron window. The AuthPromptCard renders
  // OAuth URLs (codex device page, cursor login page, opencode provider
  // pages) as <a target="_blank">; users already have their vendor logins
  // in Safari/Chrome/Firefox. Anything not on the app's own origin gets
  // shell.openExternal + deny.
  const isExternal = (url) => {
    if (!/^https?:\/\//i.test(url)) return false;
    try {
      const app_origin = new URL("http://127.0.0.1:" + serverPort).origin;
      return new URL(url).origin !== app_origin;
    } catch (_) { return true; }
  };
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternal(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isExternal(url)) { event.preventDefault(); shell.openExternal(url); }
  });
  mainWindow.loadURL("http://127.0.0.1:" + serverPort + "/?atom-transcript=1&electron=1");
  if (process.env.SUBSTRATE_UI_DEBUG === "1") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

// Sprint 081 — deep-link protocol handler. Register substrate:// so
// `open substrate://record/<id>` from anywhere on the system opens
// the app (or focuses it if already running) and hands the URL to
// the renderer. macOS delivers via app.on("open-url"); Windows and
// Linux via app.on("second-instance") on argv. For a shipping
// installer, an Info.plist entry via electron-forge completes the
// system-registered handshake; dev-mode setAsDefaultProtocolClient
// is enough for the exit test that emits open-url from main.
app.setAsDefaultProtocolClient("substrate");
app.on("open-url", (event, url) => {
  event.preventDefault();
  forwardDeepLink(url);
});
// Single-instance lock so a second `open substrate://...` focuses
// the existing window and hands off its argv-carried URL rather
// than launching a second app.
const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_e, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    for (const arg of argv) {
      if (typeof arg === "string" && arg.startsWith("substrate://")) forwardDeepLink(arg);
    }
  });
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

// Sprint 085 followup — renderer asks main to close the current window
// when Cmd-W closes the last remaining pane.
ipcMain.on("native:close-window", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

// Sprint 086 — Records surface "Add workspace" folder picker.
// Returns the chosen path or null on cancel. Same shape as
// menu:open-record's dialog, but the picked path is a workspace not
// a record.
ipcMain.handle("native:pick-folder", async () => {
  const win = mainWindow;
  const r = await dialog.showOpenDialog(win, {
    title: "Add workspace",
    properties: ["openDirectory"],
    buttonLabel: "Add",
  });
  if (r.canceled || r.filePaths.length === 0) return null;
  return r.filePaths[0];
});
