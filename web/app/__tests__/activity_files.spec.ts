// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The activity tab's files (web/app/derive/activity_files.ts, sprint 440). Hand-written record entries in the
// kernel's shapes (ToolCall args by position, HarnessToolCall args by name, FileWritten by path).

import { test } from "node:test";
import assert from "node:assert";
import { activityFiles } from "../derive/activity_files";
import { EnvelopeKind } from "../../vm/envelope_kinds.gen";
import type { RecordEnvelope } from "../../vm/types";

const WS = "/work/crumb";
let seq = 0;
const env = (kind: string, payload: Record<string, unknown>): RecordEnvelope => ({ seq: ++seq, kind, payload });

test("every workspace file the calls touched, newest touch first, with its turn and tool", () => {
  const envs = [
    env(EnvelopeKind.UserMessage, { turn_index: 0, text: "go" }),
    env(EnvelopeKind.ToolCall, { call_id: "c1", tool: "read_file", args: ["src/a.ts"] }),
    env(EnvelopeKind.ToolCall, { call_id: "c2", tool: "grep", args: ["price", "."] }),
    env(EnvelopeKind.ToolResult, { call_id: "c2", tool: "grep", ok: true, output: "src/a.ts:3:price\nsrc/b.ts:1:price\nsrc/b.ts:4:price" }),
    env(EnvelopeKind.UserMessage, { turn_index: 1, text: "again" }),
    env(EnvelopeKind.ToolCall, { call_id: "c1", tool: "edit_file", args: [WS + "/src/a.ts", "x", "y"] }),
    env(EnvelopeKind.ToolCall, { call_id: "c2", tool: "write_file", args: ["/etc/hosts", "x"] }),
    env(EnvelopeKind.ToolCall, { call_id: "c3", tool: "bash", args: ["cat src/c.ts"] }),
  ];
  assert.deepStrictEqual(activityFiles(envs, WS).map((f) => [f.path, f.turn, f.tool, f.touches]), [
    ["src/a.ts", 1, "edit_file", 3],
    ["src/b.ts", 0, "grep", 1],
  ]);
});

test("harness drivers' edits and Claude's Read, and saves by hand", () => {
  const envs = [
    env(EnvelopeKind.HarnessToolCall, { call_id: "t1", tool: "Read", args: { file_path: WS + "/README.md" } }),
    env(EnvelopeKind.HarnessToolCall, { call_id: "t2", tool: "file_change", args: { changes: [{ kind: "update", path: "src/x.ts" }, { kind: "add", path: "src/y.ts" }] } }),
    env(EnvelopeKind.HarnessToolCall, { call_id: "t3", tool: "mcp__substrate__edit_file", args: { path: "src/z.ts", search: "a", replace: "b" } }),
    env(EnvelopeKind.FileWritten, { path: "README.md", old_text: "a", new_text: "b", view: "editor" }),
    env(EnvelopeKind.FileWritten, { path: "src/x.ts", old_text: "a", new_text: "b", view: "history" }),
  ];
  assert.deepStrictEqual(activityFiles(envs, WS).map((f) => [f.path, f.tool]), [
    ["src/x.ts", "history step"],
    ["README.md", "saved by hand"],
    ["src/z.ts", "mcp__substrate__edit_file"],
    ["src/y.ts", "file_change"],
  ]);
});
