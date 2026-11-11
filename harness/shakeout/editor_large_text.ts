// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A text file over the read limit shows by line, and a long line reads on (sprint 470; roadmap r13 E14; the Architect,
// 2026-11-11: "you just open a file … they could just scroll down and see the whole file"). A repository written here
// holds million.txt (1,000,000 numbered lines, 28 MB) and one.json (5 MB on one line). The deterministic driver;
// in the editor, these agree:
//   million.txt opens in the lines view: line 1 "line 0000000 of the million"; INFO's encoding UTF-8; the status line
//   "million.txt · N bytes · read-only"; no "over the read limit" line;
//   scrolled to the end, line 1,000,000 is "line 0999999 of the million" and line 1,000,001 is empty; scrolled to the
//   middle, the first line in sight holds its own number;
//   one.json's line 1 shows its first 2,000 characters, "[1,1,…", after a link "whole line ›" at the row's start, in
//   sight; the link opens the line reader, wrapped at the
//   view's width; scrolled to its end, it reads on until it holds the whole file's characters, its last row ending
//   "1]"; "back to the lines" returns to line 1;
//   server.jsonl: FILE_LINES_READ from 0, a middle page and 999,000; FILE_BYTES_READ for one.json from 65,536 on in
//   steps of 262,144.
// Screenshots go to runs/packaged/sprint-470-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const LINES = 1_000_000;
const numbered = (k: number) => `line ${String(k).padStart(7, "0")} of the million`;
const lineText = (win: Page, n: number) => win.evaluate(`(function () { var e = document.querySelector('[data-lines-view] [data-line-text="${n}"]'); return e ? e.textContent : null; })()`) as Promise<string | null>;
const lineShown = (win: Page, n: number) => win.evaluate(`(function () { return !!document.querySelector('[data-lines-view] [data-line-row="${n}"]'); })()`) as Promise<boolean>;
const infoEncoding = (win: Page) => win.evaluate(`(function () { var row = Array.from(document.querySelectorAll("[data-info-row]")).find(function (e) { return e.textContent.indexOf("encoding") === 0; }); return row ? row.textContent.replace(/^encoding/, "").trim() : null; })()`) as Promise<string | null>;
const statusPos = (win: Page) => win.evaluate(`(function () { var e = document.querySelector("[data-status-pos]"); return e ? e.textContent : null; })()`) as Promise<string | null>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 20_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(typeof v === "string" && v.length > 200 ? `${v.slice(0, 100)}…${v.slice(-100)}` : v)}`);
  return v;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-470-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-large-text-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "million.txt"), Array.from({ length: LINES }, (_, k) => numbered(k) + "\n").join(""));
  const json = "[" + "1,".repeat((5 * 1024 * 1024) / 2) + "1]";
  writeFileSync(join(repo, "one.json"), json);
  const millionSize = statSync(join(repo, "million.txt")).size;
  const launch = launchArgs();
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

    // 1. million.txt at its start.
    await win.locator('[data-tree-row="million.txt"]').first().click();
    const start = await until(win, "million.txt's line 1", () => lineText(win, 0), (t) => t === numbered(0));
    const encoding = await until(win, "INFO's encoding", () => infoEncoding(win), (e) => e === "UTF-8");
    const pos = await until(win, "the status line", () => statusPos(win), (t) => t === `million.txt · ${millionSize.toLocaleString("en-US")} bytes · read-only`);
    if (await win.locator("[data-editor-unreadable]").count()) throw new Error("the over-the-read-limit line is drawn");
    await win.screenshot({ path: join(shots, "million-start.png") });
    // 2. Its end.
    await win.evaluate(`(function () { var s = document.querySelector("[data-lines-view]"); s.scrollTop = s.scrollHeight; })()`);
    const end = await until(win, "million.txt's last numbered line", () => lineText(win, LINES - 1), (t) => t === numbered(LINES - 1));
    await until(win, "the empty line after the last break", () => lineText(win, LINES), (t) => t === "");
    await win.screenshot({ path: join(shots, "million-end.png") });
    // 3. Its middle.
    await win.evaluate(`(function () { var s = document.querySelector("[data-lines-view]"); s.scrollTop = (s.scrollHeight - s.clientHeight) / 2; })()`);
    await settled(win);
    const mid = await win.evaluate(`(function () { var e = document.querySelector("[data-lines-view] [data-line-row]"); return e ? Number(e.getAttribute("data-line-row")) : -1; })()`) as number;
    const midText = await until(win, `million.txt's line ${mid + 1}`, () => lineText(win, mid), (t) => t === numbered(mid));
    if (mid < 400_000 || mid > 600_000) throw new Error(`the middle scroll shows line ${mid + 1}`);
    await win.screenshot({ path: join(shots, "million-middle.png") });
    // 4. one.json: its first characters and the link, then the reader, read to the end.
    await win.locator('[data-tree-row="one.json"]').first().click();
    await until(win, "one.json's line 1, its start", () => lineText(win, 0), (t) => !!t && t.startsWith("[1,1,") && t.length === 2000);
    const link = (await win.locator('[data-lines-view] [data-line-more="0"]').first().boundingBox())!;
    const pane = (await win.locator("[data-lines-view]").first().boundingBox())!;
    if (link.x + link.width > pane.x + pane.width) throw new Error(`the link is out of sight: ${JSON.stringify(link)}`);
    await win.screenshot({ path: join(shots, "one-link.png") });
    await win.locator('[data-lines-view] [data-line-more="0"]').first().click();
    const reader = (attr: string) => win.evaluate(`(function () { var e = document.querySelector("[data-line-reader]"); return e ? e.getAttribute("${attr}") : null; })()`) as Promise<string | null>;
    const readerRow = (r: number) => win.evaluate(`(function () { var e = document.querySelector('[data-line-reader] [data-reader-row="${r}"]'); return e ? e.textContent : null; })()`) as Promise<string | null>;
    await until(win, "the reader's first row", () => readerRow(0), (t) => !!t && t.startsWith("[1,1,"));
    await win.evaluate(`(function () { var s = document.querySelector("[data-reader-scroll]"); s.scrollTop = s.scrollHeight; })()`);
    const chars = await until(win, "the line read to its end", () => reader("data-reader-more").then(async (m) => (m === "0" ? reader("data-reader-chars") : null)), (c) => c !== null, 60_000);
    if (Number(chars) !== json.length) throw new Error(`the reader holds ${String(chars)} characters, not the file's ${json.length}`);
    await win.evaluate(`(function () { var s = document.querySelector("[data-reader-scroll]"); s.scrollTop = s.scrollHeight; })()`);
    await settled(win);
    const lastRow = await win.evaluate(`(function () { var rows = document.querySelectorAll("[data-line-reader] [data-reader-row]"); return rows.length ? rows[rows.length - 1].textContent : null; })()`) as string | null;
    if (!lastRow || !lastRow.endsWith("1]")) throw new Error(`the reader's last row ${JSON.stringify(lastRow)}`);
    await win.screenshot({ path: join(shots, "one-whole.png") });
    await win.locator("[data-reader-close]").first().click();
    await until(win, "back to the lines", () => lineText(win, 0), (t) => !!t && t.startsWith("[1,1,"));
    const clicks = Math.ceil((json.length - 65_536) / 262_144);
    await app.close();

    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const pages = server.filter((r) => r.name === "FILE_LINES_READ").map((r) => Number(r.payload.from));
    if (!pages.includes(0) || !pages.includes(999_000) || !pages.some((p) => p > 0 && p < 999_000)) throw new Error(`FILE_LINES_READ from ${JSON.stringify(pages)}`);
    const pieces = server.filter((r) => r.name === "FILE_BYTES_READ").map((r) => Number(r.payload.offset));
    const want = Array.from({ length: clicks }, (_, k) => 65_536 + k * 262_144);
    if (JSON.stringify(pieces) !== JSON.stringify(want)) throw new Error(`FILE_BYTES_READ offsets ${JSON.stringify(pieces)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_large_text: ok — million.txt line 1 ${JSON.stringify(start)}, INFO ${encoding}, status ${JSON.stringify(pos)}; its end ${JSON.stringify(end)} then an empty line; the middle shows line ${mid + 1} ${JSON.stringify(midText)}; one.json's reader read on in ${clicks} pieces to its ${json.length} characters, last row ending "1]"; FILE_LINES_READ pages from ${JSON.stringify(pages)}; FILE_BYTES_READ ×${pieces.length}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_large_text: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
