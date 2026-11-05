// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's side graph and the stream scroll together (sprint 299; plan
// PLAN-2026-11-04-shell-to-react-r5.md, D3).
//
// In the side direction the graph scrolls across and the stream's rows scroll down, each in proportion
// to the other: the graph's left edge is the stream's top, its right edge the stream's bottom. D3 moved
// the graph to React, with the link through web/app/state/stream.ts; no gate held the link before.
//
// Steps: a 900px window (the graph's 540px track then overflows meta's half); bind pane 1
// (deterministic); ⌘M; send turns until the stream overflows; → side. The stream scrolled to its top
// puts the graph at its left edge, to its bottom at its right edge; the graph scrolled to its left edge
// puts the stream at its top, to half its width puts the stream at half its height.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

// Plain-string evaluates: esbuild's __name helper does not exist in the page.
const STREAM = `Array.from(document.querySelectorAll("[data-stream-scroll]")).find((e) => e.offsetParent !== null)`;
const GRAPH = `document.querySelector("[data-side-scroll]")`;
const POS = `(() => { const s = ${STREAM}, g = ${GRAPH}; return {
  down: s ? s.scrollTop / Math.max(1, s.scrollHeight - s.clientHeight) : -1, streamOver: s ? s.scrollHeight - s.clientHeight : 0,
  across: g ? g.scrollLeft / Math.max(1, g.scrollWidth - g.clientWidth) : -1, graphOver: g ? g.scrollWidth - g.clientWidth : 0 }; })()`;
type Pos = { down: number; across: number; streamOver: number; graphOver: number };
const ROWS = `(${STREAM}).querySelectorAll('[data-stream-row]').length`;

async function send(win: Page, text: string): Promise<void> {
  const before = await win.evaluate(ROWS) as number;
  await win.evaluate(`window.__vm.get(1).sendTurn(${JSON.stringify(text)})`);
  await win.waitForFunction(`${ROWS} > ${before} + 5`, undefined, { timeout: 20_000 });
  await settled(win);
}

/** Scrolls one side and waits for the other to reach its share, within a pixel's worth. */
async function scrollAndWait(win: Page, side: "stream" | "graph", share: number, what: string): Promise<Pos> {
  const set = side === "stream"
    ? `(() => { const s = ${STREAM}; s.scrollTop = ${share} * (s.scrollHeight - s.clientHeight); s.dispatchEvent(new Event("scroll")); })()`
    : `(() => { const g = ${GRAPH}; g.scrollLeft = ${share} * (g.scrollWidth - g.clientWidth); g.dispatchEvent(new Event("scroll")); })()`;
  await win.evaluate(set);
  const other = side === "stream" ? "across" : "down";
  const over = side === "stream" ? "graphOver" : "streamOver";
  await win.waitForFunction(`(() => { const p = ${POS}; return Math.abs(p.${other} - ${share}) * p.${over} <= 1.5; })()`, undefined, { timeout: 5_000 })
    .catch(async () => { throw new Error(`${what}: ${JSON.stringify(await win.evaluate(POS))}`); });
  await settled(win);
  return await win.evaluate(POS) as Pos;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(900, 600));
    await bindPaneAsUser(win, "deterministic");
    await win.keyboard.press("Meta+m");
    await win.waitForFunction(`!!(${STREAM})`, undefined, { timeout: 15_000 });
    const over = async () => (await win.evaluate(POS) as Pos).streamOver;
    for (let i = 0; i < 12 && await over() < 300; i++) await send(win, `turn ${i}`);
    if (await over() < 300) throw new Error(`the stream never overflowed by 300px: ${JSON.stringify(await win.evaluate(POS))}`);
    await win.getByText("→ side", { exact: true }).click();
    await win.locator("[data-side-scroll]").waitFor({ timeout: 5_000 });
    await settled(win);
    const start = await win.evaluate(POS) as Pos;
    if (start.graphOver < 40) throw new Error(`the side graph does not overflow, so nothing can be checked: ${JSON.stringify(start)}`);
    seen.push(`stream over by ${start.streamOver}px, graph by ${start.graphOver}px`);

    let p = await scrollAndWait(win, "stream", 0, "stream at its top, the graph not at its left edge");
    p = await scrollAndWait(win, "stream", 1, "stream at its bottom, the graph not at its right edge");
    seen.push(`stream top → graph left; stream bottom → graph right (${p.across.toFixed(3)})`);
    p = await scrollAndWait(win, "graph", 0, "graph at its left edge, the stream not at its top");
    p = await scrollAndWait(win, "graph", 0.5, "graph at half its width, the stream not at half its height");
    seen.push(`graph left → stream top; graph half → stream ${p.down.toFixed(3)}`);

    console.log(`side_graph_scroll: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`side_graph_scroll: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
