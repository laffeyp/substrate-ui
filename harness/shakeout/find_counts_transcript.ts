// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// ⌘F counts the pane's own transcript (UI sprint 186). Before, the transcript scope counted lines
// of a sample session's text, so any word from a real session read "0 matching lines".
//
// Steps: bind pane 1 (deterministic); send a message with a rare word; open the find bar; type
// the word, then a word in no row; read the count each time against the transcript's own rows.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Vm = { get(id: number): { snapshot(): { transcript: { role: string; text?: string }[] } } | null };

const WORD = "pineapplequartz";

async function countIn(win: Page, word: string): Promise<number> {
  return win.evaluate((w) => {
    const rows = (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript;
    return rows.filter((r) => String(r.text || "").toLowerCase().includes(w)).length;
  }, word);
}

async function shown(win: Page, query: string): Promise<string> {
  const box = win.locator('input[placeholder="find in transcript"]').first();
  await box.fill(query);
  const line = win.locator("text=/matching lines · scope: transcript/").first();
  await line.waitFor({ state: "visible", timeout: 5_000 });
  return (await line.textContent())?.trim() ?? "";
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
    await bar.click();
    await bar.fill(`please repeat ${WORD}`);
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.some((r) => r.role === "model"), undefined, { timeout: 20_000 });
    await win.keyboard.press("Meta+f");
    const want = await countIn(win, WORD);
    if (want < 1) throw new Error(`the transcript holds no row with ${WORD}`);
    const hit = await shown(win, WORD);
    if (hit !== `${want} matching lines · scope: transcript`) throw new Error(`for ${WORD} the bar reads ${JSON.stringify(hit)}; the transcript has ${want}`);
    const miss = await shown(win, "zzznotthere");
    if (miss !== "0 matching lines · scope: transcript") throw new Error(`for a missing word the bar reads ${JSON.stringify(miss)}`);
    console.log(`find_counts_transcript: ok — ${JSON.stringify(hit)}; ${JSON.stringify(miss)}`);
    code = 0;
  } catch (e) {
    console.error(`find_counts_transcript: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
