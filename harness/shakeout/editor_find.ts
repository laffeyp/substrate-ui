// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// FIND / REPLACE in the open file (sprint 428; roadmap 2026-11-09-code-editor r10, E6 and its key table;
// frame 24a). A real repository; src/cart.ts holds "price" in five forms. These agree:
//   truth  — every count equals a JavaScript regex run over the buffer's own text (case-insensitive, then
//            Aa, then .* `price\w*`); each replace equals String.replace on that text; the file on disk
//            after ⌘S equals the buffer;
//   DOM    — ⌘F puts the focus in the find field; `N of M` and the marked matches in the code agree with
//            the truth; ↵ and ⇧↵ move the current match; with the focus in the terminal ⌘F opens the
//            transcript's find instead;
//   signals — EDITOR_FIND_QUERIED per settled query with the truth's count; EDITOR_REPLACED one 1 then
//            all with the rest; KEY_ROUTED Meta+f → editor-find.
//   sprint 438 — ab counts whole words only; sel holds the count and a replace to lines 4–5, the scope
//            drawn; AB writes each replacement in its match's case; the signals carry whole_word,
//            in_selection and preserve_case.
// The inspector is screenshotted beside 24a. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const CART = [
  "export const price = 1;",
  "export const Price = 2;",
  "export function priceCents(p: number) { return p * 100; }",
  "// price list",
  "export const total = price + Price;",
].join("\n") + "\n";

