// The top bar's model chip is an indicator: a click opens a card naming the model, and picks
// nothing (UI sprint 139, U125).
//
// Before: the chip opened a three-level model dropdown, frozen once the pane had a session. The
// model is picked in the workspace bar's model step and changed in a session with /model.
//
// Steps: bind pane 1 as a user does (workspace, model, guidance). The chip shows the model with no
// caret. A click opens [data-model-card] naming that model, with no model rows in it; a second
// click closes it.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Vm = { snapshot(): { driver: string | null } };

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    const driver = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.snapshot().driver);
    if (!driver) throw new Error("no driver after binding the pane");
    const chip = win.locator("[data-top-bar] [data-model-chip]").first();
    await chip.waitFor({ state: "visible", timeout: 10_000 });
    const text = (await chip.innerText()).trim();
    if (text.includes("▾")) throw new Error(`the chip still carries a dropdown caret: "${text}"`);
    if (!text.startsWith(driver)) throw new Error(`the chip reads "${text}"; the pane runs ${driver}`);
    await chip.click();
    const card = win.locator("[data-model-card]").first();
    await card.waitFor({ state: "visible", timeout: 5_000 });
    const named = (await win.locator("[data-model-card-driver]").first().innerText()).trim();
    if (named !== driver) throw new Error(`the card names "${named}"; the pane runs ${driver}`);
    const rows = await card.locator("[data-model-row], [onclick]").count();
    if (rows !== 0) throw new Error(`the card holds ${rows} pickable rows; it should only describe the model`);
    await chip.click();
    await card.waitFor({ state: "hidden", timeout: 5_000 });
    console.log(`model_chip_indicator: ok — the chip reads "${text}"; its card names ${named} and closes on a second click`);
    code = 0;
  } catch (e) {
    console.error(`model_chip_indicator: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
