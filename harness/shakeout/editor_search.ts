// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The left column's search (sprints 434, 435; roadmap 2026-11-09-code-editor r10, E8; frame 24j; research
// RESEARCH-2026-11-10-editor-search-r2). A repository written here: priceCents in two tracked files,
// priceCentsTotal in a third, promoPriceCents untracked, PriceCents in a test, and an ignored copy in build/.
// The expected rows are written here by hand. These agree:
//   ⌘⇧F shows the search tab with the query focused; every field, toggle and count inside the column;
//   case folded: one row per match, lit, the ignored file absent; Aa and ab (whole word) narrow to the four
//   exact words; .* reads `priceCents:\s\d+` (\s and \d); `…` shows the globs, and excluding `tests` drops
//   the test file;
//   ↵ opens the first match at its line, ↵ again the next; a click on another file's match opens it;
//   a row's ↵ replaces that one match; a file's ↵ replaces in that file; ⌘⇧↵ replaces the rest; the disk
//   after each; the record's FileWritten in that order; the search then finds nothing, and the words that
//   are not whole (priceCentsTotal) are untouched; the shown buffer reads the new text;
//   the files tab returns the tree;
//   signals — EDITOR_DRAWN.left_tab search then files; the anchor's third row reads search;
//   EDITOR_SEARCH_QUERIED's counts are the drawn ones; FILES_SEARCHED for each; EDITOR_SEARCH_REPLACED one,
//   file, all, each with FILES_REPLACE_PREPARED; EDITOR_FILE_OPENED how=search; no query in any trace (E1).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
async function until<T>(win: Page, what: string, read: () => Promise<T> | T, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const rows = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll("[data-search-line]")).map(function (e) { return e.getAttribute("data-search-line"); })`) as Promise<string[]>;
const litWords = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll("[data-search-line] span[style*='background']")).map(function (e) { return e.textContent; })`) as Promise<string[]>;
const summary = (win: Page) => win.locator("[data-search-summary]").first().textContent();
const snap = (win: Page) => win.evaluate(`(function () { var s = globalThis.__substrateEditor.getSnapshot(); return { active: s.active, caretLine: s.caretLine, leftTab: s.leftTab }; })()`) as Promise<{ active: string | null; caretLine: number; leftTab: string }>;
async function lines(win: Page): Promise<string[]> {
  return win.evaluate(`(() => { var r = document.querySelector("[data-editor-code]").shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`);
}
const outside = (win: Page) => win.evaluate(`(function () { var col = document.querySelector("[data-editor-area=left]").getBoundingClientRect(); return Array.from(document.querySelectorAll("[data-search-input], [data-search-toggle], [data-search-next], [data-search-replace], [data-search-details], [data-search-count]")).filter(function (e) { var r = e.getBoundingClientRect(); return r.right > col.right + 0.5 || r.left < col.left - 0.5; }).map(function (e) { return e.outerHTML.slice(0, 60); }); })()`) as Promise<string[]>;

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-435-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-search-" + process.pid);
  mkdirSync(join(repo, "src", "lib"), { recursive: true });
  mkdirSync(join(repo, "tests"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, ".gitignore"), "build/\n");
  writeFileSync(join(repo, "src/lib/cart.ts"), ["export class Cart {", "  priceCents: number;", "  lineTotal(item: Item): number {", "    return item.priceCents * item.qty;", "  }", "}", ""].join("\n"));
  writeFileSync(join(repo, "src/lib/menu.ts"), ["export const menu = {", "  tea: { priceCents: 450 },", "  cake: { priceCents: 375 },", "};", ""].join("\n"));
  writeFileSync(join(repo, "src/lib/tax.ts"), "export const priceCentsTotal = 0;\n");
  writeFileSync(join(repo, "tests/cart.test.ts"), ["// PriceCents in a comment", "expect(1).toBe(1);", ""].join("\n"));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  writeFileSync(join(repo, "src/lib/promo.ts"), "export const promoPriceCents = 0;\n"); // untracked
  mkdirSync(join(repo, "build"));
  writeFileSync(join(repo, "build/out.js"), "priceCents\n"); // ignored
  const folded = ["src/lib/cart.ts:2", "src/lib/cart.ts:4", "src/lib/menu.ts:2", "src/lib/menu.ts:3", "src/lib/promo.ts:1", "src/lib/tax.ts:1", "tests/cart.test.ts:1"];
  const exact = ["src/lib/cart.ts:2", "src/lib/cart.ts:4", "src/lib/menu.ts:2", "src/lib/menu.ts:3"];
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
    const disk = (rel: string) => readFileSync(join(ws, rel), "utf8");

    // ⌘⇧F: the search tab, the query focused.
    await win.keyboard.press("Meta+Shift+E");
    await win.locator("[data-editor-area=left]").first().waitFor({ timeout: 10_000 });
    await win.keyboard.press("Meta+Shift+F");
    await until(win, "the search tab", () => snap(win), (s) => s.leftTab === "search");
    await until(win, "the query focused", () => win.evaluate(`document.activeElement && document.activeElement.getAttribute("data-search-input")`), (v) => v === "query");
    await win.keyboard.type("priceCents");

    // Case folded: one row per match, every one lit, the ignored copy absent.
    await until(win, "the folded rows", () => rows(win), (r) => same(r, folded));
    await until(win, "the folded summary", () => summary(win), (t) => t === "7 matches in 5 files");
    const lit = await litWords(win);
    if (lit.length !== 7 || lit.some((w) => w.toLowerCase() !== "pricecents")) throw new Error(`lit ${JSON.stringify(lit)}`);
    const shot = join(shots, "search.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor3 || px.anchor3.left_tab !== "search") throw new Error(`the anchor's third row with the search tab: ${JSON.stringify(px.anchor3)}`);
    const row3 = px.anchor3;

    // Aa, then ab: the four whole words in the exact case.
    await win.locator('[data-search-toggle="case"]').first().click();
    await until(win, "the exact-case rows", () => rows(win), (r) => same(r, [...exact, "src/lib/tax.ts:1"]));
    await win.locator('[data-search-toggle="word"]').first().click();
    await until(win, "the whole-word rows", () => rows(win), (r) => same(r, exact));
    // .*: \s and \d.
    await win.locator('[data-search-toggle="word"]').first().click();
    await win.locator('[data-search-toggle="regexp"]').first().click();
    await win.locator('[data-search-input="query"]').first().fill("priceCents:\\s\\d+");
    await until(win, "the pattern's rows", () => rows(win), (r) => same(r, ["src/lib/menu.ts:2", "src/lib/menu.ts:3"]));
    await win.locator('[data-search-toggle="regexp"]').first().click();
    await win.locator('[data-search-toggle="case"]').first().click();
    await win.locator('[data-search-input="query"]').first().fill("priceCents");
    await until(win, "the folded rows again", () => rows(win), (r) => same(r, folded));
    // …: exclude tests.
    await win.locator("[data-search-details]").first().click();
    await win.locator('[data-search-input="exclude"]').first().fill("tests");
    await until(win, "the rows without tests", () => rows(win), (r) => same(r, folded.slice(0, 6)));
    const out = await outside(win);
    if (out.length) throw new Error(`outside the left column: ${JSON.stringify(out)}`);
    await win.locator('[data-search-input="exclude"]').first().fill("");
    await win.locator("[data-search-details]").first().click();
    await win.locator('[data-search-toggle="case"]').first().click();
    await win.locator('[data-search-toggle="word"]').first().click();
    await until(win, "the whole-word rows again", () => rows(win), (r) => same(r, exact));

    // ↵: the first match, then the next; a click on another file's match.
    await win.locator('[data-search-input="query"]').first().focus();
    await win.keyboard.press("Enter");
    await until(win, "the first match opened", () => snap(win), (s) => s.active === "src/lib/cart.ts" && s.caretLine === 2);
    await win.keyboard.press("Enter");
    await until(win, "the next match opened", () => snap(win), (s) => s.active === "src/lib/cart.ts" && s.caretLine === 4);
    await win.locator('[data-search-line="src/lib/menu.ts:2"]').first().click();
    await until(win, "the clicked match opened", () => snap(win), (s) => s.active === "src/lib/menu.ts" && s.caretLine === 2);

    // Replace one match, then one file, then the rest.
    await win.locator('[data-search-input="replace"]').first().fill("amountCents");
    await win.locator('[data-search-match="src/lib/cart.ts:4:0"]').first().hover();
    await win.locator('[data-search-replace-one="src/lib/cart.ts:4:0"]').first().click();
    await until(win, "cart.ts after one", () => disk("src/lib/cart.ts"), (t) => t.includes("return item.amountCents") && t.includes("  priceCents: number;"));
    await until(win, "the rows after one", () => rows(win), (r) => same(r, ["src/lib/cart.ts:2", "src/lib/menu.ts:2", "src/lib/menu.ts:3"]));
    await win.locator('[data-search-file="src/lib/menu.ts"] > div').first().hover();
    await win.locator('[data-search-replace-file="src/lib/menu.ts"]').first().click();
    await until(win, "menu.ts after its file", () => disk("src/lib/menu.ts"), (t) => !t.includes("priceCents") && t.split("amountCents").length === 3);
    await until(win, "the rows after the file", () => rows(win), (r) => same(r, ["src/lib/cart.ts:2"]));
    await win.locator('[data-search-input="replace"]').first().focus();
    await win.keyboard.press("Meta+Shift+Enter");
    await until(win, "the search after replace all", () => summary(win), (t) => t === "no matches");
    if (disk("src/lib/cart.ts").includes("priceCents")) throw new Error(`cart.ts after replace all: ${disk("src/lib/cart.ts")}`);
    if (!disk("src/lib/tax.ts").includes("priceCentsTotal") || !disk("src/lib/promo.ts").includes("promoPriceCents") || !disk("tests/cart.test.ts").includes("PriceCents")) throw new Error("replace all changed a match that is not a whole word in the exact case");
    await until(win, "the shown buffer after the replaces", () => lines(win), (l) => l.some((x) => x.includes("amountCents")) && !l.some((x) => x.includes("priceCents")));

    // The files tab.
    await win.locator('[data-editor-left-tab="files"]').first().click();
    await until(win, "the files tab", () => snap(win), (s) => s.leftTab === "files");
    await win.locator('[data-tree-row="src"]').first().waitFor({ timeout: 10_000 });

    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { kind: string; payload: Record<string, unknown> }));
    const written = envs.filter((e) => e.kind === "FileWritten").map((e) => String(e.payload.path));
    if (!same(written, ["src/lib/cart.ts", "src/lib/menu.ts", "src/lib/cart.ts"])) throw new Error(`the record's FileWritten: ${JSON.stringify(written)}`);

    const recs = windowRecords(launch);
    const drawnTabs = recs.filter((r) => r.name === "EDITOR_DRAWN").map((r) => String(r.payload.left_tab)).filter((t, i, a) => t !== a[i - 1]);
    if (!same(drawnTabs, ["files", "search", "files"])) throw new Error(`EDITOR_DRAWN.left_tab ${JSON.stringify(drawnTabs)}`);
    const named = recs.find((r) => r.proc_seq === row3.seq);
    if (!named || named.name !== "EDITOR_DRAWN" || named.payload.left_tab !== "search") throw new Error(`the third row names seq ${row3.seq}: ${named ? `${named.name} ${JSON.stringify(named.payload)}` : "missing"}`);
    const queried = recs.filter((r) => r.name === "EDITOR_SEARCH_QUERIED").map((r) => `${String(r.payload.regex)}:${String(r.payload.word)}:${String(r.payload.result_file_count)}:${String(r.payload.result_match_count)}`);
    for (const want of ["false:false:5:7", "false:false:3:5", "false:true:2:4", "true:false:1:2", "false:false:4:6", "false:true:0:0"]) if (!queried.includes(want)) throw new Error(`EDITOR_SEARCH_QUERIED lacks ${want}: ${JSON.stringify(queried)}`);
    const replaced = recs.filter((r) => r.name === "EDITOR_SEARCH_REPLACED").map((r) => `${String(r.payload.scope)}:${String(r.payload.files)}:${String(r.payload.count)}:${String(r.payload.refused)}`);
    if (!same(replaced, ["one:1:1:0", "file:1:2:0", "all:1:1:0"])) throw new Error(`EDITOR_SEARCH_REPLACED ${JSON.stringify(replaced)}`);
    const opened = recs.filter((r) => r.name === "EDITOR_FILE_OPENED").map((r) => String(r.payload.how));
    if (opened.length !== 2 || opened.some((h) => h !== "search")) throw new Error(`EDITOR_FILE_OPENED ${JSON.stringify(opened)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const searched = server.filter((r) => r.name === "FILES_SEARCHED").map((r) => `${String(r.payload.regex)}:${String(r.payload.word)}:${String(r.payload.files)}:${String(r.payload.matches)}`);
    for (const q of queried) if (!searched.includes(q)) throw new Error(`no FILES_SEARCHED for ${q}: ${JSON.stringify(searched)}`);
    const prepared = server.filter((r) => r.name === "FILES_REPLACE_PREPARED").map((r) => `${String(r.payload.scope)}:${String(r.payload.files)}:${String(r.payload.replaced)}`);
    if (!same(prepared, ["one:1:1", "file:1:2", "all:1:1"])) throw new Error(`FILES_REPLACE_PREPARED ${JSON.stringify(prepared)}`);
    const allTraces = readdirSync(join(traces, boot)).map((f) => readFileSync(join(traces, boot, f), "utf8")).join("\n");
    for (const secret of ["priceCents", "amountCents", "\\\\s\\\\d"]) if (allTraces.includes(secret)) throw new Error(`the query ${secret} is in the trace`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_search: ok — ⌘⇧F; folded 7 rows in 5 files, 7 lit, build/ ignored; Aa 5, ab 4; .* \\s\\d 2; exclude tests 6; ↵ cart.ts:2 then :4; click menu.ts:2; replace one, file, all → FileWritten ${written.join(", ")}; priceCentsTotal, promoPriceCents, PriceCents kept; left_tab ${drawnTabs.join("→")}; anchor row 3 search at seq ${row3.seq}; EDITOR_SEARCH_QUERIED ${queried.length}, FILES_SEARCHED ${searched.length}; replaced ${replaced.join(", ")}; no query in the trace; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_search: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
