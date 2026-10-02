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

const { app, BrowserWindow, shell, ipcMain, dialog, screen } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");
const { installMenu } = require("./menu");

// F7. Electron reads app.getName() from package.json's `productName`,
// falling back to `name`. This package.json's `name` is
// `substrate-ui-e2e`, which is the ORM registry name for the test
// harness — not what the user sees. Force the runtime name to
// `Substrate` before any `app.getPath('logs' | 'userData' | ...)`
// call so the paths land under `~/Library/Logs/Substrate/`,
// `~/Library/Application Support/Substrate/`, etc.
app.setName(process.env.SUBSTRATE_HOME ? "Substrate Dev" : "Substrate");

// Sprint 079: --port 0 asks server.py to bind an ephemeral port.
// The bound value comes back as the first stdout line matching
// /^substrate-ui port=(\d+)$/. main() waits up to READBACK_TIMEOUT_MS
// for that line before polling the health endpoint on the parsed port.
const READBACK_TIMEOUT_MS = 5_000;
const HEALTH_TIMEOUT_MS = 15_000;
const HEALTH_POLL_MS = 200;
// server.py's SIGTERM handler runs `_shutdown_all_sessions(per_session_timeout=10.0)`.
// With N live sessions this budget can approach N*10s. 3s SIGKILL grace cut
// clean shutdowns short and left sessions `interrupted` on next boot (Review
// 2026-09-28 § F9). Give the server enough time to finish its own
// shutdown work; still hard-cap so a wedged daemon can't hold the app open.
const KILL_GRACE_MS = 45_000;
const PORT_READBACK_RE = /^substrate-ui port=(\d+)$/m;

const fs = require("node:fs");

