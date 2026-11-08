// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window emitter's build posture (v0.9 E6, sprint 355): a broken emit is written as SIGNAL_REJECTED
// with the problem, the field and the call site, and the broken record is not; then it raises,
// unless the window is a packaged app's (native.packaged), where the caller goes on.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";

type Rec = { name: string; payload: Record<string, unknown> };

test("source and test builds raise; the packaged app writes SIGNAL_REJECTED", async () => {
  const sent: Rec[] = [];
  const native = { packaged: false, signal: (r: Rec) => { sent.push(r); } };
  (globalThis as unknown as { window: unknown }).window = { native };
  const { emit } = await import("../../vm/instrumentation/sdd");
  assert.throws(() => emit("NOT_A_TAG", {}), /NOT_A_TAG" rejected: unknown_tag/);
  assert.throws(() => emit("TRACE_OPENED", { process: "nowhere" }), /wrong_type \(process\)/);
  assert.deepStrictEqual(sent.map((r) => [r.name, r.payload.problem]), [["SIGNAL_REJECTED", "unknown_tag"], ["SIGNAL_REJECTED", "wrong_type"]]);
  sent.length = 0;

  native.packaged = true;
  assert.strictEqual(emit("TRACE_LOST", { process: "window", count: -2 }), null);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].name, "SIGNAL_REJECTED");
  const p = sent[0].payload;
  assert.deepStrictEqual([p.process, p.tag, p.problem, p.field], ["window", "TRACE_LOST", "out_of_range", "count"]);
  assert.match(String(p.call_site), /signal_posture\.spec\.ts/);
  emit("TRACE_OPENED", { process: "window" });
  assert.deepStrictEqual(sent.map((r) => r.name), ["SIGNAL_REJECTED", "TRACE_OPENED"]);
});
