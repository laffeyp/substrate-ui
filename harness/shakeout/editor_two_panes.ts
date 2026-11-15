// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Each pane's editor keeps its own tabs (sprint 499). Before, one editor store per window held every
// pane's tabs, so pane 2's editor drew pane 1's tab names, files of another session's workspace that
// do not open there. The gate binds two panes to two real fixture folders (harness/fixtures/code,
// copied), opens files in each pane's editor, and reads after each switch:
//   tabs  — the DOM's tab row names only that pane's files, in the order opened;
//   text  — the shown file's code holds a line of that file on disk;
//   trace — after quit, each EDITOR_DRAWN record names its pane and that pane's tab count.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { cpSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { scratchDir } from "./lib/scratch";

const FIX = join(__dirname, "..", "fixtures", "code");
const A = ["models.py", "tools.py"];
const B = ["bytes.ts"];

function folder(files: string[]): string {
  const root = scratchDir("two-panes-ws-");
  mkdirSync(root, { recursive: true });
  for (const f of files) cpSync(join(FIX, f), join(root, f));
  return root;
}

const tabs = (win: Page) => win.evaluate(() => Array.from(document.querySelectorAll("[data-editor-tab]")).filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => e.getAttribute("data-editor-tab")));

async function firstTurn(win: Page, pane: number): Promise<void> {
  await win.locator("textarea[data-input-bar]").filter({ visible: true }).last().fill("hello");
  await win.keyboard.press("Enter");
  await win.waitForFunction((n) => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(n)?.snapshot().parkReason, pane, { timeout: 30_000 });
}

async function openEditor(win: Page): Promise<void> {
  await win.keyboard.press("Meta+Shift+E");
  await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
  await settled(win);
}

async function leaveEditor(win: Page): Promise<void> {
  await win.keyboard.press("Meta+Shift+E");
  await win.locator("[data-editor-view]").first().waitFor({ state: "hidden", timeout: 10_000 });
  await settled(win);
}

async function open(win: Page, rel: string, root: string): Promise<void> {
  await win.locator(`[data-tree-row="${rel}"]`).first().click();
  const line = readFileSync(join(root, rel), "utf8").split("\n").find((l) => l.trim().length > 12)!.trim();
  await win.waitForFunction(([want, r]) => {
    const tab = document.querySelector(`[data-editor-tab="${r}"][data-active="1"]`);
    return !!tab && (document.querySelector("[data-editor-code]")?.shadowRoot?.querySelector(".cm-content")?.textContent ?? "").includes(want);
  }, [line.slice(0, 40), rel], { timeout: 15_000 }).catch(async (e) => {
    const shown = await win.evaluate(() => ({ tabs: Array.from(document.querySelectorAll("[data-editor-tab]")).map((t) => `${t.getAttribute("data-editor-tab")}:${t.getAttribute("data-active")}`), text: (document.querySelector("[data-editor-code]")?.shadowRoot?.querySelector(".cm-content")?.textContent ?? "").slice(0, 120) }));
    throw new Error(`opening ${rel}: ${(e as Error).message.split("\n")[0]}; drawn ${JSON.stringify(shown)}; wanted ${JSON.stringify(line.slice(0, 40))}`);
  });
}

function expectTabs(got: (string | null)[], want: string[], when: string): void {
  if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${when}: the tab row reads ${JSON.stringify(got)}; the pane opened ${JSON.stringify(want)}`);
}

async function main(): Promise<void> {
  const rootA = folder(A), rootB = folder(B);
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: rootA });
    await firstTurn(win, 1);
    await openEditor(win);
    for (const f of A) await open(win, f, rootA);
    expectTabs(await tabs(win), A, "pane 1");
    seen.push(`pane 1: ${A.join(", ")}`);
    await leaveEditor(win);

    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: rootB });
    await firstTurn(win, 2);
    await openEditor(win);
    expectTabs(await tabs(win), [], "pane 2, its editor first opened");
    for (const f of B) await open(win, f, rootB);
    expectTabs(await tabs(win), B, "pane 2");
    await win.screenshot({ path: join(launch.state, "pane2-editor.png") });
    seen.push(`pane 2: none on opening, then ${B.join(", ")}`);
    await leaveEditor(win);

    await win.locator('[data-pane="1"]').first().click({ position: { x: 40, y: 80 } });
    await settled(win);
    await openEditor(win);
    expectTabs(await tabs(win), A, "pane 1, back again");
    seen.push(`pane 1 again: ${A.join(", ")}`);
    await app.close();

    const drawn = windowRecords(launch).filter((r) => r.name === "EDITOR_DRAWN");
    const byPane = (n: number) => drawn.filter((r) => r.pane_id === n).map((r) => Number(r.payload.tab_count));
    const p1 = byPane(1), p2 = byPane(2);
    if (!p1.length || !p2.length) throw new Error(`EDITOR_DRAWN for pane 1: ${p1.length} records, pane 2: ${p2.length}`);
    if (Math.max(...p2) !== B.length) throw new Error(`pane 2's EDITOR_DRAWN tab counts ${JSON.stringify(p2)}; it opened ${B.length}`);
    if (p1[p1.length - 1] !== A.length) throw new Error(`pane 1's last EDITOR_DRAWN tab count ${p1[p1.length - 1]}; it opened ${A.length}`);
    seen.push(`EDITOR_DRAWN tab counts: pane 1 ${JSON.stringify(p1)}, pane 2 ${JSON.stringify(p2)}`);
    console.log(`editor_two_panes: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshot ${join(launch.state, "pane2-editor.png")}`);
    code = 0;
  } catch (e) {
    console.error(`editor_two_panes: FAIL — ${(e as Error).message}; ${seen.join("; ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: true });
  }
  process.exit(code);
}

main();
