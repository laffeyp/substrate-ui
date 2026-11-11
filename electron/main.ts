// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// electron/main.ts
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

import { app, BrowserWindow, shell, ipcMain, dialog, screen } from "electron";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { installMenu } from "./menu";
import { commitsFromPlist } from "./build_commits";
import { createChecker, type Broken, type CheckedRecord } from "./invariants";
import { Signal, VOCAB_VERSION, AppBootedHomeKind, AppQuitRequestedCause, ChildProcessGoneReason, ChildProcessGoneType, DeepLinkReceivedLinkKind, MainFaultedSource, NativeDialogClosedDialog, NativeDialogClosedOutcome, NavigationBlockedTargetKind, RendererGoneReason, TraceLostProcess, TraceOpenedProcess, WindowFaultedSource, WindowOpenedCause, type SignalPayloads } from "./signals.gen";

// ── The trace (vocabulary v0.7; plan process/planning/2026-11-05-sdd-signals, item 2) ─────────────
// Each launch writes <logs>/traces/<boot_id>/: main.jsonl (main's records), window-<id>.jsonl (each
// window's records, received over native:signal) and server.jsonl (written by server.py, which gets
// the folder and the boot id in its environment). One JSON object per line. Every line carries the
// record context: boot_id, process, proc_seq (the order key), wall (recorded, never used to order),
// window_id. Writes are synchronous appends to an open descriptor, so lines stay in order and every
// failure is seen: it is counted, and the next line that can be written is a TRACE_LOST with the
// count. The server reports its own losses on stdout and main records them (TRACE_LOST, process
// server). No file has a size cap and no launch folder is removed ("no cap on the trace",
// 2026-11-05); SUBSTRATE_TRACE_CAP caps the window files and SUBSTRATE_SERVER_TRACE_CAP the
// server's, for the loss gate only.
// SUBSTRATE_TRACE_CAP (bytes) is a test seam: harness/shakeout/trace_files.ts sets it low to force losses.
const TRACE_FILE_CAP = Number(process.env.SUBSTRATE_TRACE_CAP) > 0 ? Number(process.env.SUBSTRATE_TRACE_CAP) : Infinity;
/** Sprint 449: a gate's launch (harness/shakeout/lib/electron.ts `launchArgs` sets SUBSTRATE_GATE_ISOLATE=1). The gates
 *  run while a person works on the same machine, and their windows open on the screen in use: each window takes no
 *  focus, so the person's keys stay in their own app, and lets the OS's mouse through, since a buttonless move ends
 *  a drag's pointer capture (BLACKBOARD 2026-11-10). Playwright's input is injected into the page and still arrives. */
const GATE_ISOLATED = process.env.SUBSTRATE_GATE_ISOLATE === "1";
const BOOT_ID = new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").slice(0, 15) + "-" + Math.random().toString(16).slice(2, 8);
const trace: { [key: string]: any } = { dir: null, opened: false, held: [], files: new Map(), written: 0, lost: 0, mainSeq: 0, windowSeq: new Map(), windowsOpened: 0, serverLost: 0 };

function traceFile(name) {
  let f = trace.files.get(name);
  if (f) return f;
  f = { fd: null, bytes: 0, lost: 0, unreported: 0, announced: false, capped: false };
  try { f.fd = fs.openSync(path.join(trace.dir, name), "a"); } catch { f.fd = null; }
  trace.files.set(name, f);
  return f;
}

function traceWrite(name, record) {
  if (!trace.dir) return false;
  const f = traceFile(name);
  const line = JSON.stringify(record) + "\n";
  let ok = false;
  // The test cap binds window files only: main.jsonl must stay whole to report their losses.
  const cap = name.startsWith("window-") ? TRACE_FILE_CAP : Infinity;
  if (f.fd !== null && !f.capped && f.bytes + line.length <= cap) {
    try { fs.writeSync(f.fd, line); f.bytes += line.length; trace.written += 1; ok = true; } catch { ok = false; }
  } else if (f.fd !== null && !f.capped) {
    f.capped = true;
  }
  if (!ok) { f.lost += 1; f.unreported += 1; trace.lost += 1; }
  return ok;
}

