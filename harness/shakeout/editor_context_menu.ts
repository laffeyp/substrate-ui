// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Right-click › Add to message in the editor (sprint 457; roadmap r13 E10.4; D94). A repository written here holds
// src/cart.ts (six lines) and src/lib/menu.ts; the deterministic driver. After "hello", in the editor, these agree:
//   right-click cart.ts in the tree: the menu reads "Add to message" beside "cart.ts"; a click adds the file;
//   right-click the folder lib: ↓ ↵ adds "lib/";
//   right-click cart.ts's tab: Escape closes the menu, no chip;
//   lines 2–3 selected by keys, right-click inside them: "cart.ts 2–3"; a click adds them with the buffer's text;
//   search "const c": right-click the match: "cart.ts 3"; a click adds the line, with no text;
//   right-click a tree row, then a press in the code: the menu closes, no chip;
//   "look" sent: the record's UserMessage holds the file, the folder's listing, lines 2–3 and line 3 read by the server;
//   window-1.jsonl: CONTEXT_MENU_OPENED tree, tree, tab, code, search, tree; CONTEXT_MENU_CLOSED picked, picked,
//   escape, picked, picked, outside; EDITOR_CHIP_ADDED file, folder, range, range by menu; KEY_ROUTED Escape
//   close-menu, ArrowDown and Enter menu.
// Screenshots of the tree's, the code's and the search's menus go to runs/packaged/sprint-457-<stamp>-<source|packaged>/.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const CART = ["export const a = 1;", "export const b = 2;", "export const c = 3;", "export const d = 4;", "export const e = 5;", "export const f = 6;"].join("\n") + "\n";
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
const chips = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll('[data-editor-area="bottom"] [data-chip]')).map(function (e) { return e.firstChild && e.firstChild.textContent; })`) as Promise<string[]>;
const menu = (win: Page) => win.evaluate(`(function () { var m = document.querySelector("[data-context-menu]"); if (!m) return null; var i = m.querySelector("[data-context-item]"); var d = m.querySelector("[data-context-detail]"); return { source: m.getAttribute("data-context-menu"), item: i && i.getAttribute("data-context-item"), detail: d && d.textContent, shown: getComputedStyle(m).visibility }; })()`) as Promise<{ source: string; item: string; detail: string; shown: string } | null>;
const firstLine = (win: Page) => win.evaluate(`(function () { var r = document.querySelector("[data-editor-code]").shadowRoot; var l = r && r.querySelector(".cm-line"); return l ? l.textContent : null; })()`) as Promise<string | null>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
async function press(win: Page, key: string, times = 1): Promise<void> { for (let i = 0; i < times; i++) await win.keyboard.press(key); }
const shownMenu = (win: Page, source: string, detail: string) => until(win, `the ${source} menu`, () => menu(win), (m) => !!m && m.source === source && m.item === "Add to message" && m.detail === detail && m.shown === "visible");
const noMenu = (win: Page, what: string) => until(win, what, () => menu(win), (m) => m === null);

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-457-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-context-menu-" + process.pid);
  mkdirSync(join(repo, "src", "lib"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), CART);
  writeFileSync(join(repo, "src/lib/menu.ts"), "export const items = [];\n");
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

    // 1. The tree's file: a click on the item.
    await win.locator('[data-tree-row="src/cart.ts"]').first().click({ button: "right" });
    await shownMenu(win, "tree", "cart.ts");
    await win.screenshot({ path: join(shots, "tree-menu.png") });
    await win.locator("[data-context-item]").first().click();
    await noMenu(win, "the tree menu closed by its pick");
    await until(win, "the file chip", () => chips(win), (c) => JSON.stringify(c) === JSON.stringify(["cart.ts"]));

    // 2. The tree's folder: ↓ ↵.
    await win.locator('[data-tree-row="src/lib"]').first().click({ button: "right" });
    await shownMenu(win, "tree", "lib/");
    await press(win, "ArrowDown"); await press(win, "Enter");
    await noMenu(win, "the folder menu closed by ↵");
    await until(win, "the folder chip", () => chips(win), (c) => c.length === 2 && c[1] === "lib/");

    // 3. The tab: Escape closes the menu and adds nothing.
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await until(win, "cart.ts drawn", () => firstLine(win), (t) => t === "export const a = 1;");
    await win.locator('[data-editor-tab="src/cart.ts"]').first().click({ button: "right" });
    await shownMenu(win, "tab", "cart.ts");
    await press(win, "Escape");
    await noMenu(win, "the tab menu closed by Escape");
    if ((await chips(win)).length !== 2) throw new Error(`Escape added a chip: ${JSON.stringify(await chips(win))}`);

    // 4. The code: lines 2–3 selected by keys, right-click over line 2's text, inside the selection.
    await win.locator("[data-editor-code] .cm-line", { hasText: "export const a = 1;" }).first().click();
    await press(win, "Meta+ArrowUp"); await press(win, "ArrowDown"); await press(win, "Shift+ArrowDown", 2);
    await win.locator("[data-editor-code] .cm-line", { hasText: "export const b = 2;" }).first().click({ button: "right", position: { x: 40, y: 6 } });
    await shownMenu(win, "code", "cart.ts 2–3");
    await win.screenshot({ path: join(shots, "code-menu.png") });
    await win.locator("[data-context-item]").first().click();
    await noMenu(win, "the code menu closed by its pick");
    await until(win, "the lines chip", () => chips(win), (c) => c.length === 3 && c[2] === "cart.ts 2–3");
    const focusBack = await win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); return document.activeElement === h; })()`);
    if (!focusBack) throw new Error("the focus did not go back to the code after the pick");

    // 5. The search's match row: the line by its number.
    await press(win, "Meta+Shift+F");
    await win.locator('[data-search-input="query"]').first().fill("const c");
    await until(win, "the match row", () => win.locator('[data-search-line="src/cart.ts:3"]').count(), (n) => n === 1);
    await win.locator('[data-search-line="src/cart.ts:3"]').first().click({ button: "right" });
    await shownMenu(win, "search", "cart.ts 3");
    await win.screenshot({ path: join(shots, "search-menu.png") });
    await win.locator("[data-context-item]").first().click();
    await until(win, "the line chip", () => chips(win), (c) => c.length === 4 && c[3] === "cart.ts 3");

    // 6. A press outside closes the menu and adds nothing.
    await win.locator('[data-editor-left-tab="files"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click({ button: "right" });
    await shownMenu(win, "tree", "cart.ts");
    await win.locator("[data-editor-code] .cm-line", { hasText: "export const f = 6;" }).first().click();
    await noMenu(win, "the menu closed by a press outside");
    if ((await chips(win)).length !== 4) throw new Error(`the press outside added a chip: ${JSON.stringify(await chips(win))}`);

    // 7. Sent.
    const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
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
      ["lines", "cart.ts 2–3", [2, 3], "(src/cart.ts, lines 2–3)\nexport const b = 2;\nexport const c = 3;\n"],
      ["lines", "cart.ts 3", [3, 3], "(src/cart.ts, line 3)\nexport const c = 3;\n"],
    ];
    if (JSON.stringify(att) !== JSON.stringify(want)) throw new Error(`the UserMessage's attachments: ${JSON.stringify(att)}`);
    const recs = windowRecords(launch);
    const opened = recs.filter((r) => r.name === "CONTEXT_MENU_OPENED").map((r) => `${String(r.payload.source)}:${String(r.payload.items)}`);
    if (JSON.stringify(opened) !== JSON.stringify(["tree:1", "tree:1", "tab:1", "code:1", "search:1", "tree:1"])) throw new Error(`CONTEXT_MENU_OPENED ${JSON.stringify(opened)}`);
    const closed = recs.filter((r) => r.name === "CONTEXT_MENU_CLOSED").map((r) => String(r.payload.outcome));
    if (JSON.stringify(closed) !== JSON.stringify(["picked", "picked", "escape", "picked", "picked", "outside"])) throw new Error(`CONTEXT_MENU_CLOSED ${JSON.stringify(closed)}`);
    const added = recs.filter((r) => r.name === "EDITOR_CHIP_ADDED").map((r) => `${String(r.payload.kind)}:${String(r.payload.how)}`);
    if (JSON.stringify(added) !== JSON.stringify(["file:menu", "folder:menu", "range:menu", "range:menu"])) throw new Error(`EDITOR_CHIP_ADDED ${JSON.stringify(added)}`);
    const routed = recs.filter((r) => r.name === "KEY_ROUTED" && ["close-menu", "menu"].includes(String(r.payload.action))).map((r) => `${String(r.payload.key)}:${String(r.payload.action)}`);
    if (JSON.stringify(routed) !== JSON.stringify(["ArrowDown:menu", "Enter:menu", "Escape:close-menu"])) throw new Error(`KEY_ROUTED for the menu ${JSON.stringify(routed)}`);
    if (recs.some((r) => r.name === "TURN_INTERRUPTED")) throw new Error("a TURN_INTERRUPTED was written");
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_context_menu: ok — right-click › Add to message: the tree's cart.ts (click) and lib/ (↓ ↵), the code's lines 2–3, the search's line 3; the tab's menu closed by Escape and the tree's by a press outside, no chip; the focus back in the code; "look" carried the file, the listing, the lines with their text and line 3 read by the server; CONTEXT_MENU_OPENED ${opened.length}, CLOSED ${JSON.stringify(closed)}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_context_menu: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
