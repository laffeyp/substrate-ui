// The driver chip on a resumed session shows the session's own driver.
//
// Reported 2026-10-08: resume any session (a glm-5.2:cloud one, a claude one) and the pane's
// driver chip reads kimi-k2.7-code:cloud, the roster default, while the turns run on the
// session's real driver. The chip read the pane's picked driver, which a resume never sets; the
// controller's snapshot held the manifest's driver all along (attachExisting).
//
// Steps, in the Electron app with its own SUBSTRATE_HOME:
//   1. bind pane 1 and open a session on `deterministic` (not the roster default);
//   2. reload the window: the pane reattaches the session from the URL and has no picked
//      driver, as after a restart;
//   3. assert: the pane chip names `deterministic`, not the default.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, waitForReattached } from "./lib/electron";

const DRIVER = "deterministic";

type Vm = {
  get(id: number): {
    snapshot(): { sessionId: string | null; driver: string | null; driverDefault: string | null };
    loadDriverRoster(): Promise<void>;
    openSession(o: { driver: string }): Promise<void>;
    attachExisting(id: string): Promise<void>;
  } | null;
};

async function chipText(win: import("playwright").Page): Promise<string> {
  const chip = win.locator('[data-dropdown-region="driver-pane"] > span').first();
  await chip.waitFor({ state: "visible", timeout: 15_000 });
  return (await chip.innerText()).replace("▾", "").trim();
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);

    const opened = await win.evaluate(async (driver) => {
      const pane = (window as unknown as { __vm: Vm }).__vm.get(1)!;
      await pane.loadDriverRoster();
      await pane.openSession({ driver });
      const s = pane.snapshot();
      return { sessionId: s.sessionId, driverDefault: s.driverDefault };
    }, DRIVER);
    if (!opened.sessionId) throw new Error("no session opened");
    if (!opened.driverDefault || opened.driverDefault === DRIVER) {
      throw new Error(`the roster default must differ from ${DRIVER} for this check; it is ${opened.driverDefault}`);
    }

    await win.reload();
    await waitForApp(win);
    await waitForReattached(win, opened.sessionId);
    await win.evaluate(async () => {
      await (window as unknown as { __vm: Vm }).__vm.get(1)!.loadDriverRoster();
    });

    const shown = await chipText(win);
    if (shown !== DRIVER) {
      throw new Error(`resumed session ${opened.sessionId} runs ${DRIVER}; the chip shows "${shown}" (roster default ${opened.driverDefault})`);
    }
    console.log(`driver_chip_on_resume: ok — the chip shows ${shown} for resumed ${opened.sessionId} (roster default ${opened.driverDefault})`);
    code = 0;
  } catch (e) {
    console.error(`driver_chip_on_resume: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
