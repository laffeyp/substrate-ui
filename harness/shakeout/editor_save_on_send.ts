// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Save before send (sprint 444; roadmap r13 E10.0; SAVE-BEFORE-SEND-2026-11-10; the Architect, 2026-11-10: what is
// on screen is what the model sees). A repository written here, src/cart.ts, src/menu.ts and src/tax.ts; the live
// roster's model (EDITOR_LIVE_MODEL overrides). Multi-line edits left unsaved in all three (the Architect,
// 2026-11-10: "complicated multi-line edits"): in cart.ts a line replaced by two, a line deleted, a function added at
// the end; in menu.ts, a CRLF file, two lines inserted and the last deleted; in tax.ts two lines inserted, then tax.ts
// changed on disk behind its buffer. A message sent from the editor's terminal asks the model to read cart.ts. These
// agree:
//   the disk holds cart.ts's and menu.ts's buffers line for line (menu.ts with its CRLF kept), and tax.ts's change on
//   disk, not its buffer; each send save's FileWritten.new_text equals the disk;
//   the record holds two FileWritten with view send, for cart.ts and menu.ts, before the message's UserMessage;
//   the model's read_file of cart.ts, after them, returns the new lines and not the deleted one;
//   the transcript's row after the message is the one warning naming tax.ts, and the centre draws tax.ts's offer
//   to reload or overwrite; the unsaved list holds tax.ts alone; the activity tab names menu.ts, whose latest touch is
//   its save, "saved with the message" (cart.ts's latest is the model's read);
//   signals — EDITOR_SAVED_FOR_SEND files 2 refused 1, then TURN_SUBMITTED saved 2 (the first turn's saved 0);
//   EDITOR_SAVE_CONFLICTED once; the server's FILE_WRITTEN twice and one API_REFUSED files 409.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const MODEL = process.env.EDITOR_LIVE_MODEL || undefined;
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
type Row = { seq: number; role: string; text: string };
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
const transcript = (win: Page) => win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { transcript: { seq: number; role: string; text: string }[] } } } }).__vm.get(1).snapshot().transcript.map((r) => ({ seq: r.seq, role: r.role, text: r.text }))) as Promise<Row[]>;
const active = (win: Page) => win.evaluate(`globalThis.__substrateEditor.getSnapshot().active`) as Promise<string | null>;
const unsaved = (win: Page) => win.evaluate(`globalThis.__substrateEditor.getSnapshot().unsaved.slice()`) as Promise<string[]>;

const lines = (win: Page) => win.evaluate(`(function () { var r = document.querySelector("[data-editor-code]").shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`) as Promise<string[]>;

const FILES: Record<string, { lines: string[]; eol: string }> = {
  "src/cart.ts": { eol: "\n", lines: ["export const total = 1;", "export function add(a: number, b: number): number {", "  return a + b;", "}", "export const tax = 0.2;", "export function price(n: number): number {", "  return n * (1 + tax);", "}"] },
  "src/menu.ts": { eol: "\r\n", lines: ["export const tea = 450;", "export const coffee = 300;", "export const cake = 520;", "export const bun = 210;"] },
  "src/tax.ts": { eol: "\n", lines: ["export const rate = 0.2;", "export const band = 1;"] },
};
const fileText = (rel: string) => FILES[rel].lines.join(FILES[rel].eol) + FILES[rel].eol;
const ON_DISK = "export const rate = 0.25; // changed on disk\n";
const ASK = "Use read_file on src/cart.ts. Then reply done.";

// CodeMirror's own keys (defaultKeymap): ⌘↑ the document's start, ⌘→ a line's end, ⌘↓ the document's end, ⇧⌘K delete
// the line. Enter indents as the language does, so the gate reads the buffer back rather than predicting it.
async function lineEnd(win: Page, n: number): Promise<void> {
  await win.keyboard.press("Meta+ArrowUp");
  for (let i = 1; i < n; i++) await win.keyboard.press("ArrowDown");
  await win.keyboard.press("Meta+ArrowRight");
}
async function newLines(win: Page, ...texts: string[]): Promise<void> {
  for (const t of texts) { await win.keyboard.press("Enter"); await win.keyboard.type(t); }
}
const EDITS: Record<string, { run: (win: Page) => Promise<void>; has: string[]; gone: string[] }> = {
  // add's body: `return a + b;` becomes two lines; the tax line is deleted; a function is added at the end.
  "src/cart.ts": {
    run: async (win) => {
      await lineEnd(win, 2); await newLines(win, "const sum = a + b;", "return sum;");
      await win.keyboard.press("ArrowDown"); await win.keyboard.press("Shift+Meta+K");
      await lineEnd(win, 6); await win.keyboard.press("Shift+Meta+K");
      await win.keyboard.press("Meta+ArrowDown"); await win.keyboard.type("export function half(n: number): number {"); await newLines(win, "return n / 2;", "}");
    },
    has: ["  const sum = a + b;", "  return sum;", "export function half(n: number): number {"],
    gone: ["  return a + b;", "export const tax = 0.2;"],
  },
  // Two lines inserted after coffee; the last line deleted.
  "src/menu.ts": {
    run: async (win) => {
      await lineEnd(win, 2); await newLines(win, "export const juice = 380;", "export const water = 0;");
      await lineEnd(win, 6); await win.keyboard.press("Shift+Meta+K");
    },
    has: ["export const juice = 380;", "export const water = 0;"],
    gone: ["export const bun = 210;"],
  },
  "src/tax.ts": {
    run: async (win) => { await lineEnd(win, 1); await newLines(win, "export const floor = 0;", "export const cap = 9;"); },
    has: ["export const floor = 0;", "export const cap = 9;"],
    gone: [],
  },
};

