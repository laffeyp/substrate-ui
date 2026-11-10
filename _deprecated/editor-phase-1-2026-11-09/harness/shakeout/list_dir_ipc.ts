// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 391 gate: the native:list-dir IPC channel. Binds a session (which gives a workspacePath),
// calls window.native.listDir on the workspace root, and checks the result has entries. Also checks
// that a path outside the workspace returns an empty array.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    console.log("gate: app launched, waiting for first window");
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);

    // Bind a session, send a message so the session round-trips, then read the workspace path.
    await bindPaneAsUser(win, "deterministic");
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });

    const wsPath: string | null = await win.evaluate(() => (window as any).__vm.get(1).snapshot().workspacePath);
    if (!wsPath) throw new Error("no workspacePath on pane 1's snapshot");
    console.log("OK — workspacePath: " + wsPath);

    // Call listDir on the workspace root.
    const result = await win.evaluate(async (ws) => {
      const n = (window as any).native;
      if (!n?.listDir) return { error: "listDir not on native bridge" };
      return await n.listDir(ws, ws);
    }, wsPath);
    if ((result as any).error) throw new Error((result as any).error);
    const { entries, truncated } = result as { entries: { name: string; type: string; size: number }[]; truncated: boolean };
    if (!Array.isArray(entries)) throw new Error("entries is not an array");
    if (entries.length === 0) throw new Error("workspace root returned 0 entries — expected at least one file");
    const dirs = entries.filter((e) => e.type === "directory").length;
    const files = entries.filter((e) => e.type === "file").length;
    console.log(`OK — listDir returned ${entries.length} entries (${dirs} dirs, ${files} files, truncated=${truncated})`);

    // Check that each entry has the expected shape.
    for (const e of entries.slice(0, 5)) {
      if (typeof e.name !== "string" || !e.name) throw new Error("entry missing name");
      if (e.type !== "file" && e.type !== "directory") throw new Error(`unexpected type: ${e.type}`);
      if (typeof e.size !== "number") throw new Error("entry missing size");
    }
    console.log("OK — entry shape validated (name, type, size)");

    // Path outside workspace returns empty.
    const outside = await win.evaluate(async (ws) => {
      const n = (window as any).native;
      return await n.listDir(ws, "/tmp");
    }, wsPath);
    const { entries: outsideEntries } = outside as { entries: unknown[] };
    if (outsideEntries.length > 0) throw new Error("path outside workspace returned entries — security violation");
    console.log("OK — path outside workspace returns empty array");

    // Nonexistent path returns empty.
    const missing = await win.evaluate(async (ws) => {
      const n = (window as any).native;
      return await n.listDir(ws, ws + "/this_dir_does_not_exist_391");
    }, wsPath);
    const { entries: missingEntries } = missing as { entries: unknown[] };
    if (missingEntries.length > 0) throw new Error("nonexistent path returned entries");
    console.log("OK — nonexistent path returns empty array");

    console.log("\nPASS — list-dir IPC gate (sprint 391)");
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
