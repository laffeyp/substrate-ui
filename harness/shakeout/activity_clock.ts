// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A live turn's clock on the session bar line counts between controller events (sprint 269; plan
// PLAN-2026-11-04-shell-to-react-r5.md, C2, F350).
//
// The line used to redraw on DCLogic's 500 ms tick, rescanning the record each time; it is now
// web/app/ActivityLine.tsx, whose clock runs only while a turn is live and whose scan runs once per
// snapshot (web/reveal/activity.ts). The deterministic driver answers at once, so the gate makes the
// turn live by adding a UserMessage to pane 1's snapshot, as escape_order.ts sets a turn running.
//
// Steps: after one turn the line reads the recap and does not pulse. With a UserMessage sent 5s ago
// and nothing after it, the line pulses and its seconds read at least 5s, and within 3s they read
// more, with no controller event between. A Returned after it brings the recap back and stops the
// pulse.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const LINE = '[data-view="panes"] [data-session-bar-line]';
const read = (win: Page) => win.evaluate((sel) => {
  const el = document.querySelector(sel);
  const head = el?.querySelector("span");
  return { text: (el?.textContent ?? "").trim(), pulse: !!head && head.className === "act-pulse" };
}, LINE);
const secs = (text: string) => { const m = text.match(/· (\d+)s ·/); return m ? Number(m[1]) : null; };

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await settled(win);
    const recap = await read(win);
    if (recap.pulse || !/returned/.test(recap.text)) throw new Error(`after a turn the line reads ${JSON.stringify(recap)}`);
    seen.push(`recap "${recap.text.slice(0, 40)}…", no pulse`);

    // A live turn: a UserMessage 5s ago, nothing after it.
    await win.evaluate(() => {
      const ctl = (window as any).__vm.get(1);
      const s = ctl.snapshot();
      const last = s.rawEnvelopes[s.rawEnvelopes.length - 1];
      ctl.patch({ rawEnvelopes: [...s.rawEnvelopes, { seq: last.seq + 1, kind: "UserMessage", t: Date.now() / 1000 - 5, payload: { turn_index: 1 } }] });
    });
    await win.waitForFunction((sel) => /ctrl\+c to stop/.test(document.querySelector(sel)?.textContent ?? ""), LINE, { timeout: 5_000 });
    const first = await read(win);
    const a = secs(first.text);
    if (!first.pulse || a === null || a < 5) throw new Error(`live turn: ${JSON.stringify(first)}`);
    // No controller event comes; only the line's own clock can move the seconds.
    await win.waitForFunction(([sel, was]) => {
      const m = (document.querySelector(sel as string)?.textContent ?? "").match(/· (\d+)s ·/);
      return !!m && Number(m[1]) > (was as number);
    }, [LINE, a] as const, { timeout: 3_000 }).catch(async () => { throw new Error(`the clock did not move past ${a}s: ${JSON.stringify(await read(win))}`); });
    const b = secs((await read(win)).text);
    seen.push(`live: pulse, ${a}s then ${b}s with no event between`);

    // The turn returns: the recap comes back and the pulse stops.
    await win.evaluate(() => {
      const ctl = (window as any).__vm.get(1);
      const s = ctl.snapshot();
      const last = s.rawEnvelopes[s.rawEnvelopes.length - 1];
      ctl.patch({ rawEnvelopes: [...s.rawEnvelopes, { seq: last.seq + 1, kind: "Returned", t: Date.now() / 1000, payload: { reason: "replied" } }] });
    });
    await win.waitForFunction((sel) => /returned/.test(document.querySelector(sel)?.textContent ?? ""), LINE, { timeout: 5_000 });
    const back = await read(win);
    if (back.pulse) throw new Error(`after Returned the line still pulses: ${JSON.stringify(back)}`);
    seen.push("Returned: recap, no pulse");

    console.log(`activity_clock: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`activity_clock: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
