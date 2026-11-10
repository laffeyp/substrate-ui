// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Quick open's matching (sprint 441).

import { test } from "node:test";
import assert from "node:assert/strict";
import { quickMatches } from "../derive/quick_open";

const FILES = ["src/lib/cart.ts", "tests/cart.test.ts", "src/ui/CartDrawer.tsx", "src/cartography/map.ts", "docs/c-a-r-t.md", "src/lib/menu.ts"];

test("name matches first, letters together before apart, earlier, shorter", () => {
  assert.deepEqual(quickMatches(FILES, "cart").map((m) => m.path), ["src/lib/cart.ts", "tests/cart.test.ts", "src/ui/CartDrawer.tsx", "docs/c-a-r-t.md", "src/cartography/map.ts"]);
});

test("the lit letters are indexes in the path", () => {
  const cart = quickMatches(FILES, "ct").find((m) => m.path === "src/lib/cart.ts")!;
  assert.deepEqual(cart.lit, [8, 11]);
  const folder = quickMatches(FILES, "cartomap").find((m) => m.path === "src/cartography/map.ts")!;
  assert.deepEqual(folder.lit.map((k) => folder.path[k]).join(""), "cartomap");
});

test("no query, no match; case ignored", () => {
  assert.deepEqual(quickMatches(FILES, ""), []);
  assert.deepEqual(quickMatches(FILES, "MENU").map((m) => m.path), ["src/lib/menu.ts"]);
});
