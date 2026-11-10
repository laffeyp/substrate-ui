// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's columns fold to labelled rails and the substrate terminal to a sill that keeps its input
// (sprint 415; roadmap 2026-11-09-code-editor r6, R6; spec r6 §5.1 (1), D49 (d), D51, frame 16c).
//
// Real keys and clicks on the running window: ⌥⌘L, a click on the rail, a click on the column's ◂,
// ⌥⌘L; ⌥⌘R twice; ⌘J, then a character typed into the sill. After each step these agree:
//   DOM    — the rail or the column, the sill or the panel, and their sizes (rails 26 px + the line, as 16c);
//   pixels — the anchor's folded flags (harness/shakeout/lib/editor_pixels.ts) and the divider lines
//            found in the screenshot where the rail or sill puts them;
// after close, the signals: EDITOR_COLUMN_FOLDED in order with column, direction and cause, and the
// EDITOR_DRAWN each anchor names holding the same flags. The typed character is in the panel's input
// bar, which has the focus. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";
import { decodePng } from "../pixel/png";
import type { Anchor } from "../../web/app/derive/anchor";

const REPO_ROOT = join(__dirname, "..", "..");

/** Divider lines (#2d2f33) in a screenshot: x on the view's middle row, and the lowest y down the centre. */
function lines(file: string, dpr: number, midY: number, cx: number, top: number, bottom: number): { xs: number[]; y: number | null } {
  const img = decodePng(readFileSync(file));
  const is = (x: number, y: number) => { const i = (y * img.width + x) * 4; return Math.abs(img.data[i] - 0x2d) <= 2 && Math.abs(img.data[i + 1] - 0x2f) <= 2 && Math.abs(img.data[i + 2] - 0x33) <= 2; };
  const xs: number[] = [];
  const row = Math.round(midY * dpr);
  for (let x = 1; x < img.width; x++) if (is(x, row) && !is(x - 1, row)) xs.push(Math.round(x / dpr));
  let y: number | null = null;
  for (let yy = Math.round(bottom * dpr) - 1; yy > Math.round(top * dpr); yy--) if (is(Math.round(cx * dpr), yy)) { y = Math.round(yy / dpr); break; }
  return { xs, y };
}

interface Step { what: string; folded: { left: boolean; right: boolean; bottom: boolean }; anchor: Anchor }

