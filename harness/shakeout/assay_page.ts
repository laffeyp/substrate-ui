// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The assay page as the template drew it, and its openers (sprint 334; plan
// PLAN-2026-11-04-shell-to-react-r5.md, B5's opener kept as a logged fix).
//
// Steps: ⌘3 opens the page, which shows the template's empty-state note; ⌘3 again returns to the
// panes. View ▸ Assays opens it again and Escape closes it.

import { _electron as electron, type ElectronApplication } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";

const NOTE = "no assays on record. /api/assays returned an empty list. preregister a run with a `.preg.json` on disk to see the arm-by-arm delta report here.";

async function clickMenu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate(({ Menu }, itemId) => {
    const item = Menu.getApplicationMenu()?.getMenuItemById(itemId);
    if (!item) throw new Error("menu item not found: " + itemId);
    item.click();
  }, id);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const page = win.locator('[data-app-mount="assays"]');
    await win.keyboard.press("Meta+3");
    await win.locator("[data-assays-empty]").waitFor({ timeout: 10_000 });
    const text = (await win.locator("[data-assays-empty]").innerText()).trim();
    if (text !== NOTE) throw new Error(`the page reads ${JSON.stringify(text)}`);
    seen.push("⌘3 opens the page on the template's note");
    await win.keyboard.press("Meta+3");
    await page.waitFor({ state: "detached", timeout: 5_000 });
    seen.push("⌘3 again closes it");
    await clickMenu(app, "menu-toggle-assays");
    await win.locator("[data-assays-empty]").waitFor({ timeout: 10_000 });
    await win.keyboard.press("Escape");
    await page.waitFor({ state: "detached", timeout: 5_000 });
    await settled(win);
    seen.push("View ▸ Assays opens it; Escape closes it");
    console.log(`assay_page: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`assay_page: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
