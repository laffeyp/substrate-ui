// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's send-loss path (web/vm/instrumentation/sdd.ts, sprint 354). In the app, contextBridge
// freezes window.native, so no gate can make native.signal throw; here a stand-in window holds a
// native.signal that refuses the first two records. Sprint 532: the records are buffered and flushed to
// main on a microtask, not one send per emit, and this stand-in has no native.signalBatch, so the
// emitter falls back to native.signal per record and counts each refusal on its own. The emitter keeps
// both refused records in its buffer, and after the next send that works sends TRACE_LOST (process
// window, count 2) with the next proc_seq.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";

type Rec = { name: string; proc_seq: number; payload: Record<string, unknown> };

// Let every pending microtask (the deferred flushes) run.
const drain = () => new Promise<void>((r) => setTimeout(r, 0));

test("refused sends are counted and reported as one TRACE_LOST after the next good send", async () => {
  const sent: Rec[] = [];
  let refuse = 2;
  (globalThis as unknown as { window: unknown }).window = {
    native: {
      signal: (r: Rec) => {
        if (refuse > 0) { refuse -= 1; throw new Error("planted: the send is refused"); }
        sent.push(r);
      },
    },
  };
  const { emit, snapshot } = await import("../../vm/instrumentation/sdd");
  const { Signal, TraceOpenedProcess } = await import("../../vm/signals.gen");
  emit(Signal.TRACE_OPENED, { process: TraceOpenedProcess.WINDOW });
  emit(Signal.TRACE_OPENED, { process: TraceOpenedProcess.WINDOW });
  assert.strictEqual(sent.length, 0, "both refused sends stay unsent");
  emit(Signal.TRACE_OPENED, { process: TraceOpenedProcess.WINDOW });
  await drain();
  // The one flush sends the three records in order: the first two throw and are counted, the third
  // lands, then TRACE_LOST (count 2) lands on the next flush.
  assert.deepStrictEqual(sent.map((r) => [r.name, r.proc_seq]), [["TRACE_OPENED", 2], ["TRACE_LOST", 3]]);
  assert.deepStrictEqual(sent[1].payload, { process: "window", count: 2 });
  assert.strictEqual(snapshot().length, 4, "the buffer keeps every record, the refused ones too");
  emit(Signal.TRACE_OPENED, { process: TraceOpenedProcess.WINDOW });
  await drain();
  assert.strictEqual(sent.filter((r) => r.name === "TRACE_LOST").length, 1, "a loss is reported once");
});
