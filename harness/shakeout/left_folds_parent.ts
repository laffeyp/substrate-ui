// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// ← inside an open group folds it and lights the group; ← on a folded top-level row goes back to
// the workspace column (UI sprint 151).
//
// Steps, live roster: ↵ arms the first workspace; → opens cli agents; ↓ lights its first agent;
// ← lights cli agents, folded, with the workspace still armed; ← again goes back.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";

// Plain-string evaluate: esbuild's __name helper does not exist in the page.
const STATE = `(() => {
  const half = Array.from(document.querySelectorAll("[data-model-half]")).find((e) => e.offsetParent !== null);
  const row = half.querySelector('[data-lit="1"]');
  return {
    armed: half.getAttribute("data-armed"),
    lit: row ? row.getAttribute("data-model-row") : "",
    open: !!row && (row.lastElementChild.textContent || "").trim() === "▾",
  };
})()`;
type S = { armed: string; lit: string; open: boolean };
async function press(win: Page, key: string): Promise<S> {
  await win.keyboard.press(key);
  await settled(win);
  return win.evaluate(STATE) as Promise<S>;
}

async function main(): Promise<void> {
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const input = win.locator("input[data-ws-input]").first();
    await input.waitFor({ state: "visible", timeout: 15_000 });
    await win.locator('[data-model-row="cli agents"]').first().waitFor({ state: "attached", timeout: 20_000 });
    await input.click();
    let s = await press(win, "Enter");
    if (s.armed !== "1" || s.lit !== "cli agents") throw new Error(`↵ gave ${JSON.stringify(s)}`);
    s = await press(win, "ArrowRight");
    if (!s.open) throw new Error(`→ did not open cli agents: ${JSON.stringify(s)}`);
    s = await press(win, "ArrowDown");
    const agent = s.lit;
    if (!agent || agent === "cli agents" || agent === "ollama · cloud") throw new Error(`↓ under cli agents lit ${JSON.stringify(s)}`);
    s = await press(win, "ArrowLeft");
    if (s.armed !== "1" || s.lit !== "cli agents" || s.open) throw new Error(`← on ${agent} gave ${JSON.stringify(s)}; want cli agents lit and folded, still armed`);
    s = await press(win, "ArrowLeft");
    if (s.armed !== "0") throw new Error(`← on a folded cli agents gave ${JSON.stringify(s)}; want the workspace column`);
    console.log(`left_folds_parent: ok — ← on ${agent} folded cli agents and lit it; ← again went back to the workspace column`);
    code = 0;
  } catch (e) {
    console.error(`left_folds_parent: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
