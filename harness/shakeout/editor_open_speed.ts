// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A file's text shows when it is read, not when its comparison lands (sprint 473; BLACKBOARD 2026-11-11, the editor
// broken in use: "the tab switches over before the actual text does"). A repository written here holds a.ts (changed
// since its commit, at a different size so git's stat check sees it), b.toml, and 60,000 untracked files, which make
// the per-file base comparison take about a second, as in the Architect's workspace. The deterministic driver; in the
// editor:
//   open a.ts, open b.toml: 100 ms after each click the active tab's file is the one whose first line the code shows,
//   and the status line is drawn (a first open reads the file);
//   switch to a.ts's tab, switch to b.toml's tab: at once, with no wait after the click, the same holds (the Architect,
//   2026-11-11: "the text shows immediately whenever you click on a tab … There should be no lag": a kept tab's state
//   is placed before the next paint, with no read first);
//   a.ts's hunk card appears in CHANGES once its comparison lands;
//   window-1.jsonl: EDITOR_FILE_SHOWN ×4, the opens under 100 ms, the tab switches under 5 ms; server.jsonl: each per-file DIFF_READ lands more than the
//   shown time after its FILE_READ (printed, so the run shows the comparison was the slow half).
// Sprint 474: each per-file comparison lands within 300 ms of its read, with the 60,000 untracked files; c.ts, rewritten
// at the same size in the second it was committed (the app's launch puts its read seconds later), shows its hunk card.
// Screenshots go to runs/packaged/sprint-473-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const FIRST: Record<string, string> = { "a.ts": "export const a = 22;", "b.toml": 'name = "b"' };
const seen = (win: Page) => win.evaluate(`(function () {
  var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; var line = r && r.querySelector(".cm-line");
  var tab = document.querySelector('[data-editor-tab][data-active="1"]'); var status = document.querySelector("[data-status-pos]");
  return { tab: tab ? tab.getAttribute("data-editor-tab") : null, line: line ? line.textContent : null, status: status ? status.textContent : null };
})()`) as Promise<{ tab: string | null; line: string | null; status: string | null }>;
const hunkCards = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll("[data-hunk-card]")).length`) as Promise<number>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 20_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-473-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-open-speed-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "a.ts"), "export const a = 1;\n");
  writeFileSync(join(repo, "b.toml"), 'name = "b"\n');
  writeFileSync(join(repo, "c.ts"), "export const c = 1;\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  writeFileSync(join(repo, "a.ts"), `${FIRST["a.ts"]}\n`);
  writeFileSync(join(repo, "c.ts"), "export const c = 2;\n");
  for (let d = 0; d < 300; d++) {
    const dir = join(repo, "gen", `d${d}`);
    mkdirSync(dir, { recursive: true });
    for (let f = 0; f < 200; f++) writeFileSync(join(dir, `f${f}.txt`), "x\n");
  }
  const launch = launchArgs();
  const traces = join(launch.state, "electron", "logs", "traces");
  /** Per-file comparisons answered so far (DIFF_READ with `hunks`). */
  const compared = async () => {
    const boot = readdirSync(traces).sort().pop();
    if (!boot) return 0;
    return readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter((l) => l.includes('"DIFF_READ"') && l.includes('"hunks"')).length;
  };
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await until(win, "hello's Returned", () => returned(win), (n) => n >= 1, 30_000);
    await win.keyboard.press("Meta+Shift+E");
    await until(win, "the tree", () => win.locator('[data-tree-row="b.toml"]').count(), (n) => n > 0, 30_000);

    const steps: [string, string][] = [["tree", "a.ts"], ["tree", "b.toml"], ["tab", "a.ts"], ["tab", "b.toml"]];
    const seenAt: string[] = [];
    for (const [how, name] of steps) {
      const sel = how === "tree" ? `[data-tree-row="${name}"]` : `[data-editor-tab="${name}"]`;
      const before = await compared();
      await win.locator(sel).first().click();
      if (how === "tree") await new Promise((r) => setTimeout(r, 100));
      const s = await seen(win);
      seenAt.push(`${how}:${name}${how === "tree" ? "@100ms" : "@0ms"}=${JSON.stringify(s)}`);
      if (s.tab !== name || s.line !== FIRST[name] || !s.status || !s.status.startsWith(`${name} · `)) throw new Error(`${how === "tree" ? "100 ms" : "at once"} after ${how} ${name}: ${JSON.stringify(s)}`);
      if (how === "tab" && name === "b.toml") await win.screenshot({ path: join(shots, "b-toml-at-once.png") });
      // Each comparison lands before the next click, so every read is measured on its own.
      await until(win, `${name}'s comparison`, compared, (n) => n > before, 30_000);
    }
    await win.locator('[data-editor-tab="a.ts"]').first().click();
    const cards = await until(win, "a.ts's hunk in CHANGES", () => hunkCards(win), (n) => n === 1, 20_000);
    await win.locator('[data-tree-row="c.ts"]').first().click();
    const cCards = await until(win, "c.ts's same-second, same-size edit in CHANGES", () => hunkCards(win), (n) => n === 1, 20_000);
    await app.close();

    const shown = windowRecords(launch).filter((r) => r.name === "EDITOR_FILE_SHOWN").map((r) => Number(r.payload.ms));
    if (shown.length < 4 || !(shown[0] < 100 && shown[1] < 100 && shown[2] < 5 && shown[3] < 5)) throw new Error(`EDITOR_FILE_SHOWN ms ${JSON.stringify(shown)}`);
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; wall: string; payload: Record<string, unknown> });
    const gaps: number[] = [];
    let lastRead: number | null = null;
    for (const r of server) {
      if (r.name === "FILE_READ") lastRead = Date.parse(r.wall);
      else if (r.name === "DIFF_READ" && "hunks" in r.payload && lastRead !== null) { gaps.push(Date.parse(r.wall) - lastRead); lastRead = null; }
    }
    if (gaps.length < 4 || gaps.some((ms) => !(ms < 300))) throw new Error(`per-file comparisons landed ${JSON.stringify(gaps)} ms after their reads`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_open_speed: ok — EDITOR_FILE_SHOWN ms ${JSON.stringify(shown)}; the per-file comparisons landed ${JSON.stringify(gaps)} ms after their reads; after each click: ${seenAt.join(" | ")}; a.ts's CHANGES ${cards} card; c.ts's (same second, same size) ${cCards} card; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_open_speed: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
