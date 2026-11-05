// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The store pattern (web/app/store.ts, sprint 201).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { createElement, useSyncExternalStore } from "react";
import { renderToString } from "react-dom/server";
import { createStore } from "../store";

const make = () => createStore({ theme: "dark", fontOverride: null as number | null });

test("the snapshot is the same object until a field changes", () => {
  const s = make();
  const a = s.getSnapshot();
  s.set({ theme: "dark" });
  assert.strictEqual(s.getSnapshot(), a);
  s.set({ fontOverride: 15 });
  assert.notStrictEqual(s.getSnapshot(), a);
  assert.deepStrictEqual(s.getSnapshot(), { theme: "dark", fontOverride: 15 });
  assert.deepStrictEqual(a, { theme: "dark", fontOverride: null });
});

test("listeners run once per change and not on a set that changes nothing", () => {
  const s = make();
  let calls = 0;
  s.subscribe(() => { calls += 1; });
  s.set({ theme: "dark" });
  s.set({});
  assert.strictEqual(calls, 0);
  s.set({ theme: "light", fontOverride: 12 });
  assert.strictEqual(calls, 1);
});

test("a patch can be a function of the current state", () => {
  const s = make();
  s.set({ fontOverride: 13 });
  s.set((st) => ({ fontOverride: (st.fontOverride ?? 0) + 1 }));
  assert.strictEqual(s.getSnapshot().fontOverride, 14);
});

test("unsubscribe stops the listener, including from inside a notification", () => {
  const s = make();
  const seen: string[] = [];
  const stopA = s.subscribe(() => { seen.push("a"); stopA(); });
  s.subscribe(() => { seen.push("b"); });
  s.set({ theme: "light" });
  s.set({ theme: "dark" });
  assert.deepStrictEqual(seen, ["a", "b", "b"]);
});

test("React reads the store through useSyncExternalStore", () => {
  const s = make();
  s.set({ fontOverride: 17 });
  // renderToString needs the third argument, the server's snapshot; the window renders only in the
  // client, where React calls getSnapshot. Here the two are the same function.
  const View = () => {
    const st = useSyncExternalStore(s.subscribe, s.getSnapshot, s.getSnapshot);
    return createElement("span", null, `${st.theme} ${st.fontOverride}`);
  };
  assert.strictEqual(renderToString(createElement(View)), "<span>dark 17</span>");
});
