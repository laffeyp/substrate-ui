// UI sprint 129 — a harness driver's tool calls (kernel K282) are tool cards in the transcript.
//
// A claude, codex or cursor-agent session records each call to its own tools as a HarnessToolCall /
// HarnessToolResult pair, and each call it makes to Substrate's tools over MCP as Substrate's own
// ToolCall / ToolResult with origin `mcp` (kernel K286).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { SessionController } from "../../vm/session_controller";
import { EnvelopeKind } from "../../vm/kinds";
import { isToolCallRow, isToolResultRow } from "../../vm";
import type { RecordEnvelope, SubstrateClient } from "../../vm";

function controller(): SessionController {
  const client = {
    fetchJson: async () => ({ ok: false, status: 500, failureClass: "http_error", detail: "" }),
    streamRecord: () => () => undefined,
    streamRecordByPath: () => () => undefined,
  } as unknown as SubstrateClient;
  return new SessionController(client);
}

function feed(c: SessionController, env: Partial<RecordEnvelope>): void {
  (c as unknown as { handleEnvelope(sid: string, e: RecordEnvelope): void }).handleEnvelope("s", env as RecordEnvelope);
}

test("a harness's own call and its MCP call to Substrate each make one card, labelled", () => {
  const c = controller();
  feed(c, { seq: 22, kind: EnvelopeKind.HarnessToolCall, payload: { call_id: "toolu_1", tool: "Write", args: { file_path: "own.txt", content: "ok" }, step: 0, turn_index: 0 } });
  feed(c, { seq: 23, kind: EnvelopeKind.HarnessToolResult, payload: { call_id: "toolu_1", ok: true, output: "File created" } });
  feed(c, { seq: 26, kind: EnvelopeKind.ToolCall, payload: { call_id: "mcp0.0", tool: "write_file", args: ["mcp.txt", "ok"], step: 0, origin: "mcp" } });
  feed(c, { seq: 27, kind: EnvelopeKind.ToolResult, payload: { call_id: "mcp0.0", tool: "write_file", ok: false, output: "", error: "write_file: missing required argument(s): text", step: 0, origin: "mcp" } });
  feed(c, { seq: 30, kind: EnvelopeKind.ToolCall, payload: { call_id: "c1", tool: "bash", args: ["ls"], step: 1 } });
  const rows = c.snapshot().transcript;
  const calls = rows.filter(isToolCallRow);
  const results = rows.filter(isToolResultRow);
  assert.deepStrictEqual(calls.map((r) => r.text), ["Write (harness) own.txt", "write_file (mcp) mcp.txt", "bash ls"]);
  assert.deepStrictEqual(calls.map((r) => r.toolRoute), ["harness", "mcp", undefined]);
  assert.deepStrictEqual(calls[0].args, ["file_path=own.txt", "content=ok"]);
  assert.deepStrictEqual(results.map((r) => r.callKey), ["toolu_1@22", "mcp0.0@26"], "each result joins its call");
  assert.strictEqual(results[0].output, "File created");
  assert.strictEqual(results[1].toolOk, false);
  assert.strictEqual(results[1].error, "write_file: missing required argument(s): text");
});

test("Substrate's own ToolCall rows still count as tool cards", () => {
  assert.ok(isToolCallRow({ kind: EnvelopeKind.ToolCall }));
  assert.ok(isToolResultRow({ kind: EnvelopeKind.ToolResult }));
  assert.ok(!isToolCallRow({ kind: EnvelopeKind.ModelReply }));
});

test("a compaction row shows the range the kernel wrote", () => {
  const c = controller();
  feed(c, { seq: 29, kind: EnvelopeKind.TranscriptCompacted, payload: { strategy: "rolling_window", dropped_seq_range: [17, 27], kept_seq_start: 28, reason: "driver_window_exceeded", tokens_before: 6000, tokens_after: 4000 } });
  const row = c.snapshot().transcript.find((r) => r.kind === EnvelopeKind.TranscriptCompacted);
  assert.strictEqual(row?.text, "— prompt history: earlier turns dropped (seq 17–27)");
});

test("a v0.7 compaction row names the cleared tool output (§ S.4)", () => {
  const c = controller();
  feed(c, { seq: 40, kind: EnvelopeKind.TranscriptCompacted, payload: { strategy: "tool_output_cleared", cleared_through_seq: 33, kept_seq_start: 17, reason: "driver_window_exceeded", tokens_before: 70000, tokens_after: 28000, token_scale: 1.2 } });
  const row = c.snapshot().transcript.find((r) => r.kind === EnvelopeKind.TranscriptCompacted);
  assert.strictEqual(row?.text, "— prompt history: older tool output cleared (results through seq 33)");
});

test("a repeated cut adds no row (the codex record repeats 17–146 three times)", () => {
  const c = controller();
  for (const seq of [150, 169, 180]) {
    feed(c, { seq, kind: EnvelopeKind.TranscriptCompacted, payload: { strategy: "rolling_window", dropped_seq_range: [17, 146], kept_seq_start: 147, reason: "driver_window_exceeded", tokens_before: 228114, tokens_after: 9322 } });
  }
  const rows = c.snapshot().transcript.filter((r) => r.kind === EnvelopeKind.TranscriptCompacted);
  assert.strictEqual(rows.length, 1);
});
