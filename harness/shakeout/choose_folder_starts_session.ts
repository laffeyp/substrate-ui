// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// "choose folder…" in a fresh pane's workspace bar arms the folder Electron's dialog returns, and a
// model pick then goes on to GUIDANCE, LENGTH and TONE and starts the session there.
//
// The dialog is replaced in the main process by one that returns a repo-local folder (the picker
// leaves out $TMPDIR). Steps: click "choose folder…" → the model half is armed; click
// "deterministic" → the GUIDANCE line opens and the half stays armed; auto, normal, neutral → the
// chat prompt shows; the first message opens a session in that folder on deterministic.
// F361: the folder reaches the recent workspaces (the server's list holds it). F362: in a second
// pane's fresh picker (⌘D), ⌘O (the menu's "open" command) opens the same folder chooser and arms the
// folder, where it used to open "Open Record…".
// Run against the installed or built app with SHAKEOUT_APP=<path to Substrate.app>.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";

type Snap = { sessionId: string | null; driver: string | null; workspace?: string | null };

async function armed(win: Page): Promise<string | null> {
  return win.locator("[data-model-half]").first().getAttribute("data-armed");
}

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "choose-folder-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const picked = folder;
    await app.evaluate(({ dialog }, picked) => {
      (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = async () => ({ canceled: false, filePaths: [picked] });
    }, folder);
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const choose = win.getByText("choose folder…", { exact: true }).first();
    await choose.waitFor({ state: "visible", timeout: 15_000 });
    await choose.click();
    await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 5_000 })
      .catch(() => { throw new Error("choose folder… did not arm the model half"); });

    const recents = await win.evaluate(async () => (await (await fetch("/api/workspaces")).json()) as { path: string }[]);
    if (!recents.some((r) => r.path === picked)) throw new Error(`the chosen folder is not in the recent workspaces: ${JSON.stringify(recents.map((r) => r.path))}`);

    const model = win.locator('[data-model-row="deterministic"] > span').first();
    await model.click();
    await settled(win);
    const after = await armed(win);
    if (after !== "1") throw new Error(`the model pick sent the bar back to the workspace column (data-armed=${after})`);
    for (const [line, pos] of [["guidance", "auto"], ["length", "normal"], ["tone", "neutral"]]) {
      const row = win.locator(`[data-${line}-half] [data-${line}-row="${pos}"]`).first();
      await row.waitFor({ state: "visible", timeout: 10_000 })
        .catch(() => { throw new Error(`the ${line} line did not open after the model pick`); });
      await row.click();
    }
    const prompt = win.locator("[data-input-bar]").first();
    await prompt.waitFor({ state: "visible", timeout: 15_000 });
    await prompt.click();
    await win.keyboard.type("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => {
      const vm = (window as unknown as { __vm?: { get(n: number): { snapshot(): Snap } | null } }).__vm;
      return !!vm?.get(1)?.snapshot().sessionId;
    }, undefined, { timeout: 30_000 });
    const s = await win.evaluate(() => {
      const vm = (window as unknown as { __vm?: { get(n: number): { snapshot(): Snap } | null } }).__vm;
      return vm?.get(1)?.snapshot() ?? null;
    });
    if (!s || s.driver !== "deterministic") throw new Error(`the session opened on ${JSON.stringify(s)}`);
    await win.keyboard.press("Meta+d");
    await win.locator('[data-pane="2"] input[data-ws-input]').first().waitFor({ state: "visible", timeout: 10_000 });
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].webContents.send("menu:open", null); });
    await win.locator('[data-pane="2"] [data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 5_000 })
      .catch(() => { throw new Error("⌘O in a fresh picker did not open the folder chooser and arm the folder"); });
    console.log(`choose_folder_starts_session: ok — armed by the dialog, in the recents, model picked, started ${s.sessionId} on ${s.driver}; ⌘O armed pane 2`);
    code = 0;
  } catch (e) {
    console.error(`choose_folder_starts_session: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
