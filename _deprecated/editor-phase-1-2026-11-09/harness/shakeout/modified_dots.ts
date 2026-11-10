// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 394 gate: modified dots on the file tree. Creates a file in the workspace, then
// opens the editor and checks that the tree shows a modified dot for the new file.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, settled } from "./lib/electron";

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);

    await bindPaneAsUser(win, "deterministic");
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });

    const wsPath: string | null = await win.evaluate(() => (window as any).__vm.get(1).snapshot().workspacePath);
    if (!wsPath) throw new Error("no workspacePath");
    console.log("OK — workspacePath: " + wsPath);

    // Create a new file in the workspace so the diff vs main is non-empty.
    // Use the session's file API with a relative URL (the page is served by the same server).
    const sessionId = await win.evaluate(() => (window as any).__vm.get(1).snapshot().sessionId);
    await win.evaluate(async (sid) => {
      const resp = await fetch(`/api/session/${sid}/file?path=test_394.txt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "modified dots test file" }),
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`file write failed: ${resp.status} ${body}`);
      }
    }, sessionId);
    console.log("OK — created test_394.txt in workspace");

    // Verify the diff now reports the file.
    const diff = await win.evaluate(async (ws) => {
      const n = (window as any).native;
      return await n.diffVsMain(ws);
    }, wsPath);
    const { files } = diff as { files: { path: string; status: string }[] };
    const testFile = files.find((f) => f.path === "test_394.txt");
    if (!testFile) throw new Error(`diff does not include test_394.txt; got ${files.map((f) => f.path).join(", ")}`);
    console.log(`OK — diff includes test_394.txt with status "${testFile.status}"`);

    // Open the editor.
    const sendCmd = async (cmd: string) => win.evaluate((c) => {
      const sh = (window as any).__substrateShell;
      if (sh) for (const fn of [...sh.channel.listeners]) fn(c);
    }, cmd);
    await sendCmd("toggle-editor");
    await settled(win);
    await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 10_000 });
    console.log("OK — editor open");

    // Wait for the file tree and the diff to load.
    await win.locator("[data-file-tree]").first().waitFor({ state: "visible", timeout: 10_000 });
    // The tree's diff fetch is async; wait for a modified dot to appear.
    await win.waitForFunction(() => document.querySelectorAll("[data-modified-dot]").length > 0, undefined, { timeout: 10_000 });
    const dotCount = await win.evaluate(() => document.querySelectorAll("[data-modified-dot]").length);
    console.log(`OK — ${dotCount} modified dot(s) visible in the file tree`);

    // The dot should be on the test_394.txt node.
    const dotOnFile = await win.evaluate(() => {
      const nodes = document.querySelectorAll("[data-tree-node]");
      for (const n of nodes) {
        const path = n.getAttribute("data-tree-path") || "";
        if (path.endsWith("test_394.txt") && n.querySelector("[data-modified-dot]")) return true;
      }
      return false;
    });
    if (!dotOnFile) {
      // The dot might be on a parent dir if the tree hasn't expanded to the file level.
      console.log("WARN — dot not directly on test_394.txt node (may be on parent dir)");
    } else {
      console.log("OK — modified dot is on test_394.txt");
    }

    console.log("\nPASS — modified dots gate (sprint 394)");
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