async function buffer(win: Page): Promise<string> {
  const lines: string[] = await win.evaluate(`(() => { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`);
  return lines.join("\n");
}
async function drawn(win: Page): Promise<{ label: string; marks: number; current: number }> {
  return win.evaluate(`(() => { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; var c = document.querySelector("[data-find-count]"); return { label: c ? c.textContent : "", marks: r ? r.querySelectorAll("[data-find-match]").length : 0, current: r ? r.querySelectorAll("[data-find-current]").length : 0 }; })()`);
}
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);
const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-428-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-find-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), CART);
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
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await until(win, "the file", () => buffer(win), (t) => t.startsWith("export const price = 1;"));
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("Meta+ArrowUp"); // the caret at the top

    // ⌘F: the focus in the find field; a query, counted.
    await win.keyboard.press("Meta+f");
    await until(win, "the focus after ⌘F", () => win.evaluate(() => document.activeElement?.getAttribute("data-find-input") ?? null), (v) => v === "query");
    await win.keyboard.type("price");
    const text = await buffer(win);
    const n1 = count(text, /price/gi);
    await until(win, "case-insensitive", () => drawn(win), (d) => d.label === `1 of ${n1}` && d.marks === n1 && d.current === 1);
    await win.keyboard.press("Enter");
    await until(win, "after ↵", () => drawn(win), (d) => d.label === `2 of ${n1}`);
    await win.keyboard.press("Shift+Enter");
    await until(win, "after ⇧↵", () => drawn(win), (d) => d.label === `1 of ${n1}`);
    await win.locator('[data-find-toggle="case"]').first().click();
    const n2 = count(text, /price/g);
    await until(win, "Aa", () => drawn(win), (d) => d.marks === n2 && d.label.endsWith(`of ${n2}`));
    await win.locator('[data-find-toggle="case"]').first().click();
    await win.locator('[data-find-toggle="regexp"]').first().click();
    await win.locator('[data-find-input="query"]').first().fill("price\\w*");
    const n3 = count(text, /price\w*/gi);
    await until(win, ".*", () => drawn(win), (d) => d.marks === n3 && d.label.endsWith(`of ${n3}`));
    await win.screenshot({ path: join(shots, "find.png") });
    await win.locator('[data-editor-area="right"]').first().screenshot({ path: join(shots, "inspector.png") });

    // Replace: one, then all.
    await win.locator('[data-find-toggle="regexp"]').first().click();
    await win.locator('[data-find-toggle="case"]').first().click();
    await win.locator('[data-find-input="query"]').first().fill("Price");
    const n4 = count(text, /Price/g);
    await until(win, "Price, Aa", () => drawn(win), (d) => d.marks === n4);
    await win.keyboard.press("Meta+Alt+f");
    await until(win, "the focus after ⌥⌘F", () => win.evaluate(() => document.activeElement?.getAttribute("data-find-input") ?? null), (v) => v === "replace");
    await win.keyboard.type("Cost");
    await win.keyboard.press("Enter");
    const one = text.replace("Price", "Cost");
    await until(win, "after one replace", () => buffer(win), (t) => t === one);
    await win.locator('[data-find-replace="all"]').first().click();
    const all = text.replace(/Price/g, "Cost");
    await until(win, "after replace all", () => buffer(win), (t) => t === all);
    await until(win, "no matches left", () => drawn(win), (d) => d.label === "no matches" && d.marks === 0);
    await menu(app, "menu-save");
    await until(win, "the disk after ⌘S", async () => readFileSync(join(ws, "src/cart.ts"), "utf8"), (t) => t === all + "\n" || t === all);

    // Sprint 438: ab (whole word), sel (in the selection), AB (preserve case).
    await win.locator('[data-find-toggle="case"]').first().click(); // Aa off
    await win.locator('[data-find-toggle="word"]').first().click();
    await win.locator('[data-find-input="query"]').first().fill("price");
    const n5 = count(all, /\bprice\b/gi);
    await until(win, "ab", () => drawn(win), (d) => d.marks === n5 && d.label.endsWith(`of ${n5}`));
    await win.locator("[data-editor-code] .cm-line", { hasText: "// price list" }).first().click();
    await win.keyboard.press("Meta+ArrowLeft");
    await win.keyboard.press("Shift+ArrowDown");
    await win.keyboard.press("Shift+Meta+ArrowRight");
    await win.locator('[data-find-toggle="selection"]').first().click();
    const scoped = all.split("\n").slice(3, 5).join("\n");
    const n6 = count(scoped, /\bprice\b/gi);
    await until(win, "sel", () => drawn(win), (d) => d.marks === n6 && d.label.endsWith(`of ${n6}`));
    if (!(await win.evaluate(`!!document.querySelector("[data-editor-code]").shadowRoot.querySelector("[data-find-scope]")`))) throw new Error("the scope is not drawn");
    await win.locator('[data-find-input="replace"]').first().fill("cost");
    await win.locator('[data-find-replace="all"]').first().click();
    const lines = all.split("\n");
    const inSel = lines.map((l, k) => (k === 3 || k === 4 ? l.replace(/\bprice\b/gi, "cost") : l)).join("\n");
    await until(win, "the replace held to the selection", () => buffer(win), (t) => t === inSel);
    await win.locator('[data-find-toggle="selection"]').first().click();
    await win.locator('[data-find-input="query"]').first().fill("cost");
    const n7 = count(inSel, /\bcost\b/gi);
    await until(win, "cost, ab", () => drawn(win), (d) => d.marks === n7);
    await win.locator('[data-find-toggle="preserve"]').first().click();
    await win.locator('[data-find-input="replace"]').first().fill("amount");
    await win.locator('[data-find-replace="all"]').first().click();
    const kept = inSel.replace(/\bcost\b/gi, (m) => (m[0] === "C" ? "Amount" : "amount"));
    await until(win, "preserve case", () => buffer(win), (t) => t === kept);
    await win.locator('[data-editor-area="right"]').first().screenshot({ path: join(shots, "inspector-438.png") });

    // ⌘F with the focus in the terminal: the transcript's find.
    await win.locator('[data-editor-area="bottom"] textarea[data-input-bar], [data-editor-sill] textarea[data-input-bar]').first().click();
    await win.keyboard.press("Meta+f");
    await until(win, "the transcript's find", () => win.evaluate(`globalThis.__substrateFind.getSnapshot().open`) as Promise<boolean>, (v) => v === true);
    const frame = join(REPO_ROOT, "runs", "design", "sheet-v11", "24a.png");
    if (existsSync(frame)) copyFileSync(frame, join(shots, "24a.png"));

    await app.close();
    const recs = windowRecords(launch);
    const queried = recs.filter((r) => r.name === "EDITOR_FIND_QUERIED").map((r) => `${String(r.payload.case_sensitive)}/${String(r.payload.regex)}:${String(r.payload.match_count)}`);
    for (const want of [`false/false:${n1}`, `true/false:${n2}`, `false/true:${n3}`, `true/false:${n4}`]) if (!queried.includes(want)) throw new Error(`EDITOR_FIND_QUERIED lacks ${want}: ${JSON.stringify(queried)}`);
    const replaced = recs.filter((r) => r.name === "EDITOR_REPLACED").map((r) => `${String(r.payload.scope)}:${String(r.payload.count)}`);
    if (JSON.stringify(replaced) !== JSON.stringify(["one:1", `all:${n4 - 1}`, `all:${n6}`, `all:${n7}`])) throw new Error(`EDITOR_REPLACED ${JSON.stringify(replaced)}`);
    const preserved = recs.filter((r) => r.name === "EDITOR_REPLACED").map((r) => String(r.payload.preserve_case));
    if (JSON.stringify(preserved) !== JSON.stringify(["false", "false", "false", "true"])) throw new Error(`EDITOR_REPLACED preserve_case ${JSON.stringify(preserved)}`);
    const options = recs.filter((r) => r.name === "EDITOR_FIND_QUERIED").map((r) => `${String(r.payload.whole_word)}/${String(r.payload.in_selection)}:${String(r.payload.match_count)}`);
    for (const want of [`true/false:${n5}`, `true/true:${n6}`, `true/false:${n7}`]) if (!options.includes(want)) throw new Error(`EDITOR_FIND_QUERIED lacks ${want}: ${JSON.stringify(options)}`);
    const routed = recs.filter((r) => r.name === "KEY_ROUTED" && r.payload.action === "editor-find").length;
    if (routed !== 2) throw new Error(`KEY_ROUTED editor-find ${routed}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_find: ok — ab ${n5}, sel ${n6} (replace held to it), AB cost→amount/Cost→Amount; ⌘F to the field; price ${n1} (1 of ${n1}, ↵ 2, ⇧↵ 1), Aa ${n2}, .* ${n3} = JS regex on the buffer; Price ${n4}: ↵ replaced 1, all the rest = String.replace; saved to disk; ⌘F in the terminal opened the transcript's find; EDITOR_FIND_QUERIED ${queried.join(", ")}; EDITOR_REPLACED ${replaced.join(", ")}; packaged=${String(booted.packaged)}; screenshots ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_find: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
