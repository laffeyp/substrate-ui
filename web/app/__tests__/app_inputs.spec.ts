// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the window's React root draws from the pane snapshots (web/app/derive/app_inputs.ts,
// sprint 531, W9).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { appInputs, sameAppInputs, type PaneRef } from "../derive/app_inputs";
import type { Snapshot, RecordEnvelope } from "../../vm/types";
import { PaneDrawnConnection } from "../../vm/signals.gen";
import { EnvelopeKind } from "../../vm/kinds";

const base: Snapshot = {
  sessionId: null, sessionName: null, driver: null, bundleSlug: null, length: null, tone: null,
  handoff: null, workspacePath: null, workspaceShape: null, turnIndex: 0, transcript: [],
  parkReason: null, turnFailure: null, backgroundTasks: [], runs: [], viewOnly: null,
  language: null, languageOff: false, languageClearedSeq: 0, languageOpenTick: 0, endedReason: null,
  driverRoster: [], driverDefault: null, driverGroups: [], cliVersions: null, driverVersion: {},
  liveSessions: [], recentWorkspaces: [], bundleRoster: [], connection: PaneDrawnConnection.IDLE,
  lastError: null, topologyGraph: null, rawEnvelopes: [], progressByCallId: {}, envelopeCount: 0,
  writeCount: 0, resultByCallId: {}, lastUserMessage: null, lastTurnEnd: null, turnToolCount: 0,
  turnLiveToolName: "",
};
const mk = (p: Partial<Snapshot>): Snapshot => ({ ...base, ...p });

// Pane 1 is the focused, bound pane; pane 2 is a non-focused pane.
const panes: PaneRef[] = [
  { id: 1, unbound: false, driver: null },
  { id: 2, unbound: true, driver: null },
];
const envs: RecordEnvelope[] = [{ seq: 1, kind: EnvelopeKind.UserMessage, payload: {} }];
const focused1 = mk({ sessionId: "s_focused", driver: "claude", rawEnvelopes: envs });

test("a non-focused pane's progressByCallId change leaves the projection equal", () => {
  // The non-focused pane streams: its progressByCallId grows, nothing App draws changes.
  const a = { 1: focused1, 2: mk({ progressByCallId: { c0: { text: "line 1\n", eof: false, droppedLines: 0 } } }) };
  const b = { 1: focused1, 2: mk({ progressByCallId: { c0: { text: "line 1\nline 2\n", eof: false, droppedLines: 0 } } }) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(b, 1, panes)), true);
});

test("a change to the focused pane's rawEnvelopes makes the projection differ", () => {
  // sprint 524: a batch replaces rawEnvelopes with a fresh array, compared by reference.
  const a = { 1: focused1, 2: mk({}) };
  const b = { 1: mk({ sessionId: "s_focused", driver: "claude", rawEnvelopes: [...envs, { seq: 2, kind: EnvelopeKind.ModelReply, payload: {} }] }), 2: mk({}) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(b, 1, panes)), false);
});

test("a non-focused pane gaining a session makes the projection differ", () => {
  const a = { 1: focused1, 2: mk({}) };
  const b = { 1: focused1, 2: mk({ sessionId: "s_child" }) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(b, 1, panes)), false);
});

test("identical snapshots give an equal projection", () => {
  const a = { 1: focused1, 2: mk({ sessionId: "s_child", driver: "codex" }) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(a, 1, panes)), true);
});

test("the focused pane's turn-end, connection and roster each change the projection", () => {
  const a = { 1: focused1, 2: mk({}) };
  // A turn ends on the focused pane: lastTurnEnd lands, the turn-state projection differs.
  const ended = { 1: mk({ sessionId: "s_focused", driver: "claude", rawEnvelopes: envs, lastTurnEnd: { seq: 9, kind: EnvelopeKind.Returned, payload: {} } }), 2: mk({}) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(ended, 1, panes)), false);
  // The connection drops.
  const closed = { 1: mk({ sessionId: "s_focused", driver: "claude", rawEnvelopes: envs, connection: PaneDrawnConnection.CLOSED }), 2: mk({}) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(closed, 1, panes)), false);
  // The focused pane's driver roster loads: the picker and top bar read it.
  const rostered = { 1: mk({ sessionId: "s_focused", driver: "claude", rawEnvelopes: envs, driverGroups: [{ label: "cli", entries: ["claude"] }] }), 2: mk({}) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(rostered, 1, panes)), false);
});

test("a focus change makes the projection differ", () => {
  const snaps = { 1: focused1, 2: mk({ sessionId: "s_child", driver: "codex", rawEnvelopes: [{ seq: 5, kind: EnvelopeKind.UserMessage, payload: {} }] }) };
  assert.strictEqual(sameAppInputs(appInputs(snaps, 1, panes), appInputs(snaps, 2, panes)), false);
});

test("the focused pane parking makes the projection differ (connection stays connected)", () => {
  // topBarView's `running` reads !parkReason; a park with connection still CONNECTED and no turn-end
  // in the snapshot must still drop the render, or the top bar reads "running" on a parked session.
  const a = { 1: mk({ sessionId: "s_focused", driver: "claude", rawEnvelopes: envs, connection: PaneDrawnConnection.CONNECTED }), 2: mk({}) };
  const parked = { 1: mk({ sessionId: "s_focused", driver: "claude", rawEnvelopes: envs, connection: PaneDrawnConnection.CONNECTED, parkReason: "awaiting input" }), 2: mk({}) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(parked, 1, panes)), false);
});

test("the focused pane's language-open tick makes the projection differ", () => {
  const a = { 1: focused1, 2: mk({}) };
  const bumped = { 1: mk({ sessionId: "s_focused", driver: "claude", rawEnvelopes: envs, languageOpenTick: 1 }), 2: mk({}) };
  assert.strictEqual(sameAppInputs(appInputs(a, 1, panes), appInputs(bumped, 1, panes)), false);
});
