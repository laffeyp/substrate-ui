// Electron menu flow. Binds the first pane, then clicks two native menu items through
// Menu.getMenuItemById(...).click() and checks what each did:
//   menu-toggle-reveal — the reveal transcript mount appears, and a second click removes it;
//   menu-new-session   — a second pane opens with its own transcript (the menu binds it at once).
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
      if ((await count(win, REVEAL)) !== 0) throw new Error("reveal mount present before toggle-reveal");
      await clickMenu(app, "menu-toggle-reveal");
      await win.waitForFunction((s) => document.querySelectorAll(s).length === 1, REVEAL, { timeout: 10_000 })
        .catch(() => { throw new Error("menu-toggle-reveal did not show the reveal view"); });
      await clickMenu(app, "menu-toggle-reveal");
      await win.waitForFunction((s) => document.querySelectorAll(s).length === 0, REVEAL, { timeout: 10_000 })
        .catch(() => { throw new Error("second menu-toggle-reveal did not return to the terminal view"); });

      const PANE = '[data-vm-transcript-mount="terminal"]';
      const before = await count(win, PANE);
      await clickMenu(app, "menu-new-session");
      await win.waitForFunction(([s, b]) => document.querySelectorAll(s as string).length > (b as number), [PANE, before] as const, { timeout: 10_000 })
        .catch(() => { throw new Error(`menu-new-session did not add a pane (${before} before)`); });
    } catch (err) {
      defects.push({
        category: "electron_menu_failed",
        observed: err instanceof Error ? err.message : String(err),
        expected: "toggle-reveal shows and hides the reveal view; new-session adds a pane",
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
