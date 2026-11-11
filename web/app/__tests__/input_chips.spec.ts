// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The input bar's chips (sprint 443; D94): added once each, removed by index or by ⌫ on an empty draft, sent
// with a message and cleared, left in the bar by a slash command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { addChip, barKey, paneInput, setText } from "../state/input_bar";

const sent: [string, unknown][] = [];
(globalThis as unknown as { window: unknown }).window = { __vm: { setActive() {}, get: () => ({ submitLine: (line: string, chips: unknown) => { sent.push([line, chips]); } }) } };
const key = (k: string, value: string, at = value.length) => ({
  key: k, shiftKey: false, altKey: false, metaKey: false, ctrlKey: false, preventDefault() {},
  target: { value, selectionStart: at, selectionEnd: at } as unknown as EventTarget,
});
const CART = { kind: "file" as const, label: "cart.ts", ref: "src/lib/cart.ts" };
const TESTS = { kind: "folder" as const, label: "tests/", ref: "tests" };

test("a chip is added once; ⌫ at the start of an empty draft removes the last", () => {
  assert.equal(addChip(1, CART), true);
  assert.equal(addChip(1, TESTS), true);
  assert.equal(addChip(1, CART), false);
  assert.deepEqual(paneInput(1).chips.map((c) => c.ref), ["src/lib/cart.ts", "tests"]);
  setText(1, "x");
  barKey(1, key("Backspace", "x"));
  assert.equal(paneInput(1).chips.length, 2);
  setText(1, "");
  barKey(1, key("Backspace", ""));
  assert.deepEqual(paneInput(1).chips.map((c) => c.ref), ["src/lib/cart.ts"]);
});

test("↵ sends the chips with a message and clears them; a slash command leaves them", () => {
  addChip(2, CART);
  setText(2, "/help");
  barKey(2, key("Enter", "/help"));
  assert.deepEqual(sent.pop(), ["/help", []]);
  assert.equal(paneInput(2).chips.length, 1);
  setText(2, "why does it round down?");
  barKey(2, key("Enter", "why does it round down?"));
  assert.deepEqual(sent.pop(), ["why does it round down?", [CART]]);
  assert.equal(paneInput(2).chips.length, 0);
});
