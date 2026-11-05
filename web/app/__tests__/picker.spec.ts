// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The pane picker's workspace column and control lines (web/app/derive/picker.ts, sprint 274).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import type { SessionRow } from "../../vm/types";
import { lineStep, paneShape, SHARED_SANDBOX, shapeLabel, tabFill, workspaceRows, type PickerInput } from "../derive/picker";

const base: PickerInput = {
  recentWorkspaces: [
    { path: "/Users/someone/.substrate/sessions", shape: "per-session-sandboxes" },
    { path: "/Users/someone/code/app", shape: "worktree" },
    { path: "/var/folders/xy/T/scratch", shape: "path" },
    { path: "/Users/someone/notes", shape: "path" },
    { path: "/Users/someone/third", shape: "path" },
  ],
  inherit: null, typed: "", armed: null, pickerHalf: "ws", sel: 0, expanded: {}, paged: {},
};

test("the column offers the default, the shared sandbox, two recent folders and choose", () => {
  const { rows, flat } = workspaceRows(base);
  assert.deepStrictEqual(rows.map((r) => [r.kind, r.path, r.expandable]), [
    ["default", "per session sandbox", true],
    ["sandbox", SHARED_SANDBOX, true],
    ["recent", "/Users/someone/code/app", true],
    ["recent", "/Users/someone/notes", true],
    ["choose", "choose folder…", false],
  ]);
  assert.strictEqual(flat.length, 5);
  assert.deepStrictEqual(rows.map((r) => [r.lit, r.key]), [[true, "↵"], [false, ""], [false, ""], [false, ""], [false, "⌘O"]]);
});

test("a typed path leads; an inherited folder follows the default", () => {
  const { rows } = workspaceRows({ ...base, typed: "/tmp/x", inherit: { path: "/Users/someone/code/app", name: "pane-1" } });
  assert.deepStrictEqual(rows.slice(0, 3).map((r) => [r.kind, r.meta]), [["typed", "typed — ↵ picks the folder"], ["default", "substrate manages · isolated"], ["inherit", "inherit · from pane-1"]]);
});

test("an open row lists at most five sessions, and the keys walk them", () => {
  const s = (id: string): SessionRow => ({ sessionId: id, name: "", driver: "deterministic", status: "parked", workspacePath: SHARED_SANDBOX, workspaceShape: "sandbox", createdAt: 1 });
  const rowsIn = ["s_aaaaaaaaaaaaaa", "s_b", "s_c", "s_d", "s_e", "s_f"].map(s);
  const { rows, flat } = workspaceRows({ ...base, expanded: { [SHARED_SANDBOX]: true }, paged: { [SHARED_SANDBOX]: { rows: rowsIn, total: 6 } }, sel: 2 });
  assert.strictEqual(rows[1].sessions.length, 5);
  assert.deepStrictEqual(rows[1].sessions[0].name, "s_aaaaaa");
  assert.strictEqual(rows[1].sessions[0].lit, true);
  assert.deepStrictEqual(flat.slice(1, 3).map((f) => [f.kind, f.parent]), [["row", null], ["session", 1]]);
});

test("with a folder armed the column lights it and shows →", () => {
  const { rows } = workspaceRows({ ...base, armed: { ws: "/Users/someone/notes", isDefault: false }, pickerHalf: "model" });
  assert.deepStrictEqual(rows.filter((r) => r.lit).map((r) => [r.path, r.key]), [["/Users/someone/notes", "→"]]);
});

test("⇥ fills from the nearest recent, inherited or sandbox folder", () => {
  assert.strictEqual(tabFill(workspaceRows(base).rows), SHARED_SANDBOX);
});

test("shapes: the pane's own before the server's; a git folder reads git (F339)", () => {
  assert.deepStrictEqual([paneShape("", true), paneShape(SHARED_SANDBOX, false), paneShape("/x", false)], ["isolated", "sandbox", "flat"]);
  assert.deepStrictEqual([shapeLabel("worktree"), shapeLabel("path")], ["git", "path"]);
});

test("a control line's keys", () => {
  assert.deepStrictEqual([lineStep(4, 3, "ArrowRight"), lineStep(4, 0, "ArrowLeft"), lineStep(4, 9, "Enter"), lineStep(4, 1, "Escape"), lineStep(4, 1, "x")], [{ move: 0 }, { move: 3 }, { pick: 3 }, { back: true }, null]);
});
