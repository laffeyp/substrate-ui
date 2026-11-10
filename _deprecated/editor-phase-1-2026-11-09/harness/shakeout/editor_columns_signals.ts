// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 390 gate: foldable editor columns and their toggle keys. Opens the editor via the shell
// channel, then dispatches synthetic keydown events for ⌥⌘L, ⌥⌘R, ⌘J (the column toggles go through
// the window's keydown listener → keymap.ts → App.toggleEditorColumn, not through Electron menu
// accelerators). Checks EDITOR_COLUMN_FOLDED payloads, EDITOR_DRAWN updates, bottom panel content, E1.

import { _electron as electron, type Page } from "playwright";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";
import { bindPaneAsUser, launchArgs, observedSignals, waitForApp } from "./lib/electron";

type Sig = { name: string; payload: Record<string, unknown> };

async function runChecks(win: Page): Promise<void> {
  const sendCmd = async (cmd: string) => win.evaluate((c) => {
    const sh = (window as any).__substrateShell;
    if (sh) for (const fn of [...sh.channel.listeners]) fn(c);
  }, cmd);

  const pressKey = async (key: string, mods: { meta?: boolean; alt?: boolean; shift?: boolean; ctrl?: boolean }) =>
    win.evaluate(({ key, mods }) => {
      window.dispatchEvent(new KeyboardEvent("keydown", {
        key, code: "Key" + key.toUpperCase(), bubbles: true, cancelable: true,
        metaKey: !!mods.meta, altKey: !!mods.alt, shiftKey: !!mods.shift, ctrlKey: !!mods.ctrl,
      }));
    }, { key, mods });

  // Bind a session and open the editor.
  await bindPaneAsUser(win, "deterministic");
  await sendCmd("toggle-editor");
  await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 });
  console.log("OK — editor shell open");

  // Bottom panel has transcript mount.
  const transcriptMount = await win.locator('[data-vm-transcript-mount="terminal"]').count();
  if (transcriptMount < 1) throw new Error("bottom panel missing transcript mount");
  console.log("OK — bottom panel shows transcript");

  // Clear signals before column tests.
  await win.evaluate(() => { ((window as any).__vmSignals ?? []).splice(0); });

  // Toggle left column via ⌥⌘L (fold).
  await pressKey("l", { meta: true, alt: true });
  await new Promise((r) => setTimeout(r, 300));
  const leftRail = await win.locator('[data-editor-rail="left"]').count();
  if (leftRail < 1) throw new Error("left rail not visible after ⌥⌘L");
  const leftCol = await win.locator('[data-editor-column="left"]').count();
  if (leftCol > 0) throw new Error("left column still visible after fold");
  const foldLeft = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).find((s: Sig) => s.name === "EDITOR_COLUMN_FOLDED" && (s.payload as any).column === "left") as Sig | undefined
  );
  if (!foldLeft) throw new Error("EDITOR_COLUMN_FOLDED(left) not found");
  if (foldLeft.payload.folded !== true) throw new Error(`expected folded=true, got ${foldLeft.payload.folded}`);
  const drawnAfterLeftFold = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) => s.name === "EDITOR_DRAWN") as Sig[]
  );
  const lastDrawn = drawnAfterLeftFold[drawnAfterLeftFold.length - 1];
  if (!lastDrawn || lastDrawn.payload.left_folded !== true) throw new Error("EDITOR_DRAWN.left_folded not true after fold");
  console.log("OK — left column folded, EDITOR_COLUMN_FOLDED(left, true) + EDITOR_DRAWN updated");

  // Toggle left column (unfold).
  await win.evaluate(() => { ((window as any).__vmSignals ?? []).splice(0); });
  await pressKey("l", { meta: true, alt: true });
  await new Promise((r) => setTimeout(r, 300));
  const leftColBack = await win.locator('[data-editor-column="left"]').count();
  if (leftColBack < 1) throw new Error("left column not visible after unfold");
  const unfoldLeft = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).find((s: Sig) => s.name === "EDITOR_COLUMN_FOLDED" && (s.payload as any).column === "left") as Sig | undefined
  );
  if (!unfoldLeft || unfoldLeft.payload.folded !== false) throw new Error("EDITOR_COLUMN_FOLDED(left, false) not found after unfold");
  console.log("OK — left column unfolded, EDITOR_COLUMN_FOLDED(left, false) fired");

  // Toggle right column via ⌥⌘R.
  await win.evaluate(() => { ((window as any).__vmSignals ?? []).splice(0); });
  await pressKey("r", { meta: true, alt: true });
  await new Promise((r) => setTimeout(r, 300));
  const rightRail = await win.locator('[data-editor-rail="right"]').count();
  if (rightRail < 1) throw new Error("right rail not visible after ⌥⌘R");
  const foldRight = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).find((s: Sig) => s.name === "EDITOR_COLUMN_FOLDED" && (s.payload as any).column === "right") as Sig | undefined
  );
  if (!foldRight || foldRight.payload.folded !== true) throw new Error("EDITOR_COLUMN_FOLDED(right, true) not found");
  console.log("OK — right column folded, EDITOR_COLUMN_FOLDED(right, true) fired");

  // Toggle bottom panel via ⌘J.
  await win.evaluate(() => { ((window as any).__vmSignals ?? []).splice(0); });
  await pressKey("j", { meta: true });
  await new Promise((r) => setTimeout(r, 300));
  const bottomRail = await win.locator('[data-editor-rail="bottom"]').count();
  if (bottomRail < 1) throw new Error("bottom rail not visible after ⌘J");
  const transcriptGone = await win.locator('[data-vm-transcript-mount="terminal"]').count();
  if (transcriptGone > 0) throw new Error("transcript mount still visible after bottom panel fold");
  const foldBottom = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).find((s: Sig) => s.name === "EDITOR_COLUMN_FOLDED" && (s.payload as any).column === "bottom") as Sig | undefined
  );
  if (!foldBottom || foldBottom.payload.folded !== true) throw new Error("EDITOR_COLUMN_FOLDED(bottom, true) not found");
  console.log("OK — bottom panel folded, transcript hidden, EDITOR_COLUMN_FOLDED(bottom, true) fired");

  // Unfold bottom.
  await win.evaluate(() => { ((window as any).__vmSignals ?? []).splice(0); });
  await pressKey("j", { meta: true });
  await new Promise((r) => setTimeout(r, 300));
  const bottomCol = await win.locator('[data-editor-column="bottom"]').count();
  if (bottomCol < 1) throw new Error("bottom column not visible after unfold");
  const transcriptBack = await win.locator('[data-vm-transcript-mount="terminal"]').count();
  if (transcriptBack < 1) throw new Error("transcript mount not restored after bottom panel unfold");
  console.log("OK — bottom panel unfolded, transcript restored");

  // E1: no path or text in any editor signal.
  const allEditor = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) => s.name.startsWith("EDITOR_")) as Sig[]
  );
  for (const s of allEditor) {
    for (const [k, v] of Object.entries(s.payload)) {
      if (typeof v === "string" && (v.includes("/") || v.length > 50)) {
        throw new Error(`E1 violation: ${s.name}.${k} contains a path or long text: ${String(v).slice(0, 80)}`);
      }
    }
  }
  console.log("OK — E1: no path or text in editor signals");
  console.log("\nPASS — editor columns gate (sprint 390)");
}