// A file's losses reach main.jsonl as TRACE_LOST: the first loss at once, later ones as one count
// when that file next writes (a capped file never does; its total is on APP_QUIT_COMPLETED).
function reportLoss(name, processName: TraceLostProcess, wrote) {
  const f = trace.files.get(name);
  if (!f || f.unreported === 0) return;
  if (f.announced && !wrote) return;
  const count = f.unreported;
  f.unreported = 0; f.announced = true;
  mainRecord(Signal.TRACE_LOST, { process: processName, count });
}

// The runtime checker (plan item 5, sprint 373; electron/invariants.ts): every record main writes, its
// own and each window's, goes past the vocabulary's rules in the order it is written, whether or not
// the write succeeded; a record that breaks one is followed in main.jsonl by an INVARIANT_BROKEN.
// The timing rules (sprint 375) are also checked on a timer, so a wait that no record ends still
// breaks when its window passes; the timer does not hold the app open.
const checker = createChecker();
function writeBroken(found: Broken[]) {
  for (const b of found) mainRecord(Signal.INVARIANT_BROKEN, { rule: b.rule, context: b.context }, b.window_id);
}
// The server writes server.jsonl itself (server.py _Trace). Its records reach the checker from that
// file as it grows (sprint 376): read before each record main checks, on the timer, and at the close.
// A line cut short by the read waits, as bytes, for the rest.
const serverTail = { offset: 0, rest: Buffer.alloc(0), reading: false };
function readServerRecords() {
  if (!trace.dir || serverTail.reading) return;
  serverTail.reading = true;
  let fd: number | null = null;
  try {
    fd = fs.openSync(path.join(trace.dir, "server.jsonl"), "r");
    const size = fs.fstatSync(fd).size;
    if (size <= serverTail.offset) return;
    const chunk = Buffer.alloc(size - serverTail.offset);
    fs.readSync(fd, chunk, 0, chunk.length, serverTail.offset);
    serverTail.offset = size;
    const bytes = Buffer.concat([serverTail.rest, chunk]);
    const end = bytes.lastIndexOf(10);
    serverTail.rest = bytes.subarray(end + 1);
    for (const line of bytes.subarray(0, end + 1).toString("utf8").split("\n")) {
      if (!line) continue;
      let rec: CheckedRecord;
      try { rec = JSON.parse(line); } catch { continue; }
      writeBroken(checker.see(rec));
    }
  } catch { /* no server.jsonl yet */ } finally {
    if (fd !== null) fs.closeSync(fd);
    serverTail.reading = false;
  }
}
function checkRecord(rec: CheckedRecord) { readServerRecords(); writeBroken(checker.see(rec)); }
setInterval(() => { if (trace.opened && !trace.closed) { readServerRecords(); writeBroken(checker.tick()); } }, 250).unref();

let inMainRecord = false;
// Main's records, typed by tag from the vocabulary (signals.gen.ts, sprint 363). windowId: the window a
// record is about (WINDOW_*, NATIVE_DIALOG_CLOSED, MENU_COMMAND_SENT, ...), in the record context's
// window_id; null for the app as a whole.
function mainRecord<K extends Signal>(tag: K, payload: SignalPayloads[K], windowId: number | null = null) {
  // After the closing record nothing can report a loss in the trace; say it on stderr (substrate.log).
  if (trace.closed) { process.stderr.write("[electron] trace closed; " + tag + " not written\n"); return false; }
  // Before the trace opens (an open-url on a cold launch comes before whenReady, sprint 374), a record
  // is held, and openTrace writes it after APP_BOOTED and TRACE_OPENED, so APP_BOOTED stays first (S1).
  if (!trace.opened) { trace.held.push({ tag, payload, windowId, wall: new Date().toISOString() }); return true; }
  return writeMainRecord(tag, payload, windowId, new Date().toISOString());
}

function writeMainRecord(tag, payload, windowId, wall) {
  const rec = { boot_id: BOOT_ID, process: "main", proc_seq: trace.mainSeq++, wall, window_id: windowId, name: tag, payload };
  const wrote = traceWrite("main.jsonl", rec);
  checkRecord(rec);
  return wrote;
}

