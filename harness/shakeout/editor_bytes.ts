// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Every file that is not text opens as its bytes, at any size (sprint 463; roadmap r13 E14; the Architect, 2026-11-11).
// A repository written here holds pic.jpg (a JPEG header and 600 KB), sound.wav (a RIFF/WAVE header and bytes) and
// big.bin (12 MB, each 16-byte row holding its own offset). The deterministic driver; in the editor, these agree:
//   pic.jpg opens in hex: "00000000  ff d8 ff e0 …"; picking binary and octal in the status line redraws row 0
//   as xxd -b and od -b print it; picking text shows the code, its first line the bytes as Latin-1 (sprint 468: a file
//   up to the read limit is the code's buffer in its text form);
//   sound.wav opens in hex, its text column "|RIFF….WAVEfmt |";
//   big.bin, six times the old 2 MB limit, opens; scrolled to its end, the last row is offset 0xbffff0 with those
//   bytes; scrolled to its middle, the row there holds its own offset;
//   no "binary file" or "over the read limit" line;
//   window-1.jsonl: EDITOR_BYTES_VIEWED hex open, binary, octal, text by selector, hex open, hex open. Sprint 471: every
//   file is the editor's buffer at any size, so big.bin's rows come from it, editable, and no piece is read from the
//   server (no FILE_BYTES_READ).
// Screenshots go to runs/packaged/sprint-463-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const BIG = 12 * 1024 * 1024;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
const row = (win: Page, path: string, r: number) => win.evaluate(`(function () { var e = document.querySelector('[data-bytes-view="${path}"] [data-bytes-row="${r}"]'); return e ? e.textContent : null; })()`) as Promise<string | null>;
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const codeLines = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`) as Promise<string[]>;
const hexOf = (n: number) => n.toString(16).padStart(8, "0");

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-463-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-bytes-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  const filler = Buffer.alloc(600 * 1024); for (let k = 0; k < filler.length; k++) filler[k] = k % 251;
  writeFileSync(join(repo, "pic.jpg"), Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.from("JFIF\0"), filler]));
  const wavHead = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0x24, 0x08, 0x00, 0x00]), Buffer.from("WAVEfmt ")]);
  writeFileSync(join(repo, "sound.wav"), Buffer.concat([wavHead, Buffer.alloc(4096)]));
  const big = Buffer.alloc(BIG); for (let off = 0; off < BIG; off += 16) big.writeUInt32BE(off, off + 12);
  writeFileSync(join(repo, "big.bin"), big);
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

    // 1, 2. pic.jpg in each form.
    await win.locator('[data-tree-row="pic.jpg"]').first().click();
    const forms: Record<string, string | null> = {};
    forms.hex = await until(win, "pic.jpg in hex", () => row(win, "pic.jpg", 0), (t) => !!t && t.startsWith("00000000  ff d8 ff e0 00 10 4a 46  49 46 00 00 01 02 03 04  |......JFIF......|"));
    await win.screenshot({ path: join(shots, "pic-hex.png") });
    const want: Record<string, string> = { binary: "00000000: 11111111 11011000 11111111 11100000 00000000 00010000  ......", octal: "0000000   377 330 377 340 000 020 112 106 111 106 000 000 001 002 003 004" };
    for (const f of ["binary", "octal"]) {
      await win.locator(`[data-bytes-form-pick="${f}"]`).first().click();
      forms[f] = await until(win, `pic.jpg in ${f}`, () => row(win, "pic.jpg", 0), (t) => !!t && t.startsWith(want[f]));
      await win.screenshot({ path: join(shots, `pic-${f}.png`) });
    }
    await win.locator('[data-bytes-form-pick="text"]').first().click();
    forms.text = (await until(win, "pic.jpg in text, as the code", () => codeLines(win), (l) => !!l[0] && l[0].startsWith("ÿØÿà") && l[0].includes("JFIF")))[0];
    await win.screenshot({ path: join(shots, "pic-text.png") });
    // 3. sound.wav, hex.
    await win.locator('[data-tree-row="sound.wav"]').first().click();
    const wav = await until(win, "sound.wav in hex", () => row(win, "sound.wav", 0), (t) => !!t && t.endsWith("|RIFF$...WAVEfmt |"));
    // 4. big.bin: the end and the middle.
    await win.locator('[data-tree-row="big.bin"]').first().click();
    await until(win, "big.bin open", () => row(win, "big.bin", 0), (t) => !!t && t.startsWith("00000000  00 00 00 00"));
    const lastRow = BIG / 16 - 1, lastOff = BIG - 16;
    await win.evaluate(`(function () { var s = document.querySelector('[data-bytes-view="big.bin"]'); s.scrollTop = s.scrollHeight; })()`);
    const end = await until(win, "big.bin's last row", () => row(win, "big.bin", lastRow), (t) => !!t && t.startsWith(`${hexOf(lastOff)}  00 00 00 00 00 00 00 00  00 00 00 00 00 bf ff f0`));
    await win.screenshot({ path: join(shots, "big-end.png") });
    await win.evaluate(`(function () { var s = document.querySelector('[data-bytes-view="big.bin"]'); s.scrollTop = (s.scrollHeight - s.clientHeight) / 2; })()`);
    await settled(win);
    const midRow = await win.evaluate(`(function () { var s = document.querySelector('[data-bytes-view="big.bin"]'); var e = s.querySelector("[data-bytes-row]"); return e ? Number(e.getAttribute("data-bytes-row")) : -1; })()`) as number;
    const midText = await until(win, "big.bin's middle row", () => row(win, "big.bin", midRow), (t) => !!t && !t.includes("…") && t.startsWith(hexOf(midRow * 16)));
    const midBytes = (midRow * 16).toString(16).padStart(8, "0").match(/../g)!.join(" ");
    if (!midText || !midText.includes(midBytes)) throw new Error(`big.bin row ${midRow} does not hold its offset: ${midText}`);
    // 5. No line in place of a file.
    if (await win.locator("[data-editor-unreadable]").count()) throw new Error("an unreadable line is drawn");
    await app.close();

    const recs = windowRecords(launch);
    const viewed = recs.filter((r) => r.name === "EDITOR_BYTES_VIEWED").map((r) => `${String(r.payload.form)}:${String(r.payload.how)}`);
    if (JSON.stringify(viewed) !== JSON.stringify(["hex:open", "binary:selector", "octal:selector", "text:selector", "hex:open", "hex:open"])) throw new Error(`EDITOR_BYTES_VIEWED ${JSON.stringify(viewed)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const reads = server.filter((r) => r.name === "FILE_BYTES_READ").map((r) => Number(r.payload.offset));
    if (reads.length) throw new Error(`pieces read from the server: ${JSON.stringify(reads.slice(-6))}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_bytes: ok — pic.jpg row 0 in hex ${JSON.stringify(forms.hex?.slice(0, 40))}, binary, octal and text as the tools print them; sound.wav ${JSON.stringify(wav?.slice(-18))}; big.bin (12 MB) opened, its last row ${JSON.stringify(end?.slice(0, 58))}, its middle row ${midRow} holds its offset; EDITOR_BYTES_VIEWED ${JSON.stringify(viewed)}; FILE_BYTES_READ ×${reads.length}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_bytes: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
