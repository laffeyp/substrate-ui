// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's open view (web/app/derive/open_view.ts, sprint 346): the transitions App's `revealed` and
// `surface` pair made, one for one.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { Surface } from "../../vm/kinds";
import { closePage, metaBase, pageOf, show, START, toggleMeta, togglePage } from "../derive/open_view";

// The pair as App held it: revealed = meta is the base; surface = the open page.
const pair = (st: typeof START) => ({ revealed: metaBase(st), surface: pageOf(st) });

test("⌘M swaps panes and meta and closes a page, as revealed = !revealed, surface = null did", () => {
  assert.deepStrictEqual(pair(START), { revealed: false, surface: null });
  const meta = toggleMeta(START);
  assert.deepStrictEqual(pair(meta), { revealed: true, surface: null });
  // A page open over meta: ⌘M goes to panes.
  assert.deepStrictEqual(pair(toggleMeta(togglePage(meta, Surface.Records))), { revealed: false, surface: null });
});

test("a page opens over the base view, closes on its own key or Escape, and returns to that view", () => {
  const meta = toggleMeta(START);
  const records = togglePage(meta, Surface.Records);
  assert.deepStrictEqual(pair(records), { revealed: true, surface: Surface.Records });
  assert.deepStrictEqual(pair(togglePage(records, Surface.Records)), { revealed: true, surface: null });
  assert.deepStrictEqual(pair(togglePage(records, Surface.Assay)), { revealed: true, surface: Surface.Assay });
  assert.deepStrictEqual(pair(closePage(records)), { revealed: true, surface: null });
  assert.deepStrictEqual(pair(closePage(togglePage(START, Surface.Studio))), { revealed: false, surface: null });
});

test("a split shows panes, the design tool's view prop and /language show meta, each with no page", () => {
  assert.deepStrictEqual(pair(show("panes")), { revealed: false, surface: null });
  assert.deepStrictEqual(pair(show("meta")), { revealed: true, surface: null });
  assert.strictEqual(show("meta").view, "meta");
});
