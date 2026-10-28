// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// UI sprint 135: a harness driver's own tool calls count in the session bar's turn line. Before,
// only Substrate's ToolCall counted, so a claude, codex or cursor-agent turn read "no tools".
import { test } from "node:test";
import assert from "node:assert";
import { EnvelopeKind } from "../../vm/kinds";
import { liveActivity } from "../activity";

const t0 = Date.now() / 1000 - 5;
const um = { seq: 10, kind: EnvelopeKind.UserMessage, t: t0, payload: { turn_index: 3 } };
const call = (seq: number, id: string, tool: string) => ({ seq, kind: EnvelopeKind.HarnessToolCall, t: t0 + 1, payload: { call_id: id, tool } });
const result = (seq: number, id: string) => ({ seq, kind: EnvelopeKind.HarnessToolResult, t: t0 + 2, payload: { call_id: id, ok: true, output: "x" } });

test("a live harness turn counts its calls and names the one still running", () => {
  const a = liveActivity({ rawEnvelopes: [um, call(11, "a", "Bash"), result(12, "a"), call(13, "b", "Read")] });
  assert.strictEqual(a?.kind, "live");
  assert.match(a!.restText, /· 2 tools · Read ·/);
});

test("a finished harness turn's recap counts its calls", () => {
  const done = { seq: 20, kind: EnvelopeKind.Returned, t: t0 + 4, payload: { reason: "replied" } };
  const a = liveActivity({ rawEnvelopes: [um, call(11, "a", "Bash"), result(12, "a"), call(13, "b", "Read"), result(14, "b"), done] });
  assert.strictEqual(a?.kind, "recap");
  assert.match(a!.restText, /· 2 tools ·/);
});
