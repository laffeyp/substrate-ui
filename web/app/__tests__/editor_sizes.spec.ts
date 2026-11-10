// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor view's column sizes (web/app/editor/sizes.ts, sprint 414).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { CENTRE_MIN, CENTRE_MIN_HEIGHT, clampSize, DEFAULT_SIZES, loadSizes, MIN_BOTTOM, MIN_SIDE, saveSizes } from "../editor/sizes";

const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };

test("sizes start at frame 24a's and are kept per mode", () => {
  const s = mem();
  assert.deepStrictEqual(loadSizes("code", s), DEFAULT_SIZES);
  saveSizes("code", { left: 290, right: 360, bottom: 326, side: 400 }, s);
  assert.deepStrictEqual(loadSizes("code", s), { left: 290, right: 360, bottom: 326, side: 400 });
  // Kept before the terminal could dock right: no side, so the default.
  s.setItem("substrate.editor.sizes.code", JSON.stringify({ left: 290, right: 360, bottom: 326 }));
  assert.deepStrictEqual(loadSizes("code", s), { left: 290, right: 360, bottom: 326, side: DEFAULT_SIZES.side });
  assert.deepStrictEqual(loadSizes("code", null), DEFAULT_SIZES);
});

test("a stored value that is not three numbers gives the defaults", () => {
  const s = mem();
  s.setItem("substrate.editor.sizes.code", "{\"left\": \"wide\"}");
  assert.deepStrictEqual(loadSizes("code", s), DEFAULT_SIZES);
  s.setItem("substrate.editor.sizes.code", "not json");
  assert.deepStrictEqual(loadSizes("code", s), DEFAULT_SIZES);
});

test("a drag keeps the centre's room and each column's least size", () => {
  const view = { width: 1512, height: 870 };
  assert.strictEqual(clampSize("left", 290, DEFAULT_SIZES, view), 290);
  assert.strictEqual(clampSize("left", 10, DEFAULT_SIZES, view), MIN_SIDE);
  assert.strictEqual(clampSize("left", 5000, DEFAULT_SIZES, view), 1512 - CENTRE_MIN - DEFAULT_SIZES.right);
  assert.strictEqual(clampSize("bottom", 326, DEFAULT_SIZES, view), 326);
  assert.strictEqual(clampSize("bottom", 10, DEFAULT_SIZES, view), MIN_BOTTOM);
  assert.strictEqual(clampSize("bottom", 5000, DEFAULT_SIZES, view), 870 - CENTRE_MIN_HEIGHT);
});

test("docked right, the terminal's width counts against the side columns' room", () => {
  const view = { width: 1512, height: 870 };
  assert.strictEqual(clampSize("left", 5000, DEFAULT_SIZES, view, true), 1512 - CENTRE_MIN - DEFAULT_SIZES.right - DEFAULT_SIZES.side);
  assert.strictEqual(clampSize("side", 5000, DEFAULT_SIZES, view, true), 1512 - CENTRE_MIN - DEFAULT_SIZES.left - DEFAULT_SIZES.right);
});
