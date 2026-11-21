// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 528 — renderer crash recovery gate.
//
// Steps:
//   1. Launch the app, bind pane 1 to a session.
//   2. Mock dialog.showMessageBox in main to auto-pick Reopen (button 0).
//   3. Kill the renderer via CDP (process.crash()).
//   4. Wait for the window to reload and the __vm to come back.
//   5. Read main.jsonl for RENDERER_GONE → RENDERER_RECOVERY_OFFERED → RENDERER_RECOVERY_CHOSEN → WINDOW_REOPENED.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

interface MainRecord { name: string; payload: Record<string, unknown> }

function mainRecords(state: string): MainRecord[] {
  const traces = join(state, "electron", "logs", "traces");
  const boot = readdirSync(traces).sort().pop()!;
  return readFileSync(join(traces, boot, "main.jsonl"), "utf8")
    .split("\n").filter(Boolean).map((l) => JSON.parse(l) as MainRecord);
}

async function main(): Promise<void> {
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);

    await win.waitForFunction(
      () => document.querySelectorAll("[data-vm-transcript-mount] [data-row-kind]").length > 0,
      undefined, { timeout: 15_000 },
    );

    // Mock dialog.showMessageBox in the main process to auto-pick the first button (Reopen).
    // The render-process-gone handler awaits the dialog; the mock resolves it at once.
    await app.evaluate(async ({ dialog }) => {
      const orig = dialog.showMessageBox;
      (dialog as any).__origShowMessageBox = orig;
      dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false });
    });

    // Kill the renderer via CDP.
    const cdp = await win.context().newCDPSession(win);
    await cdp.send("Runtime.evaluate", { expression: "process.crash()" }).catch(() => undefined);

    // The deferred reload fires after setTimeout(..., 0). Wait for the window to come back.
    await win.waitForFunction(
      () => (window as unknown as { __vm?: unknown }).__vm != null,
      undefined, { timeout: 30_000 },
    );

    // Restore the original dialog.
    await app.evaluate(async ({ dialog }) => {
      if ((dialog as any).__origShowMessageBox) {
        dialog.showMessageBox = (dialog as any).__origShowMessageBox;
        delete (dialog as any).__origShowMessageBox;
      }
    });

    // The reloaded window should show the pane (picker or restored session).
    await win.waitForFunction(
      () => {
        const bar = document.querySelector("[data-input-bar]");
        const picker = document.querySelector("input[data-ws-input]");
        return bar != null || picker != null;
      },
      undefined, { timeout: 15_000 },
    );

    // Close the app and read the trace.
    await app.close();
    const records = mainRecords(launch.state);
    const tags = records.map((r) => r.name);

    const hasGone = tags.includes("RENDERER_GONE");
    const hasOffered = tags.includes("RENDERER_RECOVERY_OFFERED");
    const hasChosen = tags.includes("RENDERER_RECOVERY_CHOSEN");
    const hasReopened = tags.includes("WINDOW_REOPENED");

    if (!hasGone) throw new Error("RENDERER_GONE not in trace");
    if (!hasOffered) throw new Error("RENDERER_RECOVERY_OFFERED not in trace");
    if (!hasChosen) throw new Error("RENDERER_RECOVERY_CHOSEN not in trace");
    if (!hasReopened) throw new Error("WINDOW_REOPENED not in trace");

    const offered = records.find((r) => r.name === "RENDERER_RECOVERY_OFFERED")!;
    const chosen = records.find((r) => r.name === "RENDERER_RECOVERY_CHOSEN")!;
    if (offered.payload.rapid !== false) throw new Error("RENDERER_RECOVERY_OFFERED.rapid expected false, got " + String(offered.payload.rapid));
    if (chosen.payload.action !== "reopen") throw new Error("RENDERER_RECOVERY_CHOSEN.action expected reopen, got " + String(chosen.payload.action));

    const goneIdx = tags.indexOf("RENDERER_GONE");
    const offeredIdx = tags.indexOf("RENDERER_RECOVERY_OFFERED");
    const chosenIdx = tags.indexOf("RENDERER_RECOVERY_CHOSEN");
    const reopenedIdx = tags.indexOf("WINDOW_REOPENED");
    if (!(goneIdx < offeredIdx && offeredIdx < chosenIdx && chosenIdx < reopenedIdx)) {
      throw new Error(`tag ordering wrong: GONE@${goneIdx} OFFERED@${offeredIdx} CHOSEN@${chosenIdx} REOPENED@${reopenedIdx}`);
    }

    console.log(`renderer_crash_recovery: ok — renderer killed, dialog auto-answered Reopen, window reloaded; trace: RENDERER_GONE@${goneIdx} RENDERER_RECOVERY_OFFERED@${offeredIdx}(rapid=false) RENDERER_RECOVERY_CHOSEN@${chosenIdx}(action=reopen) WINDOW_REOPENED@${reopenedIdx}`);
    code = 0;
  } catch (e) {
    console.error(`renderer_crash_recovery: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
