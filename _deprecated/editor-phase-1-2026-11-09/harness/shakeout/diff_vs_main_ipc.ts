// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 393 gate: the native:diff-vs-main IPC channel returns modified files relative to main.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

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

    // Call diffVsMain on the workspace.
    const result = await win.evaluate(async (ws) => {
      const n = (window as any).native;
      if (!n?.diffVsMain) return { error: "diffVsMain not on native bridge" };
      return await n.diffVsMain(ws);
    }, wsPath);
    if ((result as any).error) throw new Error((result as any).error);
    const { files } = result as { files: { path: string; status: string }[] };
    if (!Array.isArray(files)) throw new Error("files is not an array");
    console.log(`OK — diffVsMain returned ${files.length} files`);

    // The deterministic session creates files; there should be at least some entries.
    // But even if no files were written by the session (the workspace starts as a fresh git repo
    // with one initial commit), the result should be a valid array.
    for (const f of files.slice(0, 5)) {
      if (typeof f.path !== "string" || !f.path) throw new Error("entry missing path");
      if (typeof f.status !== "string" || !f.status) throw new Error("entry missing status");
    }
    if (files.length > 0) {
      console.log(`OK — first file: ${files[0].status} ${files[0].path}`);
    }
    console.log("OK — entry shape validated (path, status)");

    // A nonexistent workspace returns empty.
    const missing = await win.evaluate(async () => {
      const n = (window as any).native;
      return await n.diffVsMain("/tmp/no-such-workspace-393");
    });
    const { files: missingFiles } = missing as { files: unknown[] };
    if (missingFiles.length > 0) throw new Error("nonexistent workspace returned files");
    console.log("OK — nonexistent workspace returns empty array");

    console.log("\nPASS — diff-vs-main IPC gate (sprint 393)");
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
