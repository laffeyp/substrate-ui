// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Scenario S3 (sprint 500): two panes on two sessions, switched back and forth ten times; neither
// editor loses a tab, its shown file or a fold. The Architect saw both editors empty "less and less"
// in Substrate Next before sprint 499. Large fixtures (lib/multipane.ts). Each switch is read from the
// DOM, the pixel anchor and the trace (lib/multipane.ts `report`).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, windowRecords } from "./lib/electron";
import { bigWorkspace, firstTurn, focusPane, leaveEditor, openEditor, openFile, read, report, type Step } from "./lib/multipane";

const SWITCHES = 10;

async function main(): Promise<void> {
  const A = bigWorkspace("alpha"), B = bigWorkspace("beta");
  const openA = [A.files[0], A.files[5], A.files[9], A.files.find((f) => f.endsWith("long_one.txt"))!];
  const openB = [B.files[2], B.files[7], B.files.find((f) => f.endsWith("long_two.txt"))!];
  const launch = launchArgs();
  const shots = join(__dirname, "..", "..", "runs", "packaged", `sprint-500-focus-switches-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const steps: Step[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: A.root });
    await firstTurn(win, 1);
    await openEditor(win);
    for (const f of openA) await openFile(win, A.root, f);
    steps.push(await read(win, "pane 1 opened", 1, shots));
    await leaveEditor(win);

    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: B.root });
    await firstTurn(win, 2);
    await openEditor(win);
    for (const f of openB) await openFile(win, B.root, f);
    await win.keyboard.press("Meta+Alt+KeyL"); // pane 2 folds its left column
    steps.push(await read(win, "pane 2 opened, left folded", 2, shots));
    await leaveEditor(win);

    const want = { 1: { tabs: openA, active: openA[openA.length - 1], folds: "---" }, 2: { tabs: openB, active: openB[openB.length - 1], folds: "L--" } } as const;
    for (let i = 1; i <= SWITCHES; i++) {
      const pane = i % 2 === 1 ? 1 : 2;
      await focusPane(win, pane);
      await openEditor(win);
      steps.push(await read(win, `switch ${i} to pane ${pane}`, pane, shots));
      await leaveEditor(win);
    }
    await app.close();

    const errs = report("editor_focus_switches", steps, windowRecords(launch));
    for (const s of steps.slice(2)) {
      const w = want[s.pane as 1 | 2];
      if (JSON.stringify(s.tabs) !== JSON.stringify(w.tabs)) errs.push(`${s.label}: tabs ${JSON.stringify(s.tabs)}; the pane opened ${JSON.stringify(w.tabs)}`);
      if (s.active !== w.active) errs.push(`${s.label}: shows ${String(s.active)}; the pane last showed ${w.active}`);
      if (s.folds !== w.folds) errs.push(`${s.label}: folds ${s.folds}; the pane left them ${w.folds}`);
    }
    if (errs.length) throw new Error(errs.slice(0, 6).join("; "));
    console.log(`editor_focus_switches: ok — ${SWITCHES} switches, each pane kept its ${openA.length} and ${openB.length} tabs, shown file and folds; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_focus_switches: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
