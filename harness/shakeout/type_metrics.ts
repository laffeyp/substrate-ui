// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The type as drawn (the Architect, 2026-11-11: the substrate terminal pane "looks like it's like 1.5 spaced"). Launches
// the app with the deterministic driver, sends one message, opens a file in the editor, and prints, for each text
// block, the computed font family, size, line height and their ratio. A capture, not a gate: it reports, it asserts
// nothing. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
/** Every element whose own text is non-empty, grouped by its computed type; the first example of each. */
const metrics = (win: Page, scope: string) => win.evaluate(`(function (scope) {
  var out = {}; var roots = [document];
  var h = document.querySelector("[data-editor-code]"); if (h && h.shadowRoot) roots.push(h.shadowRoot);
  roots.forEach(function (root) {
    root.querySelectorAll(scope).forEach(function (e) {
      var own = Array.from(e.childNodes).filter(function (n) { return n.nodeType === 3 && n.textContent.trim(); }).map(function (n) { return n.textContent.trim(); }).join(" ");
      if (!own || e.getBoundingClientRect().height === 0) return;
      var s = getComputedStyle(e); var fs = parseFloat(s.fontSize); var lh = s.lineHeight === "normal" ? "normal" : parseFloat(s.lineHeight);
      var k = s.fontFamily.split(",")[0] + " " + fs + "px / " + lh + (typeof lh === "number" ? " (" + (lh / fs).toFixed(2) + ")" : "");
      if (!out[k]) out[k] = { n: 0, example: own.slice(0, 50), tag: e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : "") };
      out[k].n++;
    });
  });
  return out;
})(${JSON.stringify("*")})`) as Promise<Record<string, { n: number; example: string; tag: string }>>;

async function main(): Promise<void> {
  const repo = join(__dirname, ".scratch", "type-metrics-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "main.rs"), 'fn main() {\n    let total = 42;\n}\n');
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello there, a message of a few words to measure");
    await win.keyboard.press("Enter");
    for (let k = 0; k < 300 && (await returned(win)) < 1; k++) await settled(win);
    await settled(win);
    console.log("PANE");
    for (const [k, v] of Object.entries(await metrics(win, "*"))) console.log(`  ${k}  ×${v.n}  <${v.tag}> "${v.example}"`);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="main.rs"]').first().click();
    for (let k = 0; k < 50; k++) await settled(win);
    console.log("EDITOR");
    for (const [k, v] of Object.entries(await metrics(win, "*"))) console.log(`  ${k}  ×${v.n}  <${v.tag}> "${v.example}"`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: false });
    rmSync(repo, { recursive: true, force: true });
  }
}

main();
