// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's layout commands from the View menu (sprint 416; roadmap 2026-11-09-code-editor r6, R7–R9
// and R1's View ▸ Editor; spec r6 §5.1 (2)–(4), frame 16c).
//
// The real menu path: each item is clicked in the main process (Menu.getApplicationMenu()). View ▸
// Editor opens the editor; Dock Terminal Right and back; Swap Sides and back; Focus and back; focus
// over a column already folded, which focus leaves folded; a click on a rail during focus, which ends
// focus; View ▸ Editor closes it. At each step these agree:
//   DOM    — where the terminal, the files column and the inspector are, and which are folded;
//   pixels — the anchor's dock, swap, focus and folded flags (lib/editor_pixels.ts), and the vertical
//            divider lines found on the screenshot's middle row where that layout puts them;
// and after close the signals: EDITOR_DOCK_SET, EDITOR_SIDES_SWAPPED, EDITOR_FOCUS_SET and
// EDITOR_COLUMN_FOLDED in order with their values and causes, VIEW_CHANGED cause menu, and the
// EDITOR_DRAWN each anchor names holding the same flags. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";
import { decodePng } from "../pixel/png";
import type { Anchor } from "../../web/app/derive/anchor";

const REPO_ROOT = join(__dirname, "..", "..");

interface Want { dock: "bottom" | "right"; swapped: boolean; focus: boolean; left: boolean; right: boolean; bottom: boolean }
interface Step { what: string; want: Want; anchor: Anchor }

async function menu(app: ElectronApplication, id: string): Promise<void> {
  const found = await app.evaluate(({ Menu }, itemId) => { const it = Menu.getApplicationMenu()?.getMenuItemById(itemId); if (!it) return false; it.click(); return true; }, id);
  if (!found) throw new Error(`no menu item ${id}`);
}

/** x of each vertical divider line (#2d2f33) on the screenshot's row at `y` (CSS px). */
function verticalLines(file: string, dpr: number, y: number): number[] {
  const img = decodePng(readFileSync(file));
  const row = Math.round(y * dpr);
  const is = (x: number) => { const i = (row * img.width + x) * 4; return Math.abs(img.data[i] - 0x2d) <= 2 && Math.abs(img.data[i + 1] - 0x2f) <= 2 && Math.abs(img.data[i + 2] - 0x33) <= 2; };
  const xs: number[] = [];
  for (let x = 1; x < img.width; x++) if (is(x) && !is(x - 1)) xs.push(Math.round(x / dpr));
  return xs;
}

