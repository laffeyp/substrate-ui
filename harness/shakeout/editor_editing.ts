// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Editing in the editor's centre under vim and nano (sprint 423; roadmap 2026-11-09-code-editor r8, E4;
// D53). A real repository, src/cart.ts and app.py. These agree:
//   vim (the default): Escape in the code stays in the editor; `0 i` text Escape inserts at the line's
//            start; `dd` removes the line and `u` brings it back; the buffer is marked unsaved and the file
//            on disk is unchanged; a hand save to another file lands on the record and the unsaved buffer
//            stays as typed; a trip to another tab and back keeps it;
//   nano (chosen in ⌘, settings): typing inserts; ⌃K twice cuts two lines into one buffer and ⌃U puts
//            both back; ⌃X leaves for the pane;
//   standard (the default, sprint 427): a click and typing edit the buffer;
//   after the session ends (sprint 427: the editor is an editor whether the session is on or off), the
//   editor reopens on the unsaved buffer as typed and takes typing;
//   truth  — the file's bytes on disk (sha-256) are those of the commit at the end: nothing was saved;
//   signals — EDITOR_OPENED binding vim then nano; EDITOR_DRAWN binding nano after the switch; KEY_ROUTED
//            Escape and Control+k to the editor; VIEW_CHANGED editor→panes cause key once, from ⌃X;
//   pixels — the anchor decodes from a screenshot of the edited buffer and names an EDITOR_DRAWN.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, chooseBinding, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const sha = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");

