// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's columns and its substrate terminal resize by dragging their edges, and keep their sizes
// (sprint 414; roadmap 2026-11-09-code-editor r6, R10; spec r6 §5.1 (5)).
//
// Real mouse drags on the running window: the left column's edge +80 px, the right column's edge
// -60 px (wider), the terminal's top edge -150 px (taller). After each drag four readings agree:
//   truth  — the size before the drag plus the distance the mouse moved;
//   DOM    — the area's box;
//   pixels — the divider line (#2d2f33) found in a screenshot of the window, decoded with
//            harness/pixel/png.ts: a scan across the middle row for the side dividers, down the
//            centre for the terminal's top edge;
//   signal — after close, one EDITOR_COLUMN_RESIZED per drag in window-1.jsonl with that size.
// Then Escape and ⌘⇧E: the sizes are kept. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { decodePng } from "../pixel/png";

const REPO_ROOT = join(__dirname, "..", "..");
type Col = "left" | "right" | "bottom";

async function boxes(win: Page): Promise<Record<Col, number>> {
  // No named function inside evaluate: tsx wraps it in a __name helper the page lacks.
  return win.evaluate(() => ({
    left: Math.round(document.querySelector('[data-editor-area="left"]')!.getBoundingClientRect().width),
    right: Math.round(document.querySelector('[data-editor-area="right"]')!.getBoundingClientRect().width),
    bottom: Math.round(document.querySelector('[data-editor-area="bottom"]')!.getBoundingClientRect().height),
  }));
}

/** The divider lines in a screenshot: x of each side divider on the view's middle row, y of the
 *  terminal's top edge down the centre, in CSS px. */
async function dividers(win: Page, file: string): Promise<{ xs: number[]; y: number | null }> {
  const g = await win.evaluate(() => {
    const v = document.querySelector("[data-editor-view]")!.getBoundingClientRect();
    const c = document.querySelector('[data-editor-area="centre"]')!.getBoundingClientRect();
    return { dpr: window.devicePixelRatio, top: v.top, midY: v.top + v.height * 0.4, cx: c.left + c.width / 2, vBottom: v.bottom };
  });
  await win.screenshot({ path: file });
  const img = decodePng(readFileSync(file));
  const isLine = (x: number, y: number) => {
    const i = (y * img.width + x) * 4;
    return Math.abs(img.data[i] - 0x2d) <= 2 && Math.abs(img.data[i + 1] - 0x2f) <= 2 && Math.abs(img.data[i + 2] - 0x33) <= 2;
  };
  const xs: number[] = [];
  const row = Math.round(g.midY * g.dpr);
  for (let x = 0; x < img.width; x++) if (isLine(x, row) && !isLine(x - 1, row)) xs.push(Math.round(x / g.dpr));
  let y: number | null = null;
  const col = Math.round(g.cx * g.dpr);
  for (let yy = Math.round(g.vBottom * g.dpr) - 1; yy > Math.round(g.top * g.dpr); yy--) if (isLine(col, yy)) { y = Math.round(yy / g.dpr); break; }
  return { xs, y };
}

async function drag(win: Page, col: Col, dx: number, dy: number): Promise<void> {
  const h = await win.locator(`[data-editor-resize="${col}"]`).boundingBox();
  if (!h) throw new Error(`no grab zone for ${col}`);
  const x = h.x + h.width / 2, y = h.y + h.height / 2;
  await win.mouse.move(x, y);
  await win.mouse.down();
  for (let i = 1; i <= 10; i++) await win.mouse.move(x + (dx * i) / 10, y + (dy * i) / 10);
  await win.mouse.up();
  await settled(win);
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-414-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const folder = mkdtempSync(join(tmpdir(), "editor-resize-"));
  writeFileSync(join(folder, "a.txt"), "a\n");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    await settled(win);

    const before = await boxes(win);
    const drags: [Col, number, number, number][] = [["left", 80, 0, 80], ["right", -60, 0, 60], ["bottom", 0, -150, 150]];
    const want: Record<Col, number> = { ...before };
    const lines: string[] = [];
    for (const [col, dx, dy, grow] of drags) {
      await drag(win, col, dx, dy);
      want[col] += grow;
      const got = await boxes(win);
      if (got[col] !== want[col]) throw new Error(`${col}: the mouse moved ${grow} px from ${before[col]}, so ${want[col]}; the box is ${got[col]}`);
      const px = await dividers(win, join(shots, `after-${col}.png`));
      const view = await win.evaluate(() => document.querySelector("[data-editor-view]")!.getBoundingClientRect().toJSON() as { left: number; right: number; bottom: number });
      const wantXs = [view.left + want.left - 1, view.right - want.right];
      const wantY = Math.round(view.bottom - want.bottom);
      const near = (a: number, b: number) => Math.abs(a - b) <= 1;
      if (!(px.xs.length === 2 && near(px.xs[0], wantXs[0]) && near(px.xs[1], wantXs[1]))) throw new Error(`${col}: the screenshot's side dividers at x ${JSON.stringify(px.xs)}; the sizes put them at ${JSON.stringify(wantXs)}`);
      if (px.y === null || !near(px.y, wantY)) throw new Error(`${col}: the screenshot's terminal edge at y ${px.y}; the size puts it at ${wantY}`);
      lines.push(`${col} ${want[col]} px (pixels: dividers x ${px.xs.join(",")}, edge y ${px.y})`);
    }
    // Kept: close and reopen the editor.
    await win.keyboard.press("Escape");
    await win.locator("[data-editor-view]").first().waitFor({ state: "detached", timeout: 10_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    await settled(win);
    const again = await boxes(win);
    if (JSON.stringify(again) !== JSON.stringify(want)) throw new Error(`after Escape and ⌘⇧E the sizes are ${JSON.stringify(again)}, not ${JSON.stringify(want)}`);

    await app.close();
    const recs = windowRecords(launch).filter((r) => r.name === "EDITOR_COLUMN_RESIZED").map((r) => `${String(r.payload.column)}=${String(r.payload.size)}`);
    // The record carries the stored size, which leaves out the area's 1 px divider line (24a: 210 px + the line).
    const wantRecs = drags.map(([col]) => `${col}=${want[col] - 1}`);
    if (JSON.stringify(recs) !== JSON.stringify(wantRecs)) throw new Error(`EDITOR_COLUMN_RESIZED: ${JSON.stringify(recs)}; want one per drag: ${JSON.stringify(wantRecs)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_resize: ok — ${lines.join("; ")}; kept after Escape and ⌘⇧E; EDITOR_COLUMN_RESIZED ${recs.join(" ")}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_resize: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