// F2. GUI-launched apps on macOS get launchd's default PATH
// (/usr/bin:/bin:/usr/sbin:/sbin) — not the user's shell PATH. That
// makes `shutil.which("claude" | "codex" | "cursor-agent")` fail from
// server.py and any bash tool the agent runs lose `uv`, `node`, `npm`
// and Homebrew tools. Restore the shell PATH by asking the user's
// login shell for it. Sync call, ~50ms, only runs when the shell
// PATH looks longer than launchd's. Runs BEFORE spawnServer so the
// child inherits it.
// An interactive login shell can print anything from its rc files
// (banners, prompt-plugin notices), so the PATH is bracketed by markers
// and extracted — the method sindresorhus/shell-env uses.
// DISABLE_AUTO_UPDATE stops oh-my-zsh from prompting during the probe.
const PATH_MARK = "__SUBSTRATE_PATH__";
// Sprint 094: the probe starts when main.js loads and runs while Electron initialises; spawnServer
// awaits it. It used to be a spawnSync inside whenReady that blocked startup ~0.4 s (measured).
function probeShellPath() {
  return new Promise((resolve) => {
    const shell = process.env.SHELL || "/bin/zsh";
    let out = "";
    let child;
    try {
      child = spawn(shell, ["-ilc", `printf '${PATH_MARK}%s${PATH_MARK}' "$PATH"`], {
        env: { ...process.env, DISABLE_AUTO_UPDATE: "true" },
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch (err) { resolve({ shell, path: null, why: err.message }); return; }
    const timer = setTimeout(() => { try { child.kill("SIGKILL"); } catch { /* gone */ } }, 5_000);
    child.stdout.on("data", (c) => { out += c.toString("utf8"); });
    child.on("error", (err) => { clearTimeout(timer); resolve({ shell, path: null, why: err.message }); });
    child.on("close", (code) => {
      clearTimeout(timer);
      const m = out.match(new RegExp(PATH_MARK + "(.*)" + PATH_MARK));
      resolve({ shell, path: m && m[1] ? m[1] : null, why: "shell exit " + code });
    });
  });
}
const shellPathProbe = probeShellPath();

async function restoreShellPath() {
  const { shell, path: shellPath, why } = await shellPathProbe;
  if (shellPath && shellPath.length > (process.env.PATH || "").length) {
    process.env.PATH = shellPath;
    log("PATH restored from " + shell + " (" + shellPath.length + " chars)");
  } else {
    log("PATH not restored (" + why + ")");
  }
}

// F7. Route stderr into a per-user log so a Finder-launched app leaves
// a trace when it fails. Path: app.getPath('logs')/substrate.log,
// which resolves to ~/Library/Logs/Substrate/. Runs in packaged mode
// only — source-mode terminals keep their live console AND the
// terminal still receives every line because the wrapper calls the
// original write.
function setupLogFile() {
  if (!app.isPackaged) return null;
  let logsDir, logPath;
  try {
    logsDir = app.getPath("logs");
  } catch (err) {
    process.stderr.write("[electron] setupLogFile: app.getPath('logs') threw: " + err.message + "\n");
    return null;
  }
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    logPath = path.join(logsDir, "substrate.log");
    const stream = fs.createWriteStream(logPath, { flags: "a" });
    stream.write("\n=== " + new Date().toISOString() + " app boot ===\n");
    const origWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk, ...rest) => {
      try { stream.write(chunk); } catch { /* stream closed */ }
      return origWrite(chunk, ...rest);
    };
    process.stderr.write("[electron] log file: " + logPath + "\n");
    return logPath;
  } catch (err) {
    process.stderr.write("[electron] setupLogFile: mkdir/stream failed at " + logsDir + ": " + err.message + "\n");
    return null;
  }
}

// Two launch paths — source and packaged — differ in every path.
// Source: substrate-ui/ sits next to substrate/; `uv run python`
// resolves the substrate venv from the sibling repo.
// Packaged: the app is signed and installed under /Applications; the
// bundled Python interpreter sits at Contents/Helpers/python3 and
// server.py sits at Contents/Resources/app.asar.unpacked/server.py.
// Nothing outside the bundle is referenced when packaged — a user's
// Mac has no sibling substrate/ checkout.
//
// `app.isPackaged` is Electron's own API for this test. `process.
// resourcesPath` is NOT — it points inside Electron's own dev bundle
// during source-mode runs (Sprint 088 detection bug, 2026-09-27).
const SOURCE_SUBSTRATE_ROOT = path.resolve(__dirname, "..", "..", "substrate");
const SOURCE_SERVER_PATH = path.resolve(__dirname, "..", "server.py");

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

// Set from serverProc's "exit" event. ChildProcess.killed only turns
// true when ChildProcess.kill() is used; the group kill below uses
// process.kill(-pid), so `killed` never reflects a real exit.
let serverExited = false;

function killServerGroup() {
  if (!serverProc || serverExited || !serverProc.pid) return;
  const pid = serverProc.pid;
  try {
    // Negative pid targets the process group. detached: true at
    // spawn made this child the group leader; uv run python + its
    // python child come down together. Matches the pattern at
    // harness/shakeout/lib/server.ts:22-45.
    process.kill(-pid, "SIGTERM");
    setTimeout(() => {
      if (!serverExited) {
        log("server still running " + KILL_GRACE_MS + "ms after SIGTERM; SIGKILL");
        try { process.kill(-pid, "SIGKILL"); } catch (_) { /* already gone */ }
      }
    }, KILL_GRACE_MS);
  } catch (_) { /* already gone */ }
}

function spawnServer() {
  // Packaged vs source: Electron's `app.isPackaged` is the one right
  // test. Sprint 089 A1.
  let exe, args, cwd;
  let pythonHome = null;
  if (app.isPackaged) {
    // Bundled interpreter at Contents/Resources/python/bin/python3
    // (Sprint 089 B3 explicitly deferred moving it to Contents/
    // Helpers/ for the first pass; accept the placement deviation).
    // server.py at Contents/Resources/app.asar.unpacked/server.py.
    // Working directory is Contents/Resources so CPython's home-
    // directory resolution finds its stdlib.
    const resDir = process.resourcesPath;
    exe = path.join(resDir, "python", "bin", "python3");
    // F10: python3 is a symlink into Contents/Frameworks/python-native; Python resolves its home
    // from the real file's location, so name the home (the stdlib lives in Resources/python).
    pythonHome = path.join(resDir, "python");
    args = [path.join(resDir, "app.asar.unpacked", "server.py"), "--port", "0"];
    cwd = resDir;
  } else {
    exe = "uv";
    args = ["run", "python", SOURCE_SERVER_PATH, "--port", "0"];
    cwd = SOURCE_SUBSTRATE_ROOT;
  }
  log("spawning server: " + exe + " " + args.join(" ") + " (cwd=" + cwd + ")");
  serverProc = spawn(exe, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    // PYTHONDONTWRITEBYTECODE: Apple's `xcode/embedding-nonstandard-
    // code-structures-in-a-bundle` names Python's default `.pyc`
    // write next to `.py` files as breaking the seal on the code
    // signature. Suppress writes entirely inside the packaged .app.
    // Source-mode gets it too — cheap, prevents `__pycache__` litter
    // in the checkout. Sprint 089 A2.
    // SUBSTRATE_PARENT_PID: the backend's watchdog exits when THIS process
    // dies, even when `uv` sits between us in source mode (Sprint 094).
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      PYTHONDONTWRITEBYTECODE: "1",
      SUBSTRATE_PARENT_PID: String(process.pid),
      ...(pythonHome ? { PYTHONHOME: pythonHome } : {}),
    },
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
    serverExited = true;
    log("server exited code=" + code + " signal=" + signal);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("server:dead", { code, signal });
    }
    // UI sprint 102: the backend died while the app was in use (not quitting, not starting).
    // Nothing listened for `server:dead`, so the window sat with dead streams and failing turns
    // and no word why. Say so, and offer the two ways out.
    if (serverUp && !quitAfterServer) onBackendDied(code, signal);
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
  // Sprint 088 — the reveal shell breaks below a certain floor. Lock
  // the MINIMUM to a third of the primary display's work area; the
  // user can grow the window from there, never shrink past it. Work
  // area excludes menu bar + dock. Called at window-create time so a
  // fresh monitor arrangement takes effect on next launch.
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const minW = Math.floor(workArea.width / 3);
  const minH = Math.floor(workArea.height / 3);
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: minW,
    minHeight: minH,
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

let serverUp = false; // set once the backend answered its health check
let appLogPath = null;

async function onBackendDied(code, signal) {
  const how = signal ? "was killed (" + signal + ")" : "exited with code " + code;
  const where = appLogPath ? "\n\nLog: " + appLogPath : "\n\nSee the terminal output for the server's error.";
  const { response } = await dialog.showMessageBox({
    type: "error",
    title: "Substrate's backend stopped",
    message: "Substrate's backend stopped",
    detail: "The backend server " + how + ". Sessions and records are on disk; relaunching reopens them." + where,
    buttons: ["Relaunch", "Quit"],
    defaultId: 0,
    cancelId: 1,
  });
  if (response === 0) {
    app.relaunch();
  }
  app.exit(0);
}

app.whenReady().then(async () => {
  // Sprint 094: a second instance (lock not acquired) has already called
  // app.quit(); it must not set up logging or spawn a backend on its way
  // out. Electron's requestSingleInstanceLock example registers its
  // whenReady work only in the lock-acquired branch; this guard is that.
  if (!singleInstanceLock) return;
  const logPath = setupLogFile();
  appLogPath = logPath;
  await restoreShellPath();
  spawnServer();
  try {
    const port = await waitForPortReadback(Date.now() + READBACK_TIMEOUT_MS);
    log("server bound port=" + port);
    await pollHealth(port, Date.now() + HEALTH_TIMEOUT_MS);
    log("server up on http://127.0.0.1:" + port);
    serverUp = true;
  } catch (err) {
    log("startup failed: " + err.message);
    // F7. On a packaged Finder-launched app, a silent quit leaves the
    // user with nothing. Show a dialog naming the failure + the log
    // path. Source-mode / terminal launches also get the dialog but
    // still see the traceback in the terminal.
    // Name the log only when one was opened (packaged mode). Source mode logs to the terminal;
    // naming ~/Library/Logs/... there pointed at a file that was never written (UI sprint 097).
    const logHint = logPath ? "\n\nLog: " + logPath : "\n\nSee the terminal output for the server's error.";
    dialog.showErrorBox(
      "Substrate could not start",
      "The backend server did not come up.\n\n" + err.message + logHint,
    );
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

// F6. macOS lifecycle: closing every window does NOT quit the app;
// clicking the Dock icon fires `activate` and reopens a window. The
// window's server MUST outlive the window — otherwise `activate`
// recreates the window pointing at a dead port. Kill the server only
// on real quit (Cmd-Q → `before-quit`) or on non-macOS platforms.
// Review 2026-09-28 § F6.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Quit waits for the backend. The server's SIGTERM handler ends every
// live session (up to 10 s each) and walks the whole session catalog;
// with ~3000 sessions that outlasts an immediate Electron exit, which
// left the server finishing its shutdown unsupervised after the app
// was gone (packaged smoke, 2026-09-28). Hold the first quit, SIGTERM
// the group, and quit for real once the server exits — or once
// killServerGroup's SIGKILL fallback lands after KILL_GRACE_MS.
let quitAfterServer = false;
app.on("before-quit", (event) => {
  if (!serverProc || serverExited) return;
  event.preventDefault();
  if (quitAfterServer) return;
  quitAfterServer = true;
  log("quit requested; waiting for server shutdown");
  serverProc.once("exit", () => app.quit());
  killServerGroup();
});

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
