// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's open view, written as it changes (VIEW_CHANGED, vocabulary v0.17, sprint 366).
//
// After one turn in pane 1, the steps change the view ten times, each cause the app can reach at
// least once:
//   ⌘M (key) panes→meta; View ▸ Meta (menu) meta→panes; /language (language) panes→meta;
//   the top bar's view button (button) meta→panes; ⌘3 (key) panes→assay; Escape (close)
//   assay→panes; the top bar's records (button) panes→records; a session row on the records page
//   (records_open) records→panes; ⌘M (key) panes→meta; ⌘D (split) meta→panes.
// window-1.jsonl then holds exactly those ten VIEW_CHANGED records, in order, with no pane in their
// context. `tweak` is not driven: only the design tool's tweak editor sets App's view prop.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const viewCount = (win: Page) => win.evaluate(() =>
  ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).filter((s) => s.name === "VIEW_CHANGED").length);

async function step(win: Page, what: string, n: number, act: () => Promise<unknown>): Promise<void> {
  await act();
  await win.waitForFunction((want) => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).filter((s) => s.name === "VIEW_CHANGED").length >= want, n, { timeout: 10_000 })
    .catch(async () => { throw new Error(`${what} wrote no VIEW_CHANGED (${await viewCount(win)} so far)`); });
  await settled(win);
}

async function menu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate(({ Menu }, itemId) => { Menu.getApplicationMenu()?.getMenuItemById(itemId)?.click(); }, id);
}

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "view-signals-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const leaf = folder.split("/").pop()!;
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    // A session in a repo-local folder for the records page, which leaves out $TMPDIR paths.
    await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, name: "view-fixture" }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    await win.evaluate(`window.__vm.loadRecentWorkspaces()`);

    await step(win, "⌘M", 1, () => win.keyboard.press("Meta+m"));
    await step(win, "View ▸ Meta", 2, () => menu(app, "menu-toggle-meta"));
    await step(win, "/language", 3, async () => {
      await visible(win, "textarea[data-input-bar]").fill("/language");
      await win.keyboard.press("Enter");
    });
    await step(win, "the view button", 4, () => win.locator("[data-top-bar] button").first().click());
    await step(win, "⌘3", 5, () => win.keyboard.press("Meta+3"));
    await step(win, "Escape on the assay page", 6, () => win.keyboard.press("Escape"));
    await step(win, "records", 7, () => win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click());
    await win.waitForFunction(`Array.from(document.querySelectorAll("[data-records-workspaces] span")).some((e) => (e.textContent || "").endsWith(${JSON.stringify(leaf)}))`, undefined, { timeout: 10_000 });
    await win.locator("[data-records-workspaces] span", { hasText: leaf }).first().click();
    await win.waitForFunction(`document.querySelectorAll("[data-records-session]").length > 0`, undefined, { timeout: 10_000 });
    await step(win, "a session row", 8, () => win.locator("[data-records-session]").first().click());
    await step(win, "⌘M again", 9, () => win.keyboard.press("Meta+m"));
    await step(win, "⌘D", 10, () => win.keyboard.press("Meta+d"));

    // The trace, read once the app has closed and its files are complete.
    await app.close();
    const want: [string, string, string][] = [
      ["key", "panes", "meta"], ["menu", "meta", "panes"], ["language", "panes", "meta"], ["button", "meta", "panes"],
      ["key", "panes", "assay"], ["close", "assay", "panes"], ["button", "panes", "records"], ["records_open", "records", "panes"],
      ["key", "panes", "meta"], ["split", "meta", "panes"],
    ];
    const got = windowRecords(launch).filter((r) => r.name === "VIEW_CHANGED");
    const show = got.map((r) => `${String(r.payload.cause)} ${String(r.payload.from)}→${String(r.payload.to)} pane=${String(r.pane_id)}`).join("; ");
    const match = got.length === want.length && want.every(([c, f, t], i) => got[i].payload.cause === c && got[i].payload.from === f && got[i].payload.to === t && got[i].pane_id === null);
    if (!match) throw new Error(`VIEW_CHANGED in window-1.jsonl: ${show || "none"}`);
    console.log(`view_signals: ok — ${want.length} VIEW_CHANGED in order: ${show}`);
    code = 0;
  } catch (e) {
    console.error(`view_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
