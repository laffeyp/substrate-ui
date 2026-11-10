// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sides swap (sprint 399, Phase 1). Opens the editor, verifies left column is on the left, clicks
// the swap button, verifies left column moved to the right.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);

    const sendCmd = async (cmd: string) => win.evaluate((c) => {
      const sh = (window as any).__substrateShell;
      if (sh) for (const fn of [...sh.channel.listeners]) fn(c);
    }, cmd);

    await bindPaneAsUser(win, "deterministic");
    await sendCmd("toggle-editor");
    await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 });

    // 1. Default: left column (FILES) is the first column in the row.
    const leftRect = await win.locator('[data-editor-column="left"]').first().boundingBox();
    const centreRect = await win.locator('[data-editor-column="centre"]').first().boundingBox();
    if (!leftRect || !centreRect) throw new Error("columns not found");
    if (leftRect.x >= centreRect.x) throw new Error("left column is not to the left of centre");
    console.log("OK — default: files column is to the left of centre");

    // 2. Click the swap button (⇄).
    const swapBtn = win.locator("[data-editor-shell] button").filter({ hasText: "⇄" }).first();
    await swapBtn.click();
    await new Promise((r) => setTimeout(r, 200));

    // 3. Left column (FILES) should now be to the right of centre.
    const leftRectAfter = await win.locator('[data-editor-column="left"]').first().boundingBox();
    const centreRectAfter = await win.locator('[data-editor-column="centre"]').first().boundingBox();
    if (!leftRectAfter || !centreRectAfter) throw new Error("columns not found after swap");
    if (leftRectAfter.x <= centreRectAfter.x) throw new Error("files column did not move to the right");
    console.log("OK — swapped: files column is to the right of centre");

    // 4. Swap back.
    await swapBtn.click();
    await new Promise((r) => setTimeout(r, 200));
    const leftRectBack = await win.locator('[data-editor-column="left"]').first().boundingBox();
    const centreRectBack = await win.locator('[data-editor-column="centre"]').first().boundingBox();
    if (!leftRectBack || !centreRectBack) throw new Error("columns not found after swap back");
    if (leftRectBack.x >= centreRectBack.x) throw new Error("files column did not return to the left");
    console.log("OK — swapped back: files column returned to the left");

    console.log("\nPASS — sides swap gate (sprint 399)");
    code = 0;
  } catch (err: any) {
    console.error("FAIL:", err.message);
  } finally {
    await app.close().catch(() => {});
    process.exit(code);
  }
}

main();
