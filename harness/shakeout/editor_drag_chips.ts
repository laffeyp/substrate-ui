// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Drag into the message (sprint 458; roadmap r13 E10.4; D94: "drag a thing into the prompt"; 24k's header hint, D40).
// A repository written here holds src/cart.ts (six lines), src/tax.ts and src/lib/menu.ts; the deterministic driver.
// After "hello", in the editor, these agree:
//   cart.ts dragged from the tree onto the terminal's input bar: chip "cart.ts", the bar outlined midway;
//   the folder lib: "lib/"; menu.ts's tab: "menu.ts"; the search's match row for "const c": "cart.ts 3";
//   tax.ts dragged onto the code: no chip, the code unchanged;
//   the draft empty throughout (no path typed into it); the header's tooltip the hint;
//   "look" sent: the record's UserMessage holds cart.ts, the listing, menu.ts and line 3;
//   window-1.jsonl: EDITOR_CHIP_ADDED file, folder, file, range, how drag.
// A screenshot of the drag over the bar goes to runs/packaged/sprint-458-<stamp>-<source|packaged>/.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Locator, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const CART = ["export const a = 1;", "export const b = 2;", "export const c = 3;", "export const d = 4;", "export const e = 5;", "export const f = 6;"].join("\n") + "\n";
const MENU = "export const items = [];\n";
const HINT = "⌥-click or drag to add · right-click › Add to message · ⌥A adds the selection · ⌫ removes the last chip";
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
const chips = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll('[data-editor-area="bottom"] [data-chip]')).map(function (e) { return e.firstChild && e.firstChild.textContent; })`) as Promise<string[]>;
// The code's shadow root is made when the first file opens.
const codeLines = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`) as Promise<string[]>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
/** A drag by the mouse, in steps; `midway` runs while the pointer is over the target, before the release. */
async function drag(win: Page, from: Locator, to: Locator, midway?: () => Promise<void>): Promise<void> {
  const a = (await from.boundingBox())!, b = (await to.boundingBox())!;
  await win.mouse.move(a.x + Math.min(20, a.width / 2), a.y + a.height / 2);
  await win.mouse.down();
  await win.mouse.move(a.x + 40, a.y + a.height / 2 + 10, { steps: 4 });
  await win.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  if (midway) await midway();
  await win.mouse.up();
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-458-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-drag-chips-" + process.pid);
  mkdirSync(join(repo, "src", "lib"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), CART);
  writeFileSync(join(repo, "src/tax.ts"), "export const rate = 0.2;\n");
  writeFileSync(join(repo, "src/lib/menu.ts"), MENU);
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
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
    const row = (rel: string) => win.locator(`[data-tree-row="${rel}"]`).first();

    // 1. A file from the tree, the bar outlined midway.
    let outlined = false;
    await drag(win, row("src/cart.ts"), box, async () => {
      outlined = await until(win, "the bar outlined", () => win.locator('[data-editor-area="bottom"] [data-drop-over="1"]').count(), (n) => n === 1, 5_000).then(() => true);
      await win.screenshot({ path: join(shots, "drag-over-bar.png") });
    });
    await until(win, "the file chip", () => chips(win), (c) => JSON.stringify(c) === JSON.stringify(["cart.ts"]));
    if (await win.locator('[data-drop-over="1"]').count()) throw new Error("the outline stayed after the drop");
    // 2. A folder.
    await drag(win, row("src/lib"), box);
    await until(win, "the folder chip", () => chips(win), (c) => c.length === 2 && c[1] === "lib/");
    // 3. A tab.
    await row("src/lib").click();
    await row("src/lib/menu.ts").click();
    await until(win, "menu.ts drawn", () => codeLines(win), (l) => l[0] === MENU.trimEnd());
    await drag(win, win.locator('[data-editor-tab="src/lib/menu.ts"]').first(), box);
    await until(win, "the tab's chip", () => chips(win), (c) => c.length === 3 && c[2] === "menu.ts");
    // 4. A search's match row.
    await win.keyboard.press("Meta+Shift+F");
    await win.locator('[data-search-input="query"]').first().fill("const c");
    await until(win, "the match row", () => win.locator('[data-search-line="src/cart.ts:3"]').count(), (n) => n === 1);
    await drag(win, win.locator('[data-search-line="src/cart.ts:3"]').first(), box);
    await until(win, "the line chip", () => chips(win), (c) => c.length === 4 && c[3] === "cart.ts 3");
    // 5. A file dropped on the code: refused.
    await win.locator('[data-editor-left-tab="files"]').first().click();
    const before = await codeLines(win);
    await drag(win, row("src/tax.ts"), win.locator("[data-editor-code] .cm-line").first());
    await settled(win); await settled(win);
    const after = await codeLines(win);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error(`the drop changed the code: ${JSON.stringify(after)}`);
    if ((await chips(win)).length !== 4) throw new Error(`the code's drop added a chip: ${JSON.stringify(await chips(win))}`);
    // 6, 7. The draft empty; the hint.
    if ((await box.inputValue()) !== "") throw new Error(`the draft: ${JSON.stringify(await box.inputValue())}`);
    const hint = await win.locator("[data-editor-terminal-head]").first().getAttribute("title");
    if (hint !== HINT) throw new Error(`the header's tooltip: ${JSON.stringify(hint)}`);

    // 8. Sent.
    await box.click();
    await box.fill("look");
    await win.keyboard.press("Enter");
    await until(win, "look's Returned", () => returned(win), (n) => n >= 2, 30_000);
    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();

    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Env));
    const asked = envs.filter((e) => e.kind === "UserMessage" && e.payload.text === "look").pop()!;
    const att = (asked.payload.attachments as { kind: string; label: string; span?: number[]; text?: string }[]).map((a) => [a.kind, a.label, a.span ?? [], a.text ?? ""]);
    const want = [
      ["file", "cart.ts", [], "(src/cart.ts)\n" + CART],
      ["folder", "lib/", [], "(src/lib/, 1 file)\nsrc/lib/menu.ts"],
      ["file", "menu.ts", [], "(src/lib/menu.ts)\n" + MENU],
      ["lines", "cart.ts 3", [3, 3], "(src/cart.ts, line 3)\nexport const c = 3;\n"],
    ];
    if (JSON.stringify(att) !== JSON.stringify(want)) throw new Error(`the UserMessage's attachments: ${JSON.stringify(att)}`);
    const recs = windowRecords(launch);
    const added = recs.filter((r) => r.name === "EDITOR_CHIP_ADDED").map((r) => `${String(r.payload.kind)}:${String(r.payload.how)}`);
    if (JSON.stringify(added) !== JSON.stringify(["file:drag", "folder:drag", "file:drag", "range:drag"])) throw new Error(`EDITOR_CHIP_ADDED ${JSON.stringify(added)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_drag_chips: ok — dragged onto the bar: the tree's cart.ts (the bar outlined ${String(outlined)}) and lib/, menu.ts's tab, the search's line 3; tax.ts dropped on the code: refused, the code unchanged; the draft empty; the header's tooltip the hint; "look" carried the four; EDITOR_CHIP_ADDED ${JSON.stringify(added)}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_drag_chips: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
