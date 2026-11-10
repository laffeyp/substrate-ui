// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The session's edits the editor follows (web/app/derive/follow.ts, sprint 431).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { followItems } from "../derive/follow";
import { EnvelopeKind } from "../../vm/envelope_kinds.gen";
import type { RecordEnvelope } from "../../vm/types";

const WS = "/work/crumb";
let seq = 0;
const env = (kind: string, payload: Record<string, unknown>): RecordEnvelope => ({ seq: ++seq, kind, payload });

test("edit_file and write_file calls on workspace files after a seq, with their results as they land", () => {
  const before = env(EnvelopeKind.ToolCall, { call_id: "c0", tool: "edit_file", args: ["src/a.ts", "x", "y"], step: 1 });
  const open = seq;
  const read = env(EnvelopeKind.ToolCall, { call_id: "c1", tool: "read_file", args: ["src/a.ts"], step: 1 });
  const edit = env(EnvelopeKind.ToolCall, { call_id: "c2", tool: "edit_file", args: [WS + "/src/a.ts", "b = 2", "b = 20"], step: 2 });
  const write = env(EnvelopeKind.ToolCall, { call_id: "c3", tool: "write_file", args: ["./src/b.ts", "new\n"], step: 3 });
  const outside = env(EnvelopeKind.ToolCall, { call_id: "c4", tool: "write_file", args: ["/etc/hosts", "x"], step: 4 });
  let items = followItems([before, read, edit, write, outside], WS, open);
  assert.deepStrictEqual(items.map((i) => [i.callSeq, i.tool, i.files, i.resultSeq, i.ok]), [
    [edit.seq, "edit_file", [{ path: "src/a.ts", search: "b = 2" }], null, null],
    [write.seq, "write_file", [{ path: "src/b.ts", search: null }], null, null],
  ]);
  const ok = env(EnvelopeKind.ToolResult, { call_id: "c2", tool: "edit_file", ok: true, output: "edited" });
  const failed = env(EnvelopeKind.ToolResult, { call_id: "c3", tool: "write_file", ok: false, error: "denied" });
  items = followItems([before, read, edit, write, outside, ok, failed], WS, open);
  assert.deepStrictEqual(items.map((i) => [i.callSeq, i.resultSeq, i.ok]), [[edit.seq, ok.seq, true], [write.seq, failed.seq, false]]);
  // The kernel numbers call ids per turn: the next turn's c2 is paired with its own result, not turn 1's.
  const again = env(EnvelopeKind.ToolCall, { call_id: "c2", tool: "edit_file", args: ["src/a.ts", "b = 20", "b = 200"], step: 1 });
  items = followItems([before, read, edit, write, outside, ok, failed, again], WS, open);
  assert.deepStrictEqual(items.map((i) => [i.callSeq, i.resultSeq]), [[edit.seq, ok.seq], [write.seq, failed.seq], [again.seq, null]]);
  const okAgain = env(EnvelopeKind.ToolResult, { call_id: "c2", tool: "edit_file", ok: true, output: "edited" });
  items = followItems([before, read, edit, write, outside, ok, failed, again, okAgain], WS, open);
  assert.deepStrictEqual(items.map((i) => [i.callSeq, i.resultSeq]), [[edit.seq, ok.seq], [write.seq, failed.seq], [again.seq, okAgain.seq]]);
});

// Sprint 432: the harness drivers' calls, written by hand in the shapes the kernel's stream parsers give them
// (substrate adapters/harness_streams.py) and Claude Code's tool schemas.
const call = (call_id: string, tool: string, args: Record<string, unknown>) => env(EnvelopeKind.HarnessToolCall, { call_id, tool, args, step: 0, turn_index: 0 });
const result = (call_id: string, ok: boolean) => env(EnvelopeKind.HarnessToolResult, { call_id, ok, output: ok ? "done" : "failed" });

test("Claude: Write, Edit, MultiEdit and NotebookEdit, each with its file and the text it replaces", () => {
  const recs = [
    call("t1", "Write", { file_path: WS + "/src/a.ts", content: "a\n" }), result("t1", true),
    call("t2", "Edit", { file_path: WS + "/src/a.ts", old_string: "a", new_string: "b" }), result("t2", true),
    call("t3", "MultiEdit", { file_path: WS + "/src/a.ts", edits: [{ old_string: "b", new_string: "c" }] }), result("t3", false),
    call("t4", "NotebookEdit", { notebook_path: WS + "/n.ipynb", new_source: "x" }),
    call("t5", "Bash", { command: "ls" }), result("t5", true),
  ];
  assert.deepStrictEqual(followItems(recs, WS, -1).map((i) => [i.tool, i.files.map((f) => `${f.path}:${f.search}`), i.ok]), [
    ["Write", ["src/a.ts:null"], true], ["Edit", ["src/a.ts:a"], true], ["MultiEdit", ["src/a.ts:b"], false], ["NotebookEdit", ["n.ipynb:null"], null],
  ]);
});

test("Substrate's own tools through MCP, with or without the server in the name", () => {
  const recs = [
    call("mcp0.0", "write_file", { path: WS + "/x.md", text: "x" }), result("mcp0.0", true),
    call("mcp0.1", "substrate-edit_file", { path: WS + "/x.md", search: "x", replace: "y" }), result("mcp0.1", true),
    call("mcp0.2", "substrate.write_file", { path: WS + "/y.md", text: "y" }),
    call("mcp0.3", "mcp__substrate__edit_file", { path: WS + "/y.md", search: "y", replace: "z" }),
    call("mcp0.4", "list_dir", { path: WS }), result("mcp0.4", true),
  ];
  assert.deepStrictEqual(followItems(recs, WS, -1).map((i) => [i.tool, i.files.map((f) => `${f.path}:${f.search}`)]), [
    ["write_file", ["x.md:null"]], ["substrate-edit_file", ["x.md:x"]], ["substrate.write_file", ["y.md:null"]], ["mcp__substrate__edit_file", ["y.md:y"]],
  ]);
});

test("Cursor's edit by path; Codex's file_change over each of its files, its call and result together", () => {
  const recs = [
    call("c1", "edit", { path: WS + "/own.txt", streamContent: "ok" }), result("c1", true),
    call("item_1", "file_change", { changes: [{ kind: "update", path: WS + "/src/a.ts" }, { kind: "add", path: WS + "/src/c.ts" }] }), result("item_1", true),
    call("item_2", "command_execution", { command: "printf ok > own.txt" }), result("item_2", true),
  ];
  assert.deepStrictEqual(followItems(recs, WS, -1).map((i) => [i.tool, i.files.map((f) => f.path), i.ok]), [
    ["edit", ["own.txt"], true], ["file_change", ["src/a.ts", "src/c.ts"], true],
  ]);
});

test("a harness call's result is its own, though the ids repeat per turn; a file outside the workspace is not followed", () => {
  const first = call("mcp0.0", "write_file", { path: WS + "/a.md", text: "1" });
  const firstRes = result("mcp0.0", true);
  const second = call("mcp0.0", "write_file", { path: WS + "/a.md", text: "2" });
  const secondRes = result("mcp0.0", false);
  const outside = call("t9", "Write", { file_path: "/etc/hosts", content: "x" });
  assert.deepStrictEqual(followItems([first, firstRes, second, secondRes, outside], WS, -1).map((i) => [i.callSeq, i.resultSeq, i.ok]), [
    [first.seq, firstRes.seq, true], [second.seq, secondRes.seq, false],
  ]);
});
