// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The workspace search's rows (sprint 435): one per match, lit where the server says, the indent dropped.

import { test } from "node:test";
import assert from "node:assert/strict";
import { nameParts, searchRows } from "../derive/search";

test("one row per match, at the server's ranges, the indent dropped", () => {
  const result = { files: [{ path: "a.ts", lines: [{ line: 3, text: "    x = total + total;", ranges: [[8, 13], [16, 21]] as [number, number][] }] }], lines: 1, matches: 2, truncated: false, names: [] };
  const rows = searchRows(result);
  assert.deepEqual(rows.map((r) => [r.line, r.index, r.text.slice(r.from, r.to)]), [[3, 0, "total"], [3, 1, "total"]]);
  assert.equal(rows[0].text, "x = total + total;");
});

test("a match far along a line is shown with the text just before it", () => {
  const text = "a".repeat(80) + "needle";
  const [row] = searchRows({ files: [{ path: "b.ts", lines: [{ line: 1, text, ranges: [[80, 86]] }] }], lines: 1, matches: 1, truncated: false, names: [] });
  assert.ok(row.text.startsWith("…") && row.text.slice(row.from, row.to) === "needle" && row.from === 21);
});

test("a name row: the name and its folder, the lit ranges split between them", () => {
  assert.deepEqual(nameParts({ path: "src/lib/cart.ts", kind: "file", ranges: [[4, 12]] }), { name: "cart.ts", dir: "src/lib/", nameLit: [[0, 4]], dirLit: [[4, 8]] });
  assert.deepEqual(nameParts({ path: "assets", kind: "dir", ranges: [[0, 3]] }), { name: "assets", dir: "", nameLit: [[0, 3]], dirLit: [] });
});
