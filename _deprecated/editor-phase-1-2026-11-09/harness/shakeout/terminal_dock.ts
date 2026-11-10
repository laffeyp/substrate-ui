// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Terminal dock position (sprint 398, Phase 1). Opens the editor, verifies the transcript is docked
// bottom by default, toggles to dock right, verifies the layout changed, toggles back.

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

    // Open editor.
    await sendCmd("toggle-editor");
    await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 });

    // 1. Default dock is bottom.
    const dockAttr = await win.locator("[data-editor-shell]").first().getAttribute("data-dock");
    if (dockAttr !== "bottom") throw new Error("default dock: " + dockAttr + " (expected bottom)");
    console.log("OK — default dock position is bottom");

    // 2. The bottom column is visible (transcript docked bottom).
    const bottomBefore = await win.locator('[data-editor-column="bottom"]').count();
    if (bottomBefore !== 1) throw new Error("bottom column not visible in dock-bottom mode");
    console.log("OK — transcript renders at bottom");

    // 3. Click the dock toggle button (the ⇉ button).
    const dockBtn = win.locator("[data-editor-shell] button").filter({ hasText: "⇉" }).first();
    await dockBtn.click();
    await win.waitForFunction(
      () => document.querySelector("[data-editor-shell]")?.getAttribute("data-dock") === "right",
      undefined,
      { timeout: 3_000 },
    );
    console.log("OK — dock toggled to right");

    // 4. The bottom column is now docked right (still uses data-editor-column="bottom" but layout changed).
    const dockRightAttr = await win.locator("[data-editor-shell]").first().getAttribute("data-dock");
    if (dockRightAttr !== "right") throw new Error("dock after toggle: " + dockRightAttr);

    // 5. Toggle back to bottom.
    const dockBtnBack = win.locator("[data-editor-shell] button").filter({ hasText: "⇊" }).first();
    await dockBtnBack.click();
    await win.waitForFunction(
      () => document.querySelector("[data-editor-shell]")?.getAttribute("data-dock") === "bottom",
      undefined,
      { timeout: 3_000 },
    );
    console.log("OK — dock toggled back to bottom");

    console.log("\nPASS — terminal dock gate (sprint 398)");
    code = 0;
  } catch (err: any) {
    console.error("FAIL:", err.message);
  } finally {
    await app.close().catch(() => {});
    process.exit(code);
  }
}

main();
