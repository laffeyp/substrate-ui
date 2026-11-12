// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Selecting text in code highlights its other occurrences in view (sprint 484; the Architect, 2026-11-11: "every time
// I like highlight like a function or like an object dot function call every object dot function call In the editor
// should become highlighted, maybe it should be highlighted a little less"). Real files from `harness/fixtures/code/`.
// The deterministic driver. These agree:
//   code   — in models.py, a double-click on `Responder` selects it; the marked occurrences (.cm-selectionMatch) are
//            the other occurrences of `Responder` in the lines on screen (between the fully and the partly visible
//            lines' count), the selection itself unmarked; in the screenshot each mark's box holds a tint over the
//            ground (its commonest colour is not the ground #212327);
//   prose  — in README-substrate-ui.md (Markdown) a double-click on a word seen several times marks nothing;
//   off    — with Settings › match highlight off, the same double-click in models.py marks nothing; on again, it marks.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { decodePng } from "../pixel/png";

const REPO_ROOT = join(__dirname, "..", "..");
const FIXTURES = join(__dirname, "..", "fixtures", "code");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

/** The centre of the first on-screen occurrence of `word` that stands as a word, in CSS pixels. */
const wordAt = (win: Page, word: string) => win.evaluate(`(function (word) {
  var root = document.querySelector("[data-editor-code]").shadowRoot; var sc = root.querySelector(".cm-scroller").getBoundingClientRect();
  var walker = document.createTreeWalker(root.querySelector(".cm-content"), NodeFilter.SHOW_TEXT); var node;
  while ((node = walker.nextNode())) {
    var t = node.textContent || ""; var at = t.indexOf(word);
    while (at >= 0) {
      var before = at > 0 ? t[at - 1] : " ", after = t[at + word.length] || " ";
      if (!/\\w/.test(before) && !/\\w/.test(after)) {
        var r = document.createRange(); r.setStart(node, at); r.setEnd(node, at + word.length); var b = r.getBoundingClientRect();
        // Inside the code area both ways: lines do not wrap, so a word can sit past the right edge.
        if (b.top >= sc.top && b.bottom <= sc.bottom && b.left >= sc.left && b.right <= sc.right) return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      }
      at = t.indexOf(word, at + 1);
    }
  }
  return null;
})(${JSON.stringify("__WORD__")})`.replace(JSON.stringify("__WORD__"), JSON.stringify(word))) as Promise<{ x: number; y: number } | null>;

/** The marks drawn, and the occurrences of `word` in the fully and the partly visible lines. */
const marks = (win: Page, word: string) => win.evaluate(`(function (word) {
  var root = document.querySelector("[data-editor-code]").shadowRoot; var sc = root.querySelector(".cm-scroller").getBoundingClientRect();
  var count = function (t) { var n = 0, at = t.indexOf(word); while (at >= 0) { n++; at = t.indexOf(word, at + 1); } return n; };
  var full = 0, part = 0;
  Array.from(root.querySelectorAll(".cm-line")).forEach(function (l) {
    var r = l.getBoundingClientRect(); if (r.bottom <= sc.top || r.top >= sc.bottom) return;
    var n = count(l.textContent || ""); part += n; if (r.top >= sc.top && r.bottom <= sc.bottom) full += n;
  });
  var m = Array.from(root.querySelectorAll(".cm-selectionMatch"));
  return { marks: m.length, texts: m.map(function (e) { return e.textContent; }), boxes: m.map(function (e) { var r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }), full: full, part: part,
    selected: String(root.getSelection ? root.getSelection() : document.getSelection()) };
})(${JSON.stringify("__WORD__")})`.replace(JSON.stringify("__WORD__"), JSON.stringify(word))) as Promise<{ marks: number; texts: string[]; boxes: number[][]; full: number; part: number; selected: string }>;

async function open(win: Page, file: string, language: string): Promise<void> {
  await win.locator(`[data-tree-row="${file}"]`).first().click();
  await win.waitForFunction((l) => document.querySelector("[data-status-language]")?.textContent === l, language, { timeout: 20_000 });
  for (let k = 0; k < 10; k++) await settled(win);
}

