// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The session-start line (UI sprint 144): before the first message the empty transcript says
// "session started with <model> at <workspace>"; after a message it is still first, the message below.
//
// Steps: bind pane 1 (deterministic, per-session sandbox); read the transcript before any message;
// send one; read it again; switch to the meta view and read its transcript.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Vm = { get(id: number): { snapshot(): { transcript: { role: string }[] } } | null };

async function firstRows(win: Page, mount: string): Promise<string[]> {
  return win.evaluate((m) => {
    const root = Array.from(document.querySelectorAll(`[data-vm-transcript-mount="${m}"]`)).find((e) => (e as HTMLElement).offsetParent !== null);
    const list = root?.firstElementChild?.firstElementChild;
    return list ? Array.from(list.children).slice(0, 2).map((c) => (c.textContent || "").trim()) : [];
  }, mount);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    await win.locator("[data-session-start-line]").first().waitFor({ state: "visible", timeout: 10_000 });
    const before = await firstRows(win, "terminal");
    if (before[0] !== "session started with deterministic at a per-session sandbox") throw new Error(`before a message the transcript reads ${JSON.stringify(before)}`);
    const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
    await bar.click();
    await bar.fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.some((r) => r.role === "model"), undefined, { timeout: 20_000 });
    const after = await firstRows(win, "terminal");
    if (after[0] !== before[0] || !after[1]?.includes("hello")) throw new Error(`after a message the transcript reads ${JSON.stringify(after)}`);
    await win.keyboard.press("Meta+m");
    await win.locator('[data-vm-transcript-mount="reveal"] [data-session-start-line]').first().waitFor({ state: "visible", timeout: 10_000 });
    const meta = await firstRows(win, "reveal");
    if (meta[0] !== after[0]) throw new Error(`the meta view reads ${JSON.stringify(meta)}; panes ${JSON.stringify(after)}`);
    console.log(`session_start_line: ok — before: ${JSON.stringify(before[0])}; after: ${JSON.stringify(after)}; meta the same`);
    code = 0;
  } catch (e) {
    console.error(`session_start_line: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
