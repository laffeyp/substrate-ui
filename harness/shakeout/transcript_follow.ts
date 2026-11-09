// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Transcript scroll gate (UI sprint 102), driven in the Electron app itself.
//
//   following — at the bottom, each new turn stays in view;
//   reading   — scrolled up, the row being read does not move when a turn arrives;
//   resume    — scrolled back to the bottom, following resumes;
//   switch    — terminal → reveal → terminal returns to the same place, scrolled up or not.
//
// Then the trace (vocabulary v0.13, sprint 359): window-1.jsonl holds TRANSCRIPT_SCROLLED for each
// step, in order (user: up, user: bottom, user: up, view_switch: up, user: bottom, view_switch:
// following), and every record keeps E8: following and not pinned implies at_bottom.
//
// No gate measured any of this, which is how it stayed broken from 2026-09-24 to 2026-10-02
// (process/planning/POSTMORTEM-2026-10-02-transcript-follow-bottom-regression.md).
//
// Runs against source (`electron .`) by default; SHAKEOUT_APP (or SCROLL_APP)=<path to
// Substrate.app> runs the packaged bundle. The deterministic driver keeps it offline and fast.
//
//   npx tsx harness/shakeout/transcript_follow.ts

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs } from "./lib/electron";

const SCROLLER = '[data-vm-transcript-scroller="1"]';
const fails: string[] = [];
const check = (ok: boolean, what: string) => {
  process.stdout.write(`${ok ? "ok  " : "FAIL"} ${what}\n`);
  if (!ok) fails.push(what);
};

// The shared launch: its own state and profile, and the offline roster, so the pane binds
// `deterministic` on every machine. Its own launch used this machine's live roster, so its turns
// went to a real cloud model and binding waited on Ollama's tag list (2026-10-14: one run in eight
// timed out waiting for the default model's row).
let traces = "";
function launch(): Promise<ElectronApplication> {
  if (process.env.SCROLL_APP && !process.env.SHAKEOUT_APP) process.env.SHAKEOUT_APP = process.env.SCROLL_APP;
  const args = launchArgs();
  traces = join(args.state, "electron", "logs", "traces");
  process.on("exit", args.cleanup);
  return electron.launch(args.options);
}

interface Scrolled { proc_seq: number; pane_id: number | null; payload: { pane_id: number; at_bottom: boolean; following: boolean; pinned: boolean; cause: string } }
/** Pane 1's TRANSCRIPT_SCROLLED records from the launch's window-1.jsonl, read after the app closes. */
function scrolledRecords(): Scrolled[] {
  const boot = readdirSync(traces).sort().pop()!;
  return readFileSync(join(traces, boot, "window-1.jsonl"), "utf8").split("\n").filter(Boolean)
    .map((l) => JSON.parse(l) as Scrolled & { name: string })
    .filter((r) => r.name === "TRANSCRIPT_SCROLLED" && r.payload.pane_id === 1);
}

interface Geo { top: number; height: number; client: number; dist: number }
const geo = (win: Page): Promise<Geo> =>
  win.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel)!;
    return { top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight, dist: el.scrollHeight - el.scrollTop - el.clientHeight };
  }, SCROLLER);

/** Resolve once the transcript's layout has held still for three animation frames: the condition
 * the fixed 250-400 ms sleeps stood in for (lens audit F387). */
async function settle(win: Page): Promise<void> {
  // A string, not a closure: tsx wraps named inner functions in a __name helper the page lacks.
  await win.evaluate(`new Promise((resolve) => {
    let last = -1, still = 0, frames = 0;
    const step = () => {
      const el = document.querySelector(${JSON.stringify(SCROLLER)});
      const h = el ? el.scrollHeight * 100000 + el.scrollTop : 0;
      still = h === last ? still + 1 : 0;
      last = h;
      if (still >= 3 || ++frames > 600) resolve(undefined); else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  })`);
}

