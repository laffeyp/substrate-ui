// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's lens, written as it changes (LENS_CHANGED, vocabulary v0.18, sprint 368). After one turn in
// pane 1: /language opens the language lens (App's shell subscription); ↵ on it returns to the
// stream (the language keys); then the chips, i/o, structure, language, scene, stream (MetaView),
// and stream once more, which is already shown and writes nothing.
// window-1.jsonl then holds exactly seven LENS_CHANGED, in that order, each in pane 1's context with
// pane 1's session.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const sid = await win.evaluate(() => (window as any).__vm.get(1).snapshot().sessionId as string);

    await visible(win, "textarea[data-input-bar]").fill("/language");
    await win.keyboard.press("Enter");
    await win.waitForFunction(`document.querySelectorAll("[data-lang-row]").length > 0`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("/language drew no language lens rows"); });
    await win.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
    await win.keyboard.press("Enter");
    await settled(win);
    for (const mode of ["io", "structure", "language", "scene", "stream", "stream"]) {
      await win.locator(`[data-lens-chip="${mode}"]`).first().click();
      await settled(win);
    }

    // The trace, read once the app has closed and its files are complete.
    await app.close();
    const want = ["language", "stream", "io", "structure", "language", "scene", "stream"];
    const got = windowRecords(launch).filter((r) => r.name === "LENS_CHANGED");
    const show = got.map((r) => `${String(r.payload.lens)} pane=${String(r.pane_id)} session=${String(r.payload.session_id)}`).join("; ");
    const match = got.length === want.length && want.every((lens, i) => got[i].payload.lens === lens && got[i].pane_id === 1 && got[i].payload.session_id === sid);
    if (!match) throw new Error(`LENS_CHANGED in window-1.jsonl (session ${sid}): ${show || "none"}`);
    console.log(`lens_signals: ok — ${want.length} LENS_CHANGED in order (${want.join(", ")}), each in pane 1 with ${sid}; the lit chip wrote nothing`);
    code = 0;
  } catch (e) {
    console.error(`lens_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
