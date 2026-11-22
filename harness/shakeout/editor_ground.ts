// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's ground is the look's (sprint 516; roadmap 2026-11-17-daily-driver-fixes E1). Sprint 537
// reverted sprint 516's two colour values (the Architect, 2026-11-21: sprint 516 "turned the entire editor
// pane black … we just need to revert that change"), so `new` carries the same ground and raised step as
// `original`. Decodes the pixels (ADDENDUMS.md A2): under both looks the code area, the terminal's header
// and the folded sill read the gray #212327, and the rendered Markdown's code block reads the raised step
// #1a1c20. The deterministic driver. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { decodePng, type Image } from "../pixel/png";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const FIXTURES = join(__dirname, "..", "fixtures", "code");
type Rgb = [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const dist = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const INSET = hex("#1a1c20");
const RAISED = hex("#212327");

interface Rect { x: number; y: number; w: number; h: number }

/** The element's box in CSS pixels; null when absent. */
const rectOf = (win: Page, selector: string) => win.evaluate(`(function () {
  var el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
  var r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
})()`) as Promise<Rect | null>;

/** The code scroller's box (it lives in the editor's shadow root). */
const scrollerOf = (win: Page) => win.evaluate(() => {
  const root = document.querySelector("[data-editor-code]")?.shadowRoot;
  const el = root?.querySelector(".cm-scroller");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}) as Promise<Rect | null>;

/** The average colour of a CSS-px box inside the screenshot. */
function sample(img: Image, scale: number, at: Rect): Rgb {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = Math.ceil(at.y * scale); y < Math.floor((at.y + at.h) * scale); y++) for (let x = Math.ceil(at.x * scale); x < Math.floor((at.x + at.w) * scale); x++) {
    const i = (y * img.width + x) * 4; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
  }
  if (!n) throw new Error("an empty box was sampled");
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-516-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-ground-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  // Three lines, so the scroller below the text is all ground; the fixture README carries code fences.
  writeFileSync(join(repo, "tiny.py"), "x = 1\ny = 2\nz = x + y\n");
  copyFileSync(join(FIXTURES, "README-substrate-ui.md"), join(repo, "README-substrate-ui.md"));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const errs: string[] = [];
  const report: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => {
      const vm = (window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: string | null } } | null } }).__vm;
      return !!vm?.get(1)?.snapshot().parkReason;
    }, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="tiny.py"]').first().waitFor({ state: "visible", timeout: 30_000 });
    await win.locator('[data-tree-row="tiny.py"]').first().click();
    await win.waitForFunction(() => document.querySelector("[data-status-language]")?.textContent === "Python", undefined, { timeout: 20_000 });
    await settled(win);

    const shoot = async () => {
      const img = decodePng(await win.screenshot());
      return { img, scale: img.width / (await win.evaluate(() => window.innerWidth)) };
    };
    /** One sample off a selector, at an offset from its top left. */
    const probe = async (name: string, selector: string, dx: number, dy: number, want: Rgb, img: Image, scale: number) => {
      const r = await rectOf(win, selector);
      if (!r) { errs.push(`${name}: no ${selector}`); return; }
      const got = sample(img, scale, { x: r.x + dx, y: r.y + dy, w: 8, h: 6 });
      // A box outside the screenshot reads undefined and averages to NaN; NaN fails no comparison, so it fails here.
      if (!Number.isFinite(got[0] + got[1] + got[2])) { errs.push(`${name}: the sample box fell outside the screenshot`); return; }
      const d = dist(got, want);
      report.push(`${name} rgb(${got.join(",")}) Δ ${d.toFixed(1)}`);
      if (d >= 6) errs.push(`${name} decodes rgb(${got.join(",")}), want rgb(${want.join(",")})`);
    };
    /** The code area's ground, sampled below the last line of tiny.py. */
    const codeGround = async (name: string, want: Rgb, img: Image, scale: number) => {
      const sc = await scrollerOf(win);
      if (!sc) { errs.push(`${name}: no .cm-scroller`); return; }
      const got = sample(img, scale, { x: sc.x + 200, y: sc.y + sc.h - 40, w: 60, h: 20 });
      const d = dist(got, want);
      report.push(`${name} rgb(${got.join(",")}) Δ ${d.toFixed(1)}`);
      if (d >= 6) errs.push(`${name} decodes rgb(${got.join(",")}), want rgb(${want.join(",")})`);
    };

    // The `new` look (reverted to the gray in sprint 537): the code area's ground below the text, and the
    // open terminal's header.
    let shot = await shoot();
    await codeGround("new code ground", RAISED, shot.img, shot.scale);
    await probe("new terminal head", "[data-editor-terminal-head]", 300, 3, RAISED, shot.img, shot.scale);

    // The folded sill.
    await win.keyboard.press("Meta+j");
    await win.locator("[data-editor-sill]").waitFor({ state: "visible", timeout: 5_000 });
    await settled(win);
    shot = await shoot();
    await probe("new sill", "[data-editor-sill]", 3, 4, RAISED, shot.img, shot.scale);
    await win.locator('[data-editor-sill] [data-editor-fold="bottom"]').click();
    await settled(win);

    // The rendered Markdown: the view's ground (its padding) and a code block's raised step.
    await win.locator('[data-tree-row="README-substrate-ui.md"]').first().click();
    await settled(win);
    await win.locator('[data-editor-tab="README-substrate-ui.md"]').first().click({ button: "right" });
    await win.locator('[data-context-item="show rendered"]').click();
    await win.locator("[data-md-view]").waitFor({ state: "visible", timeout: 10_000 });
    await win.locator("[data-md-code]").first().waitFor({ state: "visible", timeout: 10_000 });
    // The README's first fenced block can sit below the fold; a probe off a scrolled-off element reads
    // past the screenshot's edge (the NaN samples of the first run).
    await win.locator("[data-md-code]").first().scrollIntoViewIfNeeded();
    await settled(win);
    shot = await shoot();
    await probe("new md ground", "[data-md-view]", 4, 4, RAISED, shot.img, shot.scale);
    // (10, 10): inside the block's rounded corner and its padding, on its background.
    await probe("new md code block", "[data-md-code]", 10, 10, INSET, shot.img, shot.scale);

    // The `original` look: the grounds back to #212327, the block back to #1a1c20.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-look="original"]').first().click();
    await win.keyboard.press("Escape");
    await settled(win);
    shot = await shoot();
    await probe("original md ground", "[data-md-view]", 4, 4, RAISED, shot.img, shot.scale);
    await probe("original md code block", "[data-md-code]", 10, 10, INSET, shot.img, shot.scale);
    await win.locator('[data-editor-tab="tiny.py"]').first().click();
    await settled(win);
    shot = await shoot();
    await codeGround("original code ground", RAISED, shot.img, shot.scale);

    await win.screenshot({ path: join(shots, "ground.png") });
    if (errs.length) throw new Error(errs.join("; "));
    console.log(`editor_ground: ok — ${report.join("; ")}; packaged=${String(packaged)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_ground: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
