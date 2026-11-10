// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Probe (sprint 424): after each vim key, the store's mode, the status line, and the last EDITOR_DRAWN mode.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "../lib/electron";

async function main(): Promise<void> {
  const repo = join(__dirname, "..", ".scratch", "vim-probe-" + process.pid);
  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["-C", repo, "init", "-q", "-b", "main"]);
  writeFileSync(join(repo, "a.ts"), "one\ntwo\nthree\n");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="a.ts"]').first().click();
    await win.locator("[data-editor-code] .cm-line").first().click();
    const look = (label: string) => win.evaluate(`(() => { var d = (window.__vmSignals || []).filter(function (r) { return r.name === "EDITOR_DRAWN"; }); var k = (window.__vmSignals || []).filter(function (r) { return r.name === "KEY_ROUTED"; }).slice(-1)[0]; return ${JSON.stringify(label)} + " store=" + globalThis.__substrateEditor.getSnapshot().mode + " line=" + (document.querySelector("[data-status-mode]") || {}).textContent + " drawn=" + (d.length ? d[d.length - 1].payload.mode : "-") + " n=" + d.length + " lastkey=" + (k ? k.payload.key : "-"); })()`);
    console.log(await look("start"));
    for (const k of ["i", "zz", "Enter", "SHOT", "Escape", "v", "Escape", "i", "ELSHOT", "Escape"]) {
      if (k === "SHOT") await win.screenshot({ path: join(repo, "s.png") });
      else if (k === "ELSHOT") await win.locator("[data-status-line]").first().screenshot({ path: join(repo, "e.png") });
      else if (k.length <= 2) await win.keyboard.type(k); else await win.keyboard.press(k);
      await settled(win);
      console.log(await look(k));
    }
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({});
    rmSync(repo, { recursive: true, force: true });
  }
}
main();