/** The user scrolls: set scrollTop the way a wheel would, then let the scroll event land. */
async function scrollTo(win: Page, where: "bottom" | number): Promise<void> {
  await win.evaluate(([sel, w]) => {
    const el = document.querySelector<HTMLElement>(sel as string)!;
    el.scrollTop = w === "bottom" ? el.scrollHeight : (w as number);
  }, [SCROLLER, where] as const);
  await settle(win);
}

/** Viewport y of the transcript element at the scroller's top edge, tagged so it can be found again. */
async function markTopRow(win: Page): Promise<number> {
  return win.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel)!;
    const r = el.getBoundingClientRect();
    let hit = document.elementFromPoint(r.left + 40, r.top + 30) as HTMLElement | null;
    while (hit && hit.parentElement && !hit.parentElement.hasAttribute("data-vm-atom-root") && hit.parentElement !== el) {
      if (hit.parentElement.parentElement?.hasAttribute("data-vm-atom-root")) break;
      hit = hit.parentElement;
    }
    document.querySelectorAll("[data-scroll-probe]").forEach((n) => n.removeAttribute("data-scroll-probe"));
    hit?.setAttribute("data-scroll-probe", "1");
    return hit ? hit.getBoundingClientRect().top : NaN;
  }, SCROLLER);
}

const probeTop = (win: Page): Promise<number> =>
  win.evaluate(() => {
    const n = document.querySelector<HTMLElement>("[data-scroll-probe]");
    return n ? n.getBoundingClientRect().top : NaN;
  });

let turns = 0;
async function turn(win: Page): Promise<void> {
  turns += 1;
  // A turn ends with Returned (vocabulary v0.3) or, on records before it, Park.
  const parksBefore = await win.evaluate(
    () => ((window as any).__vm.get(1).snapshot().rawEnvelopes as { kind: string }[]).filter((e) => e.kind === "Returned" || e.kind === "Park").length,
  );
  await win.evaluate((n) => (window as any).__vm.get(1).sendTurn(`turn ${n}: say something short`), turns);
  await win.waitForFunction(
    (before) => ((window as any).__vm.get(1).snapshot().rawEnvelopes as { kind: string }[]).filter((e) => e.kind === "Returned" || e.kind === "Park").length > before,
    parksBefore,
    { timeout: 30_000 },
  );
  await settle(win); // rows render, layout settles
}

async function toggleView(win: Page): Promise<void> {
  const revealed = await win.evaluate(() => document.querySelectorAll('[data-vm-transcript-mount="reveal"]').length > 0);
  await win.keyboard.press("Meta+m"); // ⌘M toggles meta and panes
  await win.waitForFunction(
    (was) => (document.querySelectorAll('[data-vm-transcript-mount="reveal"]').length > 0) !== was,
    revealed,
    { timeout: 10_000 },
  );
  await settle(win);
}