async function dbl(win: Page, word: string): Promise<void> {
  const at = await wordAt(win, word);
  if (!at) throw new Error(`no on-screen occurrence of ${word}`);
  await win.mouse.dblclick(at.x, at.y);
  for (let k = 0; k < 5; k++) await settled(win);
}

async function setMatches(win: Page, on: "on" | "off"): Promise<void> {
  await win.keyboard.press("Meta+,");
  await win.locator(`[data-setting-matches="${on}"]`).first().click();
  await win.waitForFunction((o) => document.querySelector(`[data-setting-matches="${o}"]`)?.getAttribute("data-lit") === "1", on, { timeout: 5_000 });
  await win.keyboard.press("Escape");
  await settled(win);
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-484-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "selection-matches-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  for (const f of ["models.py", "README-substrate-ui.md"]) copyFileSync(join(FIXTURES, f), join(repo, f));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    for (let k = 0; k < 100; k++) await settled(win);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="models.py"]').first().waitFor({ state: "visible", timeout: 30_000 });
    const report: string[] = [];

    // Code: the other occurrences in view are marked, softly.
    await open(win, "models.py", "Python");
    await dbl(win, "Responder");
    const code = await marks(win, "Responder");
    report.push(`models.py "${code.selected}": ${code.marks} marked, ${code.full - 1}–${code.part - 1} other occurrences on screen`);
    if (code.selected !== "Responder") throw new Error(`the double-click selected ${JSON.stringify(code.selected)}`);
    if (code.marks < 2 || code.marks < code.full - 1 || code.marks > code.part - 1 || code.texts.some((t) => t !== "Responder")) throw new Error(`models.py: ${code.marks} marks (${JSON.stringify(code.texts)}); on screen ${code.full - 1} to ${code.part - 1} other occurrences`);
    const png = decodePng(await win.screenshot({ path: join(shots, "models.png") }));
    const scale = png.width / (await win.evaluate(() => window.innerWidth));
    let tinted = 0;
    for (const [x, y, w, h] of code.boxes) {
      const counts = new Map<string, number>();
      for (let yy = Math.ceil(y * scale); yy < Math.floor((y + h) * scale); yy++) for (let xx = Math.ceil(x * scale); xx < Math.floor((x + w) * scale); xx++) { const i = (yy * png.width + xx) * 4; const k = `${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`; counts.set(k, (counts.get(k) ?? 0) + 1); }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (top && top !== "33,35,39") tinted++;
    }
    report.push(`${tinted}/${code.boxes.length} marks tinted on screen`);
    if (tinted !== code.boxes.length) throw new Error(`only ${tinted} of ${code.boxes.length} marks hold a tint over the ground`);

    // Prose: nothing marked.
    await open(win, "README-substrate-ui.md", "Markdown");
    await dbl(win, "the");
    const prose = await marks(win, "the");
    report.push(`README "${prose.selected}": ${prose.marks} marked (${prose.part} on screen)`);
    await win.screenshot({ path: join(shots, "readme.png") });
    if (prose.selected !== "the") throw new Error(`the double-click in Markdown selected ${JSON.stringify(prose.selected)}`);
    if (prose.part < 2 || prose.marks !== 0) throw new Error(`Markdown: ${prose.marks} marks for "the" (${prose.part} on screen)`);

    // Off, then on again.
    await setMatches(win, "off");
    await open(win, "models.py", "Python");
    await dbl(win, "Responder");
    const off = await marks(win, "Responder");
    report.push(`off: ${off.marks} marked`);
    if (off.marks !== 0) throw new Error(`with match highlight off, ${off.marks} marks`);
    await setMatches(win, "on");
    await dbl(win, "Responder");
    const on = await marks(win, "Responder");
    report.push(`on again: ${on.marks} marked`);
    if (on.marks < 2) throw new Error(`on again, ${on.marks} marks`);

    await app.close();
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_selection_matches: ok — ${report.join("; ")}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_selection_matches: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
