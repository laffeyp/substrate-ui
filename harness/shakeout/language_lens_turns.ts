// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The language lens, turns stream (UI sprint 174).
//
// Steps, in the Electron app on the deterministic driver: three turns; reveal, pick language, the
// turns stream. It opens on side by side: each turn's words cell draws the message's words left of
// the centre line and the reply's right of it, both equal to the route's values on the lane's one
// scale. Then measures: the lanes sit under LENGTH, ECHO and STYLE, and style match, under its
// 1,600-word threshold, reads "N of 1,600" with N the shorter side's window words from the route.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { LANGUAGE_LSM_MIN_WORDS, LANGUAGE_RELATION_LANES } from "../../web/vm/language_measures.gen";
import { LANE_W, niceCeil } from "../../web/reveal/language_lens";
import type { LanguageView } from "../../web/vm/types";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const BAR = `(document.querySelector('[data-pane="1"] [data-session-bar-line]')?.textContent || "").replace(/\\s+/g, " ").trim()`;
const HALF = (LANE_W - 14) / 2 - 1;

async function turn(win: Page, text: string): Promise<void> {
  const before = await win.evaluate(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length`) as number;
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await win.keyboard.press("Enter");
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
    await turn(win, "one short message");
    await turn(win, "a second message, a little longer than the first one");
    await turn(win, "three");
    const sid = await win.evaluate(`window.__vm.get(1).snapshot().sessionId`) as string;

    await win.keyboard.press("Meta+m");
    await win.getByText("language", { exact: true }).first().click();
    await win.locator('[data-lang-stream="turns"]').first().click();
    await win.waitForFunction(`${visible("data-lang-row")}.length === 3 && ${visible('data-lang-view="side by side"')}.length === 1`, undefined, { timeout: 15_000 });
    const view = await win.evaluate(`fetch("/api/session/${sid}/language").then((r) => r.json())`) as LanguageView;
    const user = view.lanes.user.words.points, model = view.lanes.model.words.points;
    const top = niceCeil(Math.max(...user.map((p) => p.value), ...model.map((p) => p.value)));
    const w = (v: number) => (v === 0 ? 0 : Math.max(1, Math.round(Math.min(1, v / top) * HALF)));
    const want = model.map((p) => ({ message: w(user.find((q) => q.turn === p.turn)?.value ?? 0), reply: w(p.value) }));
    const got = await win.evaluate(`${visible("data-lang-row")}.map((r) => ({
      message: Number(r.querySelector("[data-lang-bar]").getAttribute("data-lang-bar")),
      reply: Number(r.querySelector("[data-lang-bar2]").getAttribute("data-lang-bar2")),
    }))`) as { message: number; reply: number }[];
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`side by side words ${JSON.stringify(got)}; from the route ${JSON.stringify(want)} on 0–${top}`);
    if (got.every((c) => c.message >= c.reply)) throw new Error(`no reply is longer than its message; the check would not tell the sides apart: ${JSON.stringify(got)}`);

    await win.locator('[data-lang-view="measures"]').first().click();
    await settled(win);
    const groups = await win.evaluate(`Array.from(document.querySelectorAll('[data-lang] span')).map((e) => (e.textContent || "").trim()).filter((t) => ["LENGTH", "ECHO", "STYLE"].includes(t))`) as string[];
    if (JSON.stringify([...new Set(groups)]) !== JSON.stringify(["LENGTH", "ECHO", "STYLE"])) throw new Error(`group headers ${JSON.stringify(groups)}`);
    const finalSeq = Math.max(...view.lines.filter((l) => l.stream === "relation" && l.pairing === "final").map((l) => l.seq));
    const words = (stream: string) => {
      let n = 0;
      for (const l of view.lines) if (l.seq <= finalSeq && l.stream === stream) n = Number((l.values.window as { words?: number } | undefined)?.words ?? n);
      return n;
    };
    const shorter = Math.min(words("user"), words("model"));
    const readout = await win.evaluate(`${visible("data-lang-value")}.map((e) => (e.textContent || "").trim())`) as string[];
    const lsm = readout[LANGUAGE_RELATION_LANES.indexOf("window_lsm")];
    const wantLsm = `${shorter.toLocaleString("en-US")} of ${LANGUAGE_LSM_MIN_WORDS.toLocaleString("en-US")}`;
    if (lsm !== wantLsm) throw new Error(`style match reads ${JSON.stringify(lsm)}; the route's shorter window is ${shorter} words`);
    console.log(`language_lens_turns: ok — side by side words (message | reply) ${JSON.stringify(got.map((c) => `${c.message}|${c.reply}`))} equal the route on 0–${top}; measures under LENGTH, ECHO, STYLE; style match reads "${lsm}" (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`language_lens_turns: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
