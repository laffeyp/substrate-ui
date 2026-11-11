// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Text in narrow columns wraps, and nothing is cut (sprint 461; roadmap r13 E12; BLACKBOARD 2026-11-09 deferred). The
// deterministic driver, bound to a folder whose name has no break point (underscores, no hyphens), so its path is one
// unbreakable run longer than the column. After "hello", in two layouts:
//   the editor with the terminal docked right (View ▸ Dock Terminal Right) at 1512 points;
//   the panes view at the window's minimum width;
// these agree in each: the session's first line and the bar line lie inside their element (scrollWidth at most
// clientWidth) and inside the column; the first line holds the whole folder name; the bar line holds "handoff"; each
// setting of the bar line is one line (its client rects share one top).
// Screenshots go to runs/packaged/sprint-461-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const FOLDER = `narrow_text_${process.pid}_` + "abcdefghij".repeat(6);
type Fit = { found: boolean; fits: boolean; inColumn: boolean; text: string; scroll: number; client: number; items: number[] };
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
/** One line's fit: inside its own box, inside `column`, its text, and for the bar line each setting's line count. */
const fit = (win: Page, column: string, line: string) => win.evaluate(`(function () {
  var col = document.querySelector(${JSON.stringify(column)}); var el = col && col.querySelector(${JSON.stringify(line)});
  if (!el) return { found: false, fits: false, inColumn: false, text: "", scroll: 0, client: 0, items: [] };
  var c = col.getBoundingClientRect(), r = el.getBoundingClientRect();
  var items = Array.prototype.map.call(el.querySelectorAll("[data-settings-item]"), function (s) { var tops = {}; Array.prototype.forEach.call(s.getClientRects(), function (q) { tops[Math.round(q.top / 4)] = 1; }); return Object.keys(tops).length; });
  return { found: true, fits: el.scrollWidth <= el.clientWidth + 1, inColumn: r.right <= c.right + 1, text: el.textContent, scroll: el.scrollWidth, client: el.clientWidth, items: items };
})()`) as Promise<Fit>;
async function menu(app: ElectronApplication, id: string): Promise<void> {
  const found = await app.evaluate(({ Menu }, itemId) => { const it = Menu.getApplicationMenu()?.getMenuItemById(itemId); if (!it) return false; it.click(); return true; }, id);
  if (!found) throw new Error(`no menu item ${id}`);
}
function check(where: string, start: Fit, bar: Fit): void {
  if (!start.found || !start.fits || !start.inColumn || !start.text.includes(FOLDER)) throw new Error(`${where}: the session line ${JSON.stringify(start)}`);
  if (!bar.found || !bar.fits || !bar.inColumn || !bar.text.includes("handoff") || !bar.items.length || bar.items.some((n) => n !== 1)) throw new Error(`${where}: the bar line ${JSON.stringify(bar)}`);
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-461-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const folder = join(__dirname, ".scratch", FOLDER);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "a.txt"), "one\n");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await until(win, "hello's Returned", () => returned(win), (n) => n >= 1, 30_000);

    // 1. The editor, the terminal docked right.
    await menu(app, "menu-toggle-editor");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    await menu(app, "menu-editor-dock");
    await until(win, "the terminal docked right", () => win.locator('[data-editor-area="bottom"][data-editor-dock="right"]').count(), (n) => n === 1);
    const term = '[data-editor-area="bottom"]';
    const dStart = await until(win, "the docked session line", () => fit(win, term, "[data-session-start-line]"), (f) => f.found);
    const dBar = await until(win, "the docked bar line", () => fit(win, term, "[data-session-bar-line]"), (f) => f.found);
    await win.screenshot({ path: join(shots, "editor-docked-right.png") });
    check("docked right", dStart, dBar);
    await menu(app, "menu-editor-dock");
    await menu(app, "menu-toggle-editor");
    await until(win, "the panes view", () => win.locator("[data-editor-view]").count(), (n) => n === 0);

    // 2. The panes view at the window's minimum width.
    await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.setContentSize(300, 900); });
    const width = await until(win, "the minimum width", () => win.evaluate(() => window.innerWidth), (w) => w < 700);
    const pane = "[data-pane]";
    const pStart = await until(win, "the pane's session line", () => fit(win, pane, "[data-session-start-line]"), (f) => f.found);
    const pBar = await until(win, "the pane's bar line", () => fit(win, pane, "[data-session-bar-line]"), (f) => f.found);
    await win.screenshot({ path: join(shots, `panes-${width}.png`) });
    check(`panes at ${width}`, pStart, pBar);
    await app.close();

    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`narrow_text: ok — docked right: the session line (${dStart.client} px wide) holds the whole folder name inside its column, the bar line's ${dBar.items.length} settings each on one line; panes at ${width} px: the same (${pStart.client} px, ${pBar.items.length} settings); packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`narrow_text: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
