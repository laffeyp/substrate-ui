// Transcript scroll gate (UI sprint 102), driven in the Electron app itself.
//
//   following — at the bottom, each new turn stays in view;
//   reading   — scrolled up, the row being read does not move when a turn arrives;
//   resume    — scrolled back to the bottom, following resumes;
//   switch    — terminal → reveal → terminal returns to the same place, scrolled up or not.
//
// No gate measured any of this, which is how it stayed broken from 2026-09-24 to 2026-10-02
// (process/planning/POSTMORTEM-2026-10-02-transcript-follow-bottom-regression.md).
//
// Runs against source (`electron .`) by default; SHAKEOUT_APP (or SCROLL_APP)=<path to
// Substrate.app> runs the packaged bundle. The deterministic driver keeps it offline and fast.
//
//   npx tsx harness/shakeout/transcript_follow.ts

import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { join, resolve } from "node:path";
import { scratchDir } from "./lib/scratch";
import { bindPaneAsUser } from "./lib/electron";

const REPO_ROOT = resolve(__dirname, "..", "..");
// SHAKEOUT_APP is the one variable every Electron gate reads (lib/electron.ts).
const APP = process.env.SCROLL_APP || process.env.SHAKEOUT_APP || "";
const SCROLLER = '[data-vm-transcript-scroller="1"]';
const fails: string[] = [];
const check = (ok: boolean, what: string) => {
  process.stdout.write(`${ok ? "ok  " : "FAIL"} ${what}\n`);
  if (!ok) fails.push(what);
};

function launch(): Promise<ElectronApplication> {
  const state = scratchDir("scroll-state-");
  const userData = scratchDir("scroll-userdata-");
  const env = { ...process.env, SUBSTRATE_HOME: state } as Record<string, string>;
  return APP
    ? electron.launch({ executablePath: join(APP, "Contents", "MacOS", "Substrate"), args: ["--user-data-dir=" + userData], env })
    : electron.launch({ args: [REPO_ROOT, "--user-data-dir=" + userData], env });
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
  await win.keyboard.down("Control");
  await win.keyboard.press("`");
  await win.keyboard.up("Control");
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
    // Bind the pane as a user does; the view switch (ctrl+`) is a no-op on an unbound pane
    // (reveal_component.ts), which let the switch checks below pass without switching.
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
    check(g4.dist <= 2, `switch: at the bottom before the switch, following after it (gap ${g4.dist}px)`);
  } catch (e) {
    check(false, `flow error: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await app?.close().catch(() => undefined);
  }
  process.stdout.write(fails.length ? `transcript_follow: ${fails.length} FAILED\n` : "transcript_follow: all passed\n");
  process.exit(fails.length ? 1 : 0);
})();
