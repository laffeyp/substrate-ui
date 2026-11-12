// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// File size changes nothing (sprint 471; the Architect, 2026-11-11: "There's no difference between editing a big file
// or a small file"). A repository written here holds million.txt (1,000,000 numbered lines, 28 MB) and big.bin (12 MB,
// a NUL byte first). The deterministic driver; in the editor, these agree:
//   million.txt opens in the code editor (no lines view); INFO's encoding UTF-8; the status line shows the caret and no
//   "read-only"; "Z" typed at the end of line 1 and ⌘S: the disk is the file with "Z" there and every other byte the
//   same; ⌘↓ brings "line 0999999 of the million" into view;
//   big.bin opens in hex, editable; "ff" typed over byte 0x10 and ⌘S: the disk's byte 0x10 is 0xff, every other byte
//   the same;
//   server.jsonl: FILE_READ utf8 and binary (never too_large); FILE_WRITTEN utf8, bytes.
// The time each file takes to open and to save is printed. Screenshots go to
// runs/packaged/sprint-471-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const LINES = 1_000_000;
const BIG = 12 * 1024 * 1024;
const numbered = (k: number) => `line ${String(k).padStart(7, "0")} of the million`;
const codeLines = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`) as Promise<string[]>;
const codeShown = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); return !!h && getComputedStyle(h).display !== "none"; })()`) as Promise<boolean>;
const infoEncoding = (win: Page) => win.evaluate(`(function () { var row = Array.from(document.querySelectorAll("[data-info-row]")).find(function (e) { return e.textContent.indexOf("encoding") === 0; }); return row ? row.textContent.replace(/^encoding/, "").trim() : null; })()`) as Promise<string | null>;
const statusPos = (win: Page) => win.evaluate(`(function () { var e = document.querySelector("[data-status-pos]"); return e ? e.textContent : null; })()`) as Promise<string | null>;
const row = (win: Page, path: string, r: number) => win.evaluate(`(function () { var e = document.querySelector('[data-bytes-view="${path}"] [data-bytes-row="${r}"]'); return e ? e.textContent : null; })()`) as Promise<string | null>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 60_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(Array.isArray(v) ? v.slice(0, 3) : v)}`);
  return v;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-471-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-any-size-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  const million = Buffer.from(Array.from({ length: LINES }, (_, k) => numbered(k) + "\n").join(""));
  writeFileSync(join(repo, "million.txt"), million);
  const big = Buffer.alloc(BIG); for (let k = 1; k < BIG; k++) big[k] = k % 251;
  writeFileSync(join(repo, "big.bin"), big);
  const disk = (name: string) => readFileSync(join(repo, name));
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

    // 1. million.txt in the code editor: typed and saved.
    let t0 = Date.now();
    await win.locator('[data-tree-row="million.txt"]').first().click();
    await until(win, "million.txt in the code", () => codeLines(win), (l) => l[0] === numbered(0));
    const openText = Date.now() - t0;
    if (!(await codeShown(win)) || (await win.locator("[data-lines-view]").count())) throw new Error("million.txt is not in the code editor");
    const encoding = await until(win, "INFO's encoding", () => infoEncoding(win), (e) => e === "UTF-8");
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("End");
    await win.keyboard.type("Z");
    await until(win, "line 1 typed", () => codeLines(win), (l) => l[0] === `${numbered(0)}Z`);
    const pos = await until(win, "the status line", () => statusPos(win), (t) => !!t && t.startsWith("million.txt · 1:") && !t.includes("read-only"));
    t0 = Date.now();
    await menu(app, "menu-save");
    const wantText = Buffer.concat([Buffer.from(numbered(0) + "Z"), million.subarray(numbered(0).length)]);
    await until(win, "million.txt saved", async () => disk("million.txt").length, (n) => n === wantText.length);
    const saveText = Date.now() - t0;
    if (!disk("million.txt").equals(wantText)) throw new Error("million.txt on disk is not the file with Z added");
    await win.keyboard.press("Meta+ArrowDown");
    await until(win, "the last numbered line in view", () => codeLines(win), (l) => l.includes(numbered(LINES - 1)));
    await win.screenshot({ path: join(shots, "million-end.png") });
    // 2. big.bin in hex: typed over and saved.
    t0 = Date.now();
    await win.locator('[data-tree-row="big.bin"]').first().click();
    await until(win, "big.bin editable in hex", () => win.evaluate(`(function () { var e = document.querySelector('[data-bytes-view="big.bin"]'); return e ? e.getAttribute("data-bytes-editable") : null; })()`) as Promise<string | null>, (e) => e === "1");
    const openBin = Date.now() - t0;
    const cell = win.locator('[data-bytes-view="big.bin"] [data-byte="16"]').first();
    await cell.waitFor({ timeout: 10_000 });
    const box = (await cell.boundingBox())!;
    await win.mouse.click(box.x + 2, box.y + box.height / 2);
    await win.keyboard.type("ff");
    await until(win, "big.bin row 1 typed", () => row(win, "big.bin", 1), (t) => !!t && t.startsWith("00000010  ff 11 12"));
    t0 = Date.now();
    await menu(app, "menu-save");
    await until(win, "big.bin saved", async () => disk("big.bin")[16], (b) => b === 0xff);
    const saveBin = Date.now() - t0;
    const wantBin = Buffer.from(big); wantBin[16] = 0xff;
    if (!disk("big.bin").equals(wantBin)) throw new Error("big.bin on disk differs in more than byte 0x10");
    await win.screenshot({ path: join(shots, "big-typed.png") });
    await app.close();

    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const reads = server.filter((r) => r.name === "FILE_READ").map((r) => String(r.payload.encoding));
    if (reads.includes("too_large")) throw new Error(`FILE_READ too_large: ${JSON.stringify(reads)}`);
    const written = server.filter((r) => r.name === "FILE_WRITTEN").map((r) => String(r.payload.encoding));
    if (JSON.stringify(written) !== JSON.stringify(["utf8", "bytes"])) throw new Error(`FILE_WRITTEN ${JSON.stringify(written)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_any_size: ok — million.txt (${million.length} bytes) opened in the code in ${openText} ms, INFO ${encoding}, status ${JSON.stringify(pos)}, "Z" saved in ${saveText} ms with every other byte the same, its last line in view; big.bin (${BIG} bytes) editable in hex in ${openBin} ms, byte 0x10 typed to ff and saved in ${saveBin} ms, no other byte changed; FILE_READ ${JSON.stringify(reads)}; FILE_WRITTEN ${JSON.stringify(written)}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_any_size: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
