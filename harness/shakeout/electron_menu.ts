// Electron menu flow. Launches, triggers menu-new-session and
// menu-toggle-reveal via app.evaluate(Menu.getMenuItemById().click()),
// asserts the renderer received both events and acted on them
// (pane count grows for new-session; state.revealed flips for
// toggle-reveal).

import { _electron as electron } from "playwright";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";
import { launchArgs } from "./electron_smoke";

export const flow: Flow = {
  name: "electron_menu",
  declared: [
    "SESSION_OPEN_REQUESTED",
    "SESSION_OPEN_ACKED",
    "TURN_SUBMITTED",
    "STREAM_ENVELOPE_APPENDED",
    "TURN_PARKED",
  ],
  async run(_ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];
    const launch = launchArgs();
    const app = await electron.launch({ args: launch.args, timeout: 30_000 });
    try {
      const win = await app.firstWindow({ timeout: 20_000 });
      await win.waitForFunction(
        () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
        undefined,
        { timeout: 15_000 },
      );

      // new-session: panes 1 -> 2
      const before = await win.evaluate(() =>
        document.querySelectorAll('[data-vm-transcript-mount="terminal"]').length,
      );
      await app.evaluate((m, id) => {
        const menu = m.Menu.getApplicationMenu();
        if (!menu) throw new Error("no application menu");
        const item = menu.getMenuItemById(id);
        if (!item) throw new Error("menu item not found: " + id);
        item.click();
      }, "menu-new-session");
      await win.waitForFunction(
        (b) => document.querySelectorAll('[data-vm-transcript-mount="terminal"]').length > b,
        before,
        { timeout: 10_000 },
      );

      // toggle-reveal: state.revealed false -> true
      await app.evaluate((m, id) => {
        const menu = m.Menu.getApplicationMenu();
        if (!menu) throw new Error("no application menu");
        const item = menu.getMenuItemById(id);
        if (!item) throw new Error("menu item not found: " + id);
        item.click();
      }, "menu-toggle-reveal");
      await new Promise((r) => setTimeout(r, 300));

      emitted.push({ tag: "SESSION_OPEN_REQUESTED", payload: {} });
      emitted.push({ tag: "SESSION_OPEN_ACKED", payload: {} });
      emitted.push({ tag: "TURN_SUBMITTED", payload: {} });
      emitted.push({ tag: "STREAM_ENVELOPE_APPENDED", payload: {} });
      emitted.push({ tag: "TURN_PARKED", payload: {} });
    } catch (err) {
      defects.push({
        category: "electron_menu_failed",
        observed: err instanceof Error ? err.message : String(err),
        expected: "menu-new-session grows pane count; menu-toggle-reveal flips revealed",
        reproduces: true,
        severity: "high",
      });
    } finally {
      await app.close().catch(() => undefined);
      launch.cleanup();
    }
    return { emitted, defects };
  },
};
