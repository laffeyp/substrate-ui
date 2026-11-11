// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the editor's inspector draws for one file, derived from the session's record (sprint 421; roadmap
// 2026-11-09-code-editor r8, E6; spec r6 §5 "Code", §5.0; frame 24a). No I/O, no state.
//
// - ACTIVITY: this file in the record, newest first: each turn and seq where the session read or wrote it,
//   from ToolCall arguments (read_file, edit_file, write_file by their path; grep, bash by a text match),
//   with a gist (24a: "edit_file · +2 −1", "read_file · 312 lines", `grep "price" · 6 matches`).
// - HISTORY: every edit, newest first, by the session (a ToolCall to edit_file or write_file whose
//   ToolResult is ok) or by hand (FileWritten), with + and − line counts and whether the record holds the
//   earlier text a step back would restore (BLACKBOARD 2026-11-09, HISTORY's earlier texts).
// - each hunk's author: every line carries the edit that last wrote it, and every gap the edit that last
//   removed lines there, forward through each edit the record holds; a hunk's author is the newest of its
//   lines' (a removal: its gap's). Lines whose author the record cannot show are "unattributed" (D6).
// read_file's result is the kernel's numbered window (`<n>\t<line>`, a `… N more line(s)` marker when cut;
// substrate/topologies/tool_loop/tools.py `_read_file`): only a whole read is the file's text.
// The kernel's tool names come from the record itself; kinds come from envelope_kinds.gen.ts.

import { EnvelopeKind } from "../../vm/envelope_kinds.gen";
import type { RecordEnvelope } from "../../vm/types";

export interface ActivityRow { seq: number; turn: number | null; tool: string; gist: string }
export interface HistoryRow {
  seq: number; turn: number | null;
  author: "session" | "hand"; tool: string | null;
  plus: number; minus: number;
  /** The record holds the text this edit replaced. */
  stepBack: boolean;
  /** Sprint 429: the file's whole text before and after this edit, when the record holds it (HISTORY's
   *  step back writes `before`, its step forward the next row's `after`). */
  before: string | null;
  after: string | null;
}
/** A HISTORY step (sprint 429): a save with this view moves the lit row and adds no row. */
export const HISTORY_VIEW = "history";
/** A save made before a turn was posted (sprint 444; roadmap r13 E10.0): a hand edit, listed like any save. */
export const SEND_VIEW = "send";
/** Per line of the file now, the seq of the edit that last wrote it, and per gap (before each line, and
 *  after the last) the seq of the edit that last removed lines there; null where the record cannot say. */
export interface Authors { lines: (number | null)[]; gaps: (number | null)[] }
export interface Hunk { old_start: number; old_count: number; new_start: number; new_count: number; lines: string[] }

const FILE_TOOLS = new Set(["read_file", "edit_file", "write_file"]);
const lines = (s: string) => (s === "" ? 0 : s.replace(/\n$/, "").split("\n").length);

/** A read_file result: its numbered lines, and the file's text when the window is the whole file. */
export function readResult(output: string): { count: number; first: number; text: string | null } {
  if (output === "(file is empty)") return { count: 0, first: 1, text: "" };
  const rows = output.split("\n");
  const cut = rows.length > 0 && rows[rows.length - 1].startsWith("… ");
  const body: string[] = [];
  let first = 0;
  for (const row of cut ? rows.slice(0, -1) : rows) {
    const m = /^(\d+)\t(.*)$/.exec(row);
    if (!m) return { count: 0, first: 0, text: null };
    if (!first) first = Number(m[1]);
    body.push(m[2]);
  }
  return { count: body.length, first, text: !cut && first === 1 ? body.join("\n") + "\n" : null };
}

/** A tool's path argument as the workspace names it: relative, no "./", the workspace's own prefix gone. */
export function relPath(arg: unknown, workspace: string | null): string | null {
  if (typeof arg !== "string" || !arg) return null;
  let p = arg;
  if (workspace && p.startsWith(workspace.replace(/\/$/, "") + "/")) p = p.slice(workspace.replace(/\/$/, "").length + 1);
  while (p.startsWith("./")) p = p.slice(2);
  return p;
}

/** Turn index of each seq: the last UserMessage before it. */
export function turnOf(envs: readonly RecordEnvelope[]): (seq: number) => number | null {
  const marks = envs.filter((e) => e.kind === EnvelopeKind.UserMessage).map((e) => ({ seq: e.seq, turn: Number(e.payload.turn_index) }));
  return (seq) => { let t: number | null = null; for (const m of marks) { if (m.seq <= seq) t = m.turn; else break; } return t; };
}

