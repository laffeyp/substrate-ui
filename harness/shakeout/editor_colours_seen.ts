// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What colours the code is drawn in, on real files (`harness/fixtures/code/`, with their sources in its README) (2026-11-11: the Architect saw Python "all blue" in build 1794456520,
// with flashes while clicking between tabs; the gates had checked three hand-written files only). Copies the files named
// in TONE_FILES (names in `harness/fixtures/code/`; default: all of them) into
// a scratch repository, opens each in the editor, and for each: waits for its language, screenshots the code, and counts
// the colours of the inked pixels (each glyph pixel snapped to the nearest palette colour within 40), printing the share
// of each class. Then clicks back through the tabs quickly and does it again, since the Architect saw it while clicking.
// A capture: it prints, it asserts nothing. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { decodePng } from "../pixel/png";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const FIXTURES = join(__dirname, "..", "fixtures", "code");
const FILES = (process.env.TONE_FILES ?? "models.py,tools.py,strings.go,adler32.c,Strings.java,memchr.rs,aws4.js,bytes.ts,package.json,pyproject.toml,ci.yml,fetch-python-runtime.sh,README-substrate-ui.md,reveal.html").split(",");
/** The colour sprint 4xx paints a line the comparison calls added (`Centre.tsx` ADDED), over the syntax colours. */
const ADDED_HEX = "#7fb3b8";
const PALETTE: Record<string, string> = {
  text: "#d7dade", name: "#e8eaee", "added (teal)": ADDED_HEX, keyword: "#7da3ca", type: "#b0bbd2", string: "#c7ade6", number: "#d496c3", meta: "#948dc5",
  property: "#b9bec5", punctuation: "#8a9099", comment: "#62676f",
  "keyword (475)": "#82a5c8", "type (475)": "#a9c0d8", "string (475)": "#b7a4d8", "number (475)": "#cc8fb8", "meta (475)": "#9c8fc4",
};
const rgb = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const GROUND = rgb("#212327");

async function census(win: Page, label: string, shot: string): Promise<void> {
  const box = await win.evaluate(() => {
    const root = document.querySelector("[data-editor-code]")?.shadowRoot; const c = root?.querySelector(".cm-content") as HTMLElement | null; const sc = root?.querySelector(".cm-scroller") as HTMLElement | null;
    if (!c || !sc) return null; const r = c.getBoundingClientRect(), v = sc.getBoundingClientRect();
    return { x: r.x, y: v.y, w: Math.min(r.width, v.right - r.x), h: v.height };
  });
  if (!box) { console.log(`${label}: no code box`); return; }
  const img = decodePng(await win.screenshot({ path: shot }));
  const scale = img.width / (await win.evaluate(() => window.innerWidth));
  const counts: Record<string, number> = {}; let ink = 0;
  for (let y = Math.ceil(box.y * scale); y < Math.floor((box.y + box.h) * scale); y++) for (let x = Math.ceil(box.x * scale); x < Math.floor((box.x + box.w) * scale); x++) {
    const i = (y * img.width + x) * 4; const p = [img.data[i], img.data[i + 1], img.data[i + 2]];
    if (Math.hypot(p[0] - GROUND[0], p[1] - GROUND[1], p[2] - GROUND[2]) < 90) continue; // ground and faint edges
    ink++;
    let best = "other", bd = 40;
    for (const [k, h] of Object.entries(PALETTE)) { const q = rgb(h); const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); if (d < bd) { bd = d; best = k; } }
    counts[best] = (counts[best] ?? 0) + 1;
  }
  const lang = await win.evaluate(() => document.querySelector("[data-status-language]")?.textContent ?? null);
  console.log(`${label} (${lang}): ${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${((n / ink) * 100).toFixed(0)}%`).join(", ")}`);
}

async function main(): Promise<void> {
  const repo = join(__dirname, ".scratch", "colours-seen-" + process.pid);
  const shots = join(REPO_ROOT, "runs", "packaged", "colours-seen-" + process.pid);
  mkdirSync(repo, { recursive: true }); mkdirSync(shots, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  for (const f of [...FILES]) copyFileSync(join(FIXTURES, f), join(repo, basename(f)));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  // A file never committed, and a committed file edited since: as in a workspace being worked on.
  copyFileSync(join(FIXTURES, "tools.py"), join(repo, "new_tools.py"));
  FILES.push("new_tools.py");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    for (let k = 0; k < 100; k++) await settled(win);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator(`[data-tree-row="${basename(FILES[0])}"]`).first().waitFor({ state: "visible", timeout: 30_000 });
    for (const f of FILES) {
      await win.locator(`[data-tree-row="${basename(f)}"]`).first().click();
      for (let k = 0; k < 60; k++) await settled(win);
      await census(win, `open ${basename(f)}`, join(shots, `open-${basename(f)}.png`));
    }
    // Back through the tabs quickly, as the Architect clicked.
    for (const f of FILES) {
      await win.locator(`[data-editor-tab="${basename(f)}"]`).first().click().catch(async () => { await win.locator(`[data-tree-row="${basename(f)}"]`).first().click(); });
      await settled(win);
      await census(win, `back ${basename(f)}`, join(shots, `back-${basename(f)}.png`));
    }
    console.log("screenshots in", shots);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: false });
    rmSync(repo, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
