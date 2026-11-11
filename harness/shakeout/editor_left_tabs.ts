// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The left column's open and activity tabs (sprint 440; design spec r6 §5.1; roadmap r10 E8). A repository
// written here; the live roster's model (EDITOR_LIVE_MODEL overrides) is prompted from the editor's terminal to
// read one file and edit another. These agree:
//   open — the open tabs in tab order, the shown one lit, an accent dot on the one with unsaved typing; a click
//          shows that tab and writes no EDITOR_FILE_OPENED;
//   activity — every workspace file the record's calls touched, newest touch first, equal to the order the gate
//          reads from the record on disk itself (read_file, edit_file, write_file by path; FileWritten); a click
//          opens the file, EDITOR_FILE_OPENED how=activity;
//   the files tab carries no search text;
//   the four tabs and every row inside the 210 px column; EDITOR_DRAWN.left_tab open then activity; the
//   anchor's third row reads activity.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const MODEL = process.env.EDITOR_LIVE_MODEL || undefined;
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function turn(win: Page, text: string): Promise<void> {
  const before = await returned(win);
  const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
  await box.click();
  await box.fill(text);
  await win.keyboard.press("Enter");
  await until(win, "the turn's Returned", () => returned(win), (n) => n > before, 300_000);
  await settled(win);
}
const leftRows = (win: Page, kind: string) => win.evaluate(`Array.from(document.querySelectorAll('[data-left-row="${kind}"]')).map(function (e) { return { path: e.getAttribute("data-path"), lit: e.getAttribute("data-lit") === "1" }; })`) as Promise<{ path: string; lit: boolean }[]>;
const active = (win: Page) => win.evaluate(`globalThis.__substrateEditor.getSnapshot().active`) as Promise<string | null>;

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-440-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-left-tabs-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), "export const total = 1;\n");
  writeFileSync(join(repo, "src/menu.ts"), "export const tea = 450;\n");
  writeFileSync(join(repo, "src/tax.ts"), "export const rate = 0.2;\n");
  writeFileSync(join(repo, "README.md"), "# demo\n");
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

    // Two files open, the first with unsaved typing.
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/menu.ts"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await until(win, "cart.ts shown", () => active(win), (a) => a === "src/cart.ts");
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("Meta+ArrowRight");
    await win.keyboard.type(" // typed");
    const openedBefore = windowRecords(launch).filter((r) => r.name === "EDITOR_FILE_OPENED").length;

    // The files tab carries no search text (the Architect, 2026-11-10).
    if (await win.locator("[data-editor-search-box]").count()) throw new Error("the files tab shows search text");

    // open: the tabs in tab order, cart.ts lit with its dot; a click shows menu.ts.
    await win.locator('[data-editor-left-tab="open"]').first().click();
    await until(win, "the open rows", () => leftRows(win, "open"), (r) => same(r, [{ path: "src/menu.ts", lit: false }, { path: "src/cart.ts", lit: true }]));
    if (!(await win.locator('[data-open-unsaved="src/cart.ts"]').count()) || (await win.locator('[data-open-unsaved="src/menu.ts"]').count())) throw new Error("the unsaved dot is not on cart.ts alone");
    await win.locator('[data-left-row="open"][data-path="src/menu.ts"]').first().click();
    await until(win, "menu.ts shown from open", () => active(win), (a) => a === "src/menu.ts");

    // A turn that reads one file and edits another.
    await turn(win, "Use read_file on src/tax.ts. Then use edit_file on README.md to replace exactly `# demo` with `# demo app`. Do not read README.md first. Then reply done.");

    // activity: the record's touched files, newest first; a click opens tax.ts.
    await win.locator('[data-editor-left-tab="activity"]').first().click();
    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Env));
    const rel = (p: unknown) => { let s = String(p ?? ""); if (s.startsWith(ws + "/")) s = s.slice(ws.length + 1); while (s.startsWith("./")) s = s.slice(2); return s; };
    const last = new Map<string, number>();
    for (const e of envs) {
      if (e.kind === "ToolCall" && ["read_file", "edit_file", "write_file"].includes(String(e.payload.tool))) last.set(rel((e.payload.args as unknown[])[0]), e.seq);
      if (e.kind === "FileWritten") last.set(rel(e.payload.path), e.seq);
    }
    const want = [...last.entries()].filter(([p]) => p && !p.startsWith("/") && !p.startsWith("..")).sort((a, b) => b[1] - a[1]).map(([p]) => p);
    if (!want.includes("src/tax.ts") || !want.includes("README.md")) throw new Error(`the turn did not read src/tax.ts and edit README.md: the record names ${JSON.stringify(want)}`);
    await until(win, "the activity rows", async () => (await leftRows(win, "activity")).map((r) => r.path), (r) => same(r, want));
    const outside = await win.evaluate(`(function () { var col = document.querySelector("[data-editor-area=left]").getBoundingClientRect(); return Array.from(document.querySelectorAll("[data-editor-left-tab], [data-left-row] > span, [data-editor-fold=left]")).filter(function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && (r.right > col.right + 0.5 || r.left < col.left - 0.5); }).map(function (e) { return e.outerHTML.slice(0, 70); }); })()`) as string[];
    if (outside.length) throw new Error(`outside the left column: ${JSON.stringify(outside)}`);
    const shot = join(shots, "activity.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor3 || px.anchor3.left_tab !== "activity") throw new Error(`the anchor's third row on the activity tab: ${JSON.stringify(px.anchor3)}`);
    const row3 = px.anchor3;
    await win.locator('[data-left-row="activity"][data-path="src/tax.ts"]').first().click();
    await until(win, "tax.ts opened from activity", () => active(win), (a) => a === "src/tax.ts");
    await app.close();

    const recs = windowRecords(launch);
    const opened = recs.filter((r) => r.name === "EDITOR_FILE_OPENED").map((r) => String(r.payload.how));
    if (!same(opened.slice(openedBefore), ["activity"])) throw new Error(`EDITOR_FILE_OPENED after the open tab: ${JSON.stringify(opened.slice(openedBefore))}`);
    const tabs = recs.filter((r) => r.name === "EDITOR_DRAWN").map((r) => String(r.payload.left_tab)).filter((t, i, a) => t !== a[i - 1]);
    if (!same(tabs, ["files", "open", "activity"])) throw new Error(`EDITOR_DRAWN.left_tab ${JSON.stringify(tabs)}`);
    const named = recs.find((r) => r.proc_seq === row3.seq);
    if (!named || named.name !== "EDITOR_DRAWN" || named.payload.left_tab !== "activity") throw new Error(`the third row names seq ${row3.seq}: ${named ? named.name : "missing"}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_left_tabs: ok — open: menu.ts, cart.ts (lit, dotted), a click showed menu.ts and opened nothing; activity: ${want.join(", ")} = the record, newest first; a click opened tax.ts (how=activity); every tab and row inside the column; left_tab ${tabs.join("→")}; anchor row 3 activity at seq ${row3.seq}; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_left_tabs: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
