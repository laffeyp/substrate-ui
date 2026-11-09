// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Faults and S2, planted in the running app and read from its trace (vocabulary v0.24, sprints 382
// and 384). Three launches share one state root, so they share one trace folder.
//
// Launch 1, a bound pane on the deterministic model:
//   - the window throws a TypeError from a timer, and rejects a promise with a RangeError:
//     WINDOW_FAULTED error and rejection, in window-1.jsonl;
//   - meta's stream lens is shown and its store is given envelopes it cannot draw, so React's render
//     throws with no boundary: WINDOW_FAULTED error TypeError (the page is blank after it);
//   - main rejects a promise: MAIN_FAULTED rejection RangeError;
//   - the GPU process is killed: CHILD_PROCESS_GONE gpu;
//   - Electron's unresponsive event twice, then responsive (a real hang is never reported while a
//     debugger is attached, and Playwright attaches one): one WINDOW_UNRESPONSIVE, then
//     WINDOW_RESPONSIVE timed from the first;
//   - the preload-error event is emitted on the window's webContents (a broken preload cannot be
//     planted in a built bundle): WINDOW_FAULTED preload SyntaxError, where preload.js;
//   - the renderer is crashed: RENDERER_GONE;
//   - main throws from a timer: MAIN_FAULTED exception TypeError. Electron then shows its error box,
//     so the gate kills the app, and the boot ends with no APP_QUIT_COMPLETED.
// Launch 2: its main.jsonl holds INVARIANT_BROKEN S2 naming launch 1 and its last record; it quits
//   and closes.
// Launch 3: <home>/sessions is a file, so the server dies at startup (install_registry,
//   FileExistsError): server.jsonl's only record is SERVER_UNCAUGHT, and main's SERVER_EXITED is
//   expected false with error_type FileExistsError. The startup error box is stubbed, the app quits.
// Every record is checked to carry no message text: "planted" appears in no trace file.

import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

type Rec = { boot_id: string; proc_seq: number; name: string; window_id: number | null; payload: Record<string, unknown> };

const launch = launchArgs({ plantsBreaks: true });
const traces = join(launch.state, "electron", "logs", "traces");
const boots = () => (existsSync(traces) ? readdirSync(traces).sort() : []);
const read = (boot: string, file: string): Rec[] => {
  const p = join(traces, boot, file);
  return existsSync(p) ? readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec) : [];
};
const failures: string[] = [];
const check = (ok: boolean, what: string) => { if (!ok) failures.push(what); console.log(`${ok ? "ok  " : "FAIL"} ${what}`); };

/** Wait until main.jsonl of `boot` holds a record that `pred` accepts. */
async function mainHas(boot: string, pred: (r: Rec) => boolean, what: string, ms = 15_000): Promise<Rec | undefined> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const r = read(boot, "main.jsonl").find(pred);
    if (r) return r;
    await new Promise((res) => setTimeout(res, 100));
  }
  check(false, `${what}: not in main.jsonl within ${ms} ms`);
  return undefined;
}

