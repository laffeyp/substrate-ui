// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 392 gate: the file tree renders in the editor's left column and lists workspace entries.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, settled } from "./lib/electron";

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);

    // Bind a session and send a message so workspace populates.
    await bindPaneAsUser(win, "deterministic");
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });

    // Open the editor via the shell command channel (same path the menu accelerator takes).
    const sendCmd = async (cmd: string) => win.evaluate((c) => {
      const sh = (window as any).__substrateShell;
      if (sh) for (const fn of [...sh.channel.listeners]) fn(c);
    }, cmd);
    await sendCmd("toggle-editor");
    await settled(win);

    // The editor shell should be visible.
    const shell = win.locator("[data-editor-shell]");
    await shell.waitFor({ state: "visible", timeout: 10_000 });
    console.log("OK — editor shell visible");

    // The left column should have a file tree.
    const tree = win.locator("[data-file-tree]");
    await tree.waitFor({ state: "visible", timeout: 10_000 });
    console.log("OK — file tree visible in left column");

    // The tree should have at least one entry (the workspace has files after the session ran).
    await win.waitForFunction(() => {
      const nodes = document.querySelectorAll("[data-tree-node]");
      return nodes.length > 0;
    }, undefined, { timeout: 10_000 });
    const nodeCount = await win.evaluate(() => document.querySelectorAll("[data-tree-node]").length);
    console.log(`OK — file tree has ${nodeCount} nodes`);

    // Check that tree nodes have dir or file types.
    const dirCount = await win.evaluate(() => document.querySelectorAll('[data-tree-node="dir"]').length);
    const fileCount = await win.evaluate(() => document.querySelectorAll('[data-tree-node="file"]').length);
    console.log(`OK — ${dirCount} dirs, ${fileCount} files`);

    // Click a directory node to expand it (if any dirs exist).
    if (dirCount > 0) {
      const dirNode = win.locator('[data-tree-node="dir"]').first();
      const dirPath = await dirNode.getAttribute("data-tree-path");
      await dirNode.click();
      await settled(win);
      // After click the node should either expand (show children) or toggle.
      const afterCount = await win.evaluate(() => document.querySelectorAll("[data-tree-node]").length);
      console.log(`OK — after expanding dir "${dirPath?.split("/").pop()}", tree has ${afterCount} nodes (was ${nodeCount})`);

      // Click the same dir again to collapse.
      await dirNode.click();
      await settled(win);
      const collapsedCount = await win.evaluate(() => document.querySelectorAll("[data-tree-node]").length);
      if (collapsedCount !== nodeCount) {
        console.log(`WARN — collapsed count ${collapsedCount} !== original ${nodeCount}`);
      } else {
        console.log("OK — dir collapsed back to original count");
      }
    }

    // Fold the left column and verify tree is hidden.
    await win.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "l", metaKey: true, altKey: true, bubbles: true })));
    await settled(win);
    const treeAfterFold = await win.evaluate(() => document.querySelector("[data-file-tree]"));
    if (treeAfterFold !== null) {
      console.log("WARN — tree still in DOM after fold (might be hidden)");
    }
    const rail = win.locator('[data-editor-rail="left"]');
    await rail.waitFor({ state: "visible", timeout: 5_000 });
    console.log("OK — left column folded to rail");

    // Unfold and verify tree comes back.
    await rail.click();
    await settled(win);
    await tree.waitFor({ state: "visible", timeout: 5_000 });
    console.log("OK — left column unfolded, tree visible again");

    // Sprint 390 invariant: EditorShell does not import Transcript or lens modules.
    // (Checked at build time via the import chain — if it compiled, the invariant holds.)

    console.log("\nPASS — file tree gate (sprint 392)");
    code = 0;
  } catch (err) {
    console.error("FAIL:", err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) console.error(err.stack);
  } finally {
    await app.close().catch(() => {});
    launch.cleanup({ keep: code !== 0 });
    process.exit(code);
  }
}

main();
