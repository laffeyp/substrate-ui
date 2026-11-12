// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's inspector on real data (sprint 422; roadmap 2026-11-09-code-editor r8, E6; frame 24a).
// A real repository: main, and a branch `fix` whose one commit changes TAX_RATE in src/cart.ts. A real
// model (EDITOR_LIVE_MODEL, else the live roster's default, as a first-run user binds it) is asked to read src/cart.ts
// and edit one line of it; then a save by hand (PUT …/file, view "editor") inserts two lines at the top,
// which moves the session's change down two lines; a second save writes the same text. Each of the three
// authors owns one hunk. These agree:
//   truth   — `git diff -U0` against main's merge-base in the session's workspace; the kernel record on
//             disk (events-*.jsonl): the ToolCalls on src/cart.ts and their results, the FileWritten;
//             the file on disk (size, lines);
//   DOM     — OUTLINE's rows, and after a click in total()'s body, `total` lit with its line on disk, still
//             lit after a second save (same text) lands and the file is read again; ACTIVITY
//             folds and opens on its header; one CHANGES card per git hunk, at its line, with git's + and − counts and
//             its author (the branch's: unattributed; the model's edit: by the session · turn · seq of
//             the record's edit_file; the save: by hand); ACTIVITY's rows = the record's calls on the
//             file, newest first; HISTORY's rows = the record's edits, newest first, then "opened";
//             INFO = the file's facts;
//   pixels  — both anchor rows decode from a screenshot, name the same seq, and the record at that seq
//             is EDITOR_DRAWN with the inspector's counts;
//   signals — the last EDITOR_HUNK_DRAWN per hunk carries its author and line count; DIFF_READ in
//             server.jsonl carries git's hunk count.
// The inspector's column is written beside frame 24a for reading. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const MODEL = process.env.EDITOR_LIVE_MODEL || undefined;
const FILE = "src/cart.ts";
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

const BASE = `export interface Item { name: string; price: number; qty: number }

export class Cart {
  items: Item[] = [];
  add(item: Item): void {
    this.items.push(item);
  }
  total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }
}

export function formatPrice(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

export const TAX_RATE = 0.08;
`;
const SEARCH = "this.items.push(item);";
const REPLACE = "this.items.push({ ...item });";
const HAND = "// cart: the items and their total\n// kept by hand\n";

async function call(win: Page, method: string, url: string, body?: unknown): Promise<{ status: number; data: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return win.evaluate(async ([m, u, b]) => {
    const r = await fetch(u as string, { method: m as string, headers: { "Content-Type": "application/json" }, body: b === undefined ? undefined : JSON.stringify(b) });
    return { status: r.status, data: await r.json().catch(() => null) };
  }, [method, url, body] as const);
}

interface Drawn { outline: string[]; cards: { at: string; head: string; counts: string; author: string }[]; activity: string[]; history: string[]; info: Record<string, string>; header: string }
async function drawn(win: Page): Promise<Drawn> {
  // A string, not a function: tsx wraps named functions in a __name helper the page lacks.
  return win.evaluate(`(() => {
    var all = function (sel) { return Array.from(document.querySelectorAll(sel)); };
    var text = function (e) { return (e && e.textContent) || ""; };
    var info = {};
    all("[data-info-row]").forEach(function (e) { info[e.getAttribute("data-info-row")] = text(e.lastElementChild); });
    return {
      outline: all("[data-outline-row]").map(function (e) { return e.getAttribute("data-outline-row"); }),
      cards: all("[data-hunk-card]").map(function (e) { var head = e.firstElementChild; return { at: e.getAttribute("data-hunk-card"), head: text(head.firstElementChild), counts: text(head.lastElementChild), author: text(e.querySelector("[data-hunk-author]")) }; }),
      activity: all("[data-activity-row]").map(function (e) { return e.getAttribute("data-activity-row") + " " + Array.from(e.children).map(text).join(" "); }),
      history: all("[data-history-row]").map(function (e) { return e.getAttribute("data-history-row"); }),
      info: info,
      header: text(document.querySelector("[data-inspector-file]")),
    };
  })()`);
}

