// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The left column's search (sprint 434; roadmap 2026-11-09-code-editor r10, E8; frame 24j). A real
// repository written here: priceCents in two tracked files, PriceCents in a third, an untracked file, an
// ignored one. These agree:
//   ⌘⇧F in the editor shows the search tab with the query focused, its fields and counts inside the
//   column; the results are what git grep finds
//   in the workspace (run here, case folded), grouped by file, every match lit; Aa narrows to the exact
//   case; .* reads a pattern;
//   ↵ opens the first result at its line, ↵ again the next; a click on a row in another file opens it
//   at its line;
//   ⌘⇧↵ replaces every match: the disk holds the replacement in each file, the record one FileWritten
//   per file, the search then finds nothing; the shown buffer reads the new text;
//   the files tab returns the tree;
//   signals — EDITOR_DRAWN.left_tab search then files; the anchor's third row reads search;
//   EDITOR_SEARCH_QUERIED's counts are the drawn ones; FILES_SEARCHED on the server for each, with the
//   same file counts; EDITOR_FILE_OPENED how=search; the query is in no trace (E1).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
/** git grep's own answer, as `path:line` rows (exit 1 is no match). */
function grep(cwd: string, ...args: string[]): string[] {
  try { return git(cwd, "grep", "-n", "-I", "--untracked", ...args).split("\n").filter(Boolean).map((r) => r.split(":").slice(0, 2).join(":")); } catch { return []; }
}
async function until<T>(win: Page, what: string, read: () => Promise<T> | T, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const rows = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll("[data-search-line]")).map(function (e) { return e.getAttribute("data-search-line"); })`) as Promise<string[]>;
const summary = (win: Page) => win.locator("[data-search-summary]").first().textContent();
const lit = (win: Page) => win.evaluate(`document.querySelectorAll("[data-search-line] span[style*='background']").length`) as Promise<number>;
const snap = (win: Page) => win.evaluate(`(function () { var s = globalThis.__substrateEditor.getSnapshot(); return { active: s.active, caretLine: s.caretLine, leftTab: s.leftTab }; })()`) as Promise<{ active: string | null; caretLine: number; leftTab: string }>;
async function lines(win: Page): Promise<string[]> {
  return win.evaluate(`(() => { var r = document.querySelector("[data-editor-code]").shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`);
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-434-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-search-" + process.pid);
  mkdirSync(join(repo, "src", "lib"), { recursive: true });
  mkdirSync(join(repo, "tests"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, ".gitignore"), "build/\n");
  writeFileSync(join(repo, "src/lib/cart.ts"), ["export class Cart {", "  priceCents: number;", "  lineTotal(item: Item): number {", "    return item.priceCents * item.qty;", "  }", "}", ""].join("\n"));
  writeFileSync(join(repo, "src/lib/menu.ts"), ["export const menu = {", "  tea: { priceCents: 450 },", "  cake: { priceCents: 375 },", "};", ""].join("\n"));
  writeFileSync(join(repo, "tests/cart.test.ts"), ["// PriceCents in a comment", "expect(1).toBe(1);", ""].join("\n"));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  writeFileSync(join(repo, "src/lib/promo.ts"), "export const promoPriceCents = 0;\n"); // untracked
  mkdirSync(join(repo, "build"));
  writeFileSync(join(repo, "build/out.js"), "priceCents\n"); // ignored
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

    // Case folded: git grep -i's rows, every match lit.
    const folded = grep(ws, "-i", "-F", "-e", "priceCents");
    await until(win, "the folded results", () => rows(win), (r) => JSON.stringify(r) === JSON.stringify(folded));
    const foldedSummary = await until(win, "the folded summary", () => summary(win), (t) => t === `${folded.length + 0} matches in 4 files`);
    if ((await lit(win)) !== folded.length) throw new Error(`lit matches ${await lit(win)}, want ${folded.length}`);
    if (folded.some((r) => r.startsWith("build/"))) throw new Error("git grep found the ignored file");
    if (!folded.includes("src/lib/promo.ts:1")) throw new Error("the untracked file is not in the results");
    // Every field, toggle and count is inside the column (24j), not cut at its edge.
    const outside = await win.evaluate(`(function () { var col = document.querySelector("[data-editor-area=left]").getBoundingClientRect(); return Array.from(document.querySelectorAll("[data-search-input], [data-search-toggle], [data-search-next], [data-search-replace], [data-search-file] > div > span:last-child")).filter(function (e) { var r = e.getBoundingClientRect(); return r.right > col.right + 0.5 || r.left < col.left - 0.5; }).map(function (e) { return e.outerHTML.slice(0, 60); }); })()`) as string[];
    if (outside.length) throw new Error(`outside the left column: ${JSON.stringify(outside)}`);
    const shot = join(shots, "search.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor3 || px.anchor3.left_tab !== "search") throw new Error(`the anchor's third row with the search tab: ${JSON.stringify(px.anchor3)}`);
    const row3 = px.anchor3;

    // Aa: the exact case.
    await win.locator('[data-search-toggle="case"]').first().click();
    const exact = grep(ws, "-F", "-e", "priceCents");
    await until(win, "the exact-case results", () => rows(win), (r) => JSON.stringify(r) === JSON.stringify(exact));
    await until(win, "the exact-case summary", () => summary(win), (t) => t === `${exact.length} matches in 2 files`);
    // .*: a pattern.
    await win.locator('[data-search-input="query"]').first().fill("price[A-Z]ents: [0-9]+");
    await win.locator('[data-search-toggle="regexp"]').first().click();
    const pattern = grep(ws, "-E", "-e", "price[A-Z]ents: [0-9]+");
    await until(win, "the pattern's results", () => rows(win), (r) => JSON.stringify(r) === JSON.stringify(pattern) && r.length === 2);
    await win.locator('[data-search-toggle="regexp"]').first().click();
    await win.locator('[data-search-input="query"]').first().fill("priceCents");
    await until(win, "the exact-case results again", () => rows(win), (r) => JSON.stringify(r) === JSON.stringify(exact));

    // ↵: the first result at its line, then the next; a click on another file's row.
    await win.locator('[data-search-input="query"]').first().focus();
    await win.keyboard.press("Enter");
    const [p1, l1] = exact[0].split(":");
    await until(win, "the first result opened", () => snap(win), (s) => s.active === p1 && s.caretLine === Number(l1));
    await win.keyboard.press("Enter");
    const [p2, l2] = exact[1].split(":");
    await until(win, "the next result opened", () => snap(win), (s) => s.active === p2 && s.caretLine === Number(l2));
    const other = exact.find((r) => !r.startsWith(`${p1}:`))!;
    await win.locator(`[data-search-line="${other}"]`).first().click();
    const [p3, l3] = other.split(":");
    await until(win, "the clicked result opened", () => snap(win), (s) => s.active === p3 && s.caretLine === Number(l3));

    // ⌘⇧↵: every match replaced through the file API.
    await win.locator('[data-search-input="replace"]').first().fill("amountCents");
    await win.keyboard.press("Meta+Shift+Enter");
    await until(win, "the search after replace all", () => summary(win), (t) => t === "no matches");
    for (const rel of ["src/lib/cart.ts", "src/lib/menu.ts"]) if (disk(rel).includes("priceCents") || !disk(rel).includes("amountCents")) throw new Error(`${rel} after replace all: ${disk(rel)}`);
    if (!disk("tests/cart.test.ts").includes("PriceCents")) throw new Error("replace all (exact case) changed PriceCents");
    await until(win, "the shown buffer after replace all", () => lines(win), (l) => l.some((x) => x.includes("amountCents")) && !l.some((x) => x.includes("priceCents")));

    // The files tab.
    await win.locator('[data-editor-left-tab="files"]').first().click();
    await until(win, "the files tab", () => snap(win), (s) => s.leftTab === "files");
    await win.locator('[data-tree-row="src"]').first().waitFor({ timeout: 10_000 });

    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { kind: string; payload: Record<string, unknown> }));
    const written = envs.filter((e) => e.kind === "FileWritten").map((e) => String(e.payload.path)).sort();
    if (JSON.stringify(written) !== JSON.stringify(["src/lib/cart.ts", "src/lib/menu.ts"])) throw new Error(`the record's FileWritten: ${JSON.stringify(written)}`);

    const recs = windowRecords(launch);
    const drawnTabs = recs.filter((r) => r.name === "EDITOR_DRAWN").map((r) => String(r.payload.left_tab)).filter((t, i, a) => t !== a[i - 1]);
    if (JSON.stringify(drawnTabs) !== JSON.stringify(["files", "search", "files"])) throw new Error(`EDITOR_DRAWN.left_tab ${JSON.stringify(drawnTabs)}`);
    const named = recs.find((r) => r.proc_seq === row3.seq);
    if (!named || named.name !== "EDITOR_DRAWN" || named.payload.left_tab !== "search") throw new Error(`the third row names seq ${row3.seq}: ${named ? `${named.name} ${JSON.stringify(named.payload)}` : "missing"}`);
    const queried = recs.filter((r) => r.name === "EDITOR_SEARCH_QUERIED").map((r) => `${String(r.payload.regex)}:${String(r.payload.result_file_count)}:${String(r.payload.result_match_count)}`);
    for (const want of [`false:4:${folded.length}`, `false:2:${exact.length}`, "true:1:2", "false:0:0"]) if (!queried.includes(want)) throw new Error(`EDITOR_SEARCH_QUERIED lacks ${want}: ${JSON.stringify(queried)}`);
    const opened = recs.filter((r) => r.name === "EDITOR_FILE_OPENED").map((r) => String(r.payload.how));
    if (opened.length !== 2 || opened.some((h) => h !== "search")) throw new Error(`EDITOR_FILE_OPENED ${JSON.stringify(opened)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const serverText = readFileSync(join(traces, boot, "server.jsonl"), "utf8");
    const server = serverText.split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const searched = server.filter((r) => r.name === "FILES_SEARCHED").map((r) => `${String(r.payload.regex)}:${String(r.payload.files)}`);
    if (searched.length < queried.length) throw new Error(`FILES_SEARCHED ${searched.length} for ${queried.length} EDITOR_SEARCH_QUERIED`);
    for (const q of queried) { const [rx, files] = q.split(":"); if (!searched.includes(`${rx}:${files}`)) throw new Error(`no FILES_SEARCHED ${rx}:${files}: ${JSON.stringify(searched)}`); }
    const allTraces = readdirSync(join(traces, boot)).map((f) => readFileSync(join(traces, boot, f), "utf8")).join("\n");
    for (const secret of ["priceCents", "amountCents", "price[A-Z]"]) if (allTraces.includes(secret)) throw new Error(`the query ${secret} is in the trace`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_search: ok — ⌘⇧F focused the query; "${foldedSummary}" = git grep -i (untracked in, ignored out), ${folded.length} lit; Aa ${exact.length} in 2 files; .* 2; ↵ ${exact[0]} then ${exact[1]}; click ${other}; ⌘⇧↵ wrote ${written.join(", ")} (FileWritten each), then no matches; left_tab ${drawnTabs.join("→")}; anchor row 3 search at seq ${row3.seq}; EDITOR_SEARCH_QUERIED ${queried.length}, FILES_SEARCHED ${searched.length}; no query in the trace; packaged=${String(booted.packaged)}; screenshot ${shot}`);
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
