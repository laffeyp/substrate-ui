// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The footer's text (web/app/derive/footer.ts, sprint 218).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { footerText, type FooterInput } from "../derive/footer";
import { PaneDrawnConnection } from "../../vm/signals.gen";

const base: FooterInput = { unbound: false, title: "pane-1", surfaceOpen: false, snapshot: { sessionId: "s_1", endedReason: null, connection: PaneDrawnConnection.CONNECTED } };

test("a connected session is live and named", () => {
  assert.deepStrictEqual(footerText(base), { status: "● live", statusColor: "#82a5c8", record: "session pane-1", hint: "⌘M toggles meta" });
});

test("an ended session is finalised, after the controller unbinds it too (open item 34)", () => {
  for (const [sessionId, connection] of [["s_1", PaneDrawnConnection.CONNECTED], ["s_1", PaneDrawnConnection.CLOSED], [null, PaneDrawnConnection.CLOSED]] as const) {
    const out = footerText({ ...base, snapshot: { sessionId, endedReason: "user_end", connection } });
    assert.strictEqual(out.status, "● finalised");
    assert.strictEqual(out.statusColor, "#62676f");
  }
});

test("no session, no status; an unbound pane says so", () => {
  assert.strictEqual(footerText({ ...base, snapshot: null }).status, "");
  const out = footerText({ ...base, unbound: true, snapshot: { sessionId: null, endedReason: null, connection: PaneDrawnConnection.IDLE } });
  assert.strictEqual(out.status, "");
  assert.strictEqual(out.record, "unbound — pick a workspace");
});

test("a session not connected names its state", () => {
  assert.strictEqual(footerText({ ...base, snapshot: { sessionId: "s_1", endedReason: null, connection: PaneDrawnConnection.RECONNECTING } }).status, "○ reconnecting");
});

test("a page over the panes changes the hint", () => {
  assert.strictEqual(footerText({ ...base, surfaceOpen: true }).hint, "esc back to session");
  assert.strictEqual(footerText({ ...base, title: null }).record, "");
});

// Sprint 409: the editor view names the way back (frame 24a's footer).
test("the editor view's hint names esc and ⌘⇧E; a page over it keeps the page's hint", () => {
  assert.strictEqual(footerText({ ...base, editorOpen: true }).hint, "esc or ⌘⇧E back to the pane · ⌃⇧` inspector ⇄ record");
  // Sprint 430 (24b): the seq lit in the editor's record column.
  assert.ok(footerText({ ...base, editorOpen: true, recordSeq: 240 }).record.endsWith(" · seq 240 selected"));
  assert.ok(!footerText({ ...base, editorOpen: true, recordSeq: null }).record.includes("selected"));
  assert.strictEqual(footerText({ ...base, editorOpen: true, surfaceOpen: true }).hint, "esc back to session");
  assert.strictEqual(footerText(base).hint, "⌘M toggles meta");
});
