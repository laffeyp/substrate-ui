// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// harness/quit_key.ts — does a real ⌘Q reach the app while its page is busy? (research
// 2026-11-18-window-productionizing r3, § 0.2 "Not yet judged", § 6.)
//
// A measurement, not a gate. Launches the source build with a window that takes focus (the gates' isolation is
// turned off for this one launch), makes it frontmost, sends ⌘Q through System Events, and prints the time from the
// key to APP_QUIT_REQUESTED in main's trace and to the app's exit.
//   QUIT_MODE=idle — the page idle: the control.
//   QUIT_MODE=busy — first a turn whose bash command prints QUIT_LINES lines (default 20,000); the key is sent
//                    QUIT_AFTER_S seconds (default 8) after the turn returns, while the page works through it.
// Safety: the key goes only to this launch's process. Before sending, the frontmost process's pid is read from System
// Events; if it is not this Electron's, nothing is sent and the run says so.

import { _electron as electron } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { launchArgs, waitForApp } from "./shakeout/lib/electron";

const MODE = process.env.QUIT_MODE || "idle";
const LINES = Number(process.env.QUIT_LINES || 20_000);
const AFTER_S = Number(process.env.QUIT_AFTER_S || 8);
const out = (o: unknown) => console.log(JSON.stringify(o));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function quitRequestedAt(state: string): number | null {
  const traces = join(state, "electron", "logs", "traces");
  if (!existsSync(traces)) return null;
  for (const boot of readdirSync(traces)) {
    const f = join(traces, boot, "main.jsonl");
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      if (line.includes('"APP_QUIT_REQUESTED"')) return Date.parse((JSON.parse(line) as { wall: string }).wall);
    }
  }
  return null;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  delete launch.options.env.SUBSTRATE_GATE_ISOLATE;  // this launch's window must take the key
  const ws = join(launch.state, "ws");
  mkdirSync(ws, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const pid = app.process().pid ?? -1;
  let exitedAt: number | null = null;
  app.process().on("exit", () => { exitedAt = Date.now(); });
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    if (MODE === "busy") {
      const base = `http://127.0.0.1:${new URL(win.url()).port}`;
      const post = (path: string, body: unknown) => fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
      const script = [["bash", [`for i in $(seq 1 ${LINES}); do printf 'line %06d %s\\n' $i 'the quick brown fox jumps over the lazy dog while the build prints its long log of every step it took'; done`]]];
      const { session_id: sid } = await post("/api/session", { driver: "deterministic", workspace: ws, make_repository: false, driver_params: { script } }) as { session_id: string };
      await win.evaluate(`(function () { var vm = window.__vm; return (vm.get(1) || vm.spawn(1)).attachExisting(${JSON.stringify(sid)}); })()`);
      await win.waitForFunction(`window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(sid)}`, undefined, { timeout: 15_000 });
      const t0 = Date.now();
      await post(`/api/session/${sid}/turn`, { text: "print the long log" });
      out({ turn_returned_s: Math.round((Date.now() - t0) / 100) / 10 });
      await sleep(AFTER_S * 1000);
    }
    await app.evaluate(({ app: a, BrowserWindow }) => { a.focus({ steal: true }); BrowserWindow.getAllWindows()[0]?.focus(); });
    await sleep(1500);
    // QUIT_PROGRAMMATIC=1: the idle control's quit-latency floor without a keystroke — `app.quit()` runs the
    // same before-quit → server-shutdown → exit path the menu's Command-Q reaches, so quit_requested→exit is
    // the comparable segment. Used for idle only (the busy case must use a real key, and does).
    if (process.env.QUIT_PROGRAMMATIC) {
      const ready = Date.now();
      await app.evaluate(({ app: a }) => a.quit());
      while (Date.now() - ready < 30_000 && exitedAt === null) await sleep(100);
      const req = quitRequestedAt(launch.state);
      out({
        mode: MODE, programmatic: true, quit_requested: req !== null,
        ready_to_quit_requested_s: req === null ? null : Math.round((req - ready) / 100) / 10,
        quit_requested_to_exit_s: req !== null && exitedAt !== null ? Math.round(((exitedAt as number) - req) / 100) / 10 : null,
        ready_to_exit_s: exitedAt === null ? null : Math.round(((exitedAt as number) - ready) / 100) / 10,
      });
      return;
    }
    // QUIT_MANUAL=1: the human presses Command-Q (no osascript, no Accessibility permission). The window is
    // frontmost and, in busy mode, churning through the log; wait for the app to exit, then read the trace.
    if (process.env.QUIT_MANUAL) {
      const ready = Date.now();
      out({ mode: MODE, app_pid: pid, manual: true, ready: true, msg: `window frontmost and ${MODE} — press Command-Q now` });
      while (Date.now() - ready < 180_000 && exitedAt === null) await sleep(250);
      const req = quitRequestedAt(launch.state);
      out({
        mode: MODE, manual: true, quit_requested: req !== null,
        ready_to_quit_requested_s: req === null ? null : Math.round((req - ready) / 100) / 10,
        quit_requested_to_exit_s: req !== null && exitedAt !== null ? Math.round(((exitedAt as number) - req) / 100) / 10 : null,
        ready_to_exit_s: exitedAt === null ? null : Math.round(((exitedAt as number) - ready) / 100) / 10,
      });
      return;
    }
    const front = Number(execFileSync("osascript", ["-e", 'tell application "System Events" to get unix id of first process whose frontmost is true'], { encoding: "utf8" }).trim());
    out({ mode: MODE, app_pid: pid, frontmost_pid: front });
    if (front !== pid) { out({ sent: false, reason: "this launch's window is not frontmost; no key sent" }); return; }
    const sent = Date.now();
    execFileSync("osascript", ["-e", 'tell application "System Events" to keystroke "q" using command down']);
    out({ sent: true });
    while (Date.now() - sent < 240_000 && exitedAt === null) {
      await sleep(250);
      if (quitRequestedAt(launch.state) !== null && exitedAt !== null) break;
    }
    const req = quitRequestedAt(launch.state);
    out({ mode: MODE, key_to_quit_requested_s: req === null ? null : Math.round((req - sent) / 100) / 10, key_to_exit_s: exitedAt === null ? null : Math.round(((exitedAt as number) - sent) / 100) / 10 });
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: false });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