/** A call's result: the first ToolResult after it with its call_id. The kernel numbers call ids per turn
 *  (`c1`, `c2`, …), so the same id comes back in every turn (sprint 431, found by editor_follow). */
export function resultOf(envs: readonly RecordEnvelope[], call: RecordEnvelope): RecordEnvelope | undefined {
  return envs.find((e) => e.kind === EnvelopeKind.ToolResult && e.seq > call.seq && e.payload.call_id === call.payload.call_id);
}

export function fileActivity(envs: readonly RecordEnvelope[], path: string, workspace: string | null): ActivityRow[] {
  const turn = turnOf(envs);
  const name = path.slice(path.lastIndexOf("/") + 1);
  const rows: ActivityRow[] = [];
  for (const e of envs) {
    if (e.kind !== EnvelopeKind.ToolCall) continue;
    const tool = String(e.payload.tool);
    const args = (e.payload.args as unknown[]) ?? [];
    const res = resultOf(envs, e);
    let gist: string | null = null;
    if (FILE_TOOLS.has(tool)) {
      if (relPath(args[0], workspace) !== path) continue;
      if (res && res.payload.ok === false) gist = `${tool} · failed`;
      else if (tool === "read_file") {
        const r = readResult(String(res?.payload.output ?? ""));
        gist = r.first > 1 ? `${tool} · lines ${r.first}–${r.first + r.count - 1}` : `${tool} · ${r.count} lines`;
      }
      else if (tool === "edit_file") gist = `${tool} · +${lines(String(args[2] ?? ""))} −${lines(String(args[1] ?? ""))}`;
      else gist = `${tool} · ${lines(String(args[1] ?? ""))} lines`;
    } else if (tool === "grep") {
      // grep's result lists its matches by file (`path:line:text`): the matches in this file (24a: `grep "price" · 6 matches`).
      const hits = String(res?.payload.output ?? "").split("\n").filter((l) => relPath(l.split(":")[0], workspace) === path).length;
      if (!hits) continue;
      gist = `grep "${String(args[0] ?? "")}" · ${hits} match${hits === 1 ? "" : "es"}`;
    } else if (tool === "bash") {
      // A text match, labelled as one: the command names the file (roadmap r4: ACTIVITY lists bash by text match).
      const text = args.map(String).join(" ");
      if (!text.includes(path) && !text.includes(name)) continue;
      gist = `bash ${String(args[0] ?? "").slice(0, 40)} · text match`;
    } else continue;
    rows.push({ seq: e.seq, turn: turn(e.seq), tool, gist });
  }
  return rows.reverse();
}

type Op = "keep" | "del" | "ins";
/** The line diff of two texts by longest common subsequence, as a list of keep / del / ins steps. The lines
 *  the texts share at the head and the tail are kept without the table (sprint 424: the status line diffs
 *  the buffer on each pause in typing, where only the middle differs). */
function diffOps(prev: string, next: string): Op[] {
  const all = (t: string) => (t === "" ? [] : t.replace(/\n$/, "").split("\n"));
  const fa = all(prev), fb = all(next);
  let head = 0;
  while (head < fa.length && head < fb.length && fa[head] === fb[head]) head++;
  let tail = 0;
  while (tail < fa.length - head && tail < fb.length - head && fa[fa.length - 1 - tail] === fb[fb.length - 1 - tail]) tail++;
  const a = fa.slice(head, fa.length - tail), b = fb.slice(head, fb.length - tail);
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: Op[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { ops.push("keep"); i++; j++; }
    else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) { ops.push("ins"); j++; }
    else { ops.push("del"); i++; }
  }
  return [...new Array<Op>(head).fill("keep"), ...ops, ...new Array<Op>(tail).fill("keep")];
}

/** The lines `next` has that `prev` does not, and the reverse. */
export function lineDelta(prev: string, next: string): { plus: number; minus: number } {
  const ops = diffOps(prev, next);
  return { plus: ops.filter((op) => op === "ins").length, minus: ops.filter((op) => op === "del").length };
}

/** The changes from `prev` to `next` as git writes them with -U0: each run of removed and added lines, its
 *  removed lines first; a count of 0 starts at the line before (sprint 424: the centre marks the buffer). */
