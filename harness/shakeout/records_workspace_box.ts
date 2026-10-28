// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The records page lists workspaces in the workspace bar's style (UI sprint 153): one box with the
// picker box's background, radius and border, in a centred column.
//
// Steps: open a session in a repo-local folder over the API (the page leaves out $TMPDIR paths);
// open the records page; read the box around the workspace rows and the column's margins.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

// Plain-string evaluate: esbuild's __name helper does not exist in the page.
const READ = (leaf: string) => `(() => {
  const row = Array.from(document.querySelectorAll("span")).find((e) => e.offsetParent !== null && (e.textContent || "").endsWith(${JSON.stringify(leaf)}));
  if (!row) return null;
  const box = row.closest("[data-records-workspaces]");
  const page = document.querySelector("[data-records-column]");
  const outer = page ? page.parentElement.getBoundingClientRect() : null;
  const col = page ? page.getBoundingClientRect() : null;
  const cs = box ? getComputedStyle(box) : null;
  return {
    boxed: !!box,
    bg: cs ? cs.backgroundColor : "",
    radius: cs ? cs.borderTopLeftRadius : "",
    border: cs ? cs.borderTopColor : "",
    left: col && outer ? col.left - outer.left : -1,
    right: col && outer ? outer.right - col.right : -1,
    rowText: (row.parentElement.textContent || "").replace(/\\s+/g, " ").trim(),
  };
})()`;

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "records-box-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const leaf = folder.split("/").pop()!;
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1512, 945));
    await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)} }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    await win.evaluate(`window.__vm.loadRecentWorkspaces()`);
    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await win.waitForFunction(`(${READ(leaf)})?.rowText.endsWith("1 session")`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("the folder's row on the records page never read 1 session"); });
    const r = await win.evaluate(READ(leaf)) as { boxed: boolean; bg: string; radius: string; border: string; left: number; right: number; rowText: string };
    if (!r.boxed) throw new Error(`the workspace rows are not in a box: ${JSON.stringify(r)}`);
    if (r.bg !== "rgb(26, 28, 32)" || r.radius !== "6px" || r.border !== "rgba(255, 255, 255, 0.13)") throw new Error(`the box is not the picker's style: ${JSON.stringify(r)}`);
    if (Math.abs(r.left - r.right) > 1) throw new Error(`the column is not centred: left ${r.left}, right ${r.right}`);
    if (!/1 session$/.test(r.rowText)) throw new Error(`the row's text changed: ${r.rowText}`);
    await win.screenshot({ path: join(__dirname, ".scratch", "records-box.png") });
    console.log(`records_workspace_box: ok — rows in a ${r.bg} box, radius ${r.radius}, border ${r.border}; column gaps ${r.left.toFixed(1)} / ${r.right.toFixed(1)}; row reads "${r.rowText}"`);
    code = 0;
  } catch (e) {
    console.error(`records_workspace_box: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
