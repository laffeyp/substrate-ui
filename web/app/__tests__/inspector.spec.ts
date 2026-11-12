// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The inspector's derivations (web/app/derive/inspector.ts, sprint 421) over a record shaped as the kernel
// writes it: UserMessage(turn_index), ToolCall(call_id, tool, args, step), ToolResult(call_id, ok, output),
// FileWritten(path, old_text, new_text, view); read_file's output numbered as the kernel writes it (`<n>\t<line>`).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { authorLabel, fileActivity, fileAuthors, fileHistory, fileHistoryState, fileType, hunkAuthor, lineDelta, linesText, litRow, readResult, relPath, stepText } from "../derive/inspector";
import type { RecordEnvelope } from "../../vm/types";
import { EnvelopeKind } from "../../vm/envelope_kinds.gen";

const WS = "/work/crumb";
let seq = 0;
const env = (kind: string, payload: Record<string, unknown>): RecordEnvelope => ({ seq: ++seq, kind, payload });
const v1 = "a\nb\nc\nd\n";
const v2 = "a\nB\nc\nd\n"; // the session's edit_file: b → B
const v3 = "a\nB\nc\nd\ne\n"; // the person's save: e added
const numbered = (t: string) => t.replace(/\n$/, "").split("\n").map((l, i) => `${i + 1}\t${l}`).join("\n");
const record: RecordEnvelope[] = [
  env(EnvelopeKind.UserMessage, { text: "fix it", turn_index: 0 }),
  env(EnvelopeKind.ToolCall, { call_id: "c1", tool: "read_file", args: [WS + "/src/cart.ts"], step: 1 }),
  env(EnvelopeKind.ToolResult, { call_id: "c1", tool: "read_file", ok: true, output: numbered(v1) }),
  env(EnvelopeKind.ToolCall, { call_id: "c2", tool: "grep", args: ["price", "src"], step: 2 }),
  env(EnvelopeKind.ToolResult, { call_id: "c2", tool: "grep", ok: true, output: "src/cart.ts:1:price" }),
  env(EnvelopeKind.UserMessage, { text: "again", turn_index: 1 }),
  env(EnvelopeKind.ToolCall, { call_id: "c3", tool: "edit_file", args: ["./src/cart.ts", "b\n", "B\n"], step: 1 }),
  env(EnvelopeKind.ToolResult, { call_id: "c3", tool: "edit_file", ok: true, output: "edited" }),
  env(EnvelopeKind.ToolCall, { call_id: "c4", tool: "edit_file", args: ["src/cart.ts", "zzz", "y"], step: 2 }),
  env(EnvelopeKind.ToolResult, { call_id: "c4", tool: "edit_file", ok: false, error: "edit_file: search text not found" }),
  env(EnvelopeKind.ToolCall, { call_id: "c5", tool: "bash", args: ["npm test -- cart.ts"], step: 3 }),
  env(EnvelopeKind.ToolResult, { call_id: "c5", tool: "bash", ok: true, output: "ok" }),
  env(EnvelopeKind.FileWritten, { path: "src/cart.ts", old_text: v2, new_text: v3, view: "editor" }),
  env(EnvelopeKind.ToolCall, { call_id: "c6", tool: "read_file", args: ["src/menu.ts"], step: 4 }),
];

test("tool paths are named as the workspace names them", () => {
  assert.strictEqual(relPath(WS + "/src/cart.ts", WS), "src/cart.ts");
  assert.strictEqual(relPath("./src/cart.ts", WS), "src/cart.ts");
  assert.strictEqual(relPath("src/cart.ts", null), "src/cart.ts");
  assert.strictEqual(relPath(3, WS), null);
});

test("ACTIVITY lists this file's calls newest first, with turn, seq and gist; another file's calls are left out", () => {
  const rows = fileActivity(record, "src/cart.ts", WS);
  assert.deepStrictEqual(rows.map((r) => `t${r.turn} ${r.seq} ${r.gist}`), [
    "t1 11 bash npm test -- cart.ts · text match",
    "t1 9 edit_file · failed",
    "t1 7 edit_file · +1 −1",
    "t0 4 grep \"price\" · 1 match",
    "t0 2 read_file · 4 lines",
  ]);
});

test("HISTORY lists the ok edits newest first: the hand save, then the session's edit; a failed edit is not one", () => {
  const rows = fileHistory(record, "src/cart.ts", WS, v3);
  assert.deepStrictEqual(rows.map((r) => [r.seq, r.author, r.tool, r.plus, r.minus, r.stepBack]), [
    [13, "hand", null, 1, 0, true],
    [7, "session", "edit_file", 1, 1, true],
  ]);
});

test("each hunk's author is the newest edit that wrote its lines", () => {
  const history = fileHistory(record, "src/cart.ts", WS, v3), authors = fileAuthors(record, "src/cart.ts", WS, v3);
  assert.strictEqual(authorLabel(hunkAuthor({ old_start: 2, old_count: 1, new_start: 2, new_count: 1, lines: ["-b", "+B"] }, authors, history)), "by the session · turn 1 · seq 7 edit_file");
  assert.strictEqual(authorLabel(hunkAuthor({ old_start: 4, old_count: 0, new_start: 5, new_count: 1, lines: ["+e"] }, authors, history)), "by hand");
  assert.strictEqual(authorLabel(hunkAuthor({ old_start: 1, old_count: 0, new_start: 1, new_count: 1, lines: ["+a"] }, authors, history)), "unattributed");
});