export function lineHunks(prev: string, next: string): Hunk[] {
  const all = (t: string) => (t === "" ? [] : t.replace(/\n$/, "").split("\n"));
  const a = all(prev), b = all(next);
  const out: Hunk[] = [];
  let i = 0, j = 0, run: { i: number; j: number; minus: string[]; plus: string[] } | null = null;
  const close = () => {
    if (!run) return;
    const oc = run.minus.length, nc = run.plus.length;
    out.push({ old_start: oc ? run.i + 1 : run.i, old_count: oc, new_start: nc ? run.j + 1 : run.j, new_count: nc, lines: [...run.minus.map((l) => "-" + l), ...run.plus.map((l) => "+" + l)] });
    run = null;
  };
  for (const op of diffOps(prev, next)) {
    if (op === "keep") { close(); i++; j++; continue; }
    run ??= { i, j, minus: [], plus: [] };
    if (op === "del") { run.minus.push(a[i]); i++; } else { run.plus.push(b[j]); j++; }
  }
  close();
  return out;
}

const newer = (x: number | null, y: number | null) => (x === null ? y : y === null ? x : Math.max(x, y));

/** Carry each line's author and each gap's across one edit `prev` → `next` written by `seq`. */
function carry(prev: string, next: string, at: Authors, seq: number): Authors {
  const out: Authors = { lines: [], gaps: [] };
  let i = 0, gap: number | null = at.gaps[0] ?? null;
  for (const op of diffOps(prev, next)) {
    if (op === "del") { gap = newer(newer(gap, seq), at.gaps[i + 1] ?? null); i++; continue; }
    out.gaps.push(gap);
    if (op === "keep") { out.lines.push(at.lines[i]); gap = at.gaps[i + 1] ?? null; i++; }
    else { out.lines.push(seq); gap = null; }
  }
  out.gaps.push(gap);
  return out;
}
const fresh = (text: string, seq: number | null): Authors => ({ lines: new Array<number | null>(lines(text)).fill(seq), gaps: new Array<number | null>(lines(text) + 1).fill(null) });

/** The file's edits, newest first, and who wrote each line of `current` (the file's text now). */
export function fileHistory(envs: readonly RecordEnvelope[], path: string, workspace: string | null, current: string | null): HistoryRow[] {
  return walk(envs, path, workspace, current).rows;
}
export function fileAuthors(envs: readonly RecordEnvelope[], path: string, workspace: string | null, current: string | null): Authors {
  return walk(envs, path, workspace, current).authors;
}
/** The rows, the authors, and the file's text when the record first shows it ("opened"), for HISTORY's
 *  steps (sprint 429). */
export function fileHistoryState(envs: readonly RecordEnvelope[], path: string, workspace: string | null, current: string | null): { rows: HistoryRow[]; authors: Authors; opened: string | null } {
  return walk(envs, path, workspace, current);
}

const flat = (t: string | null) => (t === null ? null : t.replace(/\r\n?/g, "\n"));
/** Which HISTORY row the file's text is now: the newest whose text after it is `current`, or "opened"
 *  when it is the opening text; null when the text is none of them (a change off the record). */
export function litRow(rows: readonly HistoryRow[], opened: string | null, current: string | null): number | "opened" | null {
  const now = flat(current);
  if (now === null) return null;
  const i = rows.findIndex((r) => flat(r.after) === now);
  if (i >= 0) return i;
  return flat(opened) === now ? "opened" : null;
}
/** The text a step writes: back from the lit row its `before`; forward the newer row's `after`. */
export function stepText(rows: readonly HistoryRow[], opened: string | null, lit: number | "opened" | null, back: boolean): string | null {
  if (lit === null) return null;
  if (back) return lit === "opened" ? null : rows[lit].stepBack ? rows[lit].before : null;
  if (lit === "opened") return rows.length ? rows[rows.length - 1].after : null;
  return lit > 0 ? rows[lit - 1].after : null;
}

