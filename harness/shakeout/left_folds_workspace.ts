// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// ← on a session folds its workspace row and lights it (UI sprint 152).
//
// Steps: open five sessions in a repo-local folder over the API (the picker leaves out $TMPDIR
// paths); ↓ to the folder's row; ⇧↵ opens it; ↓ lights its first session; ← lights the folder's
// row and folds it.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";

// Plain-string evaluates: esbuild's __name helper does not exist in the page.
const STATE = `(() => {
  const rows = Array.from(document.querySelectorAll("[data-ws-scroll] [data-ws-lit]")).filter((e) => e.offsetParent !== null);
  const lit = rows.find((e) => e.getAttribute("data-ws-lit") === "1");
  return {
    lit: lit ? (lit.textContent || "").replace(/\\s+/g, " ").trim() : "",
    litIsSession: !!lit && lit.style.padding.endsWith("40px"),
    sessions: rows.filter((e) => e.style.padding.endsWith("40px")).length,
  };
})()`;
type S = { lit: string; litIsSession: boolean; sessions: number };
async function press(win: Page, key: string): Promise<S> {
  await win.keyboard.press(key);
  await settled(win);
  return win.evaluate(STATE) as Promise<S>;
}

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "ws-left-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const leaf = folder.split("/").pop()!;
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    for (let i = 0; i < 5; i++) {
      await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, name: "fixture-${i}" }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    }
    await win.evaluate(`window.__vm.loadRecentWorkspaces()`);
    await win.waitForFunction(`Array.from(document.querySelectorAll("[data-ws-lit]")).some((e) => e.offsetParent !== null && (e.textContent || "").includes(${JSON.stringify(leaf)}))`, undefined, { timeout: 10_000 });

    await win.locator("input[data-ws-input]").first().click();
    let s = await win.evaluate(STATE) as S;
    for (let i = 0; i < 8 && !s.lit.includes(leaf); i++) s = await press(win, "ArrowDown");
    if (!s.lit.includes(leaf)) throw new Error(`↓ never lit the folder's row: ${JSON.stringify(s)}`);
    const folderRow = s.lit;
    s = await press(win, "Shift+Enter");
    await win.waitForFunction(`Array.from(document.querySelectorAll("[data-ws-scroll] [data-ws-lit]")).some((e) => e.style.padding.endsWith("40px"))`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("⇧↵ on the folder's row showed no session"); });
    s = await press(win, "ArrowDown");
    if (!s.litIsSession) throw new Error(`↓ under the opened row lit ${JSON.stringify(s)}`);
    const session = s.lit;
    s = await press(win, "ArrowLeft");
    if (s.lit !== folderRow || s.sessions !== 0) throw new Error(`← on "${session}" gave ${JSON.stringify(s)}; want the folder's row lit and folded`);
    console.log(`left_folds_workspace: ok — ← on "${session}" lit the folder's row and folded it`);
    code = 0;
  } catch (e) {
    console.error(`left_folds_workspace: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
