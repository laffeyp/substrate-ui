// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// How text sits on its ground, measured on the real apps (the Architect, 2026-11-11: BLACKBOARD.md in Substrate "might
// be too bright"; VS Code's and Ghostty's text "isn't trying to stand out … it kind of fits in"; the substrate
// terminal "undershot"; and "If you are faking something or simulating something, there's no point to it"). Each app
// draws the same file, a copy of this repository's BLACKBOARD.md, and its own renderer's pixels are decoded:
//   - VS Code, launched from its install by Playwright (as VS Code's own smoke tests drive it) with a fresh profile,
//     which is the Architect's appearance (their settings name no theme, font or size); the editor, and its terminal
//     printing the same file;
//   - Substrate, launched as the gates launch it (SHAKEOUT_APP=<Substrate.app> runs the bundle); the editor, and the
//     terminal pane's message and a reply from Claude Code (TONE_MODEL names another), asked to repeat a hand-written
//     paragraph; a test uses a model that can do what it is asked (BLACKBOARD 2026-11-11 user);
//   - any window on screen by its id (TONE_WINDOWS=<id>:<name>,…), through `screencapture -l`, which needs the shell to
//     hold Screen Recording permission; Ghostty draws with Metal, so this is the only way to read its pixels.
// For each block of text: the ground (the commonest colour), the strokes (the 98th percentile of luminance, and their
// colour), APCA Lc between them (apca-w3 0.1.9 constants), the share of the block lit, the block's mean lightness and
// how far it sits above the ground, and the same for the band each line's letters fill (rows folded over the line
// pitch). CIE L* from sRGB. A capture: it prints, it asserts nothing. Screenshots go to the scratch folder, deleted at
// the end unless TONE_KEEP=1.

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { decodePng } from "../pixel/png";

const REPO_ROOT = join(__dirname, "..", "..");
const VSCODE = process.env.VSCODE_BIN ?? "/Applications/Visual Studio Code.app/Contents/MacOS/Code";
const PARAGRAPH = "The editor opens a file when its tab is clicked, and the text sits on its ground the way a page sits on a desk. A block of prose has a tone of its own, set by the size of its letters, the weight of their strokes, and the space between its lines.";
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
type Box = { x: number; y: number; w: number; h: number };

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (r: number, g: number, b: number) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
const lstar = (y: number) => (y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y);
/** APCA Lc of text on a ground, apca-w3 0.1.9 (SA98G constants). */
function apca(t: [number, number, number], g: [number, number, number]): number {
  const y = (c: [number, number, number]) => 0.2126729 * (c[0] / 255) ** 2.4 + 0.7151522 * (c[1] / 255) ** 2.4 + 0.072175 * (c[2] / 255) ** 2.4;
  const clamp = (v: number) => (v > 0.022 ? v : v + (0.022 - v) ** 1.414);
  const ty = clamp(y(t)), gy = clamp(y(g));
  if (Math.abs(gy - ty) < 0.0005) return 0;
  if (gy > ty) { const s = (gy ** 0.56 - ty ** 0.57) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; }
  const s = (gy ** 0.65 - ty ** 0.62) * 1.14; return s > -0.1 ? 0 : (s + 0.027) * 100;
}
const hex = (c: number[]) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Measure one block of a screenshot: `box` and `line` in CSS pixels, `scale` device pixels per CSS pixel. */
function measure(name: string, png: Buffer, box: Box, line: number, scale: number): void {
  const img = decodePng(png);
  const x0 = Math.max(0, Math.round(box.x * scale)), y0 = Math.max(0, Math.round(box.y * scale));
  const x1 = Math.min(img.width, Math.round((box.x + box.w) * scale)), y1 = Math.min(img.height, Math.round((box.y + box.h) * scale));
  const w = x1 - x0, h = y1 - y0;
  const ys = new Float64Array(w * h); const counts = new Map<number, number>();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((y0 + y) * img.width + x0 + x) * 4; const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    ys[y * w + x] = lum(r, g, b); const k = (r << 16) | (g << 8) | b; counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const groundKey = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const ground: [number, number, number] = [(groundKey >> 16) & 255, (groundKey >> 8) & 255, groundKey & 255];
  const gY = lum(...ground);
  const sorted = Float64Array.from(ys).sort(); const cut = sorted[Math.floor(sorted.length * 0.98)];
  const strokeRgb = [0, 0, 0]; let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (ys[y * w + x] >= cut) { const i = ((y0 + y) * img.width + x0 + x) * 4; strokeRgb[0] += img.data[i]; strokeRgb[1] += img.data[i + 1]; strokeRgb[2] += img.data[i + 2]; n++; }
  const stroke = strokeRgb.map((v) => v / n) as [number, number, number];
  const sY = lum(...stroke);
  let mean = 0; for (const v of ys) mean += v; mean /= ys.length;
  // With no line height given, the pitch is the lag at which the rows' mean brightness best repeats itself.
  if (!line) {
    const rows = new Float64Array(h); for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) s += ys[y * w + x]; rows[y] = s / w; }
    // Multiples of the pitch repeat too, so the shortest local peak within 80% of the strongest wins.
    const m = rows.reduce((a, b) => a + b, 0) / h; const corr: number[] = [];
    const lo = Math.round(10 * scale), hi = Math.round(40 * scale);
    for (let lag = lo; lag <= hi; lag++) { let s = 0; for (let y = 0; y + lag < h; y++) s += (rows[y] - m) * (rows[y + lag] - m); corr.push(s / (h - lag)); }
    const top = Math.max(...corr);
    const peak = corr.findIndex((c, i) => c >= 0.8 * top && i > 0 && i < corr.length - 1 && c >= corr[i - 1] && c >= corr[i + 1]);
    line = (lo + (peak < 0 ? corr.indexOf(top) : peak)) / scale;
  }
  const pitch = Math.round(line * scale), lines = Math.floor(h / pitch);
  const fold = new Array(pitch).fill(0);
  for (let l = 0; l < lines; l++) for (let r = 0; r < pitch; r++) { let s = 0; for (let x = 0; x < w; x++) s += ys[(l * pitch + r) * w + x]; fold[r] += s / w / lines; }
  const lo = Math.min(...fold), hi = Math.max(...fold), band = fold.filter((v) => v > (lo + hi) / 2);
  const bandMean = band.reduce((a, b) => a + b, 0) / band.length;
  console.log(`${name.padEnd(34)} ground ${hex(ground)} L* ${lstar(gY).toFixed(1).padStart(4)} · strokes ${hex(stroke)} L* ${lstar(sY).toFixed(1).padStart(5)} · Lc ${apca(stroke, ground).toFixed(1).padStart(6)} · lit ${((mean - gY) / (sY - gY) * 100).toFixed(1).padStart(4)}% · block L* ${lstar(mean).toFixed(1)} (+${(lstar(mean) - lstar(gY)).toFixed(1)}) · line band L* ${lstar(bandMean).toFixed(1)} (+${(lstar(bandMean) - lstar(gY)).toFixed(1)}), ${((band.length / pitch) * 100).toFixed(0)}% of a ${line} px line · ${w}×${h} px`);
}

