// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's structure lens (web/app/derive/structure.ts, sprint 300).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { EnvelopeKind } from "../../vm/kinds";
import type { TopologyGraph } from "../../vm/types";
import { isLifecycleKind, kindLabel, structureView } from "../derive/structure";

const GRAPH: TopologyGraph = {
  producers: [
    { kind: "first_message", emits: [EnvelopeKind.UserMessage], initial: true, deterministic: true },
    { kind: "model", emits: [EnvelopeKind.ModelReply, EnvelopeKind.ToolCall], initial: false, deterministic: false },
    { kind: "session_started", emits: [], initial: false, deterministic: true },
  ],
  triggers: [
    { id: "model-on-UserMessage", onKind: EnvelopeKind.UserMessage, on: [EnvelopeKind.UserMessage], starts: "model", policy: "PerEvent" },
    { id: "session_started", onKind: EnvelopeKind.SessionStarted, on: [], starts: "session_started", policy: "" },
    { id: "language-on-ProducerCompleted", onKind: EnvelopeKind.ProducerCompleted, on: [EnvelopeKind.ProducerCompleted], starts: "language", policy: "PerEvent" },
  ],
  views: ["turns", "pending_calls"],
  termination: ["park on reply", "end on /exit"],
  routes: [],
  outside: [EnvelopeKind.SessionEnded],
  exports: [],
  baseline: { seed: 7, env: "test" },
  config: { vocab_version: "0.4" },
};

test("producers carry their tags; an instrument is a trigger named for what it starts", () => {
  const view = structureView(GRAPH);
  assert.strictEqual(view.empty, false);
  assert.deepStrictEqual(view.producers.map((p) => [p.name, p.emits, p.initialTag, p.instrumentTag, p.detTag]), [
    ["first_message", EnvelopeKind.UserMessage, "initial", "", "deterministic"],
    ["model", `${EnvelopeKind.ModelReply}, ${EnvelopeKind.ToolCall}`, "", "", ""],
    ["session_started", "—", "", "instrument", "deterministic"],
  ]);
  // A trigger with no `on` list splits its `onKind`; no policy reads "—".
  assert.deepStrictEqual(view.triggers[1].onKinds.map((k) => k.name), [EnvelopeKind.SessionStarted]);
  assert.strictEqual(view.triggers[1].policy, "—");
});

test("events: the topology's kinds, then the runtime's; who emits each, what it fires", () => {
  const view = structureView(GRAPH);
  const names = view.events.map((e) => e.name);
  assert.strictEqual(names.filter(isLifecycleKind).length, 1);
  const user = view.events.find((e) => e.name === EnvelopeKind.UserMessage)!;
  assert.deepStrictEqual([user.by, user.fires], [["first_message"], ["model-on-UserMessage"]]);
  const ended = view.events.find((e) => e.name === EnvelopeKind.SessionEnded)!;
  assert.deepStrictEqual([ended.by, ended.fires], [["outside"], ["—"]]);
  // The runtime's kind sorts last, names the runtime as its emitter, and breaks after the namespace.
  const done = view.events[view.events.length - 1];
  assert.deepStrictEqual([done.name, done.by, done.fires], [EnvelopeKind.ProducerCompleted, ["runtime"], ["language-on-ProducerCompleted"]]);
  assert.strictEqual(done.label, EnvelopeKind.ProducerCompleted.replace(".", ".\u200b"));
});

test("views, ends, routes, run; no graph is empty", () => {
  const view = structureView(GRAPH);
  assert.strictEqual(view.termination, "park on reply · end on /exit");
  assert.deepStrictEqual(view.run, [
    { k: "vocab version", v: "0.4" }, { k: "exports", v: "none" },
    { k: "baseline · env", v: "test" }, { k: "baseline · seed", v: "7" },
  ]);
  const none = structureView(null);
  assert.deepStrictEqual([none.empty, none.termination, none.events.length, none.run[0].v], [true, "—", 0, "—"]);
});