// main's own records; a loss on main.jsonl is reported by the next main record that is written.
function traceEmit<K extends Signal>(tag: K, payload: SignalPayloads[K], windowId: number | null = null) {
  const wrote = mainRecord(tag, payload, windowId);
  if (!inMainRecord) { inMainRecord = true; reportLoss("main.jsonl", TraceLostProcess.MAIN, wrote); inMainRecord = false; }
}

// A commit with uncommitted changes in the paths the build ships is "<sha>+dirty", so a trace never
// names code it was not built from. The paths are scripts/release.sh's clean-tree check.
function gitHead(dir, paths) {
  try {
    const r = spawnSync("git", ["-C", dir, "rev-parse", "--short=12", "HEAD"], { encoding: "utf8", timeout: 2000 });
    if (r.status !== 0) return "unrecorded";
    const st = spawnSync("git", ["-C", dir, "status", "--porcelain", "--", ...paths], { encoding: "utf8", timeout: 5000 });
    if (st.status !== 0) return r.stdout.trim() + "+unknown";
    return r.stdout.trim() + (st.stdout.trim() ? "+dirty" : "");
  } catch { return "unrecorded"; }
}

function buildCommits() {
  if (app.isPackaged) {
    try {
      return commitsFromPlist(fs.readFileSync(path.join(process.resourcesPath, "..", "Info.plist"), "utf8"));
    } catch { return { app_commit: "unrecorded", kernel_commit: "unrecorded" }; }
  }
  return {
    app_commit: gitHead(path.join(__dirname, ".."), [".", ":!runs/packaged", ":!captures"]),
    kernel_commit: gitHead(path.join(__dirname, "..", "..", "substrate"), ["src/", "pyproject.toml"]),
  };
}

function openTrace() {
  // The commits first: buildCommits runs git, and nothing may be written between the folder and
  // APP_BOOTED.
  const commits = buildCommits();
  trace.opened = true;
  try {
    const root = path.join(app.getPath("logs"), "traces");
    fs.mkdirSync(root, { recursive: true });
    trace.dir = path.join(root, BOOT_ID);
    fs.mkdirSync(trace.dir, { recursive: true });
  } catch (err) {
    trace.dir = null;
    trace.lost += trace.held.length;
    process.stderr.write("[electron] trace folder not created: " + err.message + "; " + trace.held.length + " held record(s) not written\n");
    trace.held = [];
    return;
  }
  traceEmit(Signal.APP_BOOTED, {
    app_version: app.getVersion(), app_commit: commits.app_commit, kernel_commit: commits.kernel_commit,
    vocab_version: VOCAB_VERSION, packaged: app.isPackaged, home_kind: process.env.SUBSTRATE_HOME ? AppBootedHomeKind.ENV : AppBootedHomeKind.DEFAULT,
    gate_isolated: GATE_ISOLATED,
  });
  traceEmit(Signal.TRACE_OPENED, { process: TraceOpenedProcess.MAIN });
  const held = trace.held;
  trace.held = [];
  for (const h of held) writeMainRecord(h.tag, h.payload, h.windowId, h.wall);
  checkLastBoot(path.dirname(trace.dir));
  process.stderr.write("[electron] trace: " + trace.dir + "\n");
}

// S2 (vocabulary v0.24, P-0.24-S2-NEXT-BOOT): APP_QUIT_COMPLETED is main's last record of a boot.
// main's writer refuses records after it (mainRecord), so the rule breaks only when a boot ends
// without it, killed or crashed, and that boot cannot say so. One app runs per machine (the
// single-instance lock), so when this boot opens its trace the boot before it in the same folder has
// ended: read the end of its main.jsonl and report a missing closing record here.
const S2_TAIL_BYTES = 64 * 1024;
function checkLastBoot(root: string) {
  let prior: string | undefined;
  try {
    prior = fs.readdirSync(root).filter((n) => n !== BOOT_ID && /^\d{8}-\d{6}-[0-9a-f]+$/.test(n)).sort().pop();
  } catch { return; }
  if (!prior) return;
  let last: Record<string, unknown> | null = null;
  try {
    const fd = fs.openSync(path.join(root, prior, "main.jsonl"), "r");
    try {
      const size = fs.fstatSync(fd).size;
      const len = Math.min(size, S2_TAIL_BYTES);
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, size - len);
      // The last whole line; a line cut short by the kill is not a record.
      for (const line of buf.toString("utf8").split("\n").reverse()) {
        if (!line.trim()) continue;
        try { last = JSON.parse(line); break; } catch { continue; }
      }
    } finally { fs.closeSync(fd); }
  } catch { /* no main.jsonl: a boot that never opened its trace wrote no record to close */ return; }
  if (last && last.name === Signal.APP_QUIT_COMPLETED) return;
  mainRecord(Signal.INVARIANT_BROKEN, {
    rule: "S2",
    context: { state: { boot_id: prior, last: last ? { name: last.name, proc_seq: last.proc_seq, wall: last.wall } : null, expected: Signal.APP_QUIT_COMPLETED }, recent: [] },
  });
}

