// electron/main.js
// Substrate desktop shell — Electron main process.
// Sprint 001 landed under discipline: forwards bridge stdout → renderer,
// filters {op:hello} into a dedicated `bridge:hello` channel; when
// SUBSTRATE_HARNESS=1, writes every renderer signal to
// <userData>/harness/last.jsonl for the Playwright three-channel harness.

const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("node:child_process");
const { createWriteStream, mkdirSync, appendFileSync } = require("node:fs");
const path = require("node:path");

let mainWindow = null;
let bridgeProc = null;
let harnessSink = null;
let bridgeLogPath = null;
let pending = [];
let rendererReady = false;

function harnessOn() { return process.env.SUBSTRATE_HARNESS === "1"; }

function harnessLastJsonl() {
  return path.join(app.getPath("userData"), "harness", "last.jsonl");
}

function ensureHarnessSink() {
  if (!harnessOn()) return;
  const p = harnessLastJsonl();
  mkdirSync(path.dirname(p), { recursive: true });
  // Overwrite at every launch — fresh trace per test run.
  harnessSink = createWriteStream(p, { flags: "w" });
  ipcMain.on("harness:emit", (_e, sig) => {
    if (!harnessSink) return;
    try { harnessSink.write(JSON.stringify(sig) + "\n"); } catch (_) { /* best-effort */ }
  });
}

function forwardToRenderer(channel, payload) {
  if (rendererReady && mainWindow) mainWindow.webContents.send(channel, payload);
  else pending.push({ channel, payload });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    title: "substrate",
    backgroundColor: "#212327",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: harnessOn() ? ["--harness"] : [],
    },
  });
  mainWindow.webContents.on("did-finish-load", () => {
    rendererReady = true;
    for (const p of pending) mainWindow.webContents.send(p.channel, p.payload);
    pending.length = 0;
  });
  mainWindow.loadFile(path.join(__dirname, "..", "app", "index.html"));
}

function startBridge() {
  const python = process.env.SUBSTRATE_UI_PYTHON || "python3";
  const script = path.join(__dirname, "..", "bridge", "main.py");

  // Bridge log — writes stderr and a stamped stdout hello record.
  bridgeLogPath = path.join(app.getPath("logs"), "bridge.log");
  mkdirSync(path.dirname(bridgeLogPath), { recursive: true });
  // Truncate at each launch so the harness reads a fresh log.
  try { require("node:fs").writeFileSync(bridgeLogPath, ""); } catch (_) {}

  const env = { ...process.env, PYTHONUNBUFFERED: "1" };
  if (harnessOn()) env.SUBSTRATE_HARNESS = "1";

  bridgeProc = spawn(python, [script], { stdio: ["pipe", "pipe", "pipe"], env });
  bridgeProc.stdout.setEncoding("utf8");
  bridgeProc.stderr.setEncoding("utf8");

  let buf = "";
  bridgeProc.stdout.on("data", (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (!line.trim()) continue;
      let msg;
      try { msg = JSON.parse(line); }
      catch (e) { process.stderr.write(`[shell] bad json from bridge: ${line}\n`); continue; }

      // Log the hello line to bridge.log so the third channel can read it.
      if (msg.op === "hello") {
        try {
          appendFileSync(bridgeLogPath,
            `[bridge] hello substrate=${msg.substrate} protocol=${msg.protocol}\n`);
        } catch (_) {}
        forwardToRenderer("bridge:message", msg);
      } else if (msg.op === "halt") {
        try {
          appendFileSync(bridgeLogPath, `[bridge] halt reason=${msg.reason} detail=${msg.detail}\n`);
        } catch (_) {}
        forwardToRenderer("bridge:message", msg);
      } else {
        forwardToRenderer("bridge:message", msg);
      }
    }
  });
  bridgeProc.stderr.on("data", (chunk) => {
    process.stderr.write(`[bridge] ${chunk}`);
    try { appendFileSync(bridgeLogPath, `[bridge-stderr] ${chunk}`); } catch (_) {}
  });
  bridgeProc.on("exit", (code) => {
    process.stderr.write(`[shell] bridge exited code=${code}\n`);
    forwardToRenderer("bridge:dead", null);
  });

  ipcMain.handle("bridge:send", (_e, msg) => {
    if (!bridgeProc || bridgeProc.killed) return { ok: false, reason: "bridge_dead" };
    bridgeProc.stdin.write(JSON.stringify(msg) + "\n");
    return { ok: true };
  });
}

app.whenReady().then(() => {
  ensureHarnessSink();
  createWindow();
  startBridge();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (bridgeProc && !bridgeProc.killed) bridgeProc.kill();
  if (harnessSink) harnessSink.end();
  if (process.platform !== "darwin") app.quit();
});