function walk(envs: readonly RecordEnvelope[], path: string, workspace: string | null, current: string | null): { rows: HistoryRow[]; authors: Authors; opened: string | null } {
  const turn = turnOf(envs);
  const rows: HistoryRow[] = [];
  // The file's whole text as the walk goes forward, from a whole read, a write or a save; its authors
  // beside it. A change the record does not hold (the text differs from what the walk expects) is
  // carried with an unattributed seq, so its lines read "unattributed".
  let known: string | null = null, at: Authors | null = null, opened: string | null = null;
  const outside = new Set<number>();
  // Each text the walk has seen, with its authors: a HISTORY step that writes one again takes them back.
  const seen = new Map<string, Authors>();
  const meet = (text: string, seq: number) => {
    if (known === null || at === null) { known = text; at = fresh(text, null); opened ??= text; seen.set(text, at); return; }
    if (known !== text) { at = carry(known, text, at, seq); outside.add(seq); known = text; seen.set(text, at); }
  };
  for (const e of envs) {
    if (e.kind === EnvelopeKind.FileWritten) {
      if (relPath(e.payload.path, workspace) !== path) continue;
      const before = e.payload.old_text == null ? "" : String(e.payload.old_text);
      const after = String(e.payload.new_text ?? "");
      meet(before, e.seq - 0.5);
      if (e.payload.view === HISTORY_VIEW) {
        // A step: the text is an earlier or later one again; its authors come back with it.
        at = seen.get(after) ?? carry(before, after, at!, e.seq); known = after;
        if (!seen.has(after)) { outside.add(e.seq); seen.set(after, at); }
        continue;
      }
      const d = lineDelta(before, after);
      rows.push({ seq: e.seq, turn: turn(e.seq), author: "hand", tool: null, plus: d.plus, minus: d.minus, stepBack: true, before, after });
      at = carry(before, after, at!, e.seq); known = after; seen.set(after, at);
      continue;
    }
    if (e.kind !== EnvelopeKind.ToolCall) continue;
    const tool = String(e.payload.tool);
    const args = (e.payload.args as unknown[]) ?? [];
    if (!FILE_TOOLS.has(tool) || relPath(args[0], workspace) !== path) continue;
    const res = resultOf(envs, e);
    if (!res || res.payload.ok === false) continue;
    if (tool === "read_file") { const r = readResult(String(res.payload.output ?? "")); if (r.text !== null) meet(r.text, e.seq); continue; }
    let after: string | null;
    if (tool === "write_file") after = String(args[1] ?? "");
    else {
      // edit_file: search → replace, exactly once unless replace_all (the kernel refuses anything else).
      const search = String(args[1] ?? ""), replace = String(args[2] ?? "");
      const all = args[3] === true || args[3] === "true";
      after = known !== null && search && (known as string).includes(search) ? (all ? (known as string).split(search).join(replace) : (known as string).replace(search, replace)) : null;
      if (after === null) {
        rows.push({ seq: e.seq, turn: turn(e.seq), author: "session", tool, plus: lines(replace), minus: lines(search), stepBack: false, before: null, after: null });
        known = null; at = null;
        continue;
      }
    }
    const stepBack = known !== null;
    const d = known !== null ? lineDelta(known, after) : { plus: lines(after), minus: 0 };
    rows.push({ seq: e.seq, turn: turn(e.seq), author: "session", tool, plus: d.plus, minus: d.minus, stepBack, before: known, after });
    at = known !== null && at !== null ? carry(known, after, at, e.seq) : fresh(after, e.seq);
    opened ??= known;
    known = after; seen.set(after, at);
  }
  let authors: Authors;
  if (current === null) authors = { lines: [], gaps: [] };
  else if (known === null || at === null) authors = fresh(current, null);
  else { authors = known === current ? at : carry(known, current, at, Number.POSITIVE_INFINITY); outside.add(Number.POSITIVE_INFINITY); }
  const own = (seq: number | null) => (seq === null || outside.has(seq) ? null : seq);
  return { rows: rows.reverse(), authors: { lines: authors.lines.map(own), gaps: authors.gaps.map(own) }, opened };
}

/** Who wrote a hunk: the newest author among its new lines and the gaps inside it; a removal, its gap's. */
export function hunkAuthor(hunk: Hunk, authors: Authors, history: readonly HistoryRow[]): HistoryRow | null {
  let seq: number | null = null;
  if (hunk.new_count > 0) {
    for (let k = hunk.new_start - 1; k < hunk.new_start - 1 + hunk.new_count; k++) seq = newer(newer(seq, authors.lines[k] ?? null), authors.gaps[k] ?? null);
  } else seq = authors.gaps[hunk.new_start] ?? null; // git -U0: a removal after line new_start
  return seq === null ? null : history.find((r) => r.seq === seq) ?? null;
}

export function authorLabel(r: HistoryRow | null): string {
  if (!r) return "unattributed";
  if (r.author === "hand") return "by hand";
  return `by the session${r.turn !== null ? ` · turn ${r.turn}` : ""} · seq ${r.seq}${r.tool ? ` ${r.tool}` : ""}`;
}

/** INFO's type line: the language by extension, as 24a writes it ("TypeScript (by extension)"). */
export function fileType(path: string): string {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  const names: Record<string, string> = { ts: "TypeScript", tsx: "TypeScript (JSX)", js: "JavaScript", jsx: "JavaScript (JSX)", mjs: "JavaScript", py: "Python", json: "JSON", html: "HTML", css: "CSS", md: "Markdown", sh: "Shell", bash: "Shell" };
  return names[ext] ? `${names[ext]} (by extension)` : path.includes(".") ? `.${ext} file` : "plain text";
}
