// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Scenarios S4 and S5 (sprint 500; SCENARIOS-2026-11-14-multi-pane.md). S4: each pane's unsaved edits are
// its own: the tab dots, and the pane's unsaved count in EDITOR_DRAWN. S5: a message sent from pane 1
// saves only pane 1's session's buffers; pane 2's edit stays unsaved and its file on disk unchanged.
// Large fixtures (lib/multipane.ts); the disk is read for the truth.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { bigWorkspace, firstTurn, focusPane, leaveEditor, openEditor, openFile, read as readStep, report, type Step } from "./lib/multipane";

let at = "start";
const read = (win: Page, label: string, pane: number, shots: string) => { at = label; return readStep(win, label, pane, shots); };
const dots = (win: Page) => win.evaluate(() => Array.from(document.querySelectorAll("[data-editor-tab-unsaved]")).filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => e.getAttribute("data-editor-tab-unsaved")).sort());

async function typeAtTop(win: Page, text: string): Promise<void> {
  await win.locator("[data-editor-code] .cm-line").first().click();
  await win.keyboard.press("Meta+ArrowUp");
  await win.keyboard.type(text);
  await win.keyboard.press("Enter");
  await settled(win);
}

async function main(): Promise<void> {
  const A = bigWorkspace("alpha"), B = bigWorkspace("beta");
  const editA = A.files[2], keptA = A.files[6], editB = B.files[5];
  const markA = "// edited in pane 1, sprint 500", markB = "// edited in pane 2, sprint 500";
  const launch = launchArgs();
  const shots = join(__dirname, "..", "..", "runs", "packaged", `sprint-500-unsaved-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const steps: Step[] = [];
  const errs: string[] = [];
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: A.root });
    await firstTurn(win, 1);
    await openEditor(win);
    await openFile(win, A.root, keptA);
    await openFile(win, A.root, editA);
    await typeAtTop(win, markA);
    steps.push(await read(win, "S4 pane 1 edited", 1, shots));
    const d1 = await dots(win);
    if (JSON.stringify(d1) !== JSON.stringify([editA])) errs.push(`S4 pane 1: unsaved dots on ${JSON.stringify(d1)}; edited ${editA}`);
    await leaveEditor(win);

    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: B.root });
    await firstTurn(win, 2);
    await openEditor(win);
    const d2a = await dots(win);
    if (d2a.length) errs.push(`S4 pane 2, before any edit: unsaved dots on ${JSON.stringify(d2a)}`);
    await openFile(win, B.root, editB);
    await typeAtTop(win, markB);
    steps.push(await read(win, "S4 pane 2 edited", 2, shots));
    const d2 = await dots(win);
    if (JSON.stringify(d2) !== JSON.stringify([editB])) errs.push(`S4 pane 2: unsaved dots on ${JSON.stringify(d2)}; edited ${editB}`);
    seen.push(`unsaved dots: pane 1 ${JSON.stringify(d1)}, pane 2 ${JSON.stringify(d2)}`);
    await leaveEditor(win);

    // S5: send from pane 1.
    await focusPane(win, 1);
    await win.locator(`[data-pane="1"] textarea[data-input-bar]`).first().fill("go on");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { turnState?: string; parkReason: unknown } } } }).__vm.get(1).snapshot().parkReason, undefined, { timeout: 30_000 });
    const onDiskA = readFileSync(join(A.root, editA), "utf8");
    const onDiskB = readFileSync(join(B.root, editB), "utf8");
    if (!onDiskA.startsWith(markA)) errs.push(`S5: pane 1's edit not on disk after its send (${editA} starts ${JSON.stringify(onDiskA.slice(0, 40))})`);
    if (onDiskB.includes(markB)) errs.push(`S5: pane 2's edit written by pane 1's send (${editB})`);
    seen.push(`after pane 1's send: ${editA.split("/").pop()} saved, ${editB.split("/").pop()} on disk unchanged`);
    await focusPane(win, 2);
    await openEditor(win);
    steps.push(await read(win, "S5 pane 2 after pane 1's send", 2, shots));
    const d2b = await dots(win);
    if (JSON.stringify(d2b) !== JSON.stringify([editB])) errs.push(`S5 pane 2 after pane 1's send: unsaved dots on ${JSON.stringify(d2b)}; want ${editB} still unsaved`);
    await leaveEditor(win);
    await focusPane(win, 1);
    await openEditor(win);
    steps.push(await read(win, "S5 pane 1 after its send", 1, shots));
    const d1b = await dots(win);
    if (d1b.length) errs.push(`S5 pane 1 after its send: unsaved dots on ${JSON.stringify(d1b)}`);
    await leaveEditor(win);
    await app.close();

    const recs = windowRecords(launch);
    errs.push(...report("editor_unsaved_per_pane", steps, recs));
    const unsaved = (n: number) => recs.filter((r) => r.name === "EDITOR_DRAWN" && r.pane_id === n).map((r) => Number(r.payload.unsaved));
    seen.push(`EDITOR_DRAWN unsaved: pane 1 ${JSON.stringify(unsaved(1))}, pane 2 ${JSON.stringify(unsaved(2))}`);
    if (Math.max(...unsaved(2)) > 1 || Math.max(...unsaved(1)) > 1) errs.push(`an EDITOR_DRAWN counted another pane's unsaved file: ${seen[seen.length - 1]}`);
    const saved = recs.filter((r) => r.name === "EDITOR_FILE_SAVED");
    seen.push(`EDITOR_FILE_SAVED: ${saved.map((r) => `pane ${String(r.pane_id)}`).join(", ") || "none"}`);
    if (errs.length) throw new Error(errs.slice(0, 6).join("; "));
    console.log(`editor_unsaved_per_pane: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_unsaved_per_pane: FAIL at "${at}" — ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
