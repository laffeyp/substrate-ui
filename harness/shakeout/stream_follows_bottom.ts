// The meta view's stream and graph lens follows the bottom until scrolled up (UI sprint 158), the
// transcript's rule (sprint 102).
//
// Steps: bind pane 1 (deterministic); ⌘M; send turns until the stream overflows; at the bottom a
// new turn keeps the view at the bottom; scrolled up, a new turn leaves the view where it was;
// back at the bottom, a new turn follows again.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

// Plain-string evaluates: esbuild's __name helper does not exist in the page.
const SCROLLER = `Array.from(document.querySelectorAll("[data-stream-scroll]")).find((e) => e.offsetParent !== null)`;
const POS = `(() => { const s = ${SCROLLER}; return { top: s.scrollTop, gap: s.scrollHeight - s.scrollTop - s.clientHeight, h: s.scrollHeight, view: s.clientHeight }; })()`;
type Pos = { top: number; gap: number; h: number; view: number };

async function send(win: Page, text: string): Promise<void> {
  const ROWS = `(${SCROLLER}).querySelectorAll('div[title="click to inspect · click again to close"]').length`;
  const before = await win.evaluate(ROWS) as number;
  await win.evaluate(`window.__vm.get(1).sendTurn(${JSON.stringify(text)})`);
  await win.waitForFunction(`${ROWS} > ${before} + 5`, undefined, { timeout: 20_000 });
  await settled(win);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1512, 945));
    await bindPaneAsUser(win);
    await win.keyboard.press("Meta+m");
    await win.waitForFunction(`!!(${SCROLLER})`, undefined, { timeout: 15_000 })
      .catch(() => { throw new Error("the stream has no [data-stream-scroll] scroller"); });
    let p = await win.evaluate(POS) as Pos;
    for (let i = 0; i < 12 && p.h <= p.view + 200; i++) { await send(win, `turn ${i}`); p = await win.evaluate(POS) as Pos; }
    if (p.h <= p.view + 200) throw new Error(`the stream never overflowed: ${JSON.stringify(p)}`);
    if (p.gap > 24) throw new Error(`at the start the stream is not at the bottom: ${JSON.stringify(p)}`);

    await send(win, "while at the bottom");
    p = await win.evaluate(POS) as Pos;
    if (p.gap > 24) throw new Error(`a turn at the bottom left the view ${p.gap.toFixed(0)}px above it`);

    await win.evaluate(`(() => { const s = ${SCROLLER}; s.scrollTop = Math.max(0, s.scrollTop - 200); s.dispatchEvent(new Event("scroll")); })()`);
    await settled(win);
    const held = await win.evaluate(POS) as Pos;
    await send(win, "while scrolled up");
    p = await win.evaluate(POS) as Pos;
    if (Math.abs(p.top - held.top) > 1) throw new Error(`scrolled up, a turn moved the view from ${held.top} to ${p.top}`);

    await win.evaluate(`(() => { const s = ${SCROLLER}; s.scrollTop = s.scrollHeight; s.dispatchEvent(new Event("scroll")); })()`);
    await settled(win);
    await send(win, "back at the bottom");
    p = await win.evaluate(POS) as Pos;
    if (p.gap > 24) throw new Error(`back at the bottom, a turn left the view ${p.gap.toFixed(0)}px above it`);
    console.log(`stream_follows_bottom: ok — followed at the bottom, held at ${held.top.toFixed(0)}px when scrolled up, followed again (stream ${p.h}px in a ${p.view}px view)`);
    code = 0;
  } catch (e) {
    console.error(`stream_follows_bottom: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
