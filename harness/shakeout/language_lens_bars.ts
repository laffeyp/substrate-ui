// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The language lens, bars view (UI sprint 169; roadmap ROADMAP-2026-10-13-language-in-the-app.md).
//
// Steps, in the Electron app on the deterministic driver: two turns, `/length full`, two more turns;
// reveal (⌘M) and pick the language lens. The lens shows the 13 watched measures in three groups,
// four turn rows, the length change as a rule above turn 2, a readout equal to the route's values
// for the last turn, and each header's hover equal to the generated explanation. ↑ moves the
// selection to turn 2; ↵ opens the stream.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { LANGUAGE_MEASURES, LANGUAGE_WATCHED } from "../../web/vm/language_measures.gen";
import { fmt } from "../../web/reveal/language_lens";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const BAR = `(document.querySelector('[data-pane="1"] [data-session-bar-line]')?.textContent || "").replace(/\\s+/g, " ").trim()`;

async function type(win: Page, text: string): Promise<void> {
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await win.keyboard.press("Enter");
}

async function turn(win: Page, text: string): Promise<void> {
  const before = await win.evaluate(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length`) as number;
  await type(win, text);
  await win.waitForFunction(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length > ${before} && /returned/.test(${BAR})`, undefined, { timeout: 20_000 });
}

const visible = (attr: string) => `Array.from(document.querySelectorAll('[${attr}]')).filter((e) => e.offsetParent !== null || e.getClientRects().length)`;

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    await turn(win, "one");
    await turn(win, "two");
    await type(win, "/length full");
    await settled(win);
    await turn(win, "three");
    await turn(win, "four");
    const sid = await win.evaluate(`window.__vm.get(1).snapshot().sessionId`) as string;

    await win.keyboard.press("Meta+m");
    await win.getByText("language", { exact: true }).first().click();
    await win.waitForFunction(`${visible("data-lang-lane")}.length === ${LANGUAGE_WATCHED.length} && ${visible("data-lang-row")}.length === 4`, undefined, { timeout: 15_000 });

    const lanes = await win.evaluate(`${visible("data-lang-lane")}.map((e) => ({ key: e.getAttribute("data-lang-lane"), title: e.getAttribute("title") }))`) as { key: string; title: string }[];
    if (JSON.stringify(lanes.map((l) => l.key)) !== JSON.stringify([...LANGUAGE_WATCHED])) throw new Error(`lanes ${JSON.stringify(lanes.map((l) => l.key))}`);
    const wrong = lanes.filter((l) => l.title !== LANGUAGE_MEASURES[l.key].explanation).map((l) => l.key);
    if (wrong.length) throw new Error(`headers whose hover is not the generated explanation: ${JSON.stringify(wrong)}`);

    const layout = await win.evaluate(`({
      rows: ${visible("data-lang-row")}.map((e) => ({ turn: e.getAttribute("data-lang-row"), top: e.getBoundingClientRect().top })),
      rules: ${visible("data-lang-rule")}.map((e) => ({ turn: e.getAttribute("data-lang-rule"), top: e.getBoundingClientRect().top, text: (e.textContent || "").replace(/\\s+/g, " ").trim() })),
      readout: ${visible("data-lang-value")}.map((e) => (e.textContent || "").trim()),
      label: ${visible("data-lang-readout")}.map((e) => (e.textContent || "").trim().split(/\\s+/)[0])[0],
    })`) as { rows: { turn: string; top: number }[]; rules: { turn: string; top: number; text: string }[]; readout: string[]; label: string };
    if (JSON.stringify(layout.rows.map((r) => r.turn)) !== JSON.stringify(["0", "1", "2", "3"])) throw new Error(`rows ${JSON.stringify(layout.rows)}`);
    const rule = layout.rules.find((r) => r.text.includes("length normal → full · turn 2"));
    const t1 = layout.rows[1], t2 = layout.rows[2];
    if (!rule || !(rule.top > t1.top && rule.top < t2.top)) throw new Error(`the length rule is not between turns 1 and 2: ${JSON.stringify(layout)}`);

    const view = await win.evaluate(`fetch("/api/session/${sid}/language").then((r) => r.json())`) as { lanes: { model: Record<string, { points: { turn: number; value: number }[] }> } };
    const want = LANGUAGE_WATCHED.map((m) => fmt(view.lanes.model[m].points.find((p) => p.turn === 3)?.value ?? null));
    const got = layout.readout.map((t) => t.replace(/ [▲▼]$/, ""));
    if (layout.label !== "t3" || JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`readout ${layout.label} ${JSON.stringify(layout.readout)}; the route's turn 3: ${JSON.stringify(want)}`);

    await win.keyboard.press("ArrowUp");
    await settled(win);
    const label = await win.evaluate(`${visible("data-lang-readout")}.map((e) => (e.textContent || "").trim().split(/\\s+/)[0])[0]`);
    if (label !== "t2") throw new Error(`↑ left the readout on ${JSON.stringify(label)}`);
    await win.keyboard.press("Enter");
    await settled(win);
    const lensGone = await win.evaluate(`${visible("data-lang")}.length === 0`);
    if (!lensGone) throw new Error("↵ did not open the stream");
    console.log(`language_lens_bars: ok — 13 lanes with their explanations, rows t0-t3, "${rule.text}" between t1 and t2, readout t3 ${JSON.stringify(layout.readout)} equal to the route; ↑ moved to t2, ↵ opened the stream (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`language_lens_bars: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