async function shot(app: ElectronApplication, win: Page, dir: string, name: string): Promise<{ png: Buffer; scale: number }> {
  const png = await win.screenshot({ path: join(dir, name + ".png") });
  const scale = await win.evaluate(() => window.devicePixelRatio);
  void app;
  return { png, scale };
}

async function vscode(file: string, dir: string): Promise<void> {
  const profile = mkdtempSync(join(tmpdir(), "tone-vscode-"));
  const app = await electron.launch({
    executablePath: VSCODE,
    args: [`--user-data-dir=${join(profile, "user")}`, `--extensions-dir=${join(profile, "ext")}`, "--disable-extensions", "--skip-welcome", "--skip-release-notes", "--disable-workspace-trust", "--new-window", file],
    timeout: 60_000,
  });
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.setContentSize(1512, 945); });
    await win.locator(".monaco-editor .view-lines .view-line").first().waitFor({ state: "visible", timeout: 30_000 });
    await win.waitForTimeout(1500); // no condition marks the end of Monaco's tokenizing pass; one pass of a 2,000-line file takes well under this
    const theme = await win.evaluate(() => document.querySelector(".monaco-workbench")?.className.match(/vs-dark|vs|hc-black|hc-light/)?.[0] ?? "?");
    const editor = await win.evaluate(() => {
      const e = document.querySelector(".monaco-editor .view-lines") as HTMLElement; const r = e.getBoundingClientRect();
      const l = document.querySelector(".monaco-editor .view-line") as HTMLElement; const cs = getComputedStyle(l);
      const host = (e.closest(".monaco-scrollable-element") as HTMLElement).getBoundingClientRect();
      return { box: { x: host.x, y: host.y, w: host.width - 14, h: host.height }, line: l.getBoundingClientRect().height, font: cs.fontFamily + " " + cs.fontSize, r: { x: r.x, y: r.y } };
    });
    const s = await shot(app, win, dir, "vscode-editor");
    console.log(`VS Code (${theme}), editor: ${editor.font}, line ${editor.line} px`);
    measure("VS Code editor", s.png, editor.box, editor.line, s.scale);
    // The terminal printing the same file.
    await win.keyboard.press("Control+Backquote");
    const term = win.locator(".terminal-wrapper .xterm-screen").first();
    await term.waitFor({ state: "visible", timeout: 20_000 });
    await win.waitForTimeout(1500); // the shell's first prompt has no signal the page can read
    await win.keyboard.type(`clear; cut -c1-200 '${file}' | head -60\n`);
    await win.waitForTimeout(1500);
    const tbox = await term.boundingBox();
    const tline = await win.evaluate(() => { const r = document.querySelector(".xterm-rows > div") as HTMLElement | null; return r ? r.getBoundingClientRect().height : 0; });
    const t = await shot(app, win, dir, "vscode-terminal");
    // The terminal draws its rows on a canvas, so the line pitch is read from the pixels (tline is 0).
    if (tbox) measure("VS Code terminal", t.png, { x: tbox.x, y: tbox.y + 20, w: tbox.width, h: tbox.height - 40 }, tline, t.scale);
  } finally {
    await app.close().catch(() => undefined);
    rmSync(profile, { recursive: true, force: true });
  }
}

