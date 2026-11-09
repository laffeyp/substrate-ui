// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The records page's rows (web/app/derive/records.ts, sprint 235).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import type { SessionRow } from "../../vm/types";
import { records, relTime, type RecordsInput } from "../derive/records";

const session = (id: string, ws: string, createdAt = 1000): SessionRow => ({ sessionId: id, name: "", driver: "deterministic", status: "parked", workspacePath: ws, workspaceShape: "flat", createdAt });

const base: RecordsInput = {
  workspaces: [
    { path: "/Users/someone/code/app", shape: "worktree" },
    { path: "/Users/someone/.substrate/sessions", shape: "per-session-sandboxes" },
    { path: "/var/folders/xy/T/scratch", shape: "flat" },
  ],
  liveSessions: [
    session("s_aaaaaaaaaaaaaaaa", "/Users/someone/code/app"),
    session("s_b", "/Users/someone/.substrate/sessions/s_b/workspace"),
    session("s_c", "/Users/someone/.substrate/sessions/s_c/workspace"),
  ],
  pagedByWs: {}, expandedWs: {}, sel: 0, now: 1012.9,
};

test("one group per workspace, scratch folders left out, sandboxes counted together", () => {
  const out = records(base);
  assert.deepStrictEqual(out.groups.map((grp) => [grp.path, grp.shapeLabel, grp.countLabel]), [
    ["/Users/someone/code/app", "git", "1 session"],
    ["/Users/someone/.substrate/sessions", "per-session sandboxes · substrate-managed", "2 sessions"],
  ]);
  assert.deepStrictEqual(out.flat.map((f) => f.kind), ["workspace", "workspace"]);
  assert.strictEqual(out.groups[0].lit, true);
});

test("an open group lists its page, its total and what is left", () => {
  const rows = [session("s_aaaaaaaaaaaaaaaa", "/Users/someone/code/app", 1000.25)];
  const out = records({ ...base, expandedWs: { "/Users/someone/code/app": true }, pagedByWs: { "/Users/someone/code/app": { rows, total: 60 } }, sel: 1 });
  const grp = out.groups[0];
  assert.strictEqual(grp.countLabel, "60 sessions");
  assert.strictEqual(grp.hasMore, true);
  assert.strictEqual(grp.remainingLabel, "load next 50");
  assert.deepStrictEqual(grp.sessions.map((s) => [s.name, s.idShort, s.statusLabel, s.when, s.lit]), [["s_aaaaaaaaaa", "s_aaaaaaaaaa", "◐ parked", "11.75s ago", true]]);
  assert.deepStrictEqual(out.flat.map((f) => [f.kind, f.parent]), [["workspace", null], ["session", 0], ["workspace", null]]);
  assert.strictEqual(grp.lit, false);
});

// The template: web/reveal.html at d4322e1, the dc-runtime page before the move.
test("relative times are the template's: the floored clock less the fractional start", () => {
  assert.strictEqual(relTime(100.5, 112.9), "11.5s ago");
  assert.strictEqual(relTime(0, 50), "");
  assert.strictEqual(relTime(0.5, 3 * 3600 + 1), "3h ago");
  assert.strictEqual(relTime(0.5, 3 * 3600), "2h ago");
  assert.strictEqual(relTime(1, 1 + 20 * 86400), "2w ago");
});
