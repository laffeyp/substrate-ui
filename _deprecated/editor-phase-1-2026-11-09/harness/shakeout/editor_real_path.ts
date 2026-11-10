// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// SDD verification gate: exercises ⌘⇧E through the Electron menu accelerator (the real input path),
// not the shell channel. Binds a session through the picker (bindPaneAsUser), then triggers the menu
// item via Electron's Menu API. Takes screenshots at each state transition (Track 2 perceptual).
// Reads the packaged trace after close (the trace rule). Sprint 389 re-verification under SDD discipline.

import { _electron as electron, type Page, type ElectronApplication } from "playwright";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";
import { bindPaneAsUser, launchArgs, observedSignals, waitForApp, windowRecords } from "./lib/electron";
import { join } from "node:path";
import { existsSync, readdirSync, readFileSync, mkdirSync } from "node:fs";
import { keepScratch, scratchDir } from "./lib/scratch";

type Sig = { name: string; payload: Record<string, unknown> };

/** Trigger the Editor menu item through Electron's Menu API — the real ⌘⇧E path. */
async function clickEditorMenuItem(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ Menu }) => {
    const menu = Menu.getApplicationMenu();
    if (!menu) throw new Error("no application menu");
    const item = menu.getMenuItemById("menu-toggle-editor");
    if (!item) throw new Error("menu-toggle-editor item not found");
    item.click();
  });
}

async function runChecks(app: ElectronApplication, win: Page, launch: ReturnType<typeof launchArgs>): Promise<void> {
  const screenshots: { name: string; path: string }[] = [];
  const shotDir = scratchDir("editor-real-path-shots-");
  keepScratch(shotDir);

  const takeShot = async (name: string) => {
    const p = join(shotDir, `${name}.png`);
    await win.screenshot({ path: p, type: "png" });
    screenshots.push({ name, path: p });
    console.log(`  screenshot: ${name} → ${p}`);
  };

  // 1. Unbound pane: ⌘⇧E through menu does nothing.
  await takeShot("01-unbound-pane");
  await clickEditorMenuItem(app);
  await new Promise((r) => setTimeout(r, 500));
  const editorBefore = await win.locator("[data-editor-shell]").count();
  if (editorBefore > 0) throw new Error("editor shell visible on unbound pane after menu ⌘⇧E");
  const unboundSignal = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).some((s: Sig) => s.name === "EDITOR_OPENED")
  );
  if (unboundSignal) throw new Error("EDITOR_OPENED fired on unbound pane");
  console.log("OK — menu ⌘⇧E on unbound pane: no-op");

  // 2. Bind a session through the picker (the real user flow).
  await bindPaneAsUser(win, "deterministic");
  await takeShot("02-session-bound");
  console.log("OK — session bound through picker");

  // 3. Open the editor through the Electron menu (the real ⌘⇧E).
  await win.evaluate(() => { ((window as any).__vmSignals ?? []).splice(0); });
  await clickEditorMenuItem(app);
  await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 })
    .catch(async (err: Error) => {
      // Diagnosis: capture the state of the toggle path.
      const diag = await win.evaluate(() => {
        const sh = (window as any).__substrateShell;
        const vm = (window as any).__vm;
        const snap = vm?.get(1)?.snapshot();
        return {
          shellListeners: sh?.channel?.listeners?.size ?? "no shell",
          editorOpen: document.querySelector("[data-editor-shell]") !== null,
          focusedPaneId: vm?.focusedPaneId ?? null,
          sessionId: snap?.sessionId ?? null,
          hasControllerSnaps: !!snap,
          paneState: vm ? JSON.stringify(Object.keys(vm)) : "no vm",
        };
      }).catch(() => null);
      throw new Error(`editor shell not visible after menu ⌘⇧E: ${JSON.stringify(diag)}; original: ${err.message.split("\n")[0]}`);
    });
  await takeShot("03-editor-opened");

  // Check the three columns.
  const left = await win.locator('[data-editor-column="left"]').count();
  const centre = await win.locator('[data-editor-column="centre"]').count();
  const right = await win.locator('[data-editor-column="right"]').count();
  if (left !== 1 || centre !== 1 || right !== 1) throw new Error(`expected 3 columns, got left=${left} centre=${centre} right=${right}`);
  console.log("OK — editor shell visible with 3 columns after menu ⌘⇧E");

  // Check signals.
  const afterOpen = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) =>
      s.name === "EDITOR_OPENED" || s.name === "EDITOR_DRAWN" || (s.name === "PANE_DRAWN" && (s.payload as any).state === "editor")
    ) as Sig[]
  );
  const opened = afterOpen.find((s) => s.name === "EDITOR_OPENED");
  if (!opened) throw new Error("EDITOR_OPENED not found after menu ⌘⇧E");
  if (!opened.payload.binding) throw new Error("EDITOR_OPENED missing binding");
  const drawn = afterOpen.find((s) => s.name === "EDITOR_DRAWN");
  if (!drawn) throw new Error("EDITOR_DRAWN not found");
  const paneDrawnEditor = afterOpen.find((s) => s.name === "PANE_DRAWN");
  if (!paneDrawnEditor) throw new Error("PANE_DRAWN(state=editor) not found");
  console.log("OK — EDITOR_OPENED, EDITOR_DRAWN, PANE_DRAWN(state=editor) fired via menu path");

  // 4. Close the editor through the menu.
  await clickEditorMenuItem(app);
  await win.waitForFunction(() => document.querySelector("[data-editor-shell]") === null, undefined, { timeout: 5_000 });
  await takeShot("04-editor-closed");

  const afterClose = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) => s.name === "EDITOR_CLOSED") as Sig[]
  );
  if (afterClose.length === 0) throw new Error("EDITOR_CLOSED not found after menu close");

  const paneDrawnSession = await win.evaluate(() =>
    ((window as any).__vmSignals ?? []).filter((s: Sig) =>
      s.name === "PANE_DRAWN" && (s.payload as any).state === "session"
    ) as Sig[]
  );
  if (paneDrawnSession.length === 0) throw new Error("PANE_DRAWN(state=session) not found after close");
  console.log("OK — EDITOR_CLOSED and PANE_DRAWN(state=session) fired via menu path");

  // 5. E1: no path or text in any editor signal.
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

  // 6. Summary of screenshots captured.
  console.log(`\nTrack 2 screenshots (${screenshots.length}):`);
  for (const s of screenshots) console.log(`  ${s.name}: ${s.path}`);

  console.log("\nPASS — editor real-path gate (menu ⌘⇧E, Track 2 screenshots)");
}

