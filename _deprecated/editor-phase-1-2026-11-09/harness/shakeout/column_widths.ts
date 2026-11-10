// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Column widths persist in localStorage (sprint 396, Phase 1). Opens the editor, writes a custom
// width to localStorage, closes and reopens the editor, verifies the left column renders at the
// stored width. Also checks that drag handles exist.

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

    // 1. Open editor, check default left width is 240.
    await sendCmd("toggle-editor");
    await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 });
    const defaultWidth = await win.locator('[data-editor-column="left"]').first().evaluate((el) => el.getBoundingClientRect().width);
    if (Math.abs(defaultWidth - 240) > 2) throw new Error("default left width: " + defaultWidth + " (expected ~240)");
    console.log("OK — default left column width is ~240px");

    // 2. Check drag handles exist.
    const colHandles = await win.locator('[data-drag-handle="col"]').count();
    const rowHandles = await win.locator('[data-drag-handle="row"]').count();
    if (colHandles < 2) throw new Error("expected ≥2 column drag handles, got " + colHandles);
    if (rowHandles < 1) throw new Error("expected ≥1 row drag handle, got " + rowHandles);
    console.log("OK — drag handles present (" + colHandles + " col, " + rowHandles + " row)");

    // 3. Write a custom width to localStorage and reopen.
    await win.evaluate(() => {
      try { localStorage.setItem("substrate:editor-column-widths", JSON.stringify({ left: 300, right: 280, bottomHeight: 180 })); } catch {}
    });
    await sendCmd("toggle-editor");
    await win.waitForFunction(() => document.querySelector("[data-editor-shell]") === null, undefined, { timeout: 5_000 });
    await sendCmd("toggle-editor");
    await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 });

    const storedWidth = await win.locator('[data-editor-column="left"]').first().evaluate((el) => el.getBoundingClientRect().width);
    if (Math.abs(storedWidth - 300) > 2) throw new Error("stored left width: " + storedWidth + " (expected ~300)");
    console.log("OK — left column width restored to 300px from localStorage");

    console.log("\nPASS — column widths gate (sprint 396)");
    code = 0;
  } catch (err: any) {
    console.error("FAIL:", err.message);
  } finally {
    await app.close().catch(() => {});
    process.exit(code);
  }
}

main();
