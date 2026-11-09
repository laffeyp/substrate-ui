// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The top bar's workspace card (web/app/derive/workspace_card.ts, sprint 232).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { workspaceCard } from "../derive/workspace_card";

const bound = { unbound: false, ws: "", shape: "isolated", name: "pane-1", workspacePath: null };

test("an unbound pane has no workspace yet", () => {
  assert.deepStrictEqual(workspaceCard({ ...bound, unbound: true }), { workspace: "none yet — pick one in the pane", shape: "—", branch: "" });
});

test("the server's folder wins, home written ~", () => {
  assert.strictEqual(workspaceCard({ ...bound, workspacePath: "/Users/someone/.substrate/sessions/s_1/workspace" }).workspace, "~/.substrate/sessions/s_1/workspace");
});

test("before the server reports one: the bound folder, else the default sandbox by name", () => {
  assert.strictEqual(workspaceCard(bound).workspace, "fresh per-session sandbox");
  assert.strictEqual(workspaceCard({ ...bound, ws: "~/code/app", shape: "flat" }).workspace, "~/code/app");
  assert.strictEqual(workspaceCard({ ...bound, shape: "flat" }).workspace, "—");
});

// The template: web/reveal.html at d4322e1, the dc-runtime page before the move.
test("the shape and branch read as the template drew them (sprint 334)", () => {
  assert.deepStrictEqual(workspaceCard({ ...bound, ws: "/Users/someone/code/app", shape: "worktree" }), { workspace: "/Users/someone/code/app", shape: "worktree", branch: "substrate/pane-1" });
  assert.deepStrictEqual(workspaceCard({ ...bound, ws: "~/code/app", shape: "flat" }), { workspace: "~/code/app", shape: "flat", branch: "~/code/app" });
});
