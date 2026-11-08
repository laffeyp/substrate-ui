// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The signal buffer keeps the latest SIGNAL_CAP signals (sprint 340, plan row F5, F347).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { clearBuffer, emit, SIGNAL_CAP, snapshot } from "../../vm/instrumentation/sdd";
import { Signal } from "../../vm/signals.gen";

test("past the cap the oldest signals go, in order", () => {
  clearBuffer();
  for (let i = 0; i < SIGNAL_CAP + 25; i++) emit(Signal.STREAM_ENVELOPE_APPENDED, { seq: i, kind: "x" });
  const kept = snapshot();
  assert.strictEqual(kept.length, SIGNAL_CAP);
  assert.strictEqual(kept[0].payload.seq, 25);
  assert.strictEqual(kept[kept.length - 1].payload.seq, SIGNAL_CAP + 24);
  clearBuffer();
});