/** Launch, and wait for the launch's own trace folder: main makes it when it is ready, after launch() resolves. */
async function launchOne(): Promise<{ app: ElectronApplication; boot: string }> {
  const known = new Set(boots());
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const end = Date.now() + 30_000;
  while (Date.now() < end) {
    const fresh = boots().find((b) => !known.has(b) && existsSync(join(traces, b, "main.jsonl")));
    if (fresh) return { app, boot: fresh };
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("the launch opened no trace folder within 30 s");
}

async function first(): Promise<string> {
  const { app, boot } = await launchOne();
  const win = await app.firstWindow({ timeout: 30_000 });
  await waitForApp(win);
  await bindPaneAsUser(win, "deterministic");

  // A hang. Electron fires unresponsive only when no debugger is attached to the page (measured on
  // Electron 44, 2026-11-08: a 45 s spin with a debugger attached gave responsive alone; without one,
  // unresponsive at 16.6 s), and Playwright attaches one to every page, so a real spin is never
  // reported under a gate. The gate emits Electron's two events on the window instead, twice
  // unresponsive as Electron repeats it during one hang, then responsive.
  await app.evaluate(async ({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    w.emit("unresponsive");
    await new Promise((r) => setTimeout(r, 300));
    w.emit("unresponsive");
    await new Promise((r) => setTimeout(r, 300));
    w.emit("responsive");
  });
  await mainHas(boot, (r) => r.name === "WINDOW_UNRESPONSIVE", "WINDOW_UNRESPONSIVE");
  const back = await mainHas(boot, (r) => r.name === "WINDOW_RESPONSIVE", "WINDOW_RESPONSIVE");
  check(!!back && typeof back.payload.unresponsive_ms === "number" && (back.payload.unresponsive_ms as number) >= 500, `WINDOW_RESPONSIVE unresponsive_ms ${back?.payload.unresponsive_ms}, timed from the first report`);

  await win.evaluate("setTimeout(() => { throw new TypeError('planted window throw'); }, 0); 0");
  await win.evaluate("Promise.reject(new RangeError('planted window rejection')); 0");
  await settled(win);
  // Meta's stream lens, then envelopes it cannot draw (streamRows reads .length of null).
  await win.keyboard.press("Meta+m");
  await win.locator('[data-lens-chip="stream"]').first().waitFor({ state: "visible", timeout: 10_000 });
  await win.evaluate("globalThis.__substrateStream.set({ envelopes: null, topology: null, language: null }); 0");
  await settled(win).catch(() => undefined);

  await app.evaluate(() => { Promise.reject(new RangeError("planted main rejection")); });
  await mainHas(boot, (r) => r.name === "MAIN_FAULTED" && r.payload.source === "rejection", "MAIN_FAULTED rejection");

  const gpu = await app.evaluate(({ app: a }) => {
    const g = a.getAppMetrics().find((m) => m.type === "GPU");
    if (g) process.kill(g.pid, "SIGKILL");
    return g ? g.pid : null;
  });
  check(gpu !== null, `a GPU process to kill (pid ${gpu})`);
  await mainHas(boot, (r) => r.name === "CHILD_PROCESS_GONE" && r.payload.type === "gpu", "CHILD_PROCESS_GONE gpu");

  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].webContents.emit("preload-error", {}, "/planted/path/preload.js", new SyntaxError("planted preload"));
  });
  await mainHas(boot, (r) => r.name === "WINDOW_FAULTED" && r.payload.source === "preload", "WINDOW_FAULTED preload");

  await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].webContents.forcefullyCrashRenderer(); });
  await mainHas(boot, (r) => r.name === "RENDERER_GONE", "RENDERER_GONE");

  await app.evaluate(() => { setTimeout(() => { throw new TypeError("planted main throw"); }, 0); });
  await mainHas(boot, (r) => r.name === "MAIN_FAULTED" && r.payload.source === "exception", "MAIN_FAULTED exception");
  // Electron's error box now holds main; the boot ends here, without its closing record.
  const pid = app.process().pid!;
  process.kill(pid, "SIGKILL");
  await new Promise<void>((r) => { if (app.process().exitCode !== null || app.process().signalCode !== null) r(); else app.process().once("exit", () => r()); });
  // Its server outlives main by up to its watchdog's poll; it is this launch's own.
  for (const r of read(boot, "main.jsonl")) if (r.name === "SERVER_SPAWNED") { try { process.kill(-(r.payload.pid as number), "SIGTERM"); } catch { /* gone */ } }
  return boot;
}