// Faults (vocabulary v0.24, P-0.24-FAULTS). Each hook observes and changes nothing: Node's
// uncaughtExceptionMonitor runs before the default handler, so Electron still shows its dialog; an
// unhandled rejection in Electron main is only a warning (measured on Electron 44, 2026-11-08), read
// here from the warning event, which leaves the printed warning as it was. No message text (E1).
const ERROR_CLASS_RE = /^([A-Z][A-Za-z0-9_]*(?:Error|Exception))\b/;
function errorClass(err: unknown): string {
  if (err instanceof Error) return err.name || err.constructor?.name || "Error";
  return "non-error";
}
process.on("uncaughtExceptionMonitor", (err, origin) => {
  traceEmit(Signal.MAIN_FAULTED, { error_type: errorClass(err), source: origin === "unhandledRejection" ? MainFaultedSource.REJECTION : MainFaultedSource.EXCEPTION });
});
process.on("warning", (w) => {
  // Node writes two warnings per rejection; the first carries the reason, the second its advice.
  if (w.name !== "UnhandledPromiseRejectionWarning" || w.message.startsWith("Unhandled promise rejection.")) return;
  traceEmit(Signal.MAIN_FAULTED, { error_type: ERROR_CLASS_RE.exec(w.message)?.[1] ?? "non-error", source: MainFaultedSource.REJECTION });
});
// Electron's reasons and process types, as the vocabulary spells them (hyphens and spaces to _).
const asEnum = <E extends string>(values: Record<string, E>, raw: string, fallback: E): E => {
  const v = raw.toLowerCase().replace(/[- ]/g, "_");
  return (Object.values(values) as string[]).includes(v) ? (v as E) : fallback;
};
app.on("child-process-gone", (_e, details) => {
  traceEmit(Signal.CHILD_PROCESS_GONE, {
    type: asEnum(ChildProcessGoneType, details.type, ChildProcessGoneType.UNKNOWN),
    reason: asEnum(ChildProcessGoneReason, details.reason, ChildProcessGoneReason.ABNORMAL_EXIT),
    exit_code: details.exitCode,
  });
});

// A window's records. The window stamps proc_seq and pane_id (sprint 352); main adds the launch and
// window. Until a window stamps its own proc_seq, main numbers what it receives from that window.
ipcMain.on("native:signal", (event, record) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const windowId = win ? win.id : null;
  const key = "window-" + windowId + ".jsonl";
  const seq = trace.windowSeq.get(key) ?? 0;
  trace.windowSeq.set(key, seq + 1);
  const r = record && typeof record === "object" ? record : {};
  const rec = { boot_id: BOOT_ID, process: "window", proc_seq: typeof r.proc_seq === "number" ? r.proc_seq : seq, wall: new Date().toISOString(), window_id: windowId, ...r };
  const wrote = traceWrite(key, rec);
  reportLoss(key, TraceLostProcess.WINDOW, wrote);
  checkRecord(rec);
});

// F7. Electron reads app.getName() from package.json's `productName`,
// falling back to `name`. This package.json's `name` is
// `substrate-ui-e2e`, which is the ORM registry name for the test
// harness — not what the user sees. Force the runtime name to
// `Substrate` before any `app.getPath('logs' | 'userData' | ...)`
// call so the paths land under `~/Library/Logs/Substrate/`,
// `~/Library/Application Support/Substrate/`, etc.
app.setName(process.env.SUBSTRATE_HOME ? "Substrate Dev" : "Substrate");