(async () => {
  let app: ElectronApplication | null = null;
  try {
    app = await launch();
    const win = await app.firstWindow({ timeout: 30_000 });
    await win.waitForLoadState("load");
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0]?.setSize(900, 560); });
    await win.waitForFunction(() => (window as any).__vm != null, undefined, { timeout: 15_000 });
    // Bind the pane as a user does; the view switch (⌘M) does nothing on an unbound pane, which let
    // the switch checks below pass without switching.
    await bindPaneAsUser(win);
    await win.evaluate(async () => {
      const c = (window as any).__vm.get(1) ?? (window as any).__vm.spawn(1);
      await c.loadDriverRoster();
      c.pickDriver("deterministic");
      await c.openSession({ driver: "deterministic" });
    });

    // 1. following: every turn lands in view until the transcript is several screens tall.
    let worstDist = 0;
    for (let i = 0; i < 40; i++) {
      await turn(win);
      const g = await geo(win);
      worstDist = Math.max(worstDist, g.dist);
      if (g.height > g.client * 3) break;
    }
    const g1 = await geo(win);
    check(g1.height > g1.client * 2, `transcript overflows (${g1.height}px content in a ${g1.client}px view, ${turns} turns)`);
    check(worstDist <= 2, `following: the view stayed at the bottom after every turn (worst gap ${worstDist}px)`);

    // 2. reading: scroll up, a turn arrives, the row being read does not move.
    await scrollTo(win, Math.floor(g1.height / 3));
    const before = await geo(win);
    const rowBefore = await markTopRow(win);
    await turn(win);
    const after = await geo(win);
    const rowAfter = await probeTop(win);
    check(after.height > before.height, `reading: the new turn added content (${before.height} → ${after.height}px)`);
    check(Math.abs(rowAfter - rowBefore) <= 1, `reading: the row being read stayed put (${rowBefore} → ${rowAfter})`);

    // 3. resume: back at the bottom, the next turn is followed.
    await scrollTo(win, "bottom");
    await turn(win);
    const g3 = await geo(win);
    check(g3.dist <= 2, `resume: following resumed at the bottom (gap ${g3.dist}px)`);

    // 4. view switch, scrolled up: terminal → reveal → terminal comes back to the same place.
    await scrollTo(win, Math.floor(g3.height / 3));
    const up = await geo(win);
    await toggleView(win);
    await toggleView(win);
    const back = await geo(win);
    check(Math.abs(back.top - up.top) <= 2, `switch: scrolled-up position survived terminal → reveal → terminal (${up.top} → ${back.top})`);

    // 4b. view switch at the bottom stays at the bottom, and still follows.
    await scrollTo(win, "bottom");
    await toggleView(win);
    await toggleView(win);
    await turn(win);
    const g4 = await geo(win);
    check(g4.dist <= 2, `switch: at the bottom before the switch, following after it (gap ${g4.dist}px; ${JSON.stringify(g4)})`);
  } catch (e) {
    check(false, `flow error: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await app?.close().catch(() => undefined);
  }
  try {
    const recs = scrolledRecords();
    const show = recs.map((r) => `  ${r.proc_seq} ${r.payload.cause} at_bottom=${r.payload.at_bottom} following=${r.payload.following} pinned=${r.payload.pinned}`).join("\n");
    if (process.env.TRACE_PRINT) process.stdout.write(show + "\n");
    const broken = recs.filter((r) => r.payload.following && !r.payload.pinned && !r.payload.at_bottom);
    check(broken.length === 0, `E8: following and not pinned implies at_bottom, in all ${recs.length} records${broken.length ? ` (broken at proc_seq ${broken.map((r) => r.proc_seq).join(", ")})` : ""}`);
    check(recs.every((r) => r.pane_id === 1), "every record carries pane 1 in its context");
    const want: [string, string, boolean][] = [
      ["reading", "user", false],
      ["resume", "user", true],
      ["switch scrolled up", "user", false],
      ["switch scrolled up", "view_switch", false],
      ["switch at the bottom", "user", true],
      ["switch at the bottom", "view_switch", true],
    ];
    let i = 0;
    for (const r of recs) if (i < want.length && r.payload.cause === want[i][1] && r.payload.following === want[i][2] && r.payload.at_bottom === want[i][2]) i += 1;
    check(i === want.length, i === want.length
      ? `trace: TRANSCRIPT_SCROLLED for each step in order (${want.length} of ${recs.length} records)`
      : `trace: no TRANSCRIPT_SCROLLED ${want[i][1]} following=${want[i][2]} for step "${want[i][0]}" (step ${i + 1} of ${want.length}); records:\n${show}`);
  } catch (e) {
    check(false, `trace read: ${e instanceof Error ? e.message : String(e)}`);
  }
  process.stdout.write(fails.length ? `transcript_follow: ${fails.length} FAILED\n` : "transcript_follow: all passed\n");
  process.exit(fails.length ? 1 : 0);
})();
