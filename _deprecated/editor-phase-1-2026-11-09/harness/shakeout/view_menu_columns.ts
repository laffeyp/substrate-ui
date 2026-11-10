// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// View menu column toggle entries (sprint 397, Phase 1). Opens the editor, dispatches the three
// column toggle commands through the shell channel (simulating menu IPC), verifies columns fold
// and unfold.

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
    const leftBefore = await win.locator('[data-editor-column="left"]').count();
    if (leftBefore !== 1) throw new Error("left column not visible at start");

    // 1. toggle-editor-left via menu command — folds the left column.
    await sendCmd("toggle-editor-left");
    await win.waitForFunction(() => document.querySelector('[data-editor-column="left"]') === null, undefined, { timeout: 3_000 });
    const leftRail = await win.locator('[data-editor-rail="left"]').count();
    if (leftRail !== 1) throw new Error("left rail not visible after fold");
    console.log("OK — toggle-editor-left folds the left column");

    // Unfold.
    await sendCmd("toggle-editor-left");
    await win.locator('[data-editor-column="left"]').first().waitFor({ state: "visible", timeout: 3_000 });
    console.log("OK — toggle-editor-left unfolds the left column");

    // 2. toggle-editor-right via menu command.
    await sendCmd("toggle-editor-right");
    await win.waitForFunction(() => document.querySelector('[data-editor-column="right"]') === null, undefined, { timeout: 3_000 });
    console.log("OK — toggle-editor-right folds the right column");
    await sendCmd("toggle-editor-right");
    await win.locator('[data-editor-column="right"]').first().waitFor({ state: "visible", timeout: 3_000 });
    console.log("OK — toggle-editor-right unfolds the right column");

    // 3. toggle-editor-bottom via menu command.
    await sendCmd("toggle-editor-bottom");
    await win.waitForFunction(() => document.querySelector('[data-editor-column="bottom"]') === null, undefined, { timeout: 3_000 });
    console.log("OK — toggle-editor-bottom collapses the bottom panel");
    await sendCmd("toggle-editor-bottom");
    await win.locator('[data-editor-column="bottom"]').first().waitFor({ state: "visible", timeout: 3_000 });
    console.log("OK — toggle-editor-bottom expands the bottom panel");

    // 4. Verify commands are no-op when editor is closed.
    await sendCmd("toggle-editor");
    await win.waitForFunction(() => document.querySelector("[data-editor-shell]") === null, undefined, { timeout: 5_000 });
    await sendCmd("toggle-editor-left");
    await new Promise((r) => setTimeout(r, 300));
    const noEditor = await win.locator("[data-editor-shell]").count();
    if (noEditor > 0) throw new Error("toggle-editor-left opened an editor when none was open");
    console.log("OK — column commands are no-op when editor is closed");

    console.log("\nPASS — view menu columns gate (sprint 397)");
    code = 0;
  } catch (err: any) {
    console.error("FAIL:", err.message);
  } finally {
    await app.close().catch(() => {});
    process.exit(code);
  }
}

main();