async function lines(win: Page): Promise<string[]> {
  // A string, not a function: tsx wraps named functions in a __name helper the page lacks.
  return win.evaluate(`(() => { var r = document.querySelector("[data-editor-code]").shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`);
}
const unsaved = (win: Page) => win.evaluate(`globalThis.__substrateEditor.getSnapshot().unsaved`) as Promise<string[]>;
const inEditor = (win: Page) => win.evaluate(() => !!document.querySelector("[data-editor-view]"));
async function until<T>(win: Page, read: () => Promise<T>, ok: (v: T) => boolean, what: string): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-423-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-editing-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  const base = Array.from({ length: 12 }, (_, i) => `export const line${i + 1} = ${i + 1};`);
  writeFileSync(join(repo, "src/cart.ts"), base.join("\n") + "\n");
  writeFileSync(join(repo, "app.py"), "def total(items):\n    return sum(items)\n");
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
    const before = sha(cart);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await until(win, () => lines(win), (l) => l.length === 13, "the file's lines");
    const binding0 = await win.getAttribute("[data-editor-code]", "data-binding");
    if (binding0 !== "standard") throw new Error(`the default binding is ${binding0}`);
    // The default editor: click at a line's start and type.
    await win.locator("[data-editor-code] .cm-line", { hasText: "line1 = 1" }).first().click();
    await win.keyboard.press("Meta+ArrowLeft");
    await win.keyboard.type("S ");
    await until(win, () => lines(win), (l) => l[0] === "S export const line1 = 1;", "typing under the standard binding");
    await win.keyboard.press("Backspace");
    await win.keyboard.press("Backspace");
    await until(win, () => lines(win), (l) => l[0] === "export const line1 = 1;", "Backspace under the standard binding");
    await chooseBinding(win, "vim");

    // vim. Escape in the code stays in the editor.
    await win.locator("[data-editor-code] .cm-line", { hasText: "line3 = 3" }).first().click();
    await win.keyboard.press("Escape");
    await settled(win);
    if (!(await inEditor(win))) throw new Error("Escape in the code under vim left the editor");
    await win.keyboard.type("0i");
    await win.keyboard.type("// vim ");
    await win.keyboard.press("Escape");
    await until(win, () => lines(win), (l) => l[2] === "// vim export const line3 = 3;", "line 3 after `0 i` and typing");
    if (!(await inEditor(win))) throw new Error("Escape after insert left the editor");
    await win.keyboard.type("dd");
    await until(win, () => lines(win), (l) => l.length === 12 && l[2] === "export const line4 = 4;", "after dd");
    await win.keyboard.type("u");
    const typed = await until(win, () => lines(win), (l) => l.length === 13 && l[2] === "// vim export const line3 = 3;", "after u");
    await until(win, () => unsaved(win), (u) => JSON.stringify(u) === JSON.stringify(["src/cart.ts"]), "the unsaved buffers");
    if (sha(cart) !== before) throw new Error("the file on disk changed with no save");
    const shot = join(shots, "vim.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor) throw new Error(`the anchor does not decode: ${px.anchor.error}`);

    // A write landing on the record (a hand save to another file) reads the file again; the buffer stays.
    const writes = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: unknown[] } } } }).__vm.get(1).snapshot().rawEnvelopes.length);
    const put = await win.evaluate(async (s) => (await fetch(`/api/session/${encodeURIComponent(s)}/file?path=app.py`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "def total(items):\n    return sum(items)  # by hand\n", view: "editor" }) })).status, sid);
    if (put !== 200) throw new Error(`the hand save to app.py: ${put}`);
    await win.waitForFunction((n) => (window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: unknown[] } } } }).__vm.get(1).snapshot().rawEnvelopes.length > n, writes, { timeout: 15_000 });
    await settled(win);
    if (JSON.stringify(await lines(win)) !== JSON.stringify(typed)) throw new Error("a write landing on the record replaced the unsaved buffer");
    // Another tab and back.
    await win.locator('[data-tree-row="app.py"]').first().click();
    await until(win, () => lines(win), (l) => l[0] === "def total(items):", "app.py shown");
    await win.locator('[data-editor-tab="src/cart.ts"]').first().click();
    await until(win, () => lines(win), (l) => JSON.stringify(l) === JSON.stringify(typed), "the unsaved buffer after a trip to app.py");

    // nano, chosen in settings.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-binding="nano"]').first().click();
    await win.keyboard.press("Escape");
    await until(win, () => win.getAttribute("[data-editor-code]", "data-binding"), (b) => b === "nano", "the binding after the setting");
    await win.locator("[data-editor-code] .cm-line", { hasText: "line5 = 5" }).first().click();
    await win.keyboard.press("Meta+ArrowLeft");
    await win.keyboard.type("N ");
    await until(win, () => lines(win), (l) => l[4] === "N export const line5 = 5;", "nano typing on line 5");
    const beforeCut = await lines(win);
    await win.keyboard.press("Control+k");
    await win.keyboard.press("Control+k");
    await until(win, () => lines(win), (l) => l.length === beforeCut.length - 2 && l[4] === beforeCut[6], "after ⌃K ⌃K");
    await win.keyboard.press("Control+u");
    await until(win, () => lines(win), (l) => JSON.stringify(l) === JSON.stringify(beforeCut), "after ⌃U");
    await win.keyboard.press("Control+x");
    await until(win, () => inEditor(win), (v) => !v, "⌃X left the editor");
    if (sha(cart) !== before) throw new Error("the file on disk changed with no save");

    // After the session ended: the editor still edits.
    await win.evaluate(async (s) => { await fetch(`/api/session/${encodeURIComponent(s)}/end`, { method: "POST" }); }, sid);
    await win.waitForFunction(() => !!(window as unknown as { __vm: { get(n: number): { snapshot(): { endedReason: unknown } } } }).__vm.get(1).snapshot().endedReason, undefined, { timeout: 15_000 });
    await win.keyboard.press("Meta+Shift+E");
    if (!(await inEditor(win))) throw new Error("the editor did not open on the ended session");
    // The unsaved buffer came back with the editor: leaving it lost no typing.
    await until(win, () => lines(win), (l) => JSON.stringify(l) === JSON.stringify(beforeCut), "the unsaved buffer after leaving and reopening the editor");
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("Meta+ArrowLeft");
    await win.keyboard.type("Z ");
    await until(win, () => lines(win), (l) => l[0] === "Z export const line1 = 1;", "typing in the ended session");

    await app.close();
    const recs = windowRecords(launch);
    const opened = recs.filter((r) => r.name === "EDITOR_OPENED").map((r) => String(r.payload.binding));
    if (opened[0] !== "standard" || opened[1] !== "nano") throw new Error(`EDITOR_OPENED bindings ${JSON.stringify(opened)}`);
    if (!recs.some((r) => r.name === "EDITOR_DRAWN" && r.payload.binding === "nano")) throw new Error("no EDITOR_DRAWN with binding nano");
    const routed = recs.filter((r) => r.name === "KEY_ROUTED" && r.payload.target === "editor").map((r) => String(r.payload.key));
    for (const k of ["Escape", "Control+k", "Control+u", "Control+x"]) if (!routed.includes(k)) throw new Error(`KEY_ROUTED to the editor lacks ${k}: ${JSON.stringify(routed)}`);
    const leaves = recs.filter((r) => r.name === "VIEW_CHANGED" && r.payload.from === "editor").map((r) => String(r.payload.cause));
    if (leaves[0] !== "key") throw new Error(`the first leave of the editor: ${JSON.stringify(leaves)}`);
    const anchor = px.anchor;
    const at = recs.find((r) => r.proc_seq === anchor.seq);
    if (!at || at.name !== "EDITOR_DRAWN" || at.payload.binding !== "vim") throw new Error(`the pixels name seq ${anchor.seq}: ${at ? `${at.name} ${JSON.stringify(at.payload)}` : "missing"}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_editing: ok — standard: click and type, Backspace; vim: Escape stayed, 0i inserted, dd and u, buffer unsaved and kept through a landed write and a tab trip; nano: typed, ⌃K ⌃K cut 2 lines, ⌃U restored, ⌃X left (VIEW_CHANGED cause ${leaves[0]}); ended session edits; disk unchanged (sha ${before.slice(0, 12)}); EDITOR_OPENED ${opened.join(", ")}; anchor seq ${anchor.seq} = EDITOR_DRAWN binding vim; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_editing: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
