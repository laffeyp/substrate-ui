// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The tree's find by name (sprint 437): lit letters, the filtered tree, a folder's badge count.

import { test } from "node:test";
import assert from "node:assert/strict";
import { filterRows, matchesBelow, nameHits } from "../derive/tree_find";

test("continuous and fuzzy matching, case ignored", () => {
  assert.deepEqual(nameHits("Cart.ts", "cart", false), [0, 1, 2, 3]);
  assert.deepEqual(nameHits("checkout.ts", "ckt", true), [0, 4, 7]);
  assert.equal(nameHits("checkout.ts", "ckt", false), null);
  assert.equal(nameHits("tax.ts", "", true), null);
});

test("the filtered tree: each match and the folders above it, folders first", () => {
  const rows = filterRows(["src/lib/cart.ts", "src/b.ts", "README.md"], ["src/cart"]);
  assert.deepEqual(rows.map((r) => `${"  ".repeat(r.depth)}${r.kind === "dir" ? (r.open ? "▾ " : "▸ ") : ""}${r.name}`), ["▾ src", "  ▸ cart", "  ▾ lib", "    cart.ts", "  b.ts", "README.md"]);
});

test("a collapsed folder counts the matches below it", () => {
  assert.equal(matchesBelow("src", ["src/a.ts", "src/lib/b.ts", "srcx/c.ts", "README.md"]), 2);
});