/** After the app closes, read the on-disk trace and check the trace rule. */
function checkTrace(launch: ReturnType<typeof launchArgs>): void {
  const traces = join(launch.state, "electron", "logs", "traces");
  if (!existsSync(traces)) {
    console.log("WARN — no trace directory; trace rule cannot be checked (dev launch, not packaged)");
    return;
  }
  const boots = readdirSync(traces).sort();
  if (boots.length === 0) {
    console.log("WARN — no boot directories in trace; trace rule cannot be checked");
    return;
  }
  const boot = boots[boots.length - 1];
  const windowFile = join(traces, boot, "window-1.jsonl");
  if (!existsSync(windowFile)) {
    console.log("WARN — no window-1.jsonl in trace; trace rule cannot be checked");
    return;
  }

  const lines = readFileSync(windowFile, "utf8").split("\n").filter(Boolean);
  const records = lines.map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
  const editorTags = records.filter((r) => r.name.startsWith("EDITOR_") || (r.name === "PANE_DRAWN" && (r.payload as any).state === "editor"));

  const tagNames = editorTags.map((r) => r.name);
  const required = ["EDITOR_OPENED", "EDITOR_DRAWN", "EDITOR_CLOSED"];
  for (const tag of required) {
    if (!tagNames.includes(tag)) throw new Error(`trace rule: ${tag} missing from window-1.jsonl`);
  }
  if (!records.some((r) => r.name === "PANE_DRAWN" && (r.payload as any).state === "editor")) {
    throw new Error("trace rule: PANE_DRAWN(state=editor) missing from window-1.jsonl");
  }
  if (!records.some((r) => r.name === "PANE_DRAWN" && (r.payload as any).state === "session")) {
    throw new Error("trace rule: PANE_DRAWN(state=session) missing from window-1.jsonl");
  }

  // Check for INVARIANT_BROKEN in main.jsonl.
  const mainFile = join(traces, boot, "main.jsonl");
  if (existsSync(mainFile)) {
    const mainLines = readFileSync(mainFile, "utf8").split("\n").filter(Boolean);
    const broken = mainLines.filter((l) => l.includes('"INVARIANT_BROKEN"'));
    if (broken.length > 0) {
      throw new Error(`trace rule: ${broken.length} INVARIANT_BROKEN in main.jsonl`);
    }
    console.log("OK — no INVARIANT_BROKEN in main.jsonl");
  }

  console.log(`OK — trace rule: ${editorTags.length} editor tags in window-1.jsonl (${required.join(", ")}, PANE_DRAWN editor+session)`);
}

export const flow: Flow = {
  name: "editor_real_path",
  declared: ["EDITOR_OPENED", "EDITOR_DRAWN", "EDITOR_CLOSED", "PANE_DRAWN"],
  async run(_ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    let emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];
    const launch = launchArgs();
    const app = await electron.launch({ ...launch.options, timeout: 60_000 });
    try {
      const win = await app.firstWindow({ timeout: 30_000 });
      await waitForApp(win);
      await runChecks(app, win, launch);
      emitted = await observedSignals(win);
    } catch (err) {
      defects.push({
        category: "editor_real_path_failed",
        observed: err instanceof Error ? err.message : String(err),
        expected: "editor open/close via menu ⌘⇧E with Track 2 screenshots",
        reproduces: true,
        severity: "high",
      });
    } finally {
      await app.close().catch(() => undefined);
      try { checkTrace(launch); } catch (err) {
        defects.push({
          category: "editor_trace_rule_failed",
          observed: err instanceof Error ? err.message : String(err),
          expected: "editor tags in packaged trace, no INVARIANT_BROKEN",
          reproduces: true,
          severity: "high",
        });
      }
      launch.cleanup({ keep: defects.length > 0 });
    }
    return { emitted, defects };
  },
};

// Standalone mode.
if (process.argv[1]?.endsWith("editor_real_path.ts")) {
  (async () => {
    const launch = launchArgs();
    const app = await electron.launch({ ...launch.options, timeout: 60_000 });
    let code = 1;
    try {
      const win = await app.firstWindow({ timeout: 30_000 });
      await waitForApp(win);
      await runChecks(app, win, launch);
      code = 0;
    } catch (err: any) {
      console.error("FAIL:", err.message);
    } finally {
      await app.close().catch(() => {});
      try { checkTrace(launch); } catch (err: any) {
        console.error("FAIL (trace rule):", err.message);
        code = 1;
      }
      launch.cleanup({ keep: code !== 0 });
      process.exit(code);
    }
  })();
}
