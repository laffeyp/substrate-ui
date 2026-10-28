// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Electron menu flow. Binds the first pane, then clicks a native menu item through
// Menu.getMenuItemById(...).click() and checks what it did:
//   menu-toggle-meta — the meta view's transcript mount appears, and a second click removes it.
// File → New Window has its own gate (new_window.ts, UI sprint 147); the New Session item it
// replaced is gone.
// No controller tags are declared: the menu drives the shell, not a session, so the checks are the
// observations above and any failure is a defect.

import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

async function clickMenu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate((m, itemId) => {
    const menu = m.Menu.getApplicationMenu();
    if (!menu) throw new Error("no application menu");
    const item = menu.getMenuItemById(itemId);
    if (!item) throw new Error("menu item not found: " + itemId);
    item.click();
  }, id);
}

const count = (win: Page, sel: string): Promise<number> =>
  win.evaluate((s) => document.querySelectorAll(s).length, sel);

export const flow: Flow = {
  name: "electron_menu",
  declared: [],
  async run(_ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const defects: Defect[] = [];
    const launch = launchArgs();
    const app = await electron.launch({ ...launch.options, timeout: 30_000 });
    try {
      const win = await app.firstWindow({ timeout: 20_000 });
      await waitForApp(win);
      await bindPaneAsUser(win);

      const REVEAL = '[data-vm-transcript-mount="reveal"]';
      if ((await count(win, REVEAL)) !== 0) throw new Error("meta mount present before toggle-meta");
      await clickMenu(app, "menu-toggle-meta");
      await win.waitForFunction((s) => document.querySelectorAll(s).length === 1, REVEAL, { timeout: 10_000 })
        .catch(() => { throw new Error("menu-toggle-meta did not show the meta view"); });
      await clickMenu(app, "menu-toggle-meta");
      await win.waitForFunction((s) => document.querySelectorAll(s).length === 0, REVEAL, { timeout: 10_000 })
        .catch(() => { throw new Error("second menu-toggle-meta did not return to the panes view"); });
    } catch (err) {
      defects.push({
        category: "electron_menu_failed",
        observed: err instanceof Error ? err.message : String(err),
        expected: "View → Meta shows and hides the meta view",
        reproduces: true,
        severity: "high",
      });
    } finally {
      await app.close().catch(() => undefined);
      launch.cleanup();
    }
    return { emitted: [], defects };
  },
};
