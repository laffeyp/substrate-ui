// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Edit ▸ Undo and Redo, routed by the window (sprint 426; roadmap 2026-11-09-code-editor r8, the key table;
// BLACKBOARD 2026-11-09, the undo boundary). These agree:
//   outside the editor, Undo takes back the text typed in the input bar (the page's undo);
//   in the editor, after `i` and typing under vim: Undo takes the typing back (the buffer), Redo puts it
//   back, Undo again; with the buffer clean, Undo goes nowhere until HISTORY's steps land;
//   truth  — the file's bytes on disk are unchanged: an undo is not a save;
//   signals — UNDO_ROUTED undo→page, undo→buffer, redo→buffer, undo→buffer, undo→none; MENU_COMMAND_SENT
//            undo and redo in main.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, chooseBinding, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const sha = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");
async function lines(win: Page): Promise<string[]> {
  return win.evaluate(`(() => { var r = document.querySelector("[data-editor-code]").shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`);
}
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const repo = join(__dirname, ".scratch", "editor-undo-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), "export const a = 1;\nexport const b = 2;\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    const bar = win.locator("textarea[data-input-bar]").filter({ visible: true }).first();
    await bar.fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    const cart = join(ws, "src/cart.ts");
    const before = sha(cart);

    // The page's undo: typing in the input bar, then Undo.
    await bar.click();
    await win.keyboard.type("draft");
    await until(win, "the typed draft", () => bar.inputValue(), (v) => v === "draft");
    await menu(app, "menu-undo");
    await until(win, "the input bar after Undo", () => bar.inputValue(), (v) => v !== "draft");

    // The buffer's undo and redo.
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await until(win, "the file", () => lines(win), (l) => l[0] === "export const a = 1;");
    await chooseBinding(win, "vim"); // standard is the default (sprint 427); the keys below are vim's
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.type("0ixy ");
    await win.keyboard.press("Escape");
    await until(win, "typed", () => lines(win), (l) => l[0] === "xy export const a = 1;");
    await menu(app, "menu-undo");
    await until(win, "after Undo", () => lines(win), (l) => l[0] === "export const a = 1;");
    await menu(app, "menu-redo");
    await until(win, "after Redo", () => lines(win), (l) => l[0] === "xy export const a = 1;");
    await menu(app, "menu-undo");
    await until(win, "after the second Undo", () => lines(win), (l) => l[0] === "export const a = 1;");
    // Clean: nowhere to go.
    await menu(app, "menu-undo");
    await settled(win);
    if ((await lines(win))[0] !== "export const a = 1;") throw new Error("Undo on a clean buffer changed it");
    if (sha(cart) !== before) throw new Error("an undo changed the file on disk");

    await app.close();
    const recs = windowRecords(launch);
    const routed = recs.filter((r) => r.name === "UNDO_ROUTED").map((r) => `${String(r.payload.direction)}→${String(r.payload.to)}`);
    const want = ["undo→page", "undo→buffer", "redo→buffer", "undo→buffer", "undo→none"];
    if (JSON.stringify(routed) !== JSON.stringify(want)) throw new Error(`UNDO_ROUTED ${JSON.stringify(routed)}; want ${JSON.stringify(want)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const main = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const sent = main.filter((r) => r.name === "MENU_COMMAND_SENT" && (r.payload.command === "undo" || r.payload.command === "redo")).length;
    if (sent !== 5) throw new Error(`MENU_COMMAND_SENT undo/redo ${sent}`);
    const booted = main.find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_undo: ok — UNDO_ROUTED ${routed.join(", ")}; MENU_COMMAND_SENT ${sent}; disk unchanged; packaged=${String(booted.packaged)}`);
    status = 0;
  } catch (e) {
    console.error(`editor_undo: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
