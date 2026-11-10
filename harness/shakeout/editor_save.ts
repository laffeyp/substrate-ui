// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Saving from the editor (sprint 425; roadmap 2026-11-09-code-editor r8, E4 and its key table). A real
// repository: src/cart.ts (LF) and crlf.txt (CRLF). These agree, for each save, with the file's bytes on
// disk and the kernel record's FileWritten:
//   vim `:w` writes the buffer; `u` after the save still undoes (the buffer's history survives the save's
//   own read-back); File ▸ Save (⌘S) writes the undone text back;
//   crlf.txt saved from the editor keeps CRLF;
//   a file changed on disk behind the buffer: the save is refused (409), the buffer kept, the offer drawn
//   (the anchor's third row reads conflict); overwrite writes the buffer; a second time, reload takes the
//   disk's text and drops the buffer;
//   nano ⌃O writes;
//   refusals: ⌘S outside the editor (not_editor), ⌘W with no tab open (no_file);
//   after the session ended, typing and ⌘S still write the file, off the record (sprint 427: the editor is
//   an editor whether the session is on or off);
//   signals — EDITOR_FILE_SAVED vim_w, menu_s, vim_w (crlf), vim_w (overwrite), nano_save, menu_s (ended);
//   FILE_WRITTEN off_record for the last; EDITOR_SAVE_CONFLICTED
//   twice; EDITOR_CONFLICT_RESOLVED overwrite, reload; FILE_WRITTEN on the server per save; API_REFUSED files
//   409 twice.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, chooseBinding, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