// UI sprint 107. A run that names its own SUBSTRATE_HOME (a test gate, `npm run electron`) keeps
// ALL of its state under that root: logs and the Chromium profile too. On macOS app.getPath('logs')
// is ~/Library/Logs/<name> regardless of --user-data-dir, so every gate run wrote the real
// ~/Library/Logs/Substrate Dev/substrate.log, and launchers without --user-data-dir wrote a profile
// into ~/Library/Application Support/Substrate Dev (Software Engineering at Google, ch. 14:
// hermetic tests). An explicit --user-data-dir still wins for the profile.
if (process.env.SUBSTRATE_HOME) {
  let root = path.join(process.env.SUBSTRATE_HOME, "electron");
  try {
    fs.mkdirSync(path.join(root, "profile"), { recursive: true });
  } catch (err) {
    // An unusable SUBSTRATE_HOME (lifecycle gate F7 points it at a file). Throwing here killed the
    // app before the backend could fail and show its dialog; keep the run off the real ~/Library
    // with a temp root it removes at quit, and let the backend report the bad state.
    process.stderr.write("[electron] SUBSTRATE_HOME unusable for app state: " + err.message + "\n");
    root = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-electron-"));
    fs.mkdirSync(path.join(root, "profile"));
    app.on("will-quit", () => { try { fs.rmSync(root, { recursive: true, force: true }); } catch { /* best-effort */ } });
  }
  app.setAppLogsPath(path.join(root, "logs"));
  if (!app.commandLine.hasSwitch("user-data-dir")) {
    app.setPath("userData", path.join(root, "profile"));
    app.setPath("sessionData", path.join(root, "profile"));
  }
}

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
const SERVER_LOSS_RE = /^substrate-ui trace_lost=(\d+)$/;


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
// Sprint 094: the probe starts when main loads and runs while Electron initialises; spawnServer
// awaits it. It used to be a spawnSync inside whenReady that blocked startup ~0.4 s (measured).
function probeShellPath() {
  return new Promise<{ shell: string; path: string | null; why: string }>((resolve) => {
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

// UI sprint 147: any number of windows share the one backend. Commands act on the focused window,
// or the most recently focused one when none is (a menu click with every window minimised).
let lastFocused = null;
function currentWindow() {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused) return focused;
  if (lastFocused && !lastFocused.isDestroyed()) return lastFocused;
  return BrowserWindow.getAllWindows()[0] || null;
}
let serverProc = null;
let serverPort = null;
let stdoutBuf = "";
let serverLineBuf = "";
// Sprint 081 — buffered-pending dispatch for deep-links that fire
// before the renderer is ready. Reuses the pattern of the 2026-09-12 bridge
// (_deprecated/electron-bridge-2026-09-12/main.js). A window joins readyWindows on did-finish-load;
// pending deep-links flush in order to the first window that loads.
const readyWindows = new WeakSet();
const pendingDeepLinks = [];

function log(...args) { process.stderr.write("[electron] " + args.join(" ") + "\n"); }

// Set from serverProc's "exit" event. ChildProcess.killed only turns
// true when ChildProcess.kill() is used; the group kill below uses
// process.kill(-pid), so `killed` never reflects a real exit.
let serverExited = false;
// Set when main itself stops the server (quit, a failed startup): SERVER_EXITED.expected.
let serverStopRequested = false;
let serverSpawnedAt = 0;

function killServerGroup() {
  if (!serverProc || serverExited || !serverProc.pid) return;
  serverStopRequested = true;
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
  // A new server process counts its trace losses from zero.
  trace.serverLost = 0;
  serverLineBuf = "";
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
      // The trace (item 2): the server writes server.jsonl into this launch's folder.
      SUBSTRATE_BOOT_ID: BOOT_ID,
      ...(trace.dir ? { SUBSTRATE_TRACE_DIR: trace.dir } : {}),
      ...(pythonHome ? { PYTHONHOME: pythonHome } : {}),
    },
  });
  serverSpawnedAt = Date.now();
  // A spawn that fails has no pid (its "error" event follows); there is then no server to name.
  if (typeof serverProc.pid === "number") traceEmit(Signal.SERVER_SPAWNED, { pid: serverProc.pid, packaged: app.isPackaged });
  serverProc.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    process.stderr.write("[server] " + text);
    // The server's trace losses (server.py _Trace): each report is its running total; main writes
    // the difference to main.jsonl as TRACE_LOST (process server) and counts it on APP_QUIT_COMPLETED.
    serverLineBuf += text;
    const lines = serverLineBuf.split("\n");
    serverLineBuf = lines.pop();
    for (const line of lines) {
      const m = SERVER_LOSS_RE.exec(line);
      if (!m) continue;
      const total = Number(m[1]);
      if (total <= trace.serverLost) continue;
      const count = total - trace.serverLost;
      trace.serverLost = total;
      trace.lost += count;
      traceEmit(Signal.TRACE_LOST, { process: TraceLostProcess.SERVER, count });
    }
    if (serverPort === null) {
      stdoutBuf += text;
      const match = stdoutBuf.match(PORT_READBACK_RE);
      if (match) {
        serverPort = Number(match[1]);
        traceEmit(Signal.SERVER_BOUND, { port: serverPort, ms: Date.now() - serverSpawnedAt });
      }
    }
  });
  // The end of the server's stderr, for SERVER_EXITED.error_type (v0.24): a server that dies prints
  // its traceback last, and a crash before its trace opened (an import that fails) leaves no other cause.
  let stderrTail = "";
  serverProc.stderr.on("data", (chunk) => {
    process.stderr.write("[server-stderr] " + chunk);
    stderrTail = (stderrTail + chunk.toString()).slice(-4096);
  });
  serverProc.on("exit", (code, signal) => {
    serverExited = true;
    trace.serverExitCode = code;
    const lastLine = stderrTail.split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "";
    const died = /^(?:[A-Za-z_][\w.]*\.)?([A-Z]\w*(?:Error|Exception|Interrupt|Exit))(?::|$)/.exec(lastLine);
    // expected false is the incident: the backend stopped while the app still needed it.
    traceEmit(Signal.SERVER_EXITED, { code: code ?? null, signal: signal ?? null, expected: serverStopRequested, ...(died ? { error_type: died[1] } : {}) });
    log("server exited code=" + code + " signal=" + signal);
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send("server:dead", { code, signal });
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
  return new Promise<void>((resolve, reject) => {
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
  // The kind only: a link's path names a record or session, which the window resolves (E1).
  const kind = /^substrate:\/\/record\//i.test(url) ? DeepLinkReceivedLinkKind.RECORD : /^substrate:\/\/session\//i.test(url) ? DeepLinkReceivedLinkKind.SESSION : DeepLinkReceivedLinkKind.UNKNOWN;
  traceEmit(Signal.DEEP_LINK_RECEIVED, { link_kind: kind });
  const win = currentWindow();
  if (win && readyWindows.has(win)) {
    win.webContents.send("deep-link", url);
  } else {
    pendingDeepLinks.push(url);
  }
}

// cause: boot, menu (File ▸ New Window) or activate (the Dock with no window open); v0.10.
function createWindow(cause: WindowOpenedCause) {
  trace.windowsOpened += 1;
  // Sprint 088 — the reveal shell breaks below a certain floor. Lock
  // the MINIMUM to a third of the primary display's work area; the
  // user can grow the window from there, never shrink past it. Work
  // area excludes menu bar + dock. Called at window-create time so a
  // fresh monitor arrangement takes effect on next launch.
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const minW = Math.floor(workArea.width / 3);
  const minH = Math.floor(workArea.height / 3);
  // A new window cascades from the focused one, as macOS document windows do.
  const from = currentWindow();
  const at = from ? (([x, y]) => ({ x: x + 22, y: y + 22 }))(from.getPosition()) : {};
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    ...at,
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
  if (GATE_ISOLATED) { win.setFocusable(false); win.setIgnoreMouseEvents(true); }
  const windowId = win.id;
  traceEmit(Signal.WINDOW_OPENED, { cause }, windowId);
  win.on("closed", () => traceEmit(Signal.WINDOW_CLOSED, {}, windowId));
  // A window's renderer that dies or hangs, and a preload that throws (v0.24, P-0.24-FAULTS): the
  // window cannot write these itself. Listening changes nothing; Electron does what it did before.
  win.webContents.on("render-process-gone", (_e, details) => {
    traceEmit(Signal.RENDERER_GONE, { reason: asEnum(RendererGoneReason, details.reason, RendererGoneReason.ABNORMAL_EXIT), exit_code: details.exitCode }, windowId);
  });
  let unresponsiveAt: number | null = null;
  // Electron repeats unresponsive about every 16 s while a renderer stays hung (measured on Electron 44,
  // 2026-11-08): one record per hang, timed from its first report.
  win.on("unresponsive", () => {
    if (unresponsiveAt !== null) return;
    unresponsiveAt = performance.now();
    traceEmit(Signal.WINDOW_UNRESPONSIVE, {}, windowId);
  });
  win.on("responsive", () => {
    if (unresponsiveAt === null) return;
    traceEmit(Signal.WINDOW_RESPONSIVE, { unresponsive_ms: Math.round(performance.now() - unresponsiveAt) }, windowId);
    unresponsiveAt = null;
  });
  win.webContents.on("preload-error", (_e, preloadPath, error) => {
    traceEmit(Signal.WINDOW_FAULTED, { error_type: errorClass(error), source: WindowFaultedSource.PRELOAD, where: path.basename(preloadPath) }, windowId);
  });
  win.on("focus", () => { lastFocused = win; });
  lastFocused = win;
  win.webContents.on("did-finish-load", () => {
    readyWindows.add(win);
    if (pendingDeepLinks.length > 0) {
      log("flushing " + pendingDeepLinks.length + " buffered deep-link(s)");
      for (const url of pendingDeepLinks) win.webContents.send("deep-link", url);
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
  // Every refusal is NAVIGATION_BLOCKED with the target's kind, never its address (E1).
  const targetKind = (url) => (isExternal(url) ? NavigationBlockedTargetKind.EXTERNAL : /^file:/i.test(url) ? NavigationBlockedTargetKind.FILE : NavigationBlockedTargetKind.UNKNOWN);
  win.webContents.setWindowOpenHandler(({ url }) => {
    traceEmit(Signal.NAVIGATION_BLOCKED, { target_kind: targetKind(url) }, windowId);
    if (isExternal(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (isExternal(url)) {
      traceEmit(Signal.NAVIGATION_BLOCKED, { target_kind: NavigationBlockedTargetKind.EXTERNAL }, windowId);
      event.preventDefault(); shell.openExternal(url);
    }
  });
  win.loadURL("http://127.0.0.1:" + serverPort + "/?atom-transcript=1&electron=1");
  if (process.env.SUBSTRATE_UI_DEBUG === "1") {
    win.webContents.openDevTools({ mode: "detach" });
  }
  return win;
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
    const win = currentWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    for (const arg of argv) {
      if (typeof arg === "string" && arg.startsWith("substrate://")) forwardDeepLink(arg);
    }
  });
}

let serverUp = false; // set once the backend answered its health check
let appLogPath = null;

// The launch's closing record (S2) and the trace files' close. will-quit runs it; so does
// onBackendDied, whose app.exit skips will-quit.
function closeTrace() {
  if (!trace.dir || trace.closed) return;
  // A timing rule whose window passed before the close is written before the closing record (S2).
  readServerRecords();
  writeBroken(checker.tick());
  traceEmit(Signal.APP_QUIT_COMPLETED, {
    server_exit_code: trace.serverExitCode ?? null, windows_opened: trace.windowsOpened,
    signals_written: trace.written, signals_lost: trace.lost,
  });
  trace.closed = true;
  for (const f of trace.files.values()) { if (f.fd !== null) { try { fs.closeSync(f.fd); } catch { /* closing at exit */ } } }
}

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
  noteQuit(AppQuitRequestedCause.BACKEND_DIED);
  // app.exit closes the windows without will-quit; closing them first puts each WINDOW_CLOSED
  // before the closing record (destroy guarantees "closed").
  for (const w of BrowserWindow.getAllWindows()) { try { w.destroy(); } catch { /* already gone */ } }
  closeTrace();
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
  openTrace();
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
    pendingQuitCause = AppQuitRequestedCause.STARTUP_FAILED;
    app.quit();
    return;
  }
  createWindow(WindowOpenedCause.BOOT);
  // The menu reports each command it sends to a window (MENU_COMMAND_SENT).
  installMenu(currentWindow, () => createWindow(WindowOpenedCause.MENU), (command, win) => traceEmit(Signal.MENU_COMMAND_SENT, { command }, win.id));
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(WindowOpenedCause.ACTIVATE);
  });
});

// F6. macOS lifecycle: closing every window does NOT quit the app;
// clicking the Dock icon fires `activate` and reopens a window. The
// window's server MUST outlive the window — otherwise `activate`
// recreates the window pointing at a dead port. Kill the server only
// on real quit (Cmd-Q → `before-quit`) or on non-macOS platforms.
// Review 2026-09-28 § F6.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") { pendingQuitCause = AppQuitRequestedCause.LAST_WINDOW; app.quit(); }
});

