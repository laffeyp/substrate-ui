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
  assert.deepStrictEqual(items.map((i) => [i.callSeq, i.path, i.tool, i.search, i.resultSeq, i.ok]), [
    [edit.seq, "src/a.ts", "edit_file", "b = 2", null, null],
    [write.seq, "src/b.ts", "write_file", null, null, null],
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