async function lines(win: Page): Promise<string[]> {
  return win.evaluate(`(() => { var r = document.querySelector("[data-editor-code]").shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`);
}
const unsaved = (win: Page) => win.evaluate(`globalThis.__substrateEditor.getSnapshot().unsaved`) as Promise<string[]>;
async function until<T>(win: Page, what: string, read: () => Promise<T> | T, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-425-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-save-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  const base = Array.from({ length: 6 }, (_, i) => `export const line${i + 1} = ${i + 1};`).join("\n") + "\n";
  writeFileSync(join(repo, "src/cart.ts"), base);
  writeFileSync(join(repo, "crlf.txt"), "alpha\r\nbeta\r\n");
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
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    const cart = join(ws, "src/cart.ts");
    const disk = (f: string) => readFileSync(f, "utf8");

    // ⌘S outside the editor: refused.
    await menu(app, "menu-save");
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await until(win, "the file's lines", () => lines(win), (l) => l.length === 7);
    await chooseBinding(win, "vim"); // standard is the default (sprint 427); `:w` is vim's

    // vim `:w`.
    await win.locator("[data-editor-code] .cm-line", { hasText: "line2 = 2" }).first().click();
    await win.keyboard.type("0i// a ");
    await win.keyboard.press("Escape");
    await win.keyboard.type(":w");
    await win.keyboard.press("Enter");
    const saved1 = base.replace("export const line2", "// a export const line2");
    await until(win, "the disk after :w", () => disk(cart), (t) => t === saved1);
    await until(win, "unsaved after :w", () => unsaved(win), (u) => u.length === 0);
    // `u` after the save still undoes.
    await win.keyboard.type("u");
    await until(win, "u after the save", () => lines(win), (l) => l[1] === "export const line2 = 2;");
    await until(win, "unsaved after u", () => unsaved(win), (u) => JSON.stringify(u) === JSON.stringify(["src/cart.ts"]));
    // File ▸ Save writes the undone text back.
    await menu(app, "menu-save");
    await until(win, "the disk after ⌘S", () => disk(cart), (t) => t === base);

    // CRLF kept.
    await win.locator('[data-tree-row="crlf.txt"]').first().click();
    await until(win, "crlf.txt shown", () => lines(win), (l) => l[0] === "alpha");
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.type("A x");
    await win.keyboard.press("Escape");
    await win.keyboard.type(":w");
    await win.keyboard.press("Enter");
    await until(win, "crlf.txt on disk", () => disk(join(ws, "crlf.txt")), (t) => t === "alpha x\r\nbeta\r\n");

    // Stale, then overwrite.
    await win.locator('[data-editor-tab="src/cart.ts"]').first().click();
    await until(win, "cart.ts shown", () => lines(win), (l) => l[0] === "export const line1 = 1;");
    await win.locator("[data-editor-code] .cm-line", { hasText: "line3 = 3" }).first().click();
    await win.keyboard.type("0iB ");
    await win.keyboard.press("Escape");
    const behind = base.replace("line6 = 6", "line6 = 66");
    writeFileSync(cart, behind);
    await win.keyboard.type(":w");
    await win.keyboard.press("Enter");
    await win.locator("[data-save-conflict]").first().waitFor({ timeout: 10_000 });
    if (disk(cart) !== behind) throw new Error("a stale save wrote the file");
    const shot = join(shots, "conflict.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor3 || !px.anchor3.conflict) throw new Error(`the anchor's third row during the offer: ${JSON.stringify(px.anchor3)}`);
    const row3 = px.anchor3;
    await win.locator('[data-conflict-choice="overwrite"]').first().click();
    const mine = base.replace("export const line3", "B export const line3");
    await until(win, "the disk after overwrite", () => disk(cart), (t) => t === mine);
    await until(win, "the offer after overwrite", () => win.locator("[data-save-conflict]").count(), (n) => n === 0);

    // Stale, then reload.
    await win.locator("[data-editor-code] .cm-line", { hasText: "line4 = 4" }).first().click();
    await win.keyboard.type("0iC ");
    await win.keyboard.press("Escape");
    const behind2 = mine.replace("line5 = 5", "line5 = 55");
    writeFileSync(cart, behind2);
    await win.keyboard.type(":w");
    await win.keyboard.press("Enter");
    await win.locator("[data-save-conflict]").first().waitFor({ timeout: 10_000 });
    await win.locator('[data-conflict-choice="reload"]').first().click();
    await until(win, "the buffer after reload", () => lines(win), (l) => l.join("\n") === behind2); // a final newline is CodeMirror's empty last line
    await until(win, "unsaved after reload", () => unsaved(win), (u) => u.length === 0);
    if (disk(cart) !== behind2) throw new Error("reload wrote the file");

    // nano ⌃O.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-binding="nano"]').first().click();
    await win.keyboard.press("Escape");
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("Meta+ArrowLeft");
    await win.keyboard.type("N ");
    await win.keyboard.press("Control+o");
    await until(win, "the disk after ⌃O", () => disk(cart), (t) => t.startsWith("N export const line1"));
    const final = disk(cart);

    // ⌘W with no tab open: refused, the session lives.
    for (let i = 0; i < 2; i++) await menu(app, "menu-close-pane");
    await until(win, "the tabs closed", () => win.locator("[data-editor-tab]").count(), (n) => n === 0);
    await menu(app, "menu-close-pane");
    await settled(win);
    const live = await win.evaluate(() => !!(window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string | null } } } }).__vm.get(1).snapshot().sessionId);
    if (!live) throw new Error("⌘W with no tab open ended the session");
    // After the session ended: typing and ⌘S still write the file, off the record.
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await win.evaluate(async (s) => { await fetch(`/api/session/${encodeURIComponent(s)}/end`, { method: "POST" }); }, sid);
    await win.waitForFunction(() => !!(window as unknown as { __vm: { get(n: number): { snapshot(): { endedReason: unknown } } } }).__vm.get(1).snapshot().endedReason, undefined, { timeout: 15_000 });
    await settled(win);
    await until(win, "cart.ts shown after the end", () => lines(win), (l) => l[0].startsWith("N export const line1"));
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("Meta+ArrowLeft");
    await win.keyboard.type("E ");
    await menu(app, "menu-save");
    await until(win, "the disk after ⌘S in the ended session", () => disk(cart), (t) => t.startsWith("E N export const line1"));

    // The kernel record: each save is a FileWritten whose text is what the disk held after it.
    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { kind: string; payload: Record<string, unknown> }));
    const written = envs.filter((e) => e.kind === "FileWritten").map((e) => `${String(e.payload.path)}:${JSON.stringify(e.payload.new_text)}`);
    const wantWritten = [`src/cart.ts:${JSON.stringify(saved1)}`, `src/cart.ts:${JSON.stringify(base)}`, `crlf.txt:${JSON.stringify("alpha x\r\nbeta\r\n")}`, `src/cart.ts:${JSON.stringify(mine)}`, `src/cart.ts:${JSON.stringify(final)}`];
    if (JSON.stringify(written) !== JSON.stringify(wantWritten)) throw new Error(`the record's FileWritten: ${JSON.stringify(written)}; want ${JSON.stringify(wantWritten)}`);

    const recs = windowRecords(launch);
    const pick = (name: string, field: string) => recs.filter((r) => r.name === name).map((r) => String(r.payload[field]));
    const savedCmds = pick("EDITOR_FILE_SAVED", "command");
    if (JSON.stringify(savedCmds) !== JSON.stringify(["vim_w", "menu_s", "vim_w", "vim_w", "nano_save", "menu_s"])) throw new Error(`EDITOR_FILE_SAVED ${JSON.stringify(savedCmds)}`);
    const conflicts = recs.filter((r) => r.name === "EDITOR_SAVE_CONFLICTED").length;
    const resolved = pick("EDITOR_CONFLICT_RESOLVED", "choice");
    if (conflicts !== 2 || JSON.stringify(resolved) !== JSON.stringify(["overwrite", "reload"])) throw new Error(`conflicts ${conflicts}, resolved ${JSON.stringify(resolved)}`);
    const refused = recs.filter((r) => r.name === "EDITOR_KEY_REFUSED").map((r) => `${String(r.payload.key)}:${String(r.payload.reason)}`);
    for (const want of ["Meta+s:not_editor", "Meta+w:no_file"]) if (!refused.includes(want)) throw new Error(`EDITOR_KEY_REFUSED lacks ${want}: ${JSON.stringify(refused)}`);
    const named = recs.find((r) => r.proc_seq === row3.seq);
    if (!named || named.name !== "EDITOR_DRAWN" || named.payload.conflict !== true) throw new Error(`the third row names seq ${row3.seq}: ${named ? `${named.name} ${JSON.stringify(named.payload)}` : "missing"}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const writtenHow = server.filter((r) => r.name === "FILE_WRITTEN").map((r) => String(r.payload.written));
    const fileWritten = writtenHow.length;
    const stale = server.filter((r) => r.name === "API_REFUSED" && r.payload.area === "files" && r.payload.status === 409).length;
    if (fileWritten !== 6 || writtenHow[5] !== "off_record" || writtenHow.slice(0, 5).some((w) => w !== "at_rest") || stale !== 2) throw new Error(`server.jsonl: FILE_WRITTEN ${JSON.stringify(writtenHow)}, API_REFUSED files 409 ${stale}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_save: ok — :w, u after it, ⌘S, CRLF kept, stale→overwrite, stale→reload, nano ⌃O: 5 FileWritten on the record = the disk after each; EDITOR_FILE_SAVED ${savedCmds.join(", ")}; conflicts 2 resolved ${resolved.join(", ")}; refused ${refused.join(", ")}; anchor row 3 conflict at seq ${row3.seq}; server FILE_WRITTEN 5 at_rest + 1 off_record, 409 ×2; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_save: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