async function main(): Promise<void> {
  let code = 1;
  try {
    const b1 = await first();
    const m1 = read(b1, "main.jsonl");
    const w1 = read(b1, "window-1.jsonl");
    const wf = w1.filter((r) => r.name === "WINDOW_FAULTED").map((r) => `${r.payload.source}:${r.payload.error_type}`);
    check(wf[0] === "error:TypeError" && wf[1] === "rejection:RangeError", `window faults from the timer and the rejection (${wf.join(", ")})`);
    check(wf.length === 3 && wf[2] === "error:TypeError", `the render error reaches WINDOW_FAULTED (${wf.join(", ")})`);
    const gone = m1.find((r) => r.name === "RENDERER_GONE");
    check(!!gone && gone.window_id === 1 && ["crashed", "killed", "abnormal_exit"].includes(String(gone.payload.reason)) && typeof gone.payload.exit_code === "number", `RENDERER_GONE in window 1 (${JSON.stringify(gone?.payload)})`);
    const pre = m1.find((r) => r.name === "WINDOW_FAULTED");
    check(!!pre && pre.window_id === 1 && pre.payload.error_type === "SyntaxError" && pre.payload.where === "preload.js", `WINDOW_FAULTED preload (${JSON.stringify(pre?.payload)})`);
    const mf = m1.filter((r) => r.name === "MAIN_FAULTED").map((r) => `${r.payload.source}:${r.payload.error_type}`);
    check(mf.join(",") === "rejection:RangeError,exception:TypeError", `MAIN_FAULTED (${mf.join(", ")})`);
    check(m1.filter((r) => r.name === "WINDOW_UNRESPONSIVE").length === 1, "one WINDOW_UNRESPONSIVE for the one hang");
    check(m1[m1.length - 1]?.name !== "APP_QUIT_COMPLETED", `launch 1 killed before its closing record (last: ${m1[m1.length - 1]?.name})`);

    const { app: app2, boot: b2 } = await launchOne();
    await waitForApp(await app2.firstWindow({ timeout: 30_000 }));
    await app2.close();
    const m2 = read(b2, "main.jsonl");
    const s2 = m2.filter((r) => r.name === "INVARIANT_BROKEN" && r.payload.rule === "S2");
    const st = (s2[0]?.payload.context as { state?: { boot_id?: string; last?: { name?: string } } } | undefined)?.state;
    check(s2.length === 1 && st?.boot_id === b1 && st?.last?.name === m1[m1.length - 1]?.name, `launch 2 reports S2 for launch 1 (${JSON.stringify(st)})`);
    check(m2[m2.length - 1]?.name === "APP_QUIT_COMPLETED", "launch 2 closes");
    check(m2.filter((r) => r.name === "INVARIANT_BROKEN").length === 1, `launch 2 breaks no other rule (${m2.filter((r) => r.name === "INVARIANT_BROKEN").map((r) => r.payload.rule).join(", ")})`);

    // Launch 3: the server cannot create its sessions folder.
    const sessions = join(launch.state, "sessions");
    if (existsSync(sessions)) renameSync(sessions, join(launch.state, "sessions-before"));
    writeFileSync(sessions, "planted: not a folder");
    const { app: app3, boot: b3 } = await launchOne();
    const exited = new Promise<void>((r) => app3.process().once("exit", () => r()));
    await app3.evaluate(({ dialog }) => { dialog.showErrorBox = () => undefined; });
    await Promise.race([exited, new Promise((r) => setTimeout(r, 30_000))]);
    await app3.close().catch(() => undefined);
    const s3 = read(b3, "server.jsonl");
    check(s3.length === 1 && s3[0].name === "SERVER_UNCAUGHT" && s3[0].payload.error_type === "FileExistsError" && s3[0].payload.thread === "MainThread", `server.jsonl: ${JSON.stringify(s3.map((r) => [r.name, r.payload]))}`);
    const m3 = read(b3, "main.jsonl");
    const ex = m3.find((r) => r.name === "SERVER_EXITED");
    check(!!ex && ex.payload.expected === false && ex.payload.error_type === "FileExistsError", `SERVER_EXITED (${JSON.stringify(ex?.payload)})`);
    check(m3.filter((r) => r.name === "INVARIANT_BROKEN").length === 0, `launch 3 breaks no rule (${m3.filter((r) => r.name === "INVARIANT_BROKEN").map((r) => JSON.stringify(r.payload).slice(0, 200)).join("; ")})`);

    const text = boots().flatMap((b) => readdirSync(join(traces, b)).map((f) => readFileSync(join(traces, b, f), "utf8"))).join("");
    check(!text.includes("planted"), "no planted message text in any trace file (E1)");
    code = failures.length ? 1 : 0;
    console.log(code === 0 ? "fault_signals: ok — every planted fault is in the trace, and the next boot reports the unclosed one (S2)" : `fault_signals: FAIL — ${failures.length} check(s): ${failures.join("; ")}`);
  } catch (e) {
    console.error(`fault_signals: FAIL — ${(e as Error).message}`);
  } finally {
    launch.cleanup();
  }
  process.exit(code);
}

main();
