// UI sprint 129 — a harness driver's tool calls (kernel K282) are tool cards in the transcript.
//
// A claude, codex or cursor-agent session records each call it makes inside one model step as a
// HarnessToolCall / HarnessToolResult pair, `via` naming the route: `harness` (its own tool) or
// `mcp` (the session's tool over Substrate's MCP server).
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

test("each route's call and result make one card, with the route in the row", () => {
  const c = controller();
  feed(c, { seq: 22, kind: EnvelopeKind.HarnessToolCall, payload: { call_id: "toolu_1", tool: "Write", args: { file_path: "own.txt", content: "ok" }, via: "harness", step: 0, turn_index: 0 } });
  feed(c, { seq: 23, kind: EnvelopeKind.HarnessToolResult, payload: { call_id: "toolu_1", ok: true, output: "File created" } });
  feed(c, { seq: 26, kind: EnvelopeKind.HarnessToolCall, payload: { call_id: "mcp0.0", tool: "write_file", args: { path: "mcp.txt", text: "ok" }, via: "mcp", step: 0, turn_index: 0 } });
  feed(c, { seq: 27, kind: EnvelopeKind.HarnessToolResult, payload: { call_id: "mcp0.0", ok: false, output: "write_file: missing required argument(s): text" } });
  const rows = c.snapshot().transcript;
  const calls = rows.filter(isToolCallRow);
  const results = rows.filter(isToolResultRow);
  assert.deepStrictEqual(calls.map((r) => r.text), ["Write (harness) own.txt", "write_file (mcp) mcp.txt"]);
  assert.deepStrictEqual(calls.map((r) => r.toolRoute), ["harness", "mcp"]);
  assert.deepStrictEqual(calls[1].args, ["path=mcp.txt", "text=ok"]);
  assert.deepStrictEqual(results.map((r) => r.callKey), ["toolu_1@22", "mcp0.0@26"], "each result joins its call");
  assert.strictEqual(results[0].output, "File created");
  assert.strictEqual(results[1].toolOk, false);
  assert.strictEqual(results[1].error, "write_file: missing required argument(s): text");
  assert.strictEqual(results[1].text, "write_file → err");
});

test("Substrate's own ToolCall rows still count as tool cards", () => {
  assert.ok(isToolCallRow({ kind: EnvelopeKind.ToolCall }));
  assert.ok(isToolResultRow({ kind: EnvelopeKind.ToolResult }));
  assert.ok(!isToolCallRow({ kind: EnvelopeKind.ModelReply }));
});
