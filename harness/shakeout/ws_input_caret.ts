// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The pane picker's typed path keeps its caret (sprint 287; plan PLAN-2026-11-04-shell-to-react-r5.md,
// C5). The box is a React input whose value DCLogic also holds; a controlled input given its value a
// render late puts the caret at the end, so the box keeps its own copy of the text
// (web/app/PanePicker.tsx, WsInput).
//
// Steps: in the unbound pane's box type "abc", press ← once, type "X": the box reads "abXc", the caret
// sits after the X, and the typed row at the top of the workspace column names "abXc".

import { _electron as electron } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const box = win.locator("input[data-ws-input]").first();
    await box.waitFor({ state: "visible", timeout: 15_000 });
    await box.click();
    await win.keyboard.type("abc");
    await win.keyboard.press("ArrowLeft");
    await win.keyboard.type("X");
    await settled(win);
    const got = await box.evaluate((el: HTMLInputElement) => ({ value: el.value, caret: el.selectionStart }));
    if (got.value !== "abXc" || got.caret !== 3) throw new Error(`the box reads ${JSON.stringify(got)}; expected "abXc" with the caret at 3`);
    const typedRow = (await win.locator('[data-ws-scroll] [data-ws-lit]').first().innerText()).replace(/\s+/g, " ").trim();
    if (!typedRow.includes("abXc")) throw new Error(`the column's first row reads "${typedRow}"`);
    console.log(`ws_input_caret: ok — "abXc", caret at 3; the typed row reads "${typedRow}"`);
    code = 0;
  } catch (e) {
    console.error(`ws_input_caret: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
