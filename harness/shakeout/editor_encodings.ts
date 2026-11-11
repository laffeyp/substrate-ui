// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A text file in any encoding opens as text (sprint 462; roadmap r13 E14). A repository written here holds latin.txt
// (Latin-1 bytes), wide.txt (UTF-16 with its mark), bom.txt (UTF-8 with its mark), plain.txt (UTF-8) and img.bin (a NUL
// byte); the deterministic driver. In the editor, these agree:
//   each text file shows "café crème"; INFO's encoding reads "Latin-1", "UTF-16", "UTF-8 with BOM", "UTF-8" (sprint
//   465: every file edits, so none is named read-only; editing each is editor_edit_any_file's);
//   plain.txt takes a character and saves;
//   img.bin opens as its bytes (sprint 463), not as text;
//   server.jsonl: FILE_READ encoding latin1, utf16, utf8_bom, utf8, binary among the reads; window-1.jsonl: no
//   EDITOR_KEY_REFUSED, EDITOR_FILE_SAVED once; latin.txt's bytes unchanged on disk.
// A screenshot of latin.txt with INFO goes to runs/packaged/sprint-462-<stamp>-<source|packaged>/.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const WORDS = "café crème";
// The code's lines joined: a file that ends in a newline draws an empty last line.
const SHOWN = `${WORDS}\n`;
const codeText = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }).join("\\n") : ""; })()`) as Promise<string>;
const infoEncoding = (win: Page) => win.evaluate(`(function () { var row = Array.from(document.querySelectorAll("[data-info-row]")).find(function (e) { return e.textContent.indexOf("encoding") === 0; }); return row ? row.textContent.replace(/^encoding/, "").trim() : null; })()`) as Promise<string | null>;
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
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-462-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-encodings-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  const latin = Buffer.from(`${WORDS}\n`, "latin1");
  writeFileSync(join(repo, "latin.txt"), latin);
  writeFileSync(join(repo, "wide.txt"), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(`${WORDS}\n`, "utf16le")]));
  writeFileSync(join(repo, "bom.txt"), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(`${WORDS}\n`, "utf8")]));
  writeFileSync(join(repo, "plain.txt"), `${WORDS}\n`);
  writeFileSync(join(repo, "img.bin"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
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
    const open = async (name: string) => { await win.locator(`[data-tree-row="${name}"]`).first().click(); };

    const seen: Record<string, string | null> = {};
    for (const [name, want] of [["latin.txt", "Latin-1"], ["wide.txt", "UTF-16"], ["bom.txt", "UTF-8 with BOM"], ["plain.txt", "UTF-8"]] as const) {
      await open(name);
      seen[name] = await until(win, `${name}'s encoding`, () => infoEncoding(win), (e) => e === want);
      await until(win, `${name}'s text`, () => codeText(win), (t) => t === SHOWN);
    }
    await open("latin.txt");
    await until(win, "latin.txt placed again", () => infoEncoding(win), (e) => e === "Latin-1");
    await win.screenshot({ path: join(shots, "latin.png") });
    // plain.txt: as before, typed and saved. The files hold the same words, so the text alone does not show which file
    // is placed; INFO names its encoding.
    await open("plain.txt");
    await until(win, "plain.txt placed again", () => infoEncoding(win), (e) => e === "UTF-8");
    await until(win, "plain.txt again", () => codeText(win), (t) => t === SHOWN);
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("End");
    await win.keyboard.type("Z");
    await until(win, "plain.txt typed", () => codeText(win), (t) => t === `${WORDS}Z\n`);
    await menu(app, "menu-save");
    await until(win, "plain.txt saved", async () => readFileSync(join(repo, "plain.txt"), "utf8"), (t) => t === `${WORDS}Z\n`);
    // img.bin: its line, as before.
    await open("img.bin");
    await until(win, "img.bin's bytes", () => win.locator('[data-bytes-view="img.bin"]').count(), (n) => n === 1);
    await app.close();

    if (!readFileSync(join(repo, "latin.txt")).equals(latin)) throw new Error("latin.txt changed on disk");
    const recs = windowRecords(launch);
    const refused = recs.filter((r) => r.name === "EDITOR_KEY_REFUSED").map((r) => `${String(r.payload.key)}:${String(r.payload.reason)}`);
    if (refused.length) throw new Error(`EDITOR_KEY_REFUSED ${JSON.stringify(refused)}`);
    const saved = recs.filter((r) => r.name === "EDITOR_FILE_SAVED").length;
    if (saved !== 1) throw new Error(`EDITOR_FILE_SAVED ×${saved}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const reads = new Set(server.filter((r) => r.name === "FILE_READ").map((r) => String(r.payload.encoding)));
    for (const e of ["latin1", "utf16", "utf8_bom", "utf8", "binary"]) if (!reads.has(e)) throw new Error(`no FILE_READ ${e}: ${JSON.stringify([...reads])}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_encodings: ok — "${WORDS}" in each: ${JSON.stringify(seen)}; latin.txt's bytes unchanged; no key refused; plain.txt typed and saved; img.bin as its bytes; FILE_READ ${JSON.stringify([...reads])}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_encodings: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