test("a session hunk keeps its author when a later save inserts lines above it; a removal is its remover's", () => {
  const v4 = "x\ny\na\nB\nc\ne\n"; // the person's save: x, y inserted at the top, d removed
  const rec = [...record, env(EnvelopeKind.FileWritten, { path: "src/cart.ts", old_text: v3, new_text: v4, view: "editor" })];
  const history = fileHistory(rec, "src/cart.ts", WS, v4), authors = fileAuthors(rec, "src/cart.ts", WS, v4);
  assert.strictEqual(hunkAuthor({ old_start: 2, old_count: 1, new_start: 4, new_count: 1, lines: ["-b", "+B"] }, authors, history)?.seq, 7);
  assert.strictEqual(hunkAuthor({ old_start: 4, old_count: 1, new_start: 5, new_count: 0, lines: ["-d"] }, authors, history)?.seq, seq);
});

test("a cut read is not the file's text; a change the record does not hold is unattributed", () => {
  assert.deepStrictEqual(readResult("5\te\n6\tf\n… 3 more line(s); read_file(path, 7) for the rest"), { count: 2, first: 5, text: null });
  assert.deepStrictEqual(readResult("(file is empty)"), { count: 0, first: 1, text: "" });
  const history = fileHistory(record, "src/cart.ts", WS, v3 + "z\n"), authors = fileAuthors(record, "src/cart.ts", WS, v3 + "z\n");
  assert.strictEqual(hunkAuthor({ old_start: 4, old_count: 0, new_start: 6, new_count: 1, lines: ["+z"] }, authors, history), null);
  assert.strictEqual(hunkAuthor({ old_start: 4, old_count: 0, new_start: 5, new_count: 1, lines: ["+e"] }, authors, history)?.author, "hand");
});

test("a write with no earlier text on the record cannot step back", () => {
  const rec = [env(EnvelopeKind.UserMessage, { text: "w", turn_index: 0 }), env(EnvelopeKind.ToolCall, { call_id: "w1", tool: "write_file", args: ["n.ts", "x\ny\n"], step: 1 }), env(EnvelopeKind.ToolResult, { call_id: "w1", tool: "write_file", ok: true, output: "wrote" })];
  const [row] = fileHistory(rec, "n.ts", WS, "x\ny\n");
  assert.deepStrictEqual([row.author, row.plus, row.stepBack], ["session", 2, false]);
  assert.deepStrictEqual(fileAuthors(rec, "n.ts", WS, "x\ny\n").lines, [rec[1].seq, rec[1].seq]);
});

test("line deltas and types", () => {
  assert.deepStrictEqual(lineDelta("a\nb\n", "a\nB\nc\n"), { plus: 2, minus: 1 });
  assert.strictEqual(fileType("src/cart.ts", "TypeScript"), "TypeScript");
  assert.strictEqual(fileType("notes.zz", null), ".zz file");
  assert.strictEqual(fileType("Makefile", null), "plain text");
});

test("HISTORY's steps (sprint 429): a step is not a row, the lit row follows the file, and authors come back", () => {
  const t1 = "a\nb\n", t2 = "a\nB\n", t3 = "a\nB\nc\n";
  const rec = [
    env(EnvelopeKind.UserMessage, { text: "go", turn_index: 0 }),
    env(EnvelopeKind.FileWritten, { path: "h.ts", old_text: t1, new_text: t2, view: "editor" }),
    env(EnvelopeKind.FileWritten, { path: "h.ts", old_text: t2, new_text: t3, view: "editor" }),
  ];
  const first = rec[1].seq;
  let st = fileHistoryState(rec, "h.ts", WS, t3);
  assert.strictEqual(st.rows.length, 2);
  assert.strictEqual(st.opened, t1);
  assert.strictEqual(litRow(st.rows, st.opened, t3), 0);
  assert.strictEqual(stepText(st.rows, st.opened, 0, true), t2, "back from the newest writes its earlier text");
  assert.strictEqual(stepText(st.rows, st.opened, 0, false), null, "nothing newer");
  // The step back, written as a save with view "history".
  const stepped = [...rec, env(EnvelopeKind.FileWritten, { path: "h.ts", old_text: t3, new_text: t2, view: "history" })];
  st = fileHistoryState(stepped, "h.ts", WS, t2);
  assert.strictEqual(st.rows.length, 2, "a step adds no row");
  assert.strictEqual(litRow(st.rows, st.opened, t2), 1);
  assert.strictEqual(stepText(st.rows, st.opened, 1, true), t1);
  assert.strictEqual(stepText(st.rows, st.opened, 1, false), t3);
  assert.strictEqual(litRow(st.rows, st.opened, t1), "opened");
  assert.strictEqual(stepText(st.rows, st.opened, "opened", true), null, "nothing before the opening text");
  assert.strictEqual(stepText(st.rows, st.opened, "opened", false), t2);
  // Line 2 (B) is the first save's again after the step.
  assert.strictEqual(hunkAuthor({ old_start: 2, old_count: 1, new_start: 2, new_count: 1, lines: ["-b", "+B"] }, st.authors, st.rows)?.seq, first);
  assert.strictEqual(litRow(st.rows, st.opened, "x\n"), null, "a text off the record lights nothing");
});

test("sprint 462: a count of lines reads \"1 line\" and \"N lines\"", () => {
  assert.deepStrictEqual([0, 1, 2, 312].map(linesText), ["0 lines", "1 line", "2 lines", "312 lines"]);
});
