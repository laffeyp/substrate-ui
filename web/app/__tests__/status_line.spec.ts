// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's status line (web/app/derive/status_line.ts, sprint 424).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { baseText, modeLabel, vsBase } from "../derive/status_line";
import { lineHunks } from "../derive/inspector";

test("the base is the file with its -U0 hunks undone: a change, an insertion, a removal", () => {
  const base = "a\nb\nc\nd\ne\n";
  const file = "a\nB\nc\nx\ny\nd\n"; // b → B; x, y inserted after c; e removed
  const hunks = [
    { old_start: 2, old_count: 1, new_start: 2, new_count: 1, lines: ["-b", "+B"] },
    { old_start: 3, old_count: 0, new_start: 4, new_count: 2, lines: ["+x", "+y"] },
    { old_start: 5, old_count: 1, new_start: 6, new_count: 0, lines: ["-e"] },
  ];
  assert.strictEqual(baseText(file, hunks), base);
  assert.deepStrictEqual(vsBase(base, file), { plus: 3, minus: 2 });
  // The buffer's own hunks, as git writes them, undo to the same base.
  assert.deepStrictEqual(lineHunks(base, file), hunks);
  // A removal at the top: git writes new_start 0.
  assert.strictEqual(baseText("z\n", [{ old_start: 1, old_count: 1, new_start: 0, new_count: 0, lines: ["-q"] }]), "q\nz\n");
});

test("the mode label, vim only", () => {
  assert.strictEqual(modeLabel("normal"), "-- NORMAL --");
  assert.strictEqual(modeLabel("visual line"), "-- VISUAL LINE --");
  assert.strictEqual(modeLabel(null), null);
});