async function check(win: Page, shots: string, n: number, what: string, want: Want): Promise<Step> {
  const file = join(shots, `layout-${n}.png`);
  const ok = (a: Anchor) => a.dock_right === (want.dock === "right") && a.sides_swapped === want.swapped && a.focus === want.focus && a.left_folded === want.left && a.right_folded === want.right && a.bottom_folded === want.bottom;
  const deadline = Date.now() + 10_000;
  let px = await readPixels(win, file, 0);
  while (Date.now() < deadline && ("error" in px.anchor || !ok(px.anchor))) { await settled(win); px = await readPixels(win, file, 0); }
  if ("error" in px.anchor) throw new Error(`${what}: the pixel anchor does not decode: ${px.anchor.error}`);
  if (!ok(px.anchor)) throw new Error(`${what}: the pixels say ${JSON.stringify(px.anchor)}; want ${JSON.stringify(want)}`);
  // A string, not a function: tsx wraps named functions in a __name helper the page lacks.
  const dom = await win.evaluate(`(() => {
    var r = function (q) { var e = document.querySelector(q); return e ? e.getBoundingClientRect() : null; };
    var v = r("[data-editor-view]"), c = r('[data-editor-area="centre"]'), t = r('[data-editor-area="bottom"]');
    var f = r('[data-editor-area="left"]') || r('[data-editor-rail="left"]'), i = r('[data-editor-area="right"]') || r('[data-editor-rail="right"]');
    var e = function (b) { return b ? { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height } : null; };
    return { dpr: window.devicePixelRatio, v: e(v), c: e(c), t: e(t), f: e(f), i: e(i), sill: !!document.querySelector("[data-editor-sill]"),
      railL: !!document.querySelector('[data-editor-rail="left"]'), railR: !!document.querySelector('[data-editor-rail="right"]') };
  })()`) as { dpr: number; v: Box; c: Box; t: Box | null; f: Box; i: Box; sill: boolean; railL: boolean; railR: boolean };
  type Box = { left: number; right: number; top: number; bottom: number; width: number; height: number };
  if (dom.railL !== want.left || dom.railR !== want.right || dom.sill !== want.bottom) throw new Error(`${what}: rails ${dom.railL}/${dom.railR}, sill ${dom.sill}; want ${want.left}/${want.right}/${want.bottom}`);
  if ((dom.f.left > dom.i.left) !== want.swapped) throw new Error(`${what}: files at x ${dom.f.left}, inspector at x ${dom.i.left}; swapped should be ${want.swapped}`);
  if (want.dock === "right" && !want.bottom && !(dom.t && dom.t.left >= dom.c.right - 1 && Math.abs(dom.t.height - dom.v.height) <= 1)) throw new Error(`${what}: the terminal is not a full-height column right of the centre: ${JSON.stringify(dom.t)}`);
  if (want.dock === "bottom" && !want.bottom && !(dom.t && dom.t.top >= dom.c.bottom - 1)) throw new Error(`${what}: the terminal is not below the centre: ${JSON.stringify(dom.t)}`);
  // The vertical lines: each column's edge that faces the centre, from the layout, found in the pixels.
  const wantXs = [dom.f, dom.i, ...(want.dock === "right" && !want.bottom && dom.t ? [dom.t] : [])]
    .map((b) => (b === (want.swapped ? dom.i : dom.f) ? b.right - 1 : b.left)).map(Math.round).sort((a, b) => a - b);
  const xs = verticalLines(file, dom.dpr, dom.v.top + dom.v.height * 0.4);
  if (xs.length !== wantXs.length || xs.some((x, k) => Math.abs(x - wantXs[k]) > 1)) throw new Error(`${what}: the screenshot's vertical lines at ${JSON.stringify(xs)}; the layout puts them at ${JSON.stringify(wantXs)}`);
  return { what, want, anchor: px.anchor };
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-416-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const folder = mkdtempSync(join(tmpdir(), "editor-layout-"));
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
    await menu(app, "menu-toggle-editor");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    const W = (p: Partial<Want>): Want => ({ dock: "bottom", swapped: false, focus: false, left: false, right: false, bottom: false, ...p });
    const steps: Step[] = [];
    let n = 0;
    steps.push(await check(win, shots, n++, "View ▸ Editor", W({})));
    await menu(app, "menu-editor-dock"); steps.push(await check(win, shots, n++, "Dock Terminal Right", W({ dock: "right" })));
    await menu(app, "menu-editor-dock"); steps.push(await check(win, shots, n++, "Dock Terminal Right again", W({})));
    await menu(app, "menu-editor-swap"); steps.push(await check(win, shots, n++, "Swap Sides", W({ swapped: true })));
    await menu(app, "menu-editor-swap"); steps.push(await check(win, shots, n++, "Swap Sides again", W({})));
    await menu(app, "menu-editor-focus"); steps.push(await check(win, shots, n++, "Focus", W({ focus: true, left: true, right: true, bottom: true })));
    await menu(app, "menu-editor-focus"); steps.push(await check(win, shots, n++, "Focus again", W({})));
    await win.keyboard.press("Alt+Meta+KeyL"); steps.push(await check(win, shots, n++, "⌥⌘L before focus", W({ left: true })));
    await menu(app, "menu-editor-focus"); steps.push(await check(win, shots, n++, "Focus over a folded column", W({ focus: true, left: true, right: true, bottom: true })));
    await menu(app, "menu-editor-focus"); steps.push(await check(win, shots, n++, "Focus off leaves it folded", W({ left: true })));
    await menu(app, "menu-editor-focus"); steps.push(await check(win, shots, n++, "Focus on again", W({ focus: true, left: true, right: true, bottom: true })));
    await win.locator('[data-editor-rail="left"]').click(); steps.push(await check(win, shots, n++, "a click on the files rail ends focus", W({ right: true, bottom: true })));
    await menu(app, "menu-toggle-editor");
    await win.locator("[data-editor-view]").first().waitFor({ state: "detached", timeout: 10_000 });

    await app.close();
    const recs = windowRecords(launch);
    const got = recs.filter((r) => ["EDITOR_DOCK_SET", "EDITOR_SIDES_SWAPPED", "EDITOR_FOCUS_SET", "EDITOR_COLUMN_FOLDED"].includes(r.name)).map((r) =>
      r.name === "EDITOR_DOCK_SET" ? `dock ${String(r.payload.dock)}` : r.name === "EDITOR_SIDES_SWAPPED" ? `swapped ${String(r.payload.swapped)}` : r.name === "EDITOR_FOCUS_SET" ? `focus ${String(r.payload.on)}`
        : `${String(r.payload.column)} ${r.payload.folded ? "fold" : "open"} ${String(r.payload.cause)}`);
    const want = [
      "dock right", "dock bottom", "swapped true", "swapped false",
      "focus true", "left fold focus", "right fold focus", "bottom fold focus",
      "focus false", "left open focus", "right open focus", "bottom open focus",
      "left fold key",
      "focus true", "right fold focus", "bottom fold focus",
      "focus false", "right open focus", "bottom open focus",
      "focus true", "right fold focus", "bottom fold focus",
      "focus false", "left open rail",
    ];
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`layout records:\n  got  ${got.join(", ")}\n  want ${want.join(", ")}`);
    const views = recs.filter((r) => r.name === "VIEW_CHANGED").map((r) => `${String(r.payload.cause)} ${String(r.payload.from)}→${String(r.payload.to)}`);
    if (JSON.stringify(views) !== JSON.stringify(["menu panes→editor", "menu editor→panes"])) throw new Error(`VIEW_CHANGED: ${views.join("; ")}`);
    for (const st of steps) {
      const rec = recs.find((r) => r.proc_seq === st.anchor.seq);
      const p = rec?.payload ?? {};
      if (!rec || rec.name !== "EDITOR_DRAWN" || p.dock !== st.want.dock || p.sides_swapped !== st.want.swapped || p.focus !== st.want.focus || p.left_folded !== st.want.left || p.right_folded !== st.want.right || p.bottom_folded !== st.want.bottom) {
        throw new Error(`${st.what}: the pixels name seq ${st.anchor.seq}; window-1.jsonl holds ${rec ? `${rec.name} ${JSON.stringify(p)}` : "nothing"}`);
      }
    }
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_layout: ok — ${steps.length} steps through the View menu, each read in the DOM, the pixels and EDITOR_DRAWN; ${got.length} layout records in order; VIEW_CHANGED ${views.join(", ")}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_layout: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