export const flow: Flow = {
  name: "editor_columns_signals",
  declared: ["EDITOR_COLUMN_FOLDED", "EDITOR_DRAWN"],
  async run(_ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    let emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];
    const launch = launchArgs();
    const app = await electron.launch({ ...launch.options, timeout: 60_000 });
    try {
      const win = await app.firstWindow({ timeout: 30_000 });
      await waitForApp(win);
      await runChecks(win);
      emitted = await observedSignals(win);
    } catch (err) {
      defects.push({
        category: "editor_columns_signals_failed",
        observed: err instanceof Error ? err.message : String(err),
        expected: "column fold/unfold signals fire correctly",
        reproduces: true,
        severity: "high",
      });
    } finally {
      await app.close().catch(() => undefined);
      launch.cleanup();
    }
    return { emitted, defects };
  },
};

// Standalone mode.
if (process.argv[1]?.endsWith("editor_columns_signals.ts")) {
  (async () => {
    const launch = launchArgs();
    const app = await electron.launch({ ...launch.options, timeout: 60_000 });
    let code = 1;
    try {
      const win = await app.firstWindow({ timeout: 30_000 });
      await waitForApp(win);
      await runChecks(win);
      code = 0;
    } catch (err: any) {
      console.error("FAIL:", err.message);
    } finally {
      await app.close().catch(() => {});
      launch.cleanup({ keep: code !== 0 });
      process.exit(code);
    }
  })();
}
