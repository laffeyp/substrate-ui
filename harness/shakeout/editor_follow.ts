// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Following the session's edits (sprint 431; roadmap 2026-11-09-code-editor r10, E7; D93). A real
// repository; the live roster's model (EDITOR_LIVE_MODEL overrides) is prompted from the editor's own
// terminal while src/cart.ts is open. These agree:
//   truth  — every EDITOR_FOLLOW_MARKED is an edit_file or write_file ToolCall on the kernel record made
//            while the editor was open, and its resolution names that call's ToolResult (result_seq); the
//            files on disk carry the model's edits;
//   turn 1 — edits to the open file and to src/other.ts: the tab stays on cart.ts (one tab), its buffer
//            equals the disk and the changed line is in view; other.ts gets its changed-vs-main dot;
//   turn 2 — with unsaved typing in the buffer, an edit to cart.ts: CONFIRMED conflict true, the buffer kept
//            as typed, and ⌘S meets the reload-or-overwrite offer;
//   turn 3 — an edit whose search text is not in the file: WITHDRAWN with the failing result;
//   signals — S10 holds (no INVARIANT_BROKEN); the last EDITOR_DRAWN has follow_marks 0, and the anchor's
//            third row from a screenshot after the turns reads 0.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const MODEL = process.env.EDITOR_LIVE_MODEL || undefined;
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const CART = Array.from({ length: 12 }, (_, i) => `export const line${i + 1} = ${i + 1};`).join("\n") + "\n";
type Env = { seq: number; kind: string; payload: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);
async function lines(win: Page): Promise<string[]> {
  return win.evaluate(`(() => { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }) : []; })()`);
}
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
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

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-431-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-follow-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), CART);
  writeFileSync(join(repo, "src/other.ts"), "export const z = 0;\n");
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
    const disk = (f: string) => readFileSync(join(ws, f), "utf8");
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await until(win, "cart.ts shown", () => lines(win), (l) => l[0] === "export const line1 = 1;");

    // Turn 1: the open file and another file.
    await turn(win, "Use edit_file on src/cart.ts to replace exactly `export const line10 = 10;` with `export const line10 = 1000;`. Then use edit_file on src/other.ts to replace exactly `export const z = 0;` with `export const z = 9;`. Do not read the files first. Then reply done.");
    if (!disk("src/cart.ts").includes("line10 = 1000;") || !disk("src/other.ts").includes("z = 9;")) throw new Error("turn 1: the model did not make both edits");
    await until(win, "cart.ts read again", () => lines(win), (l) => l.join("\n") === disk("src/cart.ts"));
    const tabs = await win.locator("[data-editor-tab]").count();
    if (tabs !== 1) throw new Error(`turn 1 opened another tab (${tabs} tabs): the person's focus should win`);
    const inView = await win.evaluate(`(() => { var r = document.querySelector("[data-editor-code]").shadowRoot; var box = document.querySelector("[data-editor-code]").getBoundingClientRect(); var hit = Array.from(r.querySelectorAll(".cm-line")).find(function (e) { return e.textContent.indexOf("line10 = 1000") >= 0; }); if (!hit) return false; var b = hit.getBoundingClientRect(); return b.top >= box.top && b.bottom <= box.bottom; })()`);
    if (!inView) throw new Error("turn 1: the changed line is not in view");
    await until(win, "other.ts's dot", () => win.evaluate(() => !!document.querySelector('[data-tree-row="src/other.ts"] [data-tree-dot]')), (v) => v);

    // Turn 2: unsaved typing, then the session's edit to the same file.
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("Meta+ArrowLeft");
    await win.keyboard.type("// mine ");
    const typed = await lines(win);
    await turn(win, "Use edit_file on src/cart.ts to replace exactly `export const line5 = 5;` with `export const line5 = 500;`. Do not read the file first. Then reply done.");
    if (!disk("src/cart.ts").includes("line5 = 500;")) throw new Error("turn 2: the model did not make the edit");
    if (JSON.stringify(await lines(win)) !== JSON.stringify(typed)) throw new Error("turn 2: the unsaved buffer was replaced");
    await menu(app, "menu-save");
    await win.locator("[data-save-conflict]").first().waitFor({ timeout: 10_000 });
    await win.locator('[data-conflict-choice="reload"]').first().click();
    await until(win, "reload after the conflict", () => lines(win), (l) => l.join("\n") === disk("src/cart.ts"));

    // Turn 3: an edit that fails.
    await turn(win, "This is a test of a failing tool call. Call the edit_file tool exactly once, with path src/cart.ts, search `THIS_TEXT_IS_NOT_IN_THE_FILE` and replace `x`. You must make the call even though it will fail. Do not read the file and do not retry. Then reply with the error the tool returned.");
    // The record must hold that call: a model that answers without calling it leaves the failing path untested.
    const shot = join(shots, "after.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor3 || px.anchor3.follow_marks !== 0) throw new Error(`the anchor's third row after the turns: ${JSON.stringify(px.anchor3)}`);

    // Truth: the kernel record.
    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();
    const envs: Env[] = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Env));
    // A call's result: the first ToolResult after it with its call_id (the kernel numbers call ids per turn).
    const resultOf = (call: Env) => envs.find((e) => e.kind === "ToolResult" && e.seq > call.seq && e.payload.call_id === call.payload.call_id);
    const recs = windowRecords(launch);
    const marked = recs.filter((r) => r.name === "EDITOR_FOLLOW_MARKED").map((r) => Number(r.payload.seq));
    const calls = envs.filter((e) => e.kind === "ToolCall" && ["edit_file", "write_file"].includes(String(e.payload.tool)));
    const firstTurnEnd = envs.filter((e) => e.kind === "Returned")[0].seq;
    const editorCalls = calls.filter((e) => e.seq > firstTurnEnd);
    if (JSON.stringify(marked) !== JSON.stringify(editorCalls.map((e) => e.seq))) throw new Error(`EDITOR_FOLLOW_MARKED ${JSON.stringify(marked)}; the record's edit calls after the editor opened ${JSON.stringify(editorCalls.map((e) => e.seq))}`);
    const resolutions = recs.filter((r) => r.name === "EDITOR_FOLLOW_CONFIRMED" || r.name === "EDITOR_FOLLOW_WITHDRAWN").map((r) => ({ name: r.name, seq: Number(r.payload.seq), result: Number(r.payload.result_seq), conflict: r.payload.conflict }));
    for (const call of editorCalls) {
      const res = resultOf(call)!;
      const got = resolutions.filter((r) => r.seq === call.seq);
      const want = res.payload.ok === false ? "EDITOR_FOLLOW_WITHDRAWN" : "EDITOR_FOLLOW_CONFIRMED";
      if (got.length !== 1 || got[0].name !== want || got[0].result !== res.seq) throw new Error(`call ${call.seq} (${String(call.payload.args?.[0])}): ${JSON.stringify(got)}; want one ${want} with result ${res.seq}`);
    }
    const conflictOne = resolutions.find((r) => r.conflict === true);
    const conflictCall = editorCalls.find((e) => conflictOne && e.seq === conflictOne.seq);
    if (!conflictCall || !String(conflictCall.payload.args?.[2] ?? "").includes("line5 = 500")) throw new Error(`no CONFIRMED conflict true for turn 2's edit: ${JSON.stringify(resolutions)}`);
    const failing = editorCalls.filter((e) => String(e.payload.args?.[1] ?? "").includes("THIS_TEXT_IS_NOT_IN_THE_FILE"));
    if (!failing.length) throw new Error("turn 3: the model made no edit_file call with the absent text; the failing path is untested");
    if (!resolutions.some((r) => r.name === "EDITOR_FOLLOW_WITHDRAWN" && r.seq === failing[0].seq)) throw new Error(`turn 3 left no WITHDRAWN for call ${failing[0].seq}: ${JSON.stringify(resolutions)}`);
    const drawn = recs.filter((r) => r.name === "EDITOR_DRAWN");
    const lastDrawn = drawn[drawn.length - 1];
    if (Number(lastDrawn.payload.follow_marks) !== 0) throw new Error(`the last EDITOR_DRAWN has follow_marks ${String(lastDrawn.payload.follow_marks)}`);
    const peak = Math.max(...drawn.map((r) => Number(r.payload.follow_marks)));
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_follow: ok — ${editorCalls.length} edit calls while the editor was open, each marked and resolved by its result (${resolutions.map((r) => `${r.name.replace("EDITOR_FOLLOW_", "").toLowerCase()} ${r.seq}→${r.result}${r.conflict ? " conflict" : ""}`).join(", ")}); turn 1 kept the tab on cart.ts with line 10 in view and dotted other.ts; turn 2 kept the unsaved buffer and ⌘S met the offer; turn 3 withdrew; follow_marks peak ${peak}, last 0, anchor 0; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_follow: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
