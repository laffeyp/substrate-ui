// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Every file edits as text and saves as it is (sprint 465; roadmap r13 E14; the Architect, 2026-11-11: every file
// editable by hand, by default). A repository written here holds latin.txt (Latin-1), wide.txt (UTF-16 LE with its
// mark) and blob.bin (256 bytes, every value 0 to 255 once, `\r` and `\n` among them). The deterministic driver; in the
// editor, these agree:
//   latin.txt: "ñ" typed at the end of line 1 and saved: the disk holds "café crèmeñ\n" in Latin-1 bytes;
//   wide.txt: "Z" typed and saved: the disk holds the text with "Z", UTF-16 LE, its mark kept;
//   blob.bin: text picked in the status line: the code shows the bytes as two lines (one `\n` byte), control bytes as
//   markers; saved unchanged: the disk's sha256 is the same; the character after byte 0x40 replaced by "B" and
//   saved: the disk is the 256 bytes with byte 0x41 now 0x42, every other byte the same;
//   server.jsonl: FILE_WRITTEN encoding latin1, utf16, bytes, bytes in order; window-1.jsonl: no EDITOR_KEY_REFUSED,
//   EDITOR_FILE_SAVED ×4.
// Screenshots go to runs/packaged/sprint-465-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const WORDS = "café crème";
const BLOB = Buffer.from(Array.from({ length: 256 }, (_, k) => k));
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const codeLines = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`) as Promise<string[]>;
const specials = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? r.querySelectorAll(".cm-specialChar").length : 0; })()`) as Promise<number>;
const infoEncoding = (win: Page) => win.evaluate(`(function () { var row = Array.from(document.querySelectorAll("[data-info-row]")).find(function (e) { return e.textContent.indexOf("encoding") === 0; }); return row ? row.textContent.replace(/^encoding/, "").trim() : null; })()`) as Promise<string | null>;
const statusPos = (win: Page) => win.evaluate(`(function () { var e = document.querySelector("[data-status-pos]"); return e ? e.textContent : null; })()`) as Promise<string | null>;
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
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-465-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-edit-any-file-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "latin.txt"), Buffer.from(`${WORDS}\n`, "latin1"));
  const MARK = Buffer.from([0xff, 0xfe]);
  writeFileSync(join(repo, "wide.txt"), Buffer.concat([MARK, Buffer.from(`${WORDS}\n`, "utf16le")]));
  writeFileSync(join(repo, "blob.bin"), BLOB);
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const disk = (name: string) => readFileSync(join(repo, name));
  const launch = launchArgs();
  const traces = join(launch.state, "electron", "logs", "traces");
  const serverRecs = () => {
    const boot = readdirSync(traces).sort().pop()!;
    return { boot, recs: readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }) };
  };
  const writes = async () => serverRecs().recs.filter((r) => r.name === "FILE_WRITTEN").length;
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
    const open = async (name: string) => { await win.locator(`[data-tree-row="${name}"]`).first().click(); };
    const typeAtEnd = async (text: string) => {
      await win.locator("[data-editor-code] .cm-line").first().click();
      await win.keyboard.press("End");
      await win.keyboard.type(text);
    };

    // 1. latin.txt. The two text files hold the same words; INFO's encoding says which is placed.
    await open("latin.txt");
    await until(win, "latin.txt placed", () => infoEncoding(win), (e) => e === "Latin-1");
    await until(win, "latin.txt's text", () => codeLines(win), (l) => l[0] === WORDS);
    await typeAtEnd("ñ");
    await until(win, "latin.txt typed", () => codeLines(win), (l) => l[0] === `${WORDS}ñ`);
    await menu(app, "menu-save");
    const latinWant = Buffer.from(`${WORDS}ñ\n`, "latin1");
    await until(win, "latin.txt saved in Latin-1", async () => disk("latin.txt").toString("hex"), (h) => h === latinWant.toString("hex"));
    // 2. wide.txt.
    await open("wide.txt");
    await until(win, "wide.txt placed", () => infoEncoding(win), (e) => e === "UTF-16");
    await until(win, "wide.txt's text", () => codeLines(win), (l) => l[0] === WORDS);
    await typeAtEnd("Z");
    await until(win, "wide.txt typed", () => codeLines(win), (l) => l[0] === `${WORDS}Z`);
    await menu(app, "menu-save");
    const wideWant = Buffer.concat([MARK, Buffer.from(`${WORDS}Z\n`, "utf16le")]);
    await until(win, "wide.txt saved in UTF-16 LE with its mark", async () => disk("wide.txt").toString("hex"), (h) => h === wideWant.toString("hex"));
    // 3. blob.bin in its text form.
    await open("blob.bin");
    await until(win, "blob.bin's bytes", () => win.locator('[data-bytes-view="blob.bin"]').count(), (n) => n === 1);
    await win.locator('[data-bytes-form-pick="text"]').first().click();
    await until(win, "blob.bin placed as text", () => infoEncoding(win), (e) => e === "binary");
    const lines = await until(win, "blob.bin as two lines of characters", () => codeLines(win), (l) => l.length === 2 && l[1].includes("ABCDEFGHIJKLMNOPQRSTUVWXYZ") && l[1].endsWith("ýþÿ"));
    const marks = await until(win, "blob.bin's control bytes as markers", () => specials(win), (n) => n > 0);
    const pos = await until(win, "the status line in text form", () => statusPos(win), (t) => !!t && t.includes("256 bytes") && !t.includes("read-only"));
    await win.screenshot({ path: join(shots, "blob-text.png") });
    // Saved unchanged: the same bytes.
    await win.locator("[data-editor-code] .cm-line").first().click();
    await menu(app, "menu-save");
    await until(win, "blob.bin's first save", writes, (n) => n === 3);
    if (sha(disk("blob.bin")) !== sha(BLOB)) throw new Error("blob.bin saved unchanged is not the same bytes");
    // "A" (byte 0x41) to "B": from the start of the file each character is one byte, so 66 steps right puts the caret
    // after it.
    await win.keyboard.press("Meta+ArrowUp");
    for (let k = 0; k < 0x42; k++) await win.keyboard.press("ArrowRight");
    await win.keyboard.press("Backspace");
    await win.keyboard.type("B");
    await until(win, "blob.bin typed", () => codeLines(win), (l) => l.length === 2 && l[1].includes("@BBCDEF"));
    await menu(app, "menu-save");
    const blobWant = Buffer.from(BLOB); blobWant[0x41] = 0x42;
    await until(win, "blob.bin saved byte for byte", async () => disk("blob.bin").toString("hex"), (h) => h === blobWant.toString("hex"));
    await win.screenshot({ path: join(shots, "blob-edited.png") });
    await app.close();

    const recs = windowRecords(launch);
    const refused = recs.filter((r) => r.name === "EDITOR_KEY_REFUSED").map((r) => `${String(r.payload.key)}:${String(r.payload.reason)}`);
    if (refused.length) throw new Error(`EDITOR_KEY_REFUSED ${JSON.stringify(refused)}`);
    const saved = recs.filter((r) => r.name === "EDITOR_FILE_SAVED").length;
    if (saved !== 4) throw new Error(`EDITOR_FILE_SAVED ×${saved}`);
    const { boot, recs: server } = serverRecs();
    const written = server.filter((r) => r.name === "FILE_WRITTEN").map((r) => String(r.payload.encoding));
    if (JSON.stringify(written) !== JSON.stringify(["latin1", "utf16", "bytes", "bytes"])) throw new Error(`FILE_WRITTEN encodings ${JSON.stringify(written)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_edit_any_file: ok — latin.txt saved as ${latinWant.toString("hex")} (Latin-1); wide.txt saved as UTF-16 LE with its mark (${wideWant.length} bytes); blob.bin in text form as ${lines.length} lines with ${marks} control markers, status ${JSON.stringify(pos)}; saved unchanged with the same sha256; byte 0x41 now 0x42 and no other byte changed; FILE_WRITTEN ${JSON.stringify(written)}; EDITOR_FILE_SAVED ×${saved}; no key refused; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_edit_any_file: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
