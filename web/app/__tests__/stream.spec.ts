// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's stream and its graph (web/app/derive/stream.ts, sprint 288).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { EnvelopeKind } from "../../vm/kinds";
import { bareKind, connector, KIND_COLOR, laneCells, laneOf, PLUMBING, sideLanes, streamRows, streamSpans, type RawEnvelope } from "../derive/stream";

const ENVS: RawEnvelope[] = [
  { seq: 1, kind: EnvelopeKind.SessionStarted, payload: { driver_model: "deterministic" } },
  { seq: 2, kind: EnvelopeKind.UserMessage, payload: { text: "hello", turn_index: 0 } },
  { seq: 3, kind: EnvelopeKind.TriggerFired, payload: { trigger_id: "on_message", starts: "model" } },
  { seq: 4, kind: EnvelopeKind.ProducerStarted, payload: { producer: { kind: "model", instance: "m1" } } },
  { seq: 5, kind: EnvelopeKind.ToolCall, payload: { call_id: "c1", tool: "bash", args: ["ls"] } },
  { seq: 6, kind: EnvelopeKind.ToolResult, payload: { call_id: "c1", tool: "bash", ok: true, output: "a.txt" } },
  { seq: 7, kind: EnvelopeKind.ProducerCompleted, payload: { producer: { kind: "model", instance: "m1" } } },
  { seq: 8, kind: EnvelopeKind.TriggerFired, payload: { trigger_id: "on_reply", starts: "return" } },
  { seq: 9, kind: EnvelopeKind.Returned, payload: { reason: "replied" } },
  { seq: 10, kind: EnvelopeKind.UserMessage, payload: { text: "again", turn_index: 1 } },
  { seq: 11, kind: EnvelopeKind.SessionEnded, payload: { reason: "user_end" } },
];

test("rows keep the wire kind for logic and write the kind without its prefix (F333)", () => {
  const rows = streamRows(ENVS);
  assert.deepStrictEqual(rows.map((r) => [r.seq, r.rawKind, r.prod, r.gist, r.lanes]), [
    [1, EnvelopeKind.SessionStarted, "runtime", "seed · driver deterministic", "m"],
    [2, EnvelopeKind.UserMessage, "runtime", "hello", "m"],
    [3, EnvelopeKind.TriggerFired, "runtime", "on_message fired → model", "m"],
    [4, EnvelopeKind.ProducerStarted, "runtime", "model", "m"],
    [5, EnvelopeKind.ToolCall, "model", "bash ls", "mt"],
    [6, EnvelopeKind.ToolResult, "tool · bash", "ok · a.txt", "mt"],
    [7, EnvelopeKind.ProducerCompleted, "runtime", "model", "m"],
    [8, EnvelopeKind.TriggerFired, "runtime", "on_reply fired → return", ""],
    [9, EnvelopeKind.Returned, "return", "returned · replied", ""],
    [10, EnvelopeKind.UserMessage, "runtime", "again", "m"],
    [11, EnvelopeKind.SessionEnded, "runtime", "end · user_end", "m"],
  ]);
  // The written kind drops the prefix the wire kind carries.
  assert.strictEqual(rows[2].kind, bareKind(EnvelopeKind.TriggerFired));
  assert.notStrictEqual(rows[2].kind, rows[2].rawKind);
  assert.strictEqual(rows[3].payload.instance, "m1");
  assert.ok(PLUMBING.has(rows[2].rawKind) && !PLUMBING.has(rows[4].rawKind));
  assert.strictEqual(KIND_COLOR[EnvelopeKind.RunFinalised], "#62676f");
});

test("spans: the model while open, a tool call to its result, the wait to the next message", () => {
  const spans = streamSpans(streamRows(ENVS));
  assert.deepStrictEqual(spans.model.map((s) => [s.start, s.end]), [[1, 11]]);
  assert.deepStrictEqual(spans.delegation.map((s) => [s.start, s.end, s.kind]), [[5, 6, "bash"]]);
  assert.deepStrictEqual(spans.external.map((s) => [s.start, s.end]), [[8, 10]]);
});

test("lanes, connectors and cells", () => {
  const rows = streamRows(ENVS);
  const spans = streamSpans(rows);
  const closes = new Set(spans.external.map((s) => s.end));
  assert.deepStrictEqual(rows.map(laneOf), ["model", "external", "model", "model", "delegation", "delegation", "model", "external", "external", "external", "model"]);
  assert.deepStrictEqual(connector(rows[4], closes), { c: "#7fb3b8", l: 4, w: 12, dot: 16 });
  assert.deepStrictEqual(connector(rows[7], closes), { c: "#82a5c8", l: 4, w: 24, dot: 28 });
  assert.deepStrictEqual(connector(rows[9], closes), { c: "#82a5c8", l: 4, w: 24, dot: 4 });
  assert.deepStrictEqual(connector(rows[1], closes), { c: "#88b0d0", l: 0, w: 4, dot: 4 });
  assert.deepStrictEqual(laneCells(rows[4], spans), ["#3d5166", "#7fb3b8", "transparent"]);
});

test("a resumed session has a model span per open stretch; the side graph lists tools and turn ends", () => {
  const resumed = [...ENVS, { seq: 12, kind: EnvelopeKind.UserMessage, payload: { text: "back" } }];
  const spans = streamSpans(streamRows(resumed));
  assert.deepStrictEqual(spans.model.map((s) => [s.start, s.end]), [[1, 11], [12, 12]]);
  assert.deepStrictEqual(sideLanes(streamRows(ENVS), streamSpans(streamRows(ENVS))).map((l) => [l.label, l.segs.length]), [["model", 1], ["bash", 1], ["returned", 1]]);
});
