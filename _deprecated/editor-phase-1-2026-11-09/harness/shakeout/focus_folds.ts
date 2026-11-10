// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Focus folds (sprint 400, Phase 1). Opens the editor, clicks into the input bar area,
// verifies side columns fold to rails, clicks outside, verifies they unfold.

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

    // 1. Both side columns are expanded (not rails).
    const leftCol = win.locator('[data-editor-column="left"]').first();
    const rightCol = win.locator('[data-editor-column="right"]').first();
    await leftCol.waitFor({ state: "visible", timeout: 3_000 });
    await rightCol.waitFor({ state: "visible", timeout: 3_000 });
    console.log("OK — both side columns visible before focus");

    // 2. Click into the input area (textarea or input inside the bottom panel).
    //    The bottom panel holds the transcript; its input bar contains a textarea.
    const bottomPanel = win.locator('[data-editor-column="bottom"]').first();
    await bottomPanel.waitFor({ state: "visible", timeout: 3_000 });
    const inputEl = bottomPanel.locator("textarea, input, [contenteditable]").first();
    const inputVisible = await inputEl.isVisible().catch(() => false);
    if (!inputVisible) {
      // Fall back: focus the bottom panel itself by clicking it, then check
      console.log("  (no textarea/input found in bottom panel; clicking panel)");
      await bottomPanel.click();
    } else {
      await inputEl.click();
    }
    await new Promise((r) => setTimeout(r, 300));

    // 3. Side columns should now be folded to rails.
    const leftRail = win.locator('[data-editor-rail="left"]').first();
    const rightRail = win.locator('[data-editor-rail="right"]').first();
    const leftRailVisible = await leftRail.isVisible().catch(() => false);
    const rightRailVisible = await rightRail.isVisible().catch(() => false);
    const leftColGone = !(await leftCol.isVisible().catch(() => false));
    const rightColGone = !(await rightCol.isVisible().catch(() => false));
    if (!leftRailVisible || !leftColGone) throw new Error("left column did not fold on focus");
    if (!rightRailVisible || !rightColGone) throw new Error("right column did not fold on focus");
    console.log("OK — side columns folded to rails on input focus");

    // 4. Click outside the input area (the centre column).
    const centre = win.locator('[data-editor-column="centre"]').first();
    await centre.click();
    await new Promise((r) => setTimeout(r, 300));

    // 5. Side columns should unfold back.
    await leftCol.waitFor({ state: "visible", timeout: 3_000 });
    await rightCol.waitFor({ state: "visible", timeout: 3_000 });
    console.log("OK — side columns unfolded after focus left input");

    console.log("\nPASS — focus folds gate (sprint 400)");
    code = 0;
  } catch (err: any) {
    console.error("FAIL:", err.message);
  } finally {
    await app.close().catch(() => {});
    process.exit(code);
  }
}

main();
