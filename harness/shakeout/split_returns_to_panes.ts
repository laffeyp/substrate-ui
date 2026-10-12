// A new pane made from the meta view or a page returns to the panes view (UI sprint 146).
//
// Steps: bind pane 1; ⌘M to meta; ⌘D: the panes view shows two panes and the new one is focused.
// Open the records page; ⌘⇧D: the panes view shows three panes and the newest is focused.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

async function panesView(win: Page): Promise<{ panes: number; focused: string | null; meta: boolean }> {
  return win.evaluate(() => {
    const panes = Array.from(document.querySelectorAll("[data-pane]")).filter((e) => (e as HTMLElement).offsetParent !== null) as HTMLElement[];
    const focused = panes.find((p) => getComputedStyle(p).opacity === "1" && panes.length > 1);
    const meta = Array.from(document.querySelectorAll('[data-vm-transcript-mount="reveal"]')).some((e) => (e as HTMLElement).offsetParent !== null);
    return { panes: panes.length, focused: focused ? focused.getAttribute("data-pane") : null, meta };
  });
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    await win.keyboard.press("Meta+m");
    await win.locator('[data-vm-transcript-mount="reveal"]').first().waitFor({ state: "visible", timeout: 10_000 });
    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => Array.from(document.querySelectorAll("[data-pane]")).filter((e) => (e as HTMLElement).offsetParent !== null).length === 2, undefined, { timeout: 5_000 })
      .catch(async () => { throw new Error(`⌘D in meta left ${JSON.stringify(await panesView(win))}`); });
    const one = await panesView(win);
    if (one.meta || one.focused === "1" || one.focused === null) throw new Error(`after ⌘D from meta: ${JSON.stringify(one)}`);

    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await win.waitForFunction(`Array.from(document.querySelectorAll("[data-pane]")).filter((e) => e.offsetParent !== null).length === 0`, undefined, { timeout: 5_000 })
      .catch(() => { throw new Error("the records page did not open"); });
    await win.keyboard.press("Meta+Shift+d");
    await win.waitForFunction(() => Array.from(document.querySelectorAll("[data-pane]")).filter((e) => (e as HTMLElement).offsetParent !== null).length === 3, undefined, { timeout: 5_000 })
      .catch(async () => { throw new Error(`⌘⇧D on the records page left ${JSON.stringify(await panesView(win))}`); });
    const two = await panesView(win);
    if (two.focused === null || two.focused === one.focused || two.focused === "1") throw new Error(`after ⌘⇧D from records: ${JSON.stringify(two)}`);
    console.log(`split_returns_to_panes: ok — from meta: ${JSON.stringify(one)}; from records: ${JSON.stringify(two)}`);
    code = 0;
  } catch (e) {
    console.error(`split_returns_to_panes: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
