// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// ⌘⇧E opens the editor view shell and ⌘⇧E returns to the pane (sprint 389, Phase 1). After binding
// pane 1, the gate presses ⌘⇧E and checks the editor shell is in the DOM and the signals fired;
// presses ⌘⇧E again and checks the pane returned. On a pane with no session, ⌘⇧E is a no-op.

import { _electron as electron, type Page } from "playwright";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";
import { bindPaneAsUser, launchArgs, observedSignals, waitForApp } from "./lib/electron";

type Sig = { name: string; payload: Record<string, unknown> };

async function runChecks(win: Page): Promise<void> {
  const sendCmd = async (cmd: string) => win.evaluate((c) => {
    const sh = (window as any).__substrateShell;
    if (sh) for (const fn of [...sh.channel.listeners]) fn(c);
  }, cmd);

  // Edge case: toggle-editor on an unbound pane is a no-op.
  await sendCmd("toggle-editor");
  await new Promise((r) => setTimeout(r, 500));
  const editorShellBefore = await win.locator("[data-editor-shell]").count();
  if (editorShellBefore > 0) throw new Error("editor shell visible on unbound pane");
  const unboundEditorOpened = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).some((s: Sig) => s.name === "EDITOR_OPENED")
  );
  if (unboundEditorOpened) throw new Error("EDITOR_OPENED fired on unbound pane");
  console.log("OK — toggle-editor on unbound pane: no-op");

  // Bind a session.
  await bindPaneAsUser(win, "deterministic");

  // Open the editor.
  await sendCmd("toggle-editor");
  await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 });
  const left = await win.locator('[data-editor-column="left"]').count();
  const centre = await win.locator('[data-editor-column="centre"]').count();
  const right = await win.locator('[data-editor-column="right"]').count();
  if (left !== 1 || centre !== 1 || right !== 1) throw new Error(`expected 3 columns, got left=${left} centre=${centre} right=${right}`);
  console.log("OK — editor shell visible with 3 columns");

  // Check signals.
  const afterOpen = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) =>
      s.name === "EDITOR_OPENED" || s.name === "EDITOR_DRAWN" || (s.name === "PANE_DRAWN" && (s.payload as any).state === "editor")
    ) as Sig[]
  );
  const opened = afterOpen.find((s) => s.name === "EDITOR_OPENED");
  if (!opened) throw new Error("EDITOR_OPENED not found");
  if (!opened.payload.binding) throw new Error("EDITOR_OPENED missing binding");
  const drawn = afterOpen.find((s) => s.name === "EDITOR_DRAWN");
  if (!drawn) throw new Error("EDITOR_DRAWN not found");
  if (drawn.payload.tab_count !== 0) throw new Error(`EDITOR_DRAWN.tab_count=${drawn.payload.tab_count}, expected 0`);
  const paneDrawnEditor = afterOpen.find((s) => s.name === "PANE_DRAWN");
  if (!paneDrawnEditor) throw new Error("PANE_DRAWN(state=editor) not found");
  console.log("OK — EDITOR_OPENED, EDITOR_DRAWN, PANE_DRAWN(state=editor) all fired");

  // Close the editor.
  await sendCmd("toggle-editor");
  await win.waitForFunction(() => document.querySelector("[data-editor-shell]") === null, undefined, { timeout: 5_000 });
  const paneView = await win.locator("[data-panes-view]").count();
  console.log(`OK — editor closed, PanesView ${paneView > 0 ? "visible" : "not visible (checking transcript)"}`);

  const afterClose = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) => s.name === "EDITOR_CLOSED") as Sig[]
  );
  if (afterClose.length === 0) throw new Error("EDITOR_CLOSED not found");
  if (afterClose[0].payload.tab_count !== 0) throw new Error(`EDITOR_CLOSED.tab_count=${afterClose[0].payload.tab_count}`);

  const paneDrawnSession = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) =>
      s.name === "PANE_DRAWN" && (s.payload as any).state === "session"
    ) as Sig[]
  );
  if (paneDrawnSession.length === 0) throw new Error("PANE_DRAWN(state=session) not found after close");
  console.log("OK — EDITOR_CLOSED and PANE_DRAWN(state=session) fired");

  // E1: no path or text in any editor signal.
  const allEditor = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) =>
      s.name.startsWith("EDITOR_")
    ) as Sig[]
  );
  for (const s of allEditor) {
    for (const [k, v] of Object.entries(s.payload)) {
      if (typeof v === "string" && (v.includes("/") || v.length > 50)) {
        throw new Error(`E1 violation: ${s.name}.${k} contains a path or long text: ${v.slice(0, 80)}`);
      }
    }
  }
  console.log("OK — E1: no path or text in editor signals");
  console.log("\nPASS — editor toggle gate (sprint 389)");
}

export const flow: Flow = {
  name: "editor_toggle_signals",
  declared: ["EDITOR_OPENED", "EDITOR_DRAWN", "EDITOR_CLOSED", "PANE_DRAWN"],
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
        category: "editor_toggle_signals_failed",
        observed: err instanceof Error ? err.message : String(err),
        expected: "editor open/close signals fire correctly",
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
if (process.argv[1]?.endsWith("editor_toggle_signals.ts")) {
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