async function editIn(win: Page, rel: string): Promise<string[]> {
  await win.locator(`[data-tree-row="${rel}"]`).first().click();
  await until(win, `${rel} shown`, () => active(win), (a) => a === rel);
  await until(win, `${rel}'s text drawn`, () => lines(win), (l) => same(l, [...FILES[rel].lines, ""]));
  await win.locator("[data-editor-code] .cm-line").first().click();
  await EDITS[rel].run(win);
  return until(win, `${rel}'s edits drawn`, () => lines(win), (l) => EDITS[rel].has.every((h) => l.includes(h)) && EDITS[rel].gone.every((g) => !l.includes(g)));
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-444-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-save-on-send-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  for (const rel of Object.keys(FILES)) writeFileSync(join(repo, rel), fileText(rel));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, MODEL, { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("Reply with the single word ready. Use no tools.");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 300_000 });
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);

    // Typing left unsaved in three files; tax.ts, shown last, then changed on disk behind its buffer.
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    const buffers: Record<string, string[]> = {};
    for (const rel of ["src/cart.ts", "src/menu.ts", "src/tax.ts"]) buffers[rel] = await editIn(win, rel);
    await until(win, "three unsaved", () => unsaved(win), (u) => same([...u].sort(), ["src/cart.ts", "src/menu.ts", "src/tax.ts"]));
    writeFileSync(join(ws, "src/tax.ts"), ON_DISK);

    // The message, from the editor's terminal.
    const before = await returned(win);
    const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
    await box.click();
    await box.fill(ASK);
    await win.keyboard.press("Enter");
    await until(win, "the turn's Returned", () => returned(win), (n) => n > before, 300_000);
    await settled(win);

    for (const rel of ["src/cart.ts", "src/menu.ts"]) {
      const disk = readFileSync(join(ws, rel), "utf8");
      if (disk !== buffers[rel].join(FILES[rel].eol)) throw new Error(`${rel} on disk is not its buffer: ${JSON.stringify(disk)} vs ${JSON.stringify(buffers[rel])}`);
    }
    if (readFileSync(join(ws, "src/menu.ts"), "utf8").replace(/\r\n/g, "").includes("\n")) throw new Error("menu.ts lost its CRLF line ends");
    if (readFileSync(join(ws, "src/tax.ts"), "utf8") !== ON_DISK) throw new Error("tax.ts on disk is not its change on disk");
    await until(win, "unsaved: tax.ts alone", () => unsaved(win), (u) => same(u, ["src/tax.ts"]));
    await until(win, "tax.ts's offer", () => win.locator('[data-save-conflict="src/tax.ts"]').count(), (n) => n === 1);
    const rows = await transcript(win);
    const at = rows.findIndex((r) => r.role === "user" && r.text === ASK);
    const warning = rows[at + 1];
    if (at < 0 || !warning || warning.role !== "warning" || !warning.text.includes("src/tax.ts") || rows.filter((r) => r.role === "warning" && r.text.startsWith("not saved before sending")).length !== 1) {
      throw new Error(`the row after the message: ${JSON.stringify(rows.slice(Math.max(0, at), at + 3))}`);
    }
    // Track 2: the warning row in view under the message.
    await win.locator('[data-editor-area="bottom"]').getByText("not saved before sending", { exact: false }).first().scrollIntoViewIfNeeded();
    await settled(win);
    const shot = join(shots, "warning.png");
    await win.screenshot({ path: shot });
    await win.locator('[data-editor-left-tab="activity"]').first().click();
    const label = await until(win, "menu.ts in the activity tab", () => win.evaluate(`(function () { var e = document.querySelector('[data-activity-last="src/menu.ts"]'); return e ? e.getAttribute("title") : null; })()`) as Promise<string | null>, (t) => !!t);
    if (!label!.startsWith("saved with the message")) throw new Error(`menu.ts's activity label: ${label}`);

    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Env));
    const asked = envs.find((e) => e.kind === "UserMessage" && e.payload.text === ASK);
    if (!asked) throw new Error("no UserMessage for the message");
    const sends = envs.filter((e) => e.kind === "FileWritten" && e.payload.view === "send");
    if (!same(sends.map((e) => String(e.payload.path)).sort(), ["src/cart.ts", "src/menu.ts"]) || sends.some((e) => e.seq > asked.seq)) {
      throw new Error(`FileWritten view send: ${JSON.stringify(sends.map((e) => [e.seq, e.payload.path]))}, the message at ${asked.seq}`);
    }
    for (const e of sends) {
      const rel = String(e.payload.path);
      if (e.payload.new_text !== buffers[rel].join(FILES[rel].eol) || e.payload.old_text !== fileText(rel)) throw new Error(`${rel}'s FileWritten texts: ${JSON.stringify([e.payload.old_text, e.payload.new_text])}`);
    }
    const rel = (p: unknown) => { let s = String(p ?? ""); if (s.startsWith(ws + "/")) s = s.slice(ws.length + 1); while (s.startsWith("./")) s = s.slice(2); return s; };
    const read = envs.find((e) => e.kind === "ToolCall" && e.seq > asked.seq && e.payload.tool === "read_file" && rel((e.payload.args as unknown[])[0]) === "src/cart.ts");
    if (!read) throw new Error(`the model made no read_file of src/cart.ts after the message: ${JSON.stringify(envs.filter((e) => e.seq > asked.seq && e.kind === "ToolCall").map((e) => [e.payload.tool, e.payload.args]))}`);
    const result = envs.find((e) => e.kind === "ToolResult" && e.seq > read.seq && e.payload.call_id === read.payload.call_id);
    const output = String(result?.payload.output ?? "");
    if (!result || !EDITS["src/cart.ts"].has.every((h) => output.includes(h.trim())) || EDITS["src/cart.ts"].gone.some((g) => output.includes(g.trim()))) throw new Error(`the read's output: ${JSON.stringify(output)}`);

    const recs = windowRecords(launch);
    const savedFor = recs.filter((r) => r.name === "EDITOR_SAVED_FOR_SEND");
    if (!same(savedFor.map((r) => [r.payload.files, r.payload.refused, r.pane_id]), [[2, 1, 1]])) throw new Error(`EDITOR_SAVED_FOR_SEND ${JSON.stringify(savedFor.map((r) => r.payload))}`);
    const submitted = recs.filter((r) => r.name === "TURN_SUBMITTED");
    if (!same(submitted.map((r) => r.payload.saved), [0, 2])) throw new Error(`TURN_SUBMITTED.saved ${JSON.stringify(submitted.map((r) => r.payload.saved))}`);
    if (!(savedFor[0].proc_seq < submitted[1].proc_seq) || recs.some((r) => r.proc_seq > savedFor[0].proc_seq && r.proc_seq < submitted[1].proc_seq && r.name === "TURN_SUBMITTED")) throw new Error("EDITOR_SAVED_FOR_SEND does not come just before its TURN_SUBMITTED");
    const conflicted = recs.filter((r) => r.name === "EDITOR_SAVE_CONFLICTED").length;
    if (conflicted !== 1) throw new Error(`EDITOR_SAVE_CONFLICTED ×${conflicted}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const written = server.filter((r) => r.name === "FILE_WRITTEN").length;
    const refused = server.filter((r) => r.name === "API_REFUSED" && r.payload.status === 409).length;
    if (written !== 2 || refused !== 1) throw new Error(`server: FILE_WRITTEN ×${written}, API_REFUSED 409 ×${refused}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_save_on_send: ok — cart.ts and menu.ts saved before the message (FileWritten send at ${sends.map((e) => e.seq).join(", ")}, the message at ${asked.seq}); the model's read_file of cart.ts at ${read.seq} returned its new lines (${buffers["src/cart.ts"].length} lines) without the deleted ones; menu.ts kept CRLF; tax.ts refused, its change on disk kept, one warning under the message, its offer drawn, unsaved [src/tax.ts]; activity: menu.ts "${label}"; EDITOR_SAVED_FOR_SEND 2/1 before TURN_SUBMITTED saved 2; FILE_WRITTEN ×2, API_REFUSED 409 ×1; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_save_on_send: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