async function substrate(repo: string, dir: string): Promise<void> {
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, process.env.TONE_MODEL ?? "claude", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill(`Repeat this paragraph back exactly, with nothing before or after it: ${PARAGRAPH}`);
    await win.keyboard.press("Enter");
    const rows = () => win.evaluate(() => {
      const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
      for (const g of Array.from(document.querySelectorAll("span"))) {
        const t = g.textContent; if ((t !== "◆" && t !== "›") || !g.nextElementSibling && !g.nextSibling) continue;
        const row = g.parentElement as HTMLElement; const r = row.getBoundingClientRect(); const gr = g.getBoundingClientRect();
        out[t === "◆" ? "reply" : "message"] = { x: gr.right + 6, y: r.y, w: r.right - gr.right - 6, h: r.height };
      }
      return out;
    });
    let found = await rows();
    for (let k = 0; k < 600 && !(found.reply && found.reply.h > 30); k++) { await settled(win); found = await rows(); }
    for (let k = 0; k < 20; k++) await settled(win);
    found = await rows();
    const pline = await win.evaluate(() => { const g = Array.from(document.querySelectorAll("span")).find((s) => s.textContent === "◆"); return g ? parseFloat(getComputedStyle(g.parentElement as HTMLElement).lineHeight) : 0; });
    const p = await shot(app, win, dir, "substrate-pane");
    console.log(`Substrate pane: line ${pline} px`);
    if (found.message) measure("Substrate pane, message", p.png, found.message, pline, p.scale);
    if (found.reply) measure("Substrate pane, reply", p.png, found.reply, pline, p.scale);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="BLACKBOARD.md"]').first().click();
    await win.waitForFunction(() => { const h = document.querySelector("[data-editor-code]"); return !!h?.shadowRoot?.querySelector(".cm-line"); }, undefined, { timeout: 20_000 });
    for (let k = 0; k < 30; k++) await settled(win);
    const ed = await win.evaluate(() => {
      const root = (document.querySelector("[data-editor-code]") as HTMLElement).shadowRoot as ShadowRoot;
      const c = root.querySelector(".cm-content") as HTMLElement; const s = root.querySelector(".cm-scroller") as HTMLElement;
      const l = root.querySelector(".cm-line") as HTMLElement; const cs = getComputedStyle(l);
      const cr = c.getBoundingClientRect(), sr = s.getBoundingClientRect();
      return { box: { x: cr.x, y: sr.y, w: Math.min(cr.width, sr.right - cr.x), h: sr.height }, line: l.getBoundingClientRect().height, font: cs.fontFamily + " " + cs.fontSize };
    });
    const e = await shot(app, win, dir, "substrate-editor");
    console.log(`Substrate editor: ${ed.font}, line ${ed.line} px`);
    measure("Substrate editor", e.png, ed.box, ed.line, e.scale);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: false });
  }
}

/** A window on screen by its id, through screencapture; needs Screen Recording permission. */
function onScreen(id: string, name: string, dir: string): void {
  const path = join(dir, name + ".png");
  execFileSync("screencapture", ["-x", "-o", `-l${id}`, path]);
  const png = readFileSync(path); const img = decodePng(png);
  const top = 60; // the title bar and tab strip, in points at scale 2
  measure(`${name} (on screen)`, png, { x: 0, y: top, w: img.width / 2, h: img.height / 2 - top }, Number(process.env.TONE_LINE ?? 17), 2);
}

async function main(): Promise<void> {
  const dir = join(__dirname, ".scratch", "text-tone-" + process.pid);
  const repo = join(dir, "repo");
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  copyFileSync(join(REPO_ROOT, "BLACKBOARD.md"), join(repo, "BLACKBOARD.md"));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  try {
    const only = process.env.TONE_ONLY;
    if (!only || only === "vscode") await vscode(join(repo, "BLACKBOARD.md"), dir);
    if (!only || only === "substrate") await substrate(repo, dir);
    for (const w of (process.env.TONE_WINDOWS ?? "").split(",").filter(Boolean)) { const [id, name] = w.split(":"); onScreen(id, name ?? id, dir); }
    // Screenshots taken on the machine, in sRGB: TONE_SHOTS=<png>|<pixels per point>|<name>:<x>,<y>,<w>,<h>;…‖<png>|…
    // with boxes in the image's pixels.
    for (const s of (process.env.TONE_SHOTS ?? "").split("‖").filter(Boolean)) {
      const [path, sc, boxes] = s.split("|"); const scale = Number(sc); const png = readFileSync(path);
      for (const b of boxes.split(";").filter(Boolean)) {
        const [name, nums] = b.split(":"); const [x, y, w, h] = nums.split(",").map(Number);
        measure(name, png, { x: x / scale, y: y / scale, w: w / scale, h: h / scale }, 0, scale);
      }
    }
  } finally {
    if (process.env.TONE_KEEP !== "1") rmSync(dir, { recursive: true, force: true });
    else console.log("kept:", dir);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
