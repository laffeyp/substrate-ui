// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The workspace tree's keys (web/app/derive/tree_key.ts, sprint 236).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { treeKey, type TreeItem } from "../derive/tree_key";

// An open folder with one session, then a closed folder.
const flat: TreeItem[] = [
  { expandable: true, expanded: true, parent: null },
  { expandable: false, expanded: false, parent: 0 },
  { expandable: true, expanded: false, parent: null },
];
const key = (k: string, mods: { shiftKey?: boolean; altKey?: boolean } = {}) => ({ key: k, shiftKey: !!mods.shiftKey, altKey: !!mods.altKey });

test("↑ ↓ move and wrap", () => {
  assert.deepStrictEqual(treeKey(flat, 2, key("ArrowDown")), { move: 0 });
  assert.deepStrictEqual(treeKey(flat, 0, key("ArrowUp")), { move: 2 });
});

test("→ opens a closed row; ← folds an open one, and on a session folds its row", () => {
  assert.deepStrictEqual(treeKey(flat, 2, key("ArrowRight")), { toggle: 2 });
  assert.strictEqual(treeKey(flat, 0, key("ArrowRight")), null);
  assert.deepStrictEqual(treeKey(flat, 0, key("ArrowLeft")), { toggle: 0 });
  assert.deepStrictEqual(treeKey(flat, 1, key("ArrowLeft")), { fold: 0 });
  assert.strictEqual(treeKey(flat, 2, key("ArrowLeft")), null);
});

test("⇧↵ and ⌥↵ open or fold; ↵ picks", () => {
  assert.deepStrictEqual(treeKey(flat, 2, key("Enter", { shiftKey: true })), { toggle: 2 });
  assert.deepStrictEqual(treeKey(flat, 0, key("Enter", { altKey: true })), { toggle: 0 });
  assert.deepStrictEqual(treeKey(flat, 1, key("Enter", { shiftKey: true })), { move: 1 });
  assert.deepStrictEqual(treeKey(flat, 1, key("Enter")), { pick: 1 });
  assert.strictEqual(treeKey([], 0, key("Enter")), null);
});
