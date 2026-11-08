// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's pane records (vocabulary v0.14; plan 2026-11-05-sdd-signals item 4, sprint 360), read
// from the launch's window-1.jsonl. Steps, each a user's (or, for `direct`, the gates' own) path:
//   - boot: WINDOW_BOOTED is the file's first record (S1), its vocab_version current.json's;
//     PANE_OPENED 1 start;
//   - the picker binds pane 1: PICKER_COMMITTED, then PANE_BOUND 1 picker (S4); its session is then
//     opened through window.__vm (the pane is bound already, so no second PANE_BOUND);
//   - ⌘D: PANE_OPENED 2 split and PANE_FOCUSED 2 split;
//   - a click on pane 1: PANE_FOCUSED 1 click; a click on pane 2: PANE_FOCUSED 2 click;
//   - File ▸ Close Pane: PANE_CLOSED 2 (had_session false, still at its picker), PANE_FOCUSED 1 close;
//   - ⌘D: PANE_OPENED 3 split, PANE_FOCUSED 3 split; a session opened through window.__vm on pane 3:
//     PANE_BOUND 3 direct, with its id;
//   - a reload with ?session=<pane 1's session>: WINDOW_BOOTED, PANE_OPENED 1 start, PANE_BOUND 1
//     restore with that id.
// Every pane record carries its pane in the record context. SHAKEOUT_APP=<Substrate.app> runs the
// packaged bundle.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Rec = { proc_seq: number; pane_id: number | null; name: string; payload: Record<string, unknown> };
const VOCAB = JSON.parse(readFileSync(join(__dirname, "..", "..", "web", "vm", "signals", "versions", "current.json"), "utf8")) as { vocabulary_version: string };

const panes = (win: Page): Promise<number> => win.evaluate(() => document.querySelectorAll("[data-pane]").length);

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  let step = "launch";
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    step = "picker bind";
    await bindPaneAsUser(win);
    // The picker binds the pane; its session opens with the first message. Open it now, as
    // transcript_follow does, so the reload has a session to restore.
    const sid1 = await win.evaluate(async () => {
      const c = (window as any).__vm.get(1);
      await c.openSession({ driver: "deterministic" });
      return c.snapshot().sessionId as string;
    });
    await win.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => undefined);
    step = "first split";
    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await win.locator('[data-pane="1"]').click({ position: { x: 20, y: 20 } });
    await win.locator('[data-pane="2"]').click({ position: { x: 20, y: 20 } });
    await app.evaluate(({ Menu }) => { Menu.getApplicationMenu()?.getMenuItemById("menu-close-pane")?.click(); });
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 1, undefined, { timeout: 10_000 });
    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    step = "direct open on pane 3";
    const sid3 = await win.evaluate(async () => {
      const c = (window as any).__vm.get(3);
      await c.loadDriverRoster();
      c.pickDriver("deterministic");
      await c.openSession({ driver: "deterministic" });
      return c.snapshot().sessionId as string;
    });
    await win.waitForFunction(() => !!document.querySelector('[data-pane="3"] [data-vm-transcript-mount]'), undefined, { timeout: 10_000 });
    step = "reload with ?session=";
    // A reload with pane 1's session in the URL, as the window writes it for the focused pane.
    await win.evaluate((sid) => { const u = new URL(window.location.href); u.searchParams.set("session", sid); window.location.replace(u.toString()); }, sid1);
    await win.waitForLoadState("load");
    await waitForApp(win);
    await win.waitForFunction((sid) => (window as any).__vm.get(1).snapshot().sessionId === sid, sid1, { timeout: 15_000 });
    await win.waitForFunction(() => !!document.querySelector('[data-pane="1"] [data-vm-transcript-mount]'), undefined, { timeout: 10_000 });
    if ((await panes(win)) !== 1) throw new Error("the reload did not come back with one pane");
    const logs = await app.evaluate(({ app: a }) => a.getPath("logs"));
    await app.close();

    const root = join(logs, "traces");
    const dir = join(root, readdirSync(root).sort().pop()!);
    const w = readFileSync(join(dir, "window-1.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec);
    const show = (rs: Rec[]) => rs.filter((r) => /^(WINDOW_BOOTED|PANE_|PICKER_COMMITTED)/.test(r.name)).map((r) => `  ${r.proc_seq} p${r.pane_id} ${r.name} ${JSON.stringify(r.payload)}`).join("\n");
    if (w[0]?.name !== "WINDOW_BOOTED") throw new Error(`S1: window-1.jsonl opens with ${w[0]?.name}`);
    if (w[0].payload.vocab_version !== VOCAB.vocabulary_version) throw new Error(`WINDOW_BOOTED vocab_version ${String(w[0].payload.vocab_version)}, current.json ${VOCAB.vocabulary_version}`);
    const p = (r: Rec, id: number) => r.payload.pane_id === id && r.pane_id === id;
    const want: [string, (r: Rec) => boolean][] = [
      ["WINDOW_BOOTED", () => true],
      ["PANE_OPENED", (r) => p(r, 1) && r.payload.cause === "start"],
      ["PICKER_COMMITTED", (r) => p(r, 1)],
      ["PANE_BOUND", (r) => p(r, 1) && r.payload.how === "picker" && r.payload.binding === "session"],
      ["PANE_OPENED", (r) => p(r, 2) && r.payload.cause === "split"],
      ["PANE_FOCUSED", (r) => p(r, 2) && r.payload.cause === "split"],
      ["PANE_FOCUSED", (r) => p(r, 1) && r.payload.cause === "click"],
      ["PANE_FOCUSED", (r) => p(r, 2) && r.payload.cause === "click"],
      ["PANE_CLOSED", (r) => p(r, 2) && r.payload.had_session === false],
      ["PANE_FOCUSED", (r) => p(r, 1) && r.payload.cause === "close"],
      ["PANE_OPENED", (r) => p(r, 3) && r.payload.cause === "split"],
      ["PANE_FOCUSED", (r) => p(r, 3) && r.payload.cause === "split"],
      ["PANE_BOUND", (r) => p(r, 3) && r.payload.how === "direct" && r.payload.session_id === sid3],
      ["WINDOW_BOOTED", () => true],
      ["PANE_OPENED", (r) => p(r, 1) && r.payload.cause === "start"],
      ["PANE_BOUND", (r) => p(r, 1) && r.payload.how === "restore" && r.payload.session_id === sid1],
    ];
    let i = 0;
    for (const r of w) if (i < want.length && r.name === want[i][0] && want[i][1](r)) i += 1;
    if (i < want.length) throw new Error(`window-1.jsonl lacks ${want[i][0]} (step ${i + 1} of ${want.length}) in order:\n${show(w)}`);
    // No pane record beyond the ones the steps make: one binding per pane, one focus per move.
    const counts = (n: string) => w.filter((r) => r.name === n).length;
    const extra = [["PANE_OPENED", 4], ["PANE_BOUND", 3], ["PANE_FOCUSED", 5], ["PANE_CLOSED", 1]].filter(([n, k]) => counts(n as string) !== k);
    if (extra.length) throw new Error(`record counts ${extra.map(([n, k]) => `${String(n)} ${counts(n as string)} (expected ${String(k)})`).join(", ")}:\n${show(w)}`);
    if (process.env.TRACE_PRINT) console.log(show(w));
    console.log(`pane_signals: ok — ${want.length} window records in order; WINDOW_BOOTED first (v${VOCAB.vocabulary_version}); every pane record in its pane's context`);
    code = 0;
  } catch (e) {
    console.error(`pane_signals: FAIL at ${step} — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
