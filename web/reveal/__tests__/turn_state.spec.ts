// UI sprint 101 — turn state the activity strip and the tool cards read.
//
// 2026-10-02, session s_74df6e70…, turn 28: the turn request failed after 600 s, a red
// "turn refused" row appeared, and the strip kept pulsing "turn 28 · Ns" with a clock that
// never stopped. The strip called a turn live whenever no Park followed its UserMessage. The
// same turn's bash card showed an earlier turn's result: call ids restart at c0 every turn
// and the transcript paired results by bare call id.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { liveActivity } from "../activity";
import { SessionController } from "../../vm/session_controller";
import { EnvelopeKind } from "../../vm/kinds";
import type { RecordEnvelope, SubstrateClient } from "../../vm";

const T0 = 1_790_000_000;

function um(seq: number, t: number, turn: number) {
  return { seq, t, kind: EnvelopeKind.UserMessage, payload: { turn_index: turn, text: "hi" } };
}

function snap(envs: unknown[], turnFailure: { detail: string; atT: number } | null = null) {
  return { rawEnvelopes: envs, turnFailure };
}

test("a turn with no Park and no known failure is live and pulses", () => {
  const a = liveActivity(snap([um(1, T0, 28)]));
  assert.ok(a);
  assert.strictEqual(a.kind, "live");
  assert.strictEqual(a.pulseOn, true);
});

test("a failed turn stops pulsing and says how it ended", () => {
  const envs = [
    um(1, T0, 28),
    { seq: 2, t: T0 + 150, kind: EnvelopeKind.ToolCall, payload: { call_id: "c5", tool: "bash" } },
  ];
  const a = liveActivity(snap(envs, { detail: '{"error":"TimeoutError: exceeded 600.0s"}', atT: T0 + 600 }));
  assert.ok(a);
  assert.strictEqual(a.kind, "failed");
  assert.strictEqual(a.pulseOn, false);
  assert.match(a.restText, /^2\.5m · 1 tool · ended: TimeoutError: exceeded 600\.0s$/);
});

test("a turn sent after the failure is live again", () => {
  const a = liveActivity(snap([um(1, T0, 28), um(9, T0 + 700, 29)], { detail: "x", atT: T0 + 600 }));
  assert.ok(a);
  assert.strictEqual(a.kind, "live");
});

test("a parked turn is a recap regardless of an old failure", () => {
  const envs = [um(1, T0, 3), { seq: 2, t: T0 + 4, kind: EnvelopeKind.Park, payload: { reason: "final_answer" } }];
  const a = liveActivity(snap(envs, { detail: "x", atT: T0 + 9 }));
  assert.ok(a);
  assert.strictEqual(a.kind, "recap");
});

function controller(): SessionController {
  const client = {
    fetchJson: async () => ({ ok: false, status: 500, failureClass: "http_error", detail: '{"error":"TimeoutError"}' }),
    streamRecord: () => () => undefined,
    streamRecordByPath: () => () => undefined,
  } as unknown as SubstrateClient;
  return new SessionController(client);
}

function feed(c: SessionController, env: Partial<RecordEnvelope>): void {
  (c as unknown as { handleEnvelope(sid: string, e: RecordEnvelope): void }).handleEnvelope("s", env as RecordEnvelope);
}

test("tool calls that reuse a call id across turns keep their own result and progress", () => {
  const c = controller();
  feed(c, { seq: 10, t: T0, kind: EnvelopeKind.ToolCall, payload: { call_id: "c5", tool: "bash", args: ["aws ecr"], step: 5 } });
  feed(c, { seq: 11, t: T0, kind: EnvelopeKind.ToolResult, payload: { call_id: "c5", tool: "bash", ok: true, output: "OLD", step: 5 } });
  feed(c, { seq: 50, t: T0, kind: EnvelopeKind.ToolCall, payload: { call_id: "c5", tool: "bash", args: ["node server.js &"], step: 5 } });
  feed(c, { seq: 51, t: T0, kind: EnvelopeKind.ToolProgress, payload: { call_id: "c5", chunk: "NEW\n", eof: false } });
  const rows = c.snapshot().transcript.filter((r) => r.callId === "c5");
  const keys = rows.map((r) => r.callKey);
  assert.deepStrictEqual(keys, ["c5@10", "c5@10", "c5@50"], "each call has its own key; the result joins its call");
  assert.deepStrictEqual(c.snapshot().progressByCallId, { "c5@50": { text: "NEW\n", eof: false } });
});

test("a failed turn request records the failure on the snapshot", async () => {
  const c = controller();
  (c as unknown as { snap: { sessionId: string } }).snap.sessionId = "s";
  await c.sendTurn("go");
  const f = c.snapshot().turnFailure;
  assert.ok(f, "turnFailure set");
  assert.match(f.detail, /TimeoutError/);
});

test("a replayed envelope (stream reconnect) does not append its row again", () => {
  const c = controller();
  const env = { seq: 7, t: T0, kind: EnvelopeKind.UserMessage, payload: { text: "hello", turn_index: 0 } };
  feed(c, env);
  feed(c, env);
  const rows = c.snapshot().transcript.filter((r) => r.seq === 7);
  assert.strictEqual(rows.length, 1, `rows for seq 7: ${rows.length}`);
});