async function check(win: Page, shots: string, n: number, what: string, want: { left: boolean; right: boolean; bottom: boolean }): Promise<Step> {
  const deadline = Date.now() + 10_000;
  const file = join(shots, `fold-${n}.png`);
  let px = await readPixels(win, file, 0);
  while (Date.now() < deadline && ("error" in px.anchor || px.anchor.left_folded !== want.left || px.anchor.right_folded !== want.right || px.anchor.bottom_folded !== want.bottom)) { await settled(win); px = await readPixels(win, file, 0); }
  if ("error" in px.anchor) throw new Error(`${what}: the pixel anchor does not decode: ${px.anchor.error}`);
  const a = px.anchor;
  if (a.left_folded !== want.left || a.right_folded !== want.right || a.bottom_folded !== want.bottom) throw new Error(`${what}: the pixels say folded left ${a.left_folded} right ${a.right_folded} bottom ${a.bottom_folded}; want ${JSON.stringify(want)}`);
  // A string, not a function: tsx wraps named functions in a __name helper the page lacks.
  const dom = await win.evaluate(`(() => {
    var box = function (q) { var e = document.querySelector(q); return e ? e.getBoundingClientRect() : null; };
    var v = box("[data-editor-view]"), c = box('[data-editor-area="centre"]');
    var w = function (q) { var b = box(q); return b ? b.width : null; };
    var h = function (q) { var b = box(q); return b ? b.height : null; };
    return { dpr: window.devicePixelRatio, v: { left: v.left, right: v.right, top: v.top, bottom: v.bottom, h: v.height }, cx: c.left + c.width / 2,
      railL: w('[data-editor-rail="left"]'), railR: w('[data-editor-rail="right"]'), left: w('[data-editor-area="left"]'), right: w('[data-editor-area="right"]'),
      sill: h("[data-editor-sill]"), panel: h('[data-editor-area="bottom"]'), sillBar: !!document.querySelector("[data-editor-sill] textarea[data-input-bar]") };
  })()`) as { dpr: number; v: { left: number; right: number; top: number; bottom: number; h: number }; cx: number; railL: number | null; railR: number | null; left: number | null; right: number | null; sill: number | null; panel: number | null; sillBar: boolean };
  const near = (p: number | null, q: number) => p !== null && Math.abs(p - q) <= 1;
  if (want.left ? !near(dom.railL, 27) || dom.left !== null : dom.railL !== null || dom.left === null) throw new Error(`${what}: files column ${JSON.stringify({ rail: dom.railL, column: dom.left })}`);
  if (want.right ? !near(dom.railR, 27) || dom.right !== null : dom.railR !== null || dom.right === null) throw new Error(`${what}: inspector ${JSON.stringify({ rail: dom.railR, column: dom.right })}`);
  if (want.bottom ? dom.sill === null || dom.sill > 40 || !dom.sillBar || dom.panel !== null : dom.sill !== null || dom.panel === null) throw new Error(`${what}: terminal ${JSON.stringify({ sill: dom.sill, panel: dom.panel, input: dom.sillBar })}`);
  const ln = lines(file, dom.dpr, dom.v.top + dom.v.h * 0.4, dom.cx, dom.v.top, dom.v.bottom);
  const wantL = dom.v.left + (want.left ? 26 : (dom.left ?? 0) - 1), wantR = dom.v.right - (want.right ? 27 : (dom.right ?? 0));
  if (!(ln.xs.length === 2 && near(ln.xs[0], wantL) && near(ln.xs[1], wantR))) throw new Error(`${what}: the screenshot's side lines at x ${JSON.stringify(ln.xs)}; the layout puts them at ${wantL}, ${wantR}`);
  const wantY = dom.v.bottom - (want.bottom ? dom.sill! : dom.panel!);
  if (!near(ln.y, wantY)) throw new Error(`${what}: the screenshot's terminal edge at y ${ln.y}; the layout puts it at ${wantY}`);
  return { what, folded: want, anchor: a };
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-415-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const folder = mkdtempSync(join(tmpdir(), "editor-folds-"));
  writeFileSync(join(folder, "a.txt"), "a\n");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const claimed = await app.evaluate(({ Menu }) => {
      const out: string[] = [];
      const stack: Electron.MenuItem[] = [...(Menu.getApplicationMenu()?.items ?? [])];
      while (stack.length) { const it = stack.pop()!; if (it.accelerator && /^(CmdOrCtrl|Cmd|Command)\+(Alt\+L|Alt\+R|J)$|^Alt\+(CmdOrCtrl|Cmd|Command)\+(L|R)$/i.test(String(it.accelerator))) out.push(it.label); if (it.submenu) stack.push(...it.submenu.items); }
      return out;
    });
    if (claimed.length) throw new Error(`the native menu claims a column key: ${claimed.join(", ")}`);
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
    const F = (left: boolean, right: boolean, bottom: boolean) => ({ left, right, bottom });
    const steps: Step[] = [];
    let n = 0;
    steps.push(await check(win, shots, n++, "open", F(false, false, false)));
    await win.keyboard.press("Alt+Meta+KeyL"); steps.push(await check(win, shots, n++, "⌥⌘L", F(true, false, false)));
    await win.locator('[data-editor-rail="left"]').click(); steps.push(await check(win, shots, n++, "a click on the files rail", F(false, false, false)));
    await win.locator('[data-editor-fold="left"]').click(); steps.push(await check(win, shots, n++, "a click on the files column's ◂", F(true, false, false)));
    await win.keyboard.press("Alt+Meta+KeyL"); steps.push(await check(win, shots, n++, "⌥⌘L again", F(false, false, false)));
    await win.keyboard.press("Alt+Meta+KeyR"); steps.push(await check(win, shots, n++, "⌥⌘R", F(false, true, false)));
    await win.keyboard.press("Alt+Meta+KeyR"); steps.push(await check(win, shots, n++, "⌥⌘R again", F(false, false, false)));
    await win.keyboard.press("Meta+j"); steps.push(await check(win, shots, n++, "⌘J", F(false, false, true)));
    await win.locator("[data-editor-sill] textarea[data-input-bar]").click();
    await win.keyboard.type("x");
    steps.push(await check(win, shots, n++, "x typed into the sill", F(false, false, false)));
    const typed = await win.evaluate(() => { const b = document.querySelector<HTMLTextAreaElement>('[data-editor-area="bottom"] textarea[data-input-bar]'); return { value: b?.value ?? null, focused: !!b && document.activeElement === b }; });
    if (typed.value !== "x" || !typed.focused) throw new Error(`after typing into the sill, the panel's input bar holds ${JSON.stringify(typed.value)}, focused ${typed.focused}`);

    await app.close();
    const recs = windowRecords(launch);
    const folds = recs.filter((r) => r.name === "EDITOR_COLUMN_FOLDED").map((r) => `${String(r.payload.column)} ${r.payload.folded ? "fold" : "open"} ${String(r.payload.cause)}`);
    const wantFolds = ["left fold key", "left open rail", "left fold rail", "left open key", "right fold key", "right open key", "bottom fold key", "bottom open key"];
    if (JSON.stringify(folds) !== JSON.stringify(wantFolds)) throw new Error(`EDITOR_COLUMN_FOLDED: ${JSON.stringify(folds)}; want ${JSON.stringify(wantFolds)}`);
    for (const st of steps) {
      const rec = recs.find((r) => r.proc_seq === st.anchor.seq);
      if (!rec || rec.name !== "EDITOR_DRAWN" || rec.payload.left_folded !== st.folded.left || rec.payload.right_folded !== st.folded.right || rec.payload.bottom_folded !== st.folded.bottom) throw new Error(`${st.what}: the pixels name seq ${st.anchor.seq}; window-1.jsonl holds ${rec ? `${rec.name} ${JSON.stringify(rec.payload)}` : "nothing"}`);
    }
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_folds: ok — ${steps.map((st) => `${st.what}: seq ${st.anchor.seq}`).join("; ")}; EDITOR_COLUMN_FOLDED ${folds.join(", ")}; "x" kept in the focused input bar; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_folds: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