interface Env { seq: number; kind: string; payload: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-422-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-inspector-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, FILE), BASE);
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  git(repo, "checkout", "-q", "-b", "fix");
  writeFileSync(join(repo, FILE), BASE.replace("TAX_RATE = 0.08", "TAX_RATE = 0.0825"));
  git(repo, "commit", "-q", "-am", "tax");
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, MODEL, { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first()
      .fill(`Use read_file to read ${FILE}. Then use edit_file on ${FILE} to replace exactly \`${SEARCH}\` with \`${REPLACE}\`. Change nothing else, then reply "done".`);
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 300_000 });
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    const api = `/api/session/${encodeURIComponent(sid)}`;
    const model = String((await call(win, "GET", api)).data.driver ?? MODEL);
    if (!readFileSync(join(ws, FILE), "utf8").includes(REPLACE)) throw new Error(`${model} did not make the edit; ${FILE} is unchanged by the session`);

    // The save by hand: two lines inserted at the top.
    const read = await call(win, "GET", `${api}/file?path=${encodeURIComponent(FILE)}`);
    const saved = await call(win, "PUT", `${api}/file?path=${encodeURIComponent(FILE)}`, { text: HAND + String(read.data.text), base_sha256: read.data.sha256, view: "editor" });
    if (saved.status !== 200) throw new Error(`the save: ${saved.status} ${JSON.stringify(saved.data)}`);

    // The save on the window's record before the editor opens; a later landing is the re-read case below.
    await win.waitForFunction((seq) => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { seq: number }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).some((e) => e.seq === seq), saved.data.seq as number, { timeout: 15_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator(`[data-tree-row="${FILE}"]`).first().click();

    await win.locator('[data-editor-code] .cm-line', { hasText: "this.items.reduce" }).first().waitFor({ timeout: 15_000 });
    // The current symbol: a click in total()'s body lights `total`, with the line it starts on.
    await win.locator('[data-editor-code] .cm-line', { hasText: "this.items.reduce" }).first().click();
    const totalLine = readFileSync(join(ws, FILE), "utf8").split("\n").findIndex((l) => l.includes("total(): number {")) + 1;
    await win.waitForFunction(() => document.querySelector('[data-outline-row][data-current="1"]')?.getAttribute("data-outline-row") === "total", undefined, { timeout: 10_000 });
    const lit = await win.evaluate(() => document.querySelector('[data-outline-row][data-current="1"] [data-current-line]')?.textContent);
    if (lit !== String(totalLine)) throw new Error(`OUTLINE lights total at line ${lit}; the file has it at ${totalLine}`);
    // A write landing on the record reads the file again; the caret keeps its line. A save of the same text:
    // the record gains a FileWritten, the file is unchanged.
    const again = await call(win, "GET", `${api}/file?path=${encodeURIComponent(FILE)}`);
    const resaved = await call(win, "PUT", `${api}/file?path=${encodeURIComponent(FILE)}`, { text: String(again.data.text), base_sha256: again.data.sha256, view: "editor" });
    if (resaved.status !== 200) throw new Error(`the second save: ${resaved.status}`);
    await win.waitForFunction(() => document.querySelectorAll("[data-history-row]").length === 4, undefined, { timeout: 15_000 });
    await settled(win);
    const relit = await win.evaluate(() => document.querySelector('[data-outline-row][data-current="1"]')?.getAttribute("data-outline-row") ?? null);
    if (relit !== "total") throw new Error(`after a write landed and the file was read again, OUTLINE lights ${relit}; the caret did not keep its line`);

    // Truth, I: git's hunks and the file on disk.
    const mb = git(ws, "merge-base", "main", "HEAD").trim();
    const diff = git(ws, "diff", "-U0", mb, "--", FILE).split("\n");
    const hunks: { start: number; count: number; plus: number; minus: number; added: string[] }[] = [];
    for (const l of diff) {
      const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
      if (m) { hunks.push({ start: Number(m[1]), count: m[2] === undefined ? 1 : Number(m[2]), plus: 0, minus: 0, added: [] }); continue; }
      const h = hunks[hunks.length - 1];
      if (!h || l.startsWith("+++") || l.startsWith("---")) continue;
      if (l.startsWith("+")) { h.plus++; h.added.push(l.slice(1)); } else if (l.startsWith("-")) h.minus++;
    }
    const text = readFileSync(join(ws, FILE), "utf8");
    const size = statSync(join(ws, FILE)).size;

    // Truth, II: the kernel record on disk.
    const record = (await call(win, "GET", api)).data.record as string;
    const envs: Env[] = readdirSync(record).filter((f) => f.startsWith("events-")).sort()
      .flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Env));
    const rel = (p: unknown) => { let s = String(p ?? ""); if (s.startsWith(ws + "/")) s = s.slice(ws.length + 1); while (s.startsWith("./")) s = s.slice(2); return s; };
    const result = (id: unknown) => envs.find((e) => e.kind === "ToolResult" && e.payload.call_id === id);
    const turnAt = (seq: number) => envs.filter((e) => e.kind === "UserMessage" && e.seq <= seq).map((e) => Number(e.payload.turn_index)).pop();
    const onFile = envs.filter((e) => e.kind === "ToolCall" && ["read_file", "edit_file", "write_file"].includes(String(e.payload.tool)) && rel(e.payload.args?.[0]) === FILE);
    const touching = envs.filter((e) => e.kind === "ToolCall" && (onFile.includes(e)
      || (e.payload.tool === "grep" && String(result(e.payload.call_id)?.payload.output ?? "").split("\n").some((l) => rel(l.split(":")[0]) === FILE))
      || (e.payload.tool === "bash" && (e.payload.args ?? []).map(String).join(" ").includes("cart.ts"))));
    const edits = [...onFile.filter((e) => e.payload.tool !== "read_file" && result(e.payload.call_id)?.payload.ok !== false), ...envs.filter((e) => e.kind === "FileWritten" && rel(e.payload.path) === FILE)].sort((a, b) => a.seq - b.seq);
    const sessionEdit = onFile.filter((e) => e.payload.tool === "edit_file" && result(e.payload.call_id)?.payload.ok !== false && String(e.payload.args?.[2] ?? "").includes(REPLACE)).pop();
    if (!sessionEdit) throw new Error(`the record holds no ok edit_file writing \`${REPLACE}\`; calls on the file: ${onFile.map((e) => `${e.seq} ${e.payload.tool}`).join(", ")}`);
    const wantAuthor = (h: { added: string[] }) => h.added.some((l) => l.includes("kept by hand")) ? "by hand"
      : h.added.some((l) => l.includes(REPLACE)) ? `by the session · turn ${turnAt(sessionEdit.seq)} · seq ${sessionEdit.seq} edit_file` : "unattributed";

    // The DOM, once it shows git's hunks and the record's rows.
    const deadline = Date.now() + 20_000;
    let got = await drawn(win);
    const ready = (d: Drawn) => d.cards.length === hunks.length && d.activity.length === touching.length && d.history.length === edits.length + 1 && d.outline.length > 0;
    while (Date.now() < deadline && !ready(got)) { await settled(win); got = await drawn(win); }
    if (got.header !== "cart.ts") throw new Error(`the inspector's header names "${got.header}"`);
    const wantOutline = ["Cart", "add", "total", "formatPrice"];
    if (JSON.stringify(got.outline) !== JSON.stringify(wantOutline)) throw new Error(`OUTLINE ${JSON.stringify(got.outline)}; the file declares ${JSON.stringify(wantOutline)}`);
    // ACTIVITY folds on its header and opens again.
    const activityHead = win.locator('[data-inspector-section="activity"] > div').first();
    await activityHead.click();
    const foldedRows = await win.evaluate(() => document.querySelectorAll("[data-activity-row]").length);
    await activityHead.click();
    if (foldedRows !== 0 || (await win.evaluate(() => document.querySelectorAll("[data-activity-row]").length)) !== touching.length) throw new Error(`ACTIVITY folded to ${foldedRows} rows and did not open again to ${touching.length}`);
    const wantCards = hunks.map((h) => ({ at: String(h.start), head: `@@ ${h.start}${h.count > 1 ? `–${h.start + h.count - 1}` : ""}`, counts: `+${h.plus} −${h.minus}`, author: wantAuthor(h) }));
    if (JSON.stringify(got.cards) !== JSON.stringify(wantCards)) throw new Error(`CHANGES ${JSON.stringify(got.cards)}; git and the record say ${JSON.stringify(wantCards)}`);
    if (new Set(wantCards.map((c) => c.author.split(" ·")[0])).size !== 3) throw new Error(`the three authors do not each own a hunk: ${JSON.stringify(wantCards.map((c) => c.author))}`);
    const wantActivity = touching.map((e) => e.seq).reverse();
    if (JSON.stringify(got.activity.map((r) => Number(r.split(" ")[0]))) !== JSON.stringify(wantActivity)) throw new Error(`ACTIVITY ${JSON.stringify(got.activity)}; the record's calls on the file are seqs ${JSON.stringify(wantActivity)}`);
    const editRow = got.activity.find((r) => r.startsWith(`${sessionEdit.seq} `));
    if (!editRow || !editRow.includes(`t${turnAt(sessionEdit.seq)}`) || !editRow.includes("edit_file · +1 −1")) throw new Error(`ACTIVITY's row for the edit reads "${editRow}"`);
    const wantHistory = [...edits.map((e) => String(e.seq)).reverse(), "opened"];
    if (JSON.stringify(got.history) !== JSON.stringify(wantHistory)) throw new Error(`HISTORY ${JSON.stringify(got.history)}; the record's edits are ${JSON.stringify(wantHistory)}`);
    const lines = text.replace(/\n$/, "").split("\n").length;
    const wantInfo = { path: FILE, size: `${(size / 1024).toFixed(1)} KB · ${lines} lines`, modified: "today · by hand", encoding: "UTF-8", "line ends": "LF", type: "TypeScript" }; // sprint 472: the language as the editor highlights it
    if (JSON.stringify(got.info) !== JSON.stringify(wantInfo)) throw new Error(`INFO ${JSON.stringify(got.info)}; the disk says ${JSON.stringify(wantInfo)}`);

    // Pixels: both anchor rows, from a screenshot.
    const shot = join(shots, "editor.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor) throw new Error(`the anchor's first row does not decode: ${px.anchor.error}`);
    if ("error" in px.anchor2) throw new Error(`the anchor's second row does not decode: ${px.anchor2.error}`);
    const row2 = px.anchor2;
    if (row2.seq !== px.anchor.seq) throw new Error(`the anchor's rows name seqs ${px.anchor.seq} and ${row2.seq}`);
    const want2 = { tab_count: 1, outline_rows: wantOutline.length, hunks: hunks.length, activity_rows: touching.length, history_rows: edits.length + 1 };
    for (const [k, v] of Object.entries(want2)) if ((px.anchor2 as unknown as Record<string, number>)[k] !== v) throw new Error(`the second row reads ${k} ${(px.anchor2 as unknown as Record<string, number>)[k]}; want ${v}`);
    await win.locator('[data-editor-area="right"]').first().screenshot({ path: join(shots, "inspector.png") });
    const stillLit = await win.evaluate(() => document.querySelector('[data-outline-row][data-current="1"]')?.getAttribute("data-outline-row") ?? null);
    if (stillLit !== "total") throw new Error(`after the inspector's screenshot OUTLINE lights ${stillLit}`);
    const frame = join(REPO_ROOT, "runs", "design", "sheet-v11", "24a.png");
    if (existsSync(frame)) copyFileSync(frame, join(shots, "24a.png"));

    await app.close();
    const recs = windowRecords(launch);
    const at = recs.find((r) => r.proc_seq === row2.seq);
    if (!at || at.name !== "EDITOR_DRAWN") throw new Error(`the pixels name seq ${row2.seq}; the record there is ${at ? at.name : "missing"}`);
    for (const [k, v] of Object.entries(want2)) if (at.payload[k] !== v) throw new Error(`EDITOR_DRAWN at seq ${at.proc_seq}: ${k} ${String(at.payload[k])}; want ${v}`);
    const drawnHunks = recs.filter((r) => r.name === "EDITOR_HUNK_DRAWN").slice(-hunks.length).map((r) => `${String(r.payload.author)} ${String(r.payload.line_count)}`);
    const wantDrawn = hunks.map((h) => `${wantAuthor(h) === "by hand" ? "hand" : wantAuthor(h) === "unattributed" ? "unattributed" : "session"} ${h.plus + h.minus}`);
    if (JSON.stringify(drawnHunks) !== JSON.stringify(wantDrawn)) throw new Error(`EDITOR_HUNK_DRAWN ${JSON.stringify(drawnHunks)}; want ${JSON.stringify(wantDrawn)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const read2 = (f: string) => readFileSync(join(traces, boot, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    if (!read2("server.jsonl").some((r) => r.name === "DIFF_READ" && r.payload.hunks === hunks.length)) throw new Error(`no DIFF_READ in server.jsonl carries ${hunks.length} hunks`);
    const booted = read2("main.jsonl").find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_inspector: ok — ${model}; OUTLINE ${got.outline.join(", ")}; CHANGES ${wantCards.map((c) => `${c.head} ${c.counts} ${c.author}`).join(" | ")} = git and the record; ACTIVITY ${touching.length} rows, HISTORY ${edits.length} edits + opened = the record; INFO = the disk; anchor rows 1 and 2 name EDITOR_DRAWN seq ${at.proc_seq} with ${JSON.stringify(want2)}; EDITOR_HUNK_DRAWN ${drawnHunks.join(", ")}; packaged=${String(booted.packaged)}; screenshots ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_inspector: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
