// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor view's pixel anchor (web/app/derive/anchor.ts, sprint 411).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { ANCHOR_CELLS, decodeAnchor, encodeAnchor, type Anchor } from "../derive/anchor";

const a: Anchor = { seq: 812345, tree_rows: 1033, modified_dots: 7, left_folded: true, right_folded: false, bottom_folded: true, dock_right: false, sides_swapped: true, focus: false };

test("an anchor survives encode and decode, calibration cells first", () => {
  const bits = encodeAnchor(a);
  assert.strictEqual(bits.length, ANCHOR_CELLS);
  assert.deepStrictEqual(bits.slice(0, 2), [0, 1]);
  assert.deepStrictEqual(decodeAnchor(bits), a);
});

test("one flipped cell, a wrong magic or a short strip decodes to an error, never to a wrong anchor", () => {
  const bits = encodeAnchor(a);
  for (let i = 2; i < bits.length; i++) {
    const flipped = bits.slice();
    flipped[i] ^= 1;
    assert.ok("error" in decodeAnchor(flipped), `cell ${i} flipped decoded as an anchor`);
  }
  assert.ok("error" in decodeAnchor(bits.slice(1)));
});

test("a field too large for its cells is refused at encode", () => {
  assert.throws(() => encodeAnchor({ ...a, tree_rows: 70000 }), /tree_rows/);
});

// Sprint 422: the second row.
import { ANCHOR2_CELLS, decodeAnchor2, encodeAnchor2 } from "../derive/anchor";
test("the second row survives encode and decode, and any one flipped cell decodes to an error", () => {
  const a2 = { seq: 812345, tab_count: 3, outline_rows: 7, hunks: 2, activity_rows: 5, history_rows: 4 };
  const bits = encodeAnchor2(a2);
  assert.strictEqual(bits.length, ANCHOR2_CELLS);
  assert.deepStrictEqual(decodeAnchor2(bits), a2);
  for (let i = 2; i < bits.length; i++) { const f = bits.slice(); f[i] ^= 1; assert.ok("error" in decodeAnchor2(f), `cell ${i}`); }
});

// Sprint 424: the third row.
import { ANCHOR3_CELLS, decodeAnchor3, encodeAnchor3 } from "../derive/anchor";
test("the third row survives encode and decode, and any one flipped cell decodes to an error", () => {
  const a3 = { seq: 812345, mode: "insert" as const, binding: "nano" as const, unsaved: 2, conflict: true, meta: true, follow_marks: 3 };
  const bits = encodeAnchor3(a3);
  assert.strictEqual(bits.length, ANCHOR3_CELLS);
  assert.deepStrictEqual(decodeAnchor3(bits), a3);
  for (let i = 2; i < bits.length; i++) { const f = bits.slice(); f[i] ^= 1; assert.ok("error" in decodeAnchor3(f), `cell ${i}`); }
});
