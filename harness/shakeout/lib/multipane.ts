// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Shared drivers for the editor's multi-pane scenarios (sprint 500;
// process/planning/2026-11-14-editor-features/SCENARIOS-2026-11-14-multi-pane.md).
//
// Fixtures are large and real: every file of harness/fixtures/code (12 languages) spread over folders
// three to five deep, and two long files, each every fixture joined three times over (thousands of
// lines). Each step is read three ways: the DOM (tab row, shown code), the pixel anchor (tab count,
// folds), and after quit the EDITOR_DRAWN record whose proc_seq the anchor carries.
import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "playwright";
import { settled, type WindowRecord } from "./electron";
import { readPixels } from "./editor_pixels";
import { scratchDir } from "./scratch";

const FIX = join(__dirname, "..", "..", "fixtures", "code");
export const FIXTURES = readdirSync(FIX).filter((f) => !f.startsWith("README") && !f.startsWith(".") && statSync(join(FIX, f)).isFile());

/** A workspace: the fixtures under `<tag>/a/b/c`, `<tag>/d/e`, `<tag>/f/g/h/i`, and two long files. */
export function bigWorkspace(tag: string): { root: string; files: string[] } {
  const root = scratchDir(`multipane-${tag}-`);
  const dirs = [`${tag}/a/b/c`, `${tag}/d/e`, `${tag}/f/g/h/i`];
  const files: string[] = [];
  FIXTURES.forEach((f, i) => {
    const rel = `${dirs[i % dirs.length]}/${f}`;
    mkdirSync(join(root, rel, ".."), { recursive: true });
    cpSync(join(FIX, f), join(root, rel));
    files.push(rel);
  });
  const all = FIXTURES.map((f) => readFileSync(join(FIX, f), "utf8")).join("\n");
  for (const name of [`${tag}/long_one.txt`, `${tag}/d/long_two.txt`]) {
    writeFileSync(join(root, name), [all, all, all].join("\n"));
    files.push(name);
  }
  return { root, files: files.sort() };
}

export const lineCount = (root: string, rel: string) => readFileSync(join(root, rel), "utf8").split("\n").length;

const vm = (n: number) => `window.__vm.get(${n})`;

export async function firstTurn(win: Page, pane: number): Promise<void> {
  await win.locator("textarea[data-input-bar]").filter({ visible: true }).last().fill("hello");
  await win.keyboard.press("Enter");
  await win.waitForFunction(`!!${vm(pane)}?.snapshot().parkReason`, undefined, { timeout: 30_000 });
}

export async function openEditor(win: Page): Promise<void> {
  await win.keyboard.press("Meta+Shift+E");
  await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
  await settled(win);
}

export async function leaveEditor(win: Page): Promise<void> {
  await win.keyboard.press("Meta+Shift+E");
  await win.locator("[data-editor-view]").first().waitFor({ state: "hidden", timeout: 10_000 });
  await settled(win);
}

export async function focusPane(win: Page, pane: number): Promise<void> {
  await win.locator(`[data-pane="${pane}"]`).first().click({ position: { x: 40, y: 80 } });
  await win.waitForFunction(`window.__vm.activePaneId === ${pane} || document.querySelector('[data-pane="${pane}"][data-focused="1"]') !== null`, undefined, { timeout: 5_000 }).catch(() => undefined);
  await settled(win);
}

/** Opens each folder on the path in the tree, then the file; waits for its tab to be active and its
 *  code to hold its first long line. */
export async function openFile(win: Page, root: string, rel: string): Promise<void> {
  const parts = rel.split("/");
  for (let i = 1; i < parts.length; i++) {
    const dir = parts.slice(0, i).join("/");
    const row = win.locator(`[data-tree-row="${dir}"]`).first();
    await row.waitFor({ state: "visible", timeout: 10_000 });
    if (!(await win.locator(`[data-tree-row^="${dir}/"]`).first().isVisible().catch(() => false))) await row.click();
  }
  await win.locator(`[data-tree-row="${rel}"]`).first().click();
  const want = readFileSync(join(root, rel), "utf8").split("\n").find((l) => l.trim().length > 12)!.trim().slice(0, 40);
  await win.waitForFunction(([w, r]) => {
    const tab = document.querySelector(`[data-editor-tab="${r}"][data-active="1"]`);
    const text = document.querySelector("[data-editor-code]")?.shadowRoot?.querySelector(".cm-content")?.textContent ?? "";
    return !!tab && text.includes(w);
  }, [want, rel], { timeout: 15_000 });
}

