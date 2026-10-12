// Before the user picks a model, nothing names or picks one (asked 2026-10-11).
//
// Reported: with nothing picked, the top bar's model chip read kimi-k2.7-code:cloud, the roster's
// default, and the model list opened with that row lit. A new pane took the default as its driver,
// the chip fell back to it (then to `deterministic`), and a session opened without a pick ran it.
//
// Steps, on the live roster (which has a default): wait for the roster; assert the bar shows no
// model chip and pane 1's controller has no driver. Pick the workspace: the model list opens with
// no row marked as the current model, and the lit row is the list's first, not the default.

import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

type Vm = { snapshot(): { driver: string | null; driverDefault: string | null; sessionId: string | null } };

async function main(): Promise<void> {
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await win.waitForFunction(
      () => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "DRIVER_ROSTER_LOADED"),
      undefined,
      { timeout: 15_000 },
    );
    const snap = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.snapshot());
    if (!snap.driverDefault) throw new Error("the live roster has no default; this check needs one to prove it is not used");
    if (snap.driver) throw new Error(`no model picked, yet the controller's driver is ${snap.driver}`);
    const chips = await win.locator('[data-top-bar] [data-dropdown-region="driver"]').count();
    if (chips !== 0) {
      const text = await win.locator('[data-top-bar] [data-dropdown-region="driver"]').first().innerText();
      throw new Error(`no model picked, yet the bar shows a model chip: "${text.trim()}"`);
    }

    const input = win.locator("input[data-ws-input]").first();
    await input.click();
    await win.keyboard.press("Enter");
    await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 15_000 });
    const lit = await win.locator('[data-model-half] [data-lit="1"]').first().getAttribute("data-model-row");
    if (lit === snap.driverDefault) throw new Error(`the model list opened with the default ${lit} lit`);
    const after = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.snapshot());
    if (after.driver || after.sessionId) throw new Error(`picking a workspace picked a model: ${JSON.stringify(after)}`);
    console.log(`no_default_model: ok — default ${snap.driverDefault} not shown or picked; the list opens on "${lit}"`);
    code = 0;
  } catch (e) {
    console.error(`no_default_model: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