// Quit waits for the backend. The server's SIGTERM handler ends every
// live session (up to 10 s each) and walks the whole session catalog;
// with ~3000 sessions that outlasts an immediate Electron exit, which
// left the server finishing its shutdown unsupervised after the app
// was gone (packaged smoke, 2026-09-28). Hold the first quit, SIGTERM
// the group, and quit for real once the server exits — or once
// killServerGroup's SIGKILL fallback lands after KILL_GRACE_MS.
let quitAfterServer = false;
// APP_QUIT_REQUESTED, once per launch. Main's own quits name their cause first; any other quit
// (Cmd-Q, the Dock, logout, a test driver) reaches before-quit as "app" (v0.10).
let pendingQuitCause: AppQuitRequestedCause = AppQuitRequestedCause.APP;
let quitNoted = false;
function noteQuit(cause: AppQuitRequestedCause) {
  if (quitNoted) return;
  quitNoted = true;
  traceEmit(Signal.APP_QUIT_REQUESTED, { cause });
}
app.on("before-quit", (event) => {
  noteQuit(pendingQuitCause);
  if (!serverProc || serverExited) return;
  event.preventDefault();
  if (quitAfterServer) return;
  quitAfterServer = true;
  log("quit requested; waiting for server shutdown");
  serverProc.once("exit", () => app.quit());
  killServerGroup();
});