/** What one step shows, read from the DOM and the pixels. */
export interface Step { label: string; pane: number; tabs: string[]; active: string | null; anchorSeq: number | null; anchorTabs: number | null; folds: string; shot: string }

export async function read(win: Page, label: string, pane: number, shots: string): Promise<Step> {
  if (!(await win.locator("[data-editor-view]").first().isVisible().catch(() => false))) {
    const why = await win.evaluate(() => ({ view: (window as unknown as { __vm?: { activePaneId?: number } }).__vm?.activePaneId, tabs: Array.from(document.querySelectorAll("[data-editor-tab]")).map((e) => e.getAttribute("data-editor-tab")) }));
    throw new Error(`${label}: the editor is not on screen after it was opened (focused pane ${String(why.view)}; tabs in the DOM ${JSON.stringify(why.tabs)})`);
  }
  const dom = await win.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll("[data-editor-tab]")).filter((e) => (e as HTMLElement).offsetParent !== null);
    return { tabs: tabs.map((e) => e.getAttribute("data-editor-tab")!), active: tabs.find((e) => e.getAttribute("data-active") === "1")?.getAttribute("data-editor-tab") ?? null };
  });
  mkdirSync(shots, { recursive: true });
  const shot = join(shots, `${label.replace(/[^a-z0-9]+/gi, "-")}.png`);
  let px = await readPixels(win, shot, 0);
  for (let k = 0; k < 20 && ("error" in px.anchor2 || px.anchor2.tab_count !== dom.tabs.length); k++) { await settled(win); px = await readPixels(win, shot, 0); }
  const a1 = "error" in px.anchor ? null : px.anchor;
  const a2 = "error" in px.anchor2 ? null : px.anchor2;
  return { label, pane, ...dom, anchorSeq: a2?.seq ?? null, anchorTabs: a2?.tab_count ?? null, folds: a1 ? `${a1.left_folded ? "L" : "-"}${a1.right_folded ? "R" : "-"}${a1.bottom_folded ? "B" : "-"}` : "?", shot };
}

/** Prints the steps as a table, and checks each against the trace: the record the anchor names is
 *  EDITOR_DRAWN, for the pane the step was in, with the tab count the DOM drew. */
export function report(gate: string, steps: Step[], recs: WindowRecord[]): string[] {
  const errs: string[] = [];
  console.log(`${gate}: step | pane | DOM tabs (active) | pixels tabs, folds | trace`);
  for (const s of steps) {
    const rec = s.anchorSeq === null ? undefined : recs.find((r) => r.proc_seq === s.anchorSeq);
    const trace = rec ? `${rec.name} pane ${rec.pane_id} tabs ${String(rec.payload.tab_count)}` : "no record";
    console.log(`  ${s.label} | ${s.pane} | ${s.tabs.length} [${s.tabs.map((t) => t.split("/").pop()).join(", ")}] (${s.active?.split("/").pop() ?? "none"}) | ${s.anchorTabs ?? "?"}, ${s.folds} | ${trace}`);
    if (s.anchorTabs !== s.tabs.length) errs.push(`${s.label}: the pixels say ${String(s.anchorTabs)} tabs, the DOM ${s.tabs.length}`);
    if (!rec || rec.name !== "EDITOR_DRAWN") errs.push(`${s.label}: the anchor's seq ${String(s.anchorSeq)} names ${rec ? rec.name : "no record"}`);
    else {
      if (rec.pane_id !== s.pane) errs.push(`${s.label}: EDITOR_DRAWN names pane ${String(rec.pane_id)}, the step was in pane ${s.pane}`);
      if (Number(rec.payload.tab_count) !== s.tabs.length) errs.push(`${s.label}: EDITOR_DRAWN tab_count ${String(rec.payload.tab_count)}, the DOM ${s.tabs.length}`);
    }
  }
  return errs;
}
