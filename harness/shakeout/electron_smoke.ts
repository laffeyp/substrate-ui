// Electron smoke flow. Launches the app, binds the first pane through the path input as a user
// does, drives one deterministic turn through the prompt input, and reports the controller
// signals the renderer actually emitted (window.__vmSignals). A tag the app did not emit is not
// reported, so a broken open/turn/park path shows as missing coverage as well as a defect.
//
// The FlowContext server is unused: the app spawns its own server on an ephemeral port.

import { _electron as electron } from "playwright";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";
import { bindPaneAsUser, launchArgs, observedSignals, waitForApp } from "./lib/electron";

export const flow: Flow = {
  name: "electron_smoke",
  declared: [
    "SESSION_OPEN_REQUESTED",
    "SESSION_OPEN_ACKED",
    "TURN_SUBMITTED",
    "STREAM_ENVELOPE_APPENDED",
    "TURN_PARKED",
  ],
  async run(_ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    let emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];
    const launch = launchArgs();
    const app = await electron.launch({ ...launch.options, timeout: 30_000 });
    try {
      const win = await app.firstWindow({ timeout: 20_000 });
      await waitForApp(win);
      await win.evaluate(async () => {
        const vm = (window as unknown as { __vm: { get(id: number): unknown; spawn(id: number): unknown } }).__vm;
        const c = (vm.get(1) ?? vm.spawn(1)) as { loadDriverRoster: () => Promise<void>; pickDriver: (n: string) => void };
        await c.loadDriverRoster();
        c.pickDriver("deterministic");
      });
      await bindPaneAsUser(win);
      const prompt = win.locator('[placeholder^="type to talk"]').first();
      await prompt.click();
      await prompt.type("hello", { delay: 5 });
      await win.keyboard.press("Enter");
      await win.waitForFunction(
        () => (window as unknown as { __vm?: { get(id: number): { snapshot(): { parkReason?: unknown } } | null } }).__vm?.get(1)?.snapshot().parkReason != null,
        undefined,
        { timeout: 30_000 },
      );
      emitted = await observedSignals(win);
    } catch (err) {
      defects.push({
        category: "electron_smoke_failed",
        observed: err instanceof Error ? err.message : String(err),
        expected: "the pane binds, one deterministic turn typed into the prompt parks",
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
