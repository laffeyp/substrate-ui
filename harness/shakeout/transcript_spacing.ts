// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The transcript's line spacing, measured on the screen (sprint 477, roadmap r15 E16; the Architect, 2026-11-11: the
// pane "looks like it's like 1.5 spaced", measured at 2.0). The deterministic driver; a message long enough to wrap
// is sent. In the pane, in meta (⌘M) and in the editor's terminal (⌘⇧E), the message's row is cut from a screenshot,
// its pixel rows that hold ink are grouped into text lines, and the pitch between the starts of consecutive lines is
// 20 px ± 1 at 13 px type (1.54). Sprint 478: the same under the look `original` from Settings, where each place
// keeps its spacing before sprint 477 (26, 25.35 and 22.1 px), and under `new` again. Prints each place's pitch. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { decodePng } from "../pixel/png";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const MESSAGE = "a message long enough to wrap onto several lines in every place the transcript is drawn, so that the space between its lines can be measured from the pixels on the screen rather than read from a stylesheet, which is what a person sees when they read the pane, meta, and the terminal under the editor";
const WANT = 20;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);

/** The message row's text box (right of its glyph) inside the container `scope`, in CSS pixels: the row scrolled to
 *  the top of its scroller (the editor's terminal is short), and the box cut to what the scroller shows. */
const messageBox = (win: Page, scope: string) => win.evaluate((sel) => {
  const root = document.querySelector(sel); if (!root) return null;
  const glyph = Array.from(root.querySelectorAll("span")).find((s) => s.textContent === "›"); if (!glyph) return null;
  const row = glyph.parentElement as HTMLElement;
  row.scrollIntoView({ block: "start" });
  let scroller: HTMLElement | null = row.parentElement;
  while (scroller && getComputedStyle(scroller).overflowY !== "auto") scroller = scroller.parentElement;
  const view = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
  const r = row.getBoundingClientRect(); const g = glyph.getBoundingClientRect();
  const top = Math.max(r.top, view.top), bottom = Math.min(r.bottom, view.bottom);
  return { x: g.right + 2, y: top, w: r.right - g.right - 2, h: bottom - top };
}, scope);

/** The pitch, in CSS pixels, between the starts of consecutive text lines in `box`, read from the pixels. */
async function pitchOf(win: Page, box: { x: number; y: number; w: number; h: number }, shot: string): Promise<{ pitch: number[]; lines: number }> {
  const img = decodePng(await win.screenshot({ path: shot }));
  const scale = img.width / (await win.evaluate(() => window.innerWidth));
  const x0 = Math.ceil(box.x * scale), x1 = Math.floor((box.x + box.w) * scale), y0 = Math.floor(box.y * scale), y1 = Math.ceil((box.y + box.h) * scale);
  const at = (x: number, y: number) => { const i = (y * img.width + x) * 4; return img.data[i] + img.data[i + 1] + img.data[i + 2]; };
  const ground = at(x1 - 2, y0 + 1);
  const ink: boolean[] = [];
  for (let y = y0; y < y1; y++) { let n = 0; for (let x = x0; x < x1; x++) if (Math.abs(at(x, y) - ground) > 90) n++; ink.push(n > 2); }
  const starts: number[] = [];
  for (let k = 0; k < ink.length; k++) if (ink[k] && (k === 0 || !ink[k - 1])) starts.push(k);
  // A text line can hold two bands (a letter's dot, an accent): starts closer than 8 CSS px belong to one line.
  const lines = starts.filter((s, i) => i === 0 || s - starts[i - 1] > 8 * scale);
  const pitch = lines.slice(1).map((s, i) => Math.round(((s - lines[i]) / scale) * 10) / 10);
  return { pitch, lines: lines.length };
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-477-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "transcript-spacing-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "notes.md"), "# notes\n"); git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill(MESSAGE);
    await win.keyboard.press("Enter");
    for (let k = 0; k < 300 && (await returned(win)) < 1; k++) await settled(win);
    if ((await returned(win)) < 1) throw new Error("the message's turn did not return");
    const report: string[] = [];
    // Each look's pitch per place (sprint 478): `new` 20 px everywhere; `original` as drawn before sprint 477.
    const WANTS: Record<string, Record<string, number>> = { new: { pane: WANT, meta: WANT, "editor terminal": WANT }, original: { pane: 26, meta: 25.35, "editor terminal": 22.1 } };
    const pick = async (look: string) => {
      await win.keyboard.press("Meta+,");
      const chip = win.locator(`[data-setting-look="${look}"]`).first();
      await chip.waitFor({ state: "visible", timeout: 10_000 });
      await chip.click();
      await win.waitForFunction((l) => document.querySelector(`[data-setting-look="${l}"]`)?.getAttribute("data-lit") === "1", look, { timeout: 5_000 });
      await win.keyboard.press("Escape");
      await settled(win);
    };
    const measureAll = async (look: string) => {
      const places: [string, string, () => Promise<void>][] = [
        ["pane", "[data-vm-transcript-scroller]", async () => undefined],
        ["meta", '[data-vm-transcript-mount="reveal"]', async () => { await win.keyboard.press("Meta+m"); }],
        ["editor terminal", '[data-vm-transcript-mount="editor"]', async () => { await win.keyboard.press("Meta+m"); await settled(win); await win.keyboard.press("Meta+Shift+E"); }],
      ];
      for (const [name, scope, open] of places) {
        await open();
        let box = await messageBox(win, scope);
        for (let k = 0; k < 100 && !box; k++) { await settled(win); box = await messageBox(win, scope); }
        if (!box) throw new Error(`${look} ${name}: no message row in ${scope}`);
        for (let k = 0; k < 10; k++) await settled(win);
        box = (await messageBox(win, scope))!;
        const want = WANTS[look][name];
        const { pitch, lines } = await pitchOf(win, box, join(shots, `${look}-${name.replace(" ", "-")}.png`));
        report.push(`${look} ${name} ${lines} lines, pitch ${pitch.join(", ")} px`);
        if (lines < 2) throw new Error(`${look} ${name}: the message drew ${lines} line(s); it must wrap to be measured`);
        if (pitch.some((p) => Math.abs(p - want) > 1)) throw new Error(`${look} ${name}: line pitch ${pitch.join(", ")} px, want ${want} ± 1`);
      }
      // Back to the pane for the next look.
      await win.keyboard.press("Meta+Shift+E"); await settled(win);
    };
    await measureAll("new");
    await pick("original");
    await measureAll("original");
    await pick("new");
    await measureAll("new");
    await app.close();
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`transcript_spacing: ok — ${report.join("; ")}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`transcript_spacing: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