// The launch's closing record: the server's exit and the trace's write and loss counts (S2: the
// last line of main.jsonl). will-quit runs after before-quit has waited for the server.
app.on("will-quit", closeTrace);

// Sprint 085 followup — renderer asks main to close its window
// when Cmd-W closes the last remaining pane.
ipcMain.on("native:close-window", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) win.close();
});

// F362: File ▸ Open Record… (⌘O) when the window has no pane picker showing. The same dialog the
// menu opened itself until then; the window attaches the picked record.
ipcMain.handle("native:open-record", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const r = await dialog.showOpenDialog(win, {
    title: "Open Record",
    properties: ["openDirectory"],
    buttonLabel: "Open",
  });
  const picked = !r.canceled && r.filePaths.length > 0;
  traceEmit(Signal.NATIVE_DIALOG_CLOSED, { dialog: NativeDialogClosedDialog.OPEN_RECORD, outcome: picked ? NativeDialogClosedOutcome.PICKED : NativeDialogClosedOutcome.CANCELLED }, win ? win.id : null);
  return picked ? r.filePaths[0] : null;
});

// Sprint 086 — Records surface "Add workspace" folder picker.
// Returns the chosen path or null on cancel. Same shape as
// menu:open-record's dialog, but the picked path is a workspace not
// a record.
ipcMain.handle("native:pick-folder", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const r = await dialog.showOpenDialog(win, {
    title: "Add workspace",
    properties: ["openDirectory"],
    buttonLabel: "Add",
  });
  const picked = !r.canceled && r.filePaths.length > 0;
  traceEmit(Signal.NATIVE_DIALOG_CLOSED, { dialog: NativeDialogClosedDialog.PICK_FOLDER, outcome: picked ? NativeDialogClosedOutcome.PICKED : NativeDialogClosedOutcome.CANCELLED }, win ? win.id : null);
  return picked ? r.filePaths[0] : null;
});
