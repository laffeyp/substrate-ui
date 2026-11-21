// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 524: batch fold. Feeds 30,000 envelopes through the controller and asserts
// that batching produces correct state with fewer listener notifications than envelopes.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { EnvelopeKind } from "../../vm/kinds";
import { SessionController } from "../../vm/session_controller";
import type { SubstrateClient } from "../../vm/client";

// Stub requestAnimationFrame and cancelAnimationFrame for the node test environment.
// The spec calls drainBatch directly; the stub prevents handleEnvelope from throwing.
const globals = globalThis as Record<string, unknown>;
let rafId = 0;
globals.requestAnimationFrame = (_cb: unknown) => ++rafId;
globals.cancelAnimationFrame = (_id: unknown) => {};

const client = {
  fetchJson: async () => ({ ok: true, data: null }),
  streamRecord: () => () => undefined,
  streamRecordByPath: () => () => undefined,
} as unknown as SubstrateClient;

type Handle = {
  handleEnvelope(sessionId: string, env: unknown): void;
  drainBatch(): void;
};

function makeEnvelopes(): { seq: number; kind: string; payload: Record<string, unknown>; t: number }[] {
  const envelopes: { seq: number; kind: string; payload: Record<string, unknown>; t: number }[] = [];
  let seq = 1;

  // 1 UserMessage
  envelopes.push({ seq: seq++, kind: EnvelopeKind.UserMessage, payload: { text: "run a long command", turn_index: 0 }, t: 1 });
  // 1 ModelReply
  envelopes.push({ seq: seq++, kind: EnvelopeKind.ModelReply, payload: { text: "executing..." }, t: 2 });
  // 1 ToolCall
  envelopes.push({ seq: seq++, kind: EnvelopeKind.ToolCall, payload: { tool: "bash", call_id: "c0", args: ["ls -la"] }, t: 3 });
  // 20,000 ToolProgress chunks for c0
  for (let i = 0; i < 20_000; i++) {
    envelopes.push({ seq: seq++, kind: EnvelopeKind.ToolProgress, payload: { call_id: "c0", chunk: `line_${i}\n` }, t: 4 + i * 0.001 });
  }
  // 1 ToolResult for c0
  envelopes.push({ seq: seq++, kind: EnvelopeKind.ToolResult, payload: { tool: "bash", call_id: "c0", ok: true, output: "done" }, t: 25 });
  // Fill the rest to reach 30,000 with a mix of AssistantMessage, ToolCall, ToolProgress, ToolResult
  while (envelopes.length < 29_998) {
    const callId = `c${Math.floor((envelopes.length - 20005) / 3) + 1}`;
    envelopes.push({ seq: seq++, kind: EnvelopeKind.ToolCall, payload: { tool: "read", call_id: callId, args: ["file.txt"] }, t: 30 + envelopes.length });
    envelopes.push({ seq: seq++, kind: EnvelopeKind.ToolProgress, payload: { call_id: callId, chunk: "data\n" }, t: 30 + envelopes.length });
    envelopes.push({ seq: seq++, kind: EnvelopeKind.ToolResult, payload: { tool: "read", call_id: callId, ok: true, output: "ok" }, t: 30 + envelopes.length });
  }
  // Pad with ModelReply to reach exactly 30,000
  while (envelopes.length < 30_000) {
    envelopes.push({ seq: seq++, kind: EnvelopeKind.ModelReply, payload: { text: `reply_${envelopes.length}` }, t: 50 + envelopes.length });
  }
  return envelopes;
}

test("batch fold: 30,000 envelopes produce fewer listener calls, correct state", () => {
  const ctl = new SessionController(client);
  const handle = ctl as unknown as Handle;
  let listenerCalls = 0;
  ctl.subscribe(() => { listenerCalls++; });
  // subscribe fires once synchronously with the initial snapshot
  const initialCall = listenerCalls;

  const envelopes = makeEnvelopes();
  assert.strictEqual(envelopes.length, 30_000);

  // Feed all envelopes through handleEnvelope. In a jsdom-less env, requestAnimationFrame
  // is unavailable; call drainBatch directly after queuing.
  for (const env of envelopes) {
    handle.handleEnvelope("s_test", env);
  }
  // Drain the queued batch synchronously. The drain yields after its frame budget and
  // reschedules via rAF (which the stub swallows), so loop until the queue is empty.
  while (ctl.snapshot().rawEnvelopes.length < 30_000) {
    handle.drainBatch();
  }

  const snap = ctl.snapshot();

  // Listener was called fewer than 30,000 times after the initial subscribe call.
  const envelopeCalls = listenerCalls - initialCall;
  assert.ok(
    envelopeCalls < 30_000,
    `listener called ${envelopeCalls} times, expected fewer than 30,000`,
  );

  // rawEnvelopes holds all 30,000 in order.
  assert.strictEqual(snap.rawEnvelopes.length, 30_000);
  for (let i = 0; i < 30_000; i++) {
    assert.strictEqual(snap.rawEnvelopes[i].seq, envelopes[i].seq);
  }

  // progressByCallId["c0@3"].text holds the last 1,000 lines (sprint 526 trim); droppedLines
  // counts the lines that were trimmed. 20,000 chunks of "line_N\n" produce 20,001 split entries
  // (the trailing empty string after the final \n). Keeping the last 1,001 entries (1,000 lines
  // plus the trailing empty) drops 19,000.
  const callKey = "c0@3";
  const progress = snap.progressByCallId[callKey];
  assert.ok(progress, `progressByCallId["${callKey}"] missing`);
  let expected = "";
  for (let i = 19_000; i < 20_000; i++) expected += `line_${i}\n`;
  assert.strictEqual(progress.text, expected);
  assert.strictEqual(progress.eof, true);
  assert.strictEqual(progress.droppedLines, 19_000);

  // Transcript holds rows in order: UserMessage, ModelReply, ToolCall, ToolResult, ...
  assert.ok(snap.transcript.length > 0, "transcript is empty");
  const kinds = snap.transcript.map((r) => r.kind);
  assert.strictEqual(kinds[0], EnvelopeKind.UserMessage);
  assert.strictEqual(kinds[1], EnvelopeKind.ModelReply);
  assert.strictEqual(kinds[2], EnvelopeKind.ToolCall);
  // The ToolResult for c0 follows the ToolCall somewhere after the ToolProgress chunk envelopes.
  const toolResultIndex = kinds.indexOf(EnvelopeKind.ToolResult);
  assert.ok(toolResultIndex > 2, "ToolResult not found after ToolCall");

  // Seqs in the transcript are monotonically non-decreasing (fractional seqs from model_error
  // rows can appear between integer seqs, but integer seqs are ordered).
  const intSeqs = snap.transcript.map((r) => r.seq).filter((s) => Number.isInteger(s));
  for (let i = 1; i < intSeqs.length; i++) {
    assert.ok(intSeqs[i] >= intSeqs[i - 1], `transcript seq order broken at index ${i}: ${intSeqs[i - 1]} > ${intSeqs[i]}`);
  }
});

test("batch fold: drainBatch is idempotent on an empty queue", () => {
  const ctl = new SessionController(client);
  const handle = ctl as unknown as Handle;
  let calls = 0;
  ctl.subscribe(() => { calls++; });
  const before = calls;
  handle.drainBatch();
  // An empty drain still fires listeners once (the post-drain notification).
  assert.ok(calls - before <= 1);
});
