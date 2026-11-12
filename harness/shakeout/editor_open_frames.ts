// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Frames of a file opening (the Architect, 2026-11-11: "when I open up a .toml file or a .c file, it drifts back and
// forth"; "the tab switches over before the actual text does"). A repository written here holds Cargo.toml, main.c and
// notes.md; the deterministic driver. In the editor: open notes.md, then Cargo.toml, then main.c, then switch tabs
// back and forth, a screenshot every 100 ms for 2.5 s after each click, with the code's first line, the tab shown and
// the scroll offsets at each frame. Writes runs/packaged/open-frames-<stamp>-<source|packaged>/ and prints, per frame,
// what was on screen. A capture, not a gate: it reports, it asserts nothing.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const state = (win: Page) => win.evaluate(`(function () {
  var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot;
  var line = r && r.querySelector(".cm-line"); var sc = r && r.querySelector(".cm-scroller");
  var tab = document.querySelector('[data-editor-tab][data-active="1"]');
  var content = r && r.querySelector(".cm-content"); var box = content ? content.getBoundingClientRect() : null;
  var status = document.querySelector("[data-status-pos]");
  return { tab: tab ? tab.getAttribute("data-editor-tab") : null, line: line ? line.textContent : null,
    scrollLeft: sc ? sc.scrollLeft : null, scrollTop: sc ? sc.scrollTop : null, contentX: box ? Math.round(box.x) : null,
    status: status ? status.textContent : null };
})()`) as Promise<Record<string, unknown>>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `open-frames-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-open-frames-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "Cargo.toml"), '# the package\n[package]\nname = "demo"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nserde = "1"\n');
  writeFileSync(join(repo, "main.c"), '/* a program */\n#include <stdio.h>\n\nint main(void) {\n  printf("hello\\n");\n  return 0;\n}\n');
  writeFileSync(join(repo, "notes.md"), "# notes\n\nsome text\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    for (let k = 0; k < 300 && (await returned(win)) < 1; k++) await settled(win);
    await win.keyboard.press("Meta+Shift+E");
    let n = 0;
    const watch = async (label: string, click: () => Promise<void>) => {
      const t0 = Date.now();
      await click();
      for (let f = 0; f < 25; f++) {
        const s = await state(win);
        const file = `${String(n++).padStart(3, "0")}-${label}-${String(Date.now() - t0).padStart(4, "0")}ms.png`;
        await win.screenshot({ path: join(shots, file) });
        console.log(`${label} +${Date.now() - t0}ms ${JSON.stringify(s)}`);
        await new Promise((r) => setTimeout(r, 100));
      }
    };
    await watch("open-notes", () => win.locator('[data-tree-row="notes.md"]').first().click());
    await watch("open-toml", () => win.locator('[data-tree-row="Cargo.toml"]').first().click());
    await watch("open-c", () => win.locator('[data-tree-row="main.c"]').first().click());
    await watch("tab-toml", () => win.locator('[data-editor-tab="Cargo.toml"]').first().click());
    await watch("tab-c", () => win.locator('[data-editor-tab="main.c"]').first().click());
    console.log(`frames in ${shots}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: false });
    rmSync(repo, { recursive: true, force: true });
  }
}

main();
