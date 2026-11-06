// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A pane's transcript keeps its element while the window redraws (sprint 324; plan
// PLAN-2026-11-04-shell-to-react-r5.md, E2, F361).
//
// Before: each pane's transcript was a React root of its own in a div dc-runtime drew; when dc-runtime
// redrew that div (closing pane 1 moves pane 2 to the grid's first place) reveal.ts mounted a fresh
// root, so the transcript's element and every row in it were thrown away and rebuilt, and its scroll
// place lived only in a side table. Now the transcript is a child of its pane, keyed by the pane.
//
// Steps: bind pane 1 (deterministic) and send a turn; note its transcript root and first row; send a
// second turn and split the window: both elements are still in the page and no root was mounted again.
// Pane 2 opens a session and speaks; note its root and first row; focus pane 1 and close it: pane 2's
// two elements are still in the page. On the tree before sprint 323 the last step fails: pane 2's root
// and row are replaced.

import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";


async function turn(win: Page, text: string, pane = 1): Promise<void> {
  const before = await win.evaluate((id) => (window as any).__vm.get(id).snapshot().transcript.filter((r: { role: string }) => r.role === "model").length, pane) as number;
  await win.evaluate(([id, t]) => (window as any).__vm.get(id).sendTurn(t), [pane, text] as const);
  await win.waitForFunction(([id, n]) => (window as any).__vm.get(id).snapshot().transcript.filter((r: { role: string }) => r.role === "model").length > n, [pane, before] as const, { timeout: 30_000 });
  await settled(win);
}

/** Notes pane `id`'s transcript root and first row under `name`. */
const keep = (win: Page, id: number, name: string) => win.evaluate(([pane, key]) => {
  const root = document.querySelector(`[data-vm-atom-root="terminal"][data-pane-id="${pane}"]`);
  (window as any)[key] = { root, row: root?.firstElementChild?.firstElementChild ?? null };
  return !!(window as any)[key].row;
}, [id, name] as const);
const kept = (win: Page, id: number, name: string) => win.evaluate(([pane, key]) => {
  const k = (window as any)[key];
  return { root: !!k.root && k.root === document.querySelector(`[data-vm-atom-root="terminal"][data-pane-id="${pane}"]`) && k.root.isConnected, row: !!k.row && k.row.isConnected };
}, [id, name] as const);

async function clickMenu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate(({ Menu }, itemId) => { Menu.getApplicationMenu()?.getMenuItemById(itemId)?.click(); }, id);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const mounts: string[] = [];
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    win.on("console", (m) => { if (m.text().includes("transcript root mounted (terminal")) mounts.push(m.text()); });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await turn(win, "hello");
    if (!await keep(win, 1, "__one")) throw new Error("pane 1's transcript has no row after a turn");
    const mountsBefore = mounts.length;

    await turn(win, "again");
    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 5_000 });
    await settled(win);
    const one = await kept(win, 1, "__one");
    if (!one.root || !one.row) throw new Error(`after a second turn and a split: pane 1's transcript root ${one.root ? "kept" : "replaced"}, its first row ${one.row ? "kept" : "replaced"}; ${mounts.length - mountsBefore} new mount(s)`);
    if (mounts.length !== mountsBefore) throw new Error(`pane 1's transcript root was mounted ${mounts.length - mountsBefore} more time(s)`);
    seen.push("pane 1's transcript root and first row kept across a turn and a split");

    // Pane 2 opens a session and speaks; closing pane 1 moves pane 2 to the grid's first place.
    await win.evaluate(() => (window as any).__vm.get(2).openSession({ driver: "deterministic" }));
    await win.locator('[data-vm-atom-root="terminal"][data-pane-id="2"]').waitFor({ timeout: 10_000 });
    await turn(win, "from two", 2);
    if (!await keep(win, 2, "__two")) throw new Error("pane 2's transcript has no row after a turn");
    await win.locator('[data-pane="1"]').click({ position: { x: 5, y: 5 } });
    await settled(win);
    await clickMenu(app, "menu-close-pane");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 1, undefined, { timeout: 5_000 });
    await settled(win);
    const two = await kept(win, 2, "__two");
    if (!two.root || !two.row) throw new Error(`after pane 1 closed: pane 2's transcript root ${two.root ? "kept" : "replaced"}, its first row ${two.row ? "kept" : "replaced"}`);
    seen.push("pane 2's kept when pane 1 closed and pane 2 took the grid");
    console.log(`transcript_root_kept: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`transcript_root_kept: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
