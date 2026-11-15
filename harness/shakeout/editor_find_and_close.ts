// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Scenarios S6 and S7 (sprint 500; SCENARIOS-2026-11-14-multi-pane.md). S6: each pane's find in the file
// and workspace search keep their own query and count. S7: closing pane 2, with an unsaved edit, leaves
// pane 1's editor as it was, and a pane opened after it starts with an empty editor. Large fixtures
// (lib/multipane.ts); each step read from the DOM, the pixel anchor and its EDITOR_DRAWN record.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { bigWorkspace, firstTurn, focusPane, leaveEditor, openEditor, openFile, read as readStep, report, type Step } from "./lib/multipane";

let at = "start";
const read = (win: Page, label: string, pane: number, shots: string) => { at = label; return readStep(win, label, pane, shots); };

/** The find bar's query and count, and the workspace search's query and file count, as drawn. */
// A string, so the bundler adds no helper names inside the page.
const queries = (win: Page) => win.evaluate(`(function () {
  var f = document.querySelector('[data-find-input="query"]'), q = document.querySelector('[data-search-input="query"]'), c = document.querySelector("[data-find-count]");
  return { find: f ? f.value : null, findCount: c ? c.textContent : null, search: q ? q.value : null, searchFiles: document.querySelectorAll("[data-search-file]").length };
})()`) as Promise<{ find: string | null; findCount: string | null; search: string | null; searchFiles: number }>;

async function find(win: Page, q: string): Promise<void> {
  await win.locator("[data-editor-code] .cm-line").first().click();
  await win.keyboard.press("Meta+f");
  const box = win.locator('[data-find-input="query"]').first();
  await box.waitFor({ state: "visible", timeout: 10_000 });
  await box.fill(q);
  await settled(win);
}

async function search(win: Page, q: string): Promise<void> {
  await win.keyboard.press("Meta+Shift+f");
  const box = win.locator('[data-search-input="query"]').first();
  await box.waitFor({ state: "visible", timeout: 10_000 });
  await box.fill(q);
  await win.waitForFunction(() => document.querySelectorAll("[data-search-file]").length > 0, undefined, { timeout: 15_000 });
  await settled(win);
}

async function main(): Promise<void> {
  const A = bigWorkspace("alpha"), B = bigWorkspace("beta");
  const fileA = A.files.find((f) => f.endsWith("models.py"))!, fileB = B.files.find((f) => f.endsWith("bytes.ts"))!;
  const launch = launchArgs();
  const shots = join(__dirname, "..", "..", "runs", "packaged", `sprint-500-find-close-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
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
    await openFile(win, A.root, fileA);
    await find(win, "self");
    await search(win, "import");
    const q1 = await queries(win);
    steps.push(await read(win, "S6 pane 1 find and search", 1, shots));
    await leaveEditor(win);

    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: B.root });
    await firstTurn(win, 2);
    await openEditor(win);
    const q2a = await queries(win);
    if (q2a.find || q2a.search) errs.push(`S6 pane 2 opened: find ${JSON.stringify(q2a.find)}, search ${JSON.stringify(q2a.search)}; pane 2 had typed none`);
    await openFile(win, B.root, fileB);
    await find(win, "const");
    await search(win, "function");
    const q2 = await queries(win);
    steps.push(await read(win, "S6 pane 2 find and search", 2, shots));
    // S7: an unsaved edit in pane 2, then pane 2 closed.
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("Meta+ArrowUp");
    await win.keyboard.type("// unsaved in pane 2, sprint 500");
    await win.keyboard.press("Enter");
    await settled(win);
    await leaveEditor(win);

    await focusPane(win, 1);
    await openEditor(win);
    // The search tab runs its kept query again once it mounts (Search.tsx, after SETTLE_MS).
    await win.waitForFunction((n) => document.querySelectorAll("[data-search-file]").length === n, q1.searchFiles, { timeout: 15_000 }).catch(() => undefined);
    const q1b = await queries(win);
    steps.push(await read(win, "S6 pane 1 again", 1, shots));
    if (q1b.find !== q1.find || q1b.search !== q1.search || q1b.searchFiles !== q1.searchFiles) errs.push(`S6 pane 1 again: ${JSON.stringify(q1b)}; it left ${JSON.stringify(q1)}`);
    seen.push(`find/search: pane 1 ${JSON.stringify(q1)}, pane 2 ${JSON.stringify(q2)}`);
    await leaveEditor(win);

    await focusPane(win, 2);
    await app.evaluate(({ Menu }) => { Menu.getApplicationMenu()?.getMenuItemById("menu-close-pane")?.click(); });
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 1, undefined, { timeout: 15_000 });
    await focusPane(win, 1);
    await openEditor(win);
    const after = await read(win, "S7 pane 1 after pane 2 closed", 1, shots);
    steps.push(after);
    if (JSON.stringify(after.tabs) !== JSON.stringify([fileA])) errs.push(`S7 pane 1 after the close: tabs ${JSON.stringify(after.tabs)}`);
    const q1c = await queries(win);
    if (q1c.find !== q1.find) errs.push(`S7 pane 1 after the close: find ${JSON.stringify(q1c.find)}; it left ${JSON.stringify(q1.find)}`);
    await leaveEditor(win);

    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    const newId = await win.evaluate(() => Number(Array.from(document.querySelectorAll("[data-pane]")).map((e) => e.getAttribute("data-pane")).pop()));
    await bindPaneAsUser(win, "deterministic", { folder: B.root });
    await firstTurn(win, newId);
    await openEditor(win);
    const fresh = await read(win, `S7 new pane ${newId}, first open`, newId, shots);
    steps.push(fresh);
    const qf = await queries(win);
    if (fresh.tabs.length || qf.find || qf.search) errs.push(`S7 new pane ${newId}: tabs ${JSON.stringify(fresh.tabs)}, find ${JSON.stringify(qf.find)}, search ${JSON.stringify(qf.search)}; a new pane starts empty`);
    seen.push(`pane 2 closed with an unsaved edit; pane 1 kept ${after.tabs.length} tab and its find; new pane ${newId} opened empty`);
    await leaveEditor(win);
    await app.close();

    errs.push(...report("editor_find_and_close", steps, windowRecords(launch)));
    if (errs.length) throw new Error(errs.slice(0, 6).join("; "));
    console.log(`editor_find_and_close: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_find_and_close: FAIL at "${at}" — ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
