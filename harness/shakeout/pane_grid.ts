// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The pane grid's layout: splits, a gutter drag and closes (sprint 320; plan
// PLAN-2026-11-04-shell-to-react-r5.md, E1, written before E2 moves the panes).
//
// The pixel captures hold one and two panes side by side; no gate held a third pane, a gutter's drag
// or what a close hands to the neighbour. Steps, in a 1200×800 window: ⌘D splits pane 1 right;
// ⌘⇧D splits pane 2 down; the three panes tile the grid (pane 1 the left half, 2 and 3 the right
// half's top and bottom). Dragging the column gutter 120px right widens pane 1 by the gutter's rule
// (web/app/derive/panes.ts, `dragCols`). Close Pane on pane 3 gives its space to pane 2, which then
// runs the full height. A close focuses the first pane left, so a second Close Pane closes pane 1 and
// leaves pane 2 the whole grid and no gutter.

import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";
import { dragCols } from "../../web/app/derive/panes";

type Box = { x: number; y: number; w: number; h: number };
const PANES = `Array.from(document.querySelectorAll("[data-pane]")).filter((e) => e.offsetParent !== null)`;

/** Each visible pane's box as a share of the grid's (0 to 1), by pane id. */
async function boxes(win: Page): Promise<Record<string, Box>> {
  return await win.evaluate(`(() => {
    const panes = ${PANES};
    if (!panes.length) return {};
    const grid = panes[0].parentElement.getBoundingClientRect();
    return Object.fromEntries(panes.map((p) => { const r = p.getBoundingClientRect();
      return [p.getAttribute("data-pane"), { x: (r.left - grid.left) / grid.width, y: (r.top - grid.top) / grid.height, w: r.width / grid.width, h: r.height / grid.height }]; }));
  })()`) as Record<string, Box>;
}

const near = (a: number, b: number, tol = 0.01) => Math.abs(a - b) <= tol;
function expectBox(all: Record<string, Box>, id: string, want: Box, what: string): void {
  const got = all[id];
  if (!got || !near(got.x, want.x) || !near(got.y, want.y) || !near(got.w, want.w) || !near(got.h, want.h)) {
    throw new Error(`${what}: pane ${id} at ${JSON.stringify(got)}; expected ${JSON.stringify(want)} (shares of the grid, ±0.01)`);
  }
}

async function waitPanes(win: Page, n: number): Promise<void> {
  await win.waitForFunction(`${PANES}.length === ${n}`, undefined, { timeout: 5_000 })
    .catch(async () => { throw new Error(`expected ${n} panes; ${await win.evaluate(`${PANES}.length`)} shown`); });
  await settled(win);
}

async function clickMenu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate(({ Menu }, itemId) => { Menu.getApplicationMenu()?.getMenuItemById(itemId)?.click(); }, id);
}

const gutters = (win: Page, cursor: string) => win.evaluate(`Array.from(document.querySelectorAll('div[title="drag to resize"]')).filter((g) => g.style.cursor === "${cursor}" && g.offsetParent !== null).map((g) => { const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 4 }; })`) as Promise<{ x: number; y: number }[]>;

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1200, 800));
    await waitPanes(win, 1);
    expectBox(await boxes(win), "1", { x: 0, y: 0, w: 1, h: 1 }, "one pane");

    await win.keyboard.press("Meta+d");
    await waitPanes(win, 2);
    await win.keyboard.press("Meta+Shift+d");
    await waitPanes(win, 3);
    let all = await boxes(win);
    expectBox(all, "1", { x: 0, y: 0, w: 0.5, h: 1 }, "after ⌘D, ⌘⇧D");
    expectBox(all, "2", { x: 0.5, y: 0, w: 0.5, h: 0.5 }, "after ⌘D, ⌘⇧D");
    expectBox(all, "3", { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }, "after ⌘D, ⌘⇧D");
    seen.push("⌘D then ⌘⇧D tile three panes: left half, right top, right bottom");

    const cols = await gutters(win, "col-resize");
    const rows = await gutters(win, "row-resize");
    if (cols.length !== 1 || rows.length !== 1) throw new Error(`gutters: ${cols.length} column, ${rows.length} row; expected one of each`);
    const winW = await win.evaluate("window.innerWidth") as number;
    // A quarter of the way down: the row gutter crosses the column gutter at its middle, the full width
    // of the grid (it lies over pane 1 too), so a grab there takes the row gutter.
    await win.mouse.move(cols[0].x, cols[0].y);
    await win.mouse.down();
    for (let step = 1; step <= 12; step++) await win.mouse.move(cols[0].x + step * 10, cols[0].y);
    await win.mouse.up();
    await settled(win);
    const weights = await win.evaluate(`getComputedStyle(${PANES}[0].parentElement).gridTemplateColumns`) as string;
    const want = dragCols([1, 1], 1, 120, winW);
    all = await boxes(win);
    const share = want[0] / (want[0] + want[1]);
    if (!near(all["1"].w, share, 0.005)) throw new Error(`a 120px drag in a ${winW}px window left pane 1 at ${all["1"].w.toFixed(4)} of the grid; the rule gives ${share.toFixed(4)} (tracks ${weights})`);
    seen.push(`a 120px gutter drag: pane 1 at ${all["1"].w.toFixed(3)} of the grid, the rule's ${share.toFixed(3)}`);

    await clickMenu(app, "menu-close-pane");
    await waitPanes(win, 2);
    all = await boxes(win);
    expectBox(all, "2", { x: all["1"].w + (all["2"].x - all["1"].w), y: 0, w: all["2"].w, h: 1 }, "after closing pane 3");
    if (!near(all["1"].w + all["2"].w, 1, 0.01)) throw new Error(`after closing pane 3 the two panes cover ${(all["1"].w + all["2"].w).toFixed(3)} of the grid's width`);
    seen.push(`Close Pane on pane 3: pane 2 runs the full height`);

    // A close focuses the first pane left (pane 1), so the next Close Pane closes it.
    await clickMenu(app, "menu-close-pane");
    await waitPanes(win, 1);
    expectBox(await boxes(win), "2", { x: 0, y: 0, w: 1, h: 1 }, "after the second close");
    const left = [...await gutters(win, "col-resize"), ...await gutters(win, "row-resize")];
    if (left.length) throw new Error(`one pane left and ${left.length} gutter(s) still shown`);
    seen.push("Close Pane again closes pane 1, the first left: pane 2 takes the grid, no gutter");

    console.log(`pane_grid: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`pane_grid: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
