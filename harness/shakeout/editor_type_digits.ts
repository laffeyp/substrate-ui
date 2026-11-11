// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Hex, binary and octal edit by typing over a digit (sprint 468; roadmap r13 E14; the Architect, 2026-11-11: every
// file editable by hand). A repository written here holds blob.bin (256 bytes, 0 to 255, committed) and big.bin
// (3 MB, a NUL byte first, over the read limit). The deterministic driver; in the editor, these agree:
//   blob.bin opens in hex, editable, the status line "blob.bin · 0x0 · 256 bytes";
//   "42" typed over byte 0x41: row 4 "00000040  40 42 42 43", 0x41 marked changed, the tab's dot, the status "0x42";
//   in binary "01000100" over 0x42: row 11 "00000042: 01000100"; in octal "105" over 0x43: row 4 "0000100   100 102
//   104 105"; Undo puts 0x43 back (103) and keeps 0x42 (104); in text the code's line 2 holds "@BDCDE"; in hex "45"
//   over 0x43;
//   ⌘S: the disk is the 256 bytes with 0x41, 0x42, 0x43 now 0x42, 0x44, 0x45, no other byte changed; no byte marked
//   changed, the dot gone;
//   big.bin opens in hex, not editable, "read-only" in the status line; "f" typed changes nothing on disk;
//   server.jsonl: FILE_WRITTEN encoding bytes once; window-1.jsonl: EDITOR_BYTES_VIEWED hex open, binary, octal, text,
//   hex by selector, hex open; EDITOR_FILE_SAVED once; no EDITOR_KEY_REFUSED.
// Screenshots go to runs/packaged/sprint-468-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const BLOB = Buffer.from(Array.from({ length: 256 }, (_, k) => k));
const BIG = 3 * 1024 * 1024;
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const row = (win: Page, path: string, r: number) => win.evaluate(`(function () { var e = document.querySelector('[data-bytes-view="${path}"] [data-bytes-row="${r}"]'); return e ? e.textContent : null; })()`) as Promise<string | null>;
const attr = (win: Page, sel: string, name: string) => win.evaluate(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); return e ? e.getAttribute(${JSON.stringify(name)}) : null; })()`) as Promise<string | null>;
const count = (win: Page, sel: string) => win.evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>;
const statusPos = (win: Page) => win.evaluate(`(function () { var e = document.querySelector("[data-status-pos]"); return e ? e.textContent : null; })()`) as Promise<string | null>;
const codeLines = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`) as Promise<string[]>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-468-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-type-digits-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "blob.bin"), BLOB);
  const big = Buffer.alloc(BIG); big[1] = 0x41;
  writeFileSync(join(repo, "big.bin"), big);
  git(repo, "add", "blob.bin"); git(repo, "commit", "-q", "-m", "base");
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
    const view = '[data-bytes-view="blob.bin"]';
    /** A click on the left edge of a byte's cell: its first digit. */
    const clickByte = async (offset: number) => {
      const cell = win.locator(`${view} [data-byte="${offset}"]`).first();
      await cell.waitFor({ timeout: 10_000 });
      const box = (await cell.boundingBox())!;
      await win.mouse.click(box.x + 2, box.y + box.height / 2);
    };
    const pick = async (form: string) => { await win.locator(`[data-bytes-form-pick="${form}"]`).first().click(); await until(win, `${form} picked`, () => attr(win, view, "data-bytes-form"), (f) => f === form); };

    // 1. blob.bin in hex, editable.
    await win.locator('[data-tree-row="blob.bin"]').first().click();
    await until(win, "blob.bin editable in hex", () => attr(win, view, "data-bytes-editable"), (e) => e === "1");
    const opened = await until(win, "the status line", () => statusPos(win), (t) => t === "blob.bin · 0x0 · 256 bytes");
    // 2. Hex: "42" over 0x41.
    await clickByte(0x41);
    await until(win, "the caret on 0x41", () => statusPos(win), (t) => !!t && t.includes("0x41"));
    await win.keyboard.type("42");
    const hexRow = await until(win, "hex row 4 typed", () => row(win, "blob.bin", 4), (t) => !!t && t.startsWith("00000040  40 42 42 43"));
    if ((await attr(win, `${view} [data-byte="65"]`, "data-changed")) !== "1") throw new Error("byte 0x41 is not marked changed");
    await until(win, "the tab's dot", () => count(win, '[data-editor-tab-unsaved="blob.bin"]'), (n) => n === 1);
    await until(win, "the caret moved on", () => statusPos(win), (t) => !!t && t.includes("0x42"));
    await win.screenshot({ path: join(shots, "hex-typed.png") });
    // 3. Binary: "01000100" over 0x42.
    await pick("binary");
    await clickByte(0x42);
    await win.keyboard.type("01000100");
    const binRow = await until(win, "binary row 11 typed", () => row(win, "blob.bin", 11), (t) => !!t && t.startsWith("00000042: 01000100 01000011"));
    await win.screenshot({ path: join(shots, "binary-typed.png") });
    // 4. Octal: "105" over 0x43, then Undo.
    await pick("octal");
    await clickByte(0x43);
    await win.keyboard.type("105");
    const octRow = await until(win, "octal row 4 typed", () => row(win, "blob.bin", 4), (t) => !!t && t.startsWith("0000100   100 102 104 105 104"));
    await win.screenshot({ path: join(shots, "octal-typed.png") });
    await menu(app, "menu-undo");
    const undone = await until(win, "octal row 4 after Undo", () => row(win, "blob.bin", 4), (t) => !!t && t.startsWith("0000100   100 102 104 103 104"));
    // 5. Text: the same buffer; then hex, "45" over 0x43.
    await pick("text");
    const line2 = await until(win, "the code's line 2", () => codeLines(win), (l) => l.length === 2 && l[1].includes("@BDCDE"));
    await pick("hex");
    await clickByte(0x43);
    await win.keyboard.type("45");
    await until(win, "hex row 4 typed again", () => row(win, "blob.bin", 4), (t) => !!t && t.startsWith("00000040  40 42 44 45 44 45"));
    // 6. ⌘S.
    await menu(app, "menu-save");
    const want = Buffer.from(BLOB); want[0x41] = 0x42; want[0x42] = 0x44; want[0x43] = 0x45;
    await until(win, "blob.bin saved", async () => disk("blob.bin").toString("hex"), (h) => h === want.toString("hex"));
    await until(win, "no byte marked changed", () => count(win, `${view} [data-changed]`), (n) => n === 0);
    await until(win, "the tab's dot gone", () => count(win, '[data-editor-tab-unsaved="blob.bin"]'), (n) => n === 0);
    await win.screenshot({ path: join(shots, "saved.png") });
    // 7. big.bin, over the read limit: read-only.
    const bigSha = sha(disk("big.bin"));
    await win.locator('[data-tree-row="big.bin"]').first().click();
    await until(win, "big.bin in hex", () => row(win, "big.bin", 0), (t) => !!t && t.startsWith("00000000  00 41 00 00"));
    if ((await attr(win, '[data-bytes-view="big.bin"]', "data-bytes-editable")) !== "0") throw new Error("big.bin's view is editable");
    const bigStatus = await until(win, "big.bin's status line", () => statusPos(win), (t) => !!t && t.endsWith("read-only"));
    await win.locator('[data-bytes-view="big.bin"] [data-bytes-row="0"]').first().click();
    await win.keyboard.type("f");
    await settled(win);
    if (sha(disk("big.bin")) !== bigSha) throw new Error("big.bin changed on disk");
    await app.close();

    const recs = windowRecords(launch);
    const viewed = recs.filter((r) => r.name === "EDITOR_BYTES_VIEWED").map((r) => `${String(r.payload.form)}:${String(r.payload.how)}`);
    if (JSON.stringify(viewed) !== JSON.stringify(["hex:open", "binary:selector", "octal:selector", "text:selector", "hex:selector", "hex:open"])) throw new Error(`EDITOR_BYTES_VIEWED ${JSON.stringify(viewed)}`);
    const saved = recs.filter((r) => r.name === "EDITOR_FILE_SAVED").length;
    if (saved !== 1) throw new Error(`EDITOR_FILE_SAVED ×${saved}`);
    const refused = recs.filter((r) => r.name === "EDITOR_KEY_REFUSED").length;
    if (refused) throw new Error(`EDITOR_KEY_REFUSED ×${refused}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const written = server.filter((r) => r.name === "FILE_WRITTEN").map((r) => String(r.payload.encoding));
    if (JSON.stringify(written) !== JSON.stringify(["bytes"])) throw new Error(`FILE_WRITTEN ${JSON.stringify(written)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_type_digits: ok — opened ${JSON.stringify(opened)}; hex ${JSON.stringify(hexRow?.slice(0, 30))}; binary ${JSON.stringify(binRow?.slice(0, 28))}; octal ${JSON.stringify(octRow?.slice(0, 30))}, after Undo ${JSON.stringify(undone?.slice(0, 30))}; text line 2 holds "@BDCDE" (${line2[1].length} characters); saved: 0x41, 0x42, 0x43 now 0x42, 0x44, 0x45, no other byte changed; big.bin ${JSON.stringify(bigStatus)}, unchanged; EDITOR_BYTES_VIEWED ${JSON.stringify(viewed)}; FILE_WRITTEN ${JSON.stringify(written)}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_type_digits: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
