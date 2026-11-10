// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The workspace search's text work (sprint 434): lighting, counting and replacing matches.

import { test } from "node:test";
import assert from "node:assert/strict";
import { countMatches, matchRanges, matcher, replaceAll } from "../derive/search";

const fixed = { query: "a.b", caseSensitive: true, regexp: false };

test("a fixed string is not a pattern, and case folds unless asked", () => {
  assert.deepEqual(matchRanges("a.b axb a.b", matcher(fixed)), [[0, 3], [8, 11]]);
  assert.deepEqual(matchRanges("Total total", matcher({ query: "total", caseSensitive: false, regexp: false })), [[0, 5], [6, 11]]);
  assert.deepEqual(matchRanges("Total total", matcher({ query: "total", caseSensitive: true, regexp: false })), [[6, 11]]);
});

test("a pattern that does not compile lights nothing and counts a match per line", () => {
  const spec = { query: "(", caseSensitive: true, regexp: true };
  assert.equal(matcher(spec), null);
  const result = { files: [{ path: "a.ts", lines: [{ line: 1, text: "f(" }, { line: 2, text: "g(" }] }], lines: 2, truncated: false };
  assert.equal(countMatches(result, spec), 2);
});

test("the count is every match in every returned line", () => {
  const result = { files: [{ path: "a.ts", lines: [{ line: 1, text: "cents cents" }] }, { path: "b.ts", lines: [{ line: 4, text: "cents" }] }], lines: 2, truncated: false };
  assert.equal(countMatches(result, { query: "cents", caseSensitive: true, regexp: false }), 3);
});

test("replace all: a fixed replacement is taken as written; a pattern's may name its groups", () => {
  assert.equal(replaceAll("a.b axb a.b", fixed, "$&!"), "$&! axb $&!");
  assert.equal(replaceAll("price * qty", { query: "(\\w+) \\* (\\w+)", caseSensitive: true, regexp: true }, "$2 * $1"), "qty * price");
  assert.equal(replaceAll("Cart cart", { query: "cart", caseSensitive: false, regexp: false }, "basket"), "basket basket");
  assert.equal(replaceAll("unchanged", { query: "", caseSensitive: true, regexp: false }, "x"), "unchanged");
});
