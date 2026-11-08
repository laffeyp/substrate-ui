// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The runtime checker (electron/invariants.ts, plan 2026-11-05-sdd-signals item 5, sprint 373). A
// pane's normal run breaks nothing: its picker, its session's open, two turns, the session ending, a
// resumed turn, a reattach of the same session, a second session after the pane reopens. Then one
// planted violation of each rule (S1, S3, S4 four ways, S5, S6, S8, E8) breaks that rule once, with the
// state it read and the recent records, the offending one last.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { createRequire } from "node:module";
import { EnvelopeKind } from "../../vm/kinds";

type Rec = { process: string; window_id: number | null; pane_id?: number | null; name: string; payload?: Record<string, unknown> };
type Broken = { rule: string; window_id: number | null; context: { state: Record<string, unknown>; recent: Rec[] } };
const { createChecker, RECENT } = createRequire(__filename)("../../../electron/invariants.ts") as {
  createChecker: () => { see: (r: Rec) => Broken[] };
  RECENT: number;
};

const main = (name: string, payload: Record<string, unknown> = {}): Rec => ({ process: "main", window_id: null, name, payload });
const srv = (name: string, payload: Record<string, unknown> = {}): Rec => ({ process: "server", window_id: null, name, payload });
const win = (name: string, payload: Record<string, unknown> = {}, pane: number | null = 1, windowId = 1): Rec => ({ process: "window", window_id: windowId, pane_id: pane, name, payload });

/** A started window: main's and window 1's first records. */
function started() {
  const c = createChecker();
  assert.deepStrictEqual(c.see(main("APP_BOOTED")), []);
  assert.deepStrictEqual(c.see(win("WINDOW_BOOTED", { vocab_version: "0.20" }, null)), []);
  assert.deepStrictEqual(c.see(srv("SERVER_STARTED", { port: 1 })), []);
  return c;
}
const picked = (pane = 1): Rec[] => [
  win("PANE_OPENED", { pane_id: pane, cause: "start" }, pane),
  win("PICKER_FOLDER_ARMED", { pane_id: pane, workspace: null, is_default: true, source: "row" }, pane),
  win("PICKER_LINE_ENTERED", { pane_id: pane, line: "guidance", cause: "picked" }, pane),
  win("PICKER_LINE_ENTERED", { pane_id: pane, line: "length", cause: "picked" }, pane),
  win("PICKER_LINE_ENTERED", { pane_id: pane, line: "tone", cause: "picked" }, pane),
  win("PICKER_COMMITTED", { pane_id: pane, workspace: null, is_default: true }, pane),
  win("SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: null, bundle: null }, pane),
  srv("SESSION_CREATED", { session_id: "s1", driver: "deterministic", workspace_shape: "sandbox" }),
  win("SESSION_OPEN_ACKED", { session_id: "s1", name: null, driver: "deterministic" }, pane),
  win("PANE_BOUND", { pane_id: pane, binding: "session", how: "picker", session_id: "s1" }, pane),
];

function broken(c: { see: (r: Rec) => Broken[] }, recs: Rec[]): Broken[] {
  return recs.flatMap((r) => c.see(r));
}

test("a pane's normal run breaks no rule", () => {
  const c = started();
  assert.deepStrictEqual(broken(c, [
    ...picked(),
    win("TURN_SUBMITTED", { session_id: "s1", turn_index: 0, text_length: 5 }),
    win("TRANSCRIPT_SCROLLED", { pane_id: 1, at_bottom: true, following: true, pinned: false, cause: "content" }),
    win("TRANSCRIPT_SCROLLED", { pane_id: 1, at_bottom: false, following: false, pinned: false, cause: "user" }),
    win("TURN_SUBMITTED", { session_id: "s1", turn_index: 1, text_length: 3 }),
    win("SESSION_ENDED_LOCAL", { reason: "user" }),
    win("TURN_SUBMITTED", { session_id: "s1", turn_index: 2, text_length: 4 }),
    win("SESSION_ATTACH_STARTED", { session_id: "s1" }),
    win("PANE_CLOSED", { pane_id: 1, had_session: true }),
    win("PANE_OPENED", { pane_id: 1, cause: "split" }),
    win("SESSION_ATTACH_STARTED", { session_id: "s2" }),
    win("TURN_SUBMITTED", { session_id: "s2", turn_index: 0, text_length: 2 }),
  ]), []);
});

test("a reload's attach before the pane opens, and the records page switching a pane's session, break no rule", () => {
  const c = started();
  assert.deepStrictEqual(broken(c, [
    win("SESSION_ATTACH_STARTED", { session_id: "r1" }),
    win("PANE_OPENED", { pane_id: 1, cause: "start" }),
    win("PANE_BOUND", { pane_id: 1, binding: "session", how: "restore", session_id: "r1" }),
    win("TRANSCRIPT_ROW_DRAWN", { pane_id: 1, session_id: "r1", seq: 4, kind: EnvelopeKind.ModelReply }),
    win("TURN_SUBMITTED", { session_id: "r1", turn_index: 0, text_length: 5 }),
    win("SESSION_ATTACH_STARTED", { session_id: "r2" }),
    win("TRANSCRIPT_ROW_SKIPPED", { pane_id: 1, session_id: "r2", seq: 0, kind: EnvelopeKind.RunStarted, reason: "hidden_kind" }),
    win("TRANSCRIPT_ROW_DRAWN", { pane_id: 1, session_id: null, seq: 1, kind: EnvelopeKind.UserMessage }),
    win("TURN_SUBMITTED", { session_id: "r2", turn_index: 0, text_length: 2 }),
  ]), []);
});

test("a picker folder disarmed and re-armed, and an open refused after the bind, break no rule", () => {
  const c = started();
  assert.deepStrictEqual(broken(c, [
    win("PANE_OPENED", { pane_id: 2, cause: "split" }, 2),
    win("PICKER_FOLDER_ARMED", { pane_id: 2, workspace: "/w", is_default: false, source: "row" }, 2),
    win("PICKER_FOLDER_DISARMED", { pane_id: 2, cause: "escape" }, 2),
    win("PICKER_FOLDER_ARMED", { pane_id: 2, workspace: "/w", is_default: false, source: "row" }, 2),
    win("PICKER_LINE_ENTERED", { pane_id: 2, line: "tone", cause: "picked" }, 2),
    win("PICKER_COMMITTED", { pane_id: 2, workspace: "/w", is_default: false }, 2),
    win("PANE_BOUND", { pane_id: 2, binding: "session", how: "picker" }, 2),
    win("SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: "/w", bundle: null }, 2),
    srv("API_REFUSED", { area: "session", status: 400, cause: "_open_session:3050" }),
    win("SESSION_OPEN_REFUSED", { failure_class: "http_error", detail: "400" }, 2),
    win("SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: "/w", bundle: null }, 2),
    srv("SESSION_CREATED", { session_id: "s3", driver: "deterministic", workspace_shape: "workspace" }),
    win("SESSION_OPEN_ACKED", { session_id: "s3", name: null, driver: "deterministic" }, 2),
  ]), []);
});

test("each planted violation breaks its rule once, with its state and the recent records", () => {
  const plants: [string, Rec[]][] = [
    ["S3", [win("PANE_OPENED", { pane_id: 3, cause: "split" }, 3), win("PICKER_LINE_ENTERED", { pane_id: 3, line: "guidance", cause: "picked" }, 3)]],
    ["S4", [win("PANE_OPENED", { pane_id: 4, cause: "split" }, 4), win("PICKER_FOLDER_ARMED", { pane_id: 4, workspace: null, is_default: true, source: "row" }, 4),
      win("PICKER_LINE_ENTERED", { pane_id: 4, line: "guidance", cause: "picked" }, 4), win("PICKER_COMMITTED", { pane_id: 4, workspace: null, is_default: true }, 4)]],
    ["S4", [win("PANE_OPENED", { pane_id: 14, cause: "split" }, 14), win("PICKER_FOLDER_ARMED", { pane_id: 14, workspace: null, is_default: true, source: "row" }, 14),
      win("PICKER_LINE_ENTERED", { pane_id: 14, line: "tone", cause: "picked" }, 14), win("PICKER_COMMITTED", { pane_id: 14, workspace: null, is_default: true }, 14),
      win("PANE_BOUND", { pane_id: 14, binding: "session", how: "attach", session_id: "s14" }, 14)]],
    ["S4", [win("PANE_OPENED", { pane_id: 24, cause: "split" }, 24), win("PICKER_FOLDER_ARMED", { pane_id: 24, workspace: null, is_default: true, source: "row" }, 24),
      win("PICKER_LINE_ENTERED", { pane_id: 24, line: "tone", cause: "picked" }, 24), win("PICKER_COMMITTED", { pane_id: 24, workspace: null, is_default: true }, 24),
      win("PANE_CLOSED", { pane_id: 24, had_session: false }, 24)]],
    ["S4", [win("PANE_OPENED", { pane_id: 34, cause: "split" }, 34), win("PICKER_FOLDER_ARMED", { pane_id: 34, workspace: null, is_default: true, source: "row" }, 34),
      win("PICKER_LINE_ENTERED", { pane_id: 34, line: "tone", cause: "picked" }, 34), win("PICKER_COMMITTED", { pane_id: 34, workspace: null, is_default: true }, 34),
      win("PICKER_COMMITTED", { pane_id: 34, workspace: null, is_default: true }, 34)]],
    ["S5", [win("PANE_OPENED", { pane_id: 5, cause: "split" }, 5), win("SESSION_ATTACH_STARTED", { session_id: "a" }, 5), win("SESSION_ATTACH_STARTED", { session_id: "b" }, 5),
      win("TRANSCRIPT_ROW_DRAWN", { pane_id: 5, session_id: "a", seq: 3, kind: EnvelopeKind.ModelReply }, 5)]],
    ["S6", [win("PANE_OPENED", { pane_id: 6, cause: "split" }, 6), srv("SESSION_CREATED", { session_id: "s6", driver: "deterministic", workspace_shape: "sandbox" }), win("SESSION_OPEN_ACKED", { session_id: "s6", name: null, driver: "deterministic" }, 6)]],
    ["S8", [win("PANE_OPENED", { pane_id: 8, cause: "split" }, 8), win("TURN_SUBMITTED", { session_id: "s8", turn_index: 0, text_length: 1 }, 8)]],
    ["E8", [win("TRANSCRIPT_SCROLLED", { pane_id: 18, at_bottom: false, following: true, pinned: false, cause: "content" }, 18)]],
  ];
  for (const [rule, recs] of plants) {
    const c = started();
    const got = broken(c, recs);
    assert.deepStrictEqual(got.map((b) => b.rule), [rule], `${rule}: ${JSON.stringify(got.map((b) => b.rule))}`);
    assert.ok(Object.keys(got[0].context.state).length > 0, `${rule} carries the state it read`);
    assert.deepStrictEqual(got[0].context.recent.at(-1), recs.at(-1), `${rule}'s recent records end with the one that broke it`);
  }
});

test("S1: a stream whose first record is not its boot record", () => {
  assert.deepStrictEqual(createChecker().see(main("TRACE_OPENED", { process: "main" })).map((b) => b.rule), ["S1"]);
  const c = started();
  assert.deepStrictEqual(c.see(win("PANE_OPENED", { pane_id: 1, cause: "start" }, 1, 2)).map((b) => b.rule), ["S1"]);
});

test("the recent records are the last RECENT, oldest first", () => {
  const c = started();
  for (let i = 0; i < RECENT + 5; i += 1) c.see(win("KEY_ROUTED", { key: "enter", target: "window", action: "none" }, null));
  const got = c.see(win("TRANSCRIPT_SCROLLED", { pane_id: 1, at_bottom: false, following: true, pinned: false, cause: "content" }));
  assert.strictEqual(got[0].context.recent.length, RECENT);
});

// The timing rules (sprint 375), on a clock the test moves.
function clocked() {
  let t = 0;
  const c = (createRequire(__filename)("../../../electron/invariants.ts") as { createChecker: (now: () => number) => { see: (r: Rec) => Broken[]; tick: () => Broken[] } }).createChecker(() => t);
  c.see(main("APP_BOOTED"));
  c.see(win("WINDOW_BOOTED", { vocab_version: "0.21" }, null));
  c.see(srv("SERVER_STARTED", { port: 1 }));
  return { c, at: (ms: number) => { t = ms; } };
}

test("answers inside their windows break no timing rule", () => {
  const { c, at } = clocked();
  const seen: Broken[] = [];
  const step = (ms: number, r: Rec) => { at(ms); seen.push(...c.see(r)); };
  step(0, main("SERVER_SPAWNED", { pid: 1, packaged: false }));
  step(4_900, main("SERVER_BOUND", { port: 1, ms: 4_900 }));
  step(5_000, win("SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: null, bundle: null }));
  step(14_800, srv("SESSION_CREATED", { session_id: "s1", driver: "deterministic", workspace_shape: "sandbox" }));
  step(14_900, win("SESSION_OPEN_ACKED", { session_id: "s1", name: null, driver: "deterministic" }));
  step(15_000, win("STREAM_ENVELOPE_APPENDED", { seq: 7, kind: EnvelopeKind.ModelReply }));
  step(15_100, win("STREAM_ENVELOPE_APPENDED", { seq: 8, kind: EnvelopeKind.RunStarted }));
  step(15_900, win("TRANSCRIPT_ROW_DRAWN", { pane_id: 1, session_id: "s1", seq: 7, kind: EnvelopeKind.ModelReply }));
  step(16_000, win("TRANSCRIPT_ROW_SKIPPED", { pane_id: 1, session_id: "s1", seq: 8, kind: EnvelopeKind.RunStarted, reason: "hidden_kind" }));
  step(16_000, win("TURN_SUBMITTED", { session_id: "s1", turn_index: 0, text_length: 5 }));
  step(24_900, srv("TURN_ACCEPTED", { session_id: "s1", turn_index: 0 }));
  step(25_000, win("TURN_ACK", { session_id: "s1" }));
  step(30_000, main("APP_QUIT_REQUESTED", { cause: "menu" }));
  at(74_000); seen.push(...c.tick());
  step(74_900, main("APP_QUIT_COMPLETED", { server_exit_code: 0, windows_opened: 1, signals_written: 20, signals_lost: 0 }));
  at(200_000); seen.push(...c.tick());
  assert.deepStrictEqual(seen.map((b) => b.rule), []);
});

test("a wait whose pane or window is gone breaks nothing", () => {
  const { c, at } = clocked();
  const seen: Broken[] = [];
  seen.push(...c.see(win("STREAM_ENVELOPE_APPENDED", { seq: 1, kind: EnvelopeKind.ModelReply }, 2)));
  seen.push(...c.see(win("PANE_CLOSED", { pane_id: 2, had_session: true }, 2)));
  seen.push(...c.see(win("SESSION_ATTACH_STARTED", { session_id: "s" }, 1)));
  seen.push(...c.see(win("TURN_SUBMITTED", { session_id: "s", turn_index: 0, text_length: 1 }, 1)));
  seen.push(...c.see(win("WINDOW_BOOTED", { vocab_version: "0.21" }, null)));
  seen.push(...c.see(win("SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: null, bundle: null }, 1)));
  seen.push(...c.see({ process: "main", window_id: 1, name: "WINDOW_CLOSED", payload: {} }));
  at(100_000); seen.push(...c.tick());
  assert.deepStrictEqual(seen.map((b) => b.rule), []);
});

test("each timing rule breaks once its window passes, found by tick or by the next record", () => {
  const cases: [string, Rec, number][] = [
    ["T1", main("SERVER_SPAWNED", { pid: 1, packaged: false }), 5_001],
    ["T3", main("APP_QUIT_REQUESTED", { cause: "menu" }), 45_001],
    ["T4", win("STREAM_ENVELOPE_APPENDED", { seq: 9, kind: EnvelopeKind.ModelReply }), 1_001],
    ["T5", win("SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: null, bundle: null }), 10_001],
    ["T6", win("TURN_SUBMITTED", { session_id: "s", turn_index: 0, text_length: 1 }), 10_001],
  ];
  for (const [rule, from, late] of cases) {
    for (const by of ["tick", "record"]) {
      const { c, at } = clocked();
      c.see(from);
      at(late - 2);
      assert.deepStrictEqual(c.tick(), [], `${rule} inside its window`);
      at(late);
      const got = by === "tick" ? c.tick() : c.see(win("KEY_ROUTED", { key: "enter", target: "window", action: "none" }, null));
      assert.deepStrictEqual(got.map((b) => b.rule), [rule], `${rule} by ${by}`);
      const state = got[0].context.state as { from: Rec; waited_ms: number; within_ms: number };
      assert.deepStrictEqual(state.from, from);
      assert.ok(state.waited_ms > state.within_ms);
      assert.strictEqual(got[0].window_id, from.process === "window" ? 1 : null);
    }
  }
});

// The server's records (sprint 376, vocabulary v0.22).

test("the server's records paired with the window's and main's break no rule", () => {
  const { c, at } = clocked();
  const seen: Broken[] = [];
  const step = (ms: number, r: Rec) => { at(ms); seen.push(...c.see(r)); };
  step(0, main("SERVER_BOUND", { port: 9, ms: 100 }));
  step(200, srv("SERVER_STARTED", { port: 9 }));
  step(300, srv("SESSION_CREATED", { session_id: "other-client", driver: "deterministic", workspace_shape: "sandbox" }));
  step(400, win("SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: null, bundle: null }));
  step(500, srv("SESSION_CREATED", { session_id: "s1", driver: "deterministic", workspace_shape: "sandbox" }));
  step(600, win("SESSION_OPEN_ACKED", { session_id: "s1", name: null, driver: "deterministic" }));
  step(700, win("TURN_SUBMITTED", { session_id: "s1", turn_index: 0, text_length: 5 }));
  step(800, srv("TURN_ACCEPTED", { session_id: "s1", turn_index: 0 }));
  step(900, win("TURN_ACK", { session_id: "s1" }));
  step(950, srv("TURN_ACCEPTED", { session_id: "s1", turn_index: 1 }));
  step(1_000, win("TURN_SUBMITTED", { session_id: "s1", turn_index: 1, text_length: 1 }));
  step(1_100, srv("API_REFUSED", { area: "turn", status: 409, cause: "_turn:3200" }));
  step(1_200, win("TURN_REFUSED", { failure_class: "http_error", detail: "busy" }));
  step(1_300, win("TURN_SUBMITTED", { session_id: "s1", turn_index: 1, text_length: 1 }));
  step(1_400, win("TURN_REFUSED", { failure_class: "network", detail: "offline" }));
  at(100_000); seen.push(...c.tick());
  assert.deepStrictEqual(seen.map((b) => b.rule), []);
  const early = clocked();
  early.c.see(srv("SERVER_STARTED", { port: 7 }));
  early.c.see(main("SERVER_BOUND", { port: 7, ms: 90 }));
  early.at(100_000);
  assert.deepStrictEqual(early.c.tick().map((b) => b.rule), [], "a SERVER_STARTED read before main's bind answers T2");
});

test("each planted break of a server pairing breaks its rule", () => {
  const cases: [string, Rec[]][] = [
    ["S7", [win("SESSION_OPEN_REQUESTED", { driver: "d", workspace: null, bundle: null }), win("SESSION_OPEN_ACKED", { session_id: "nobody", name: null, driver: "d" })]],
    ["S7", [srv("SESSION_CREATED", { session_id: "s", driver: "d", workspace_shape: "sandbox" }),
      win("SESSION_OPEN_REQUESTED", { driver: "d", workspace: null, bundle: null }, 2), win("SESSION_OPEN_ACKED", { session_id: "s", name: null, driver: "d" }, 2),
      win("SESSION_OPEN_REQUESTED", { driver: "d", workspace: null, bundle: null }, 3), win("SESSION_OPEN_ACKED", { session_id: "s", name: null, driver: "d" }, 3)]],
    ["S8", [win("TURN_ACK", { session_id: "s" }, null)]],
    ["S9", [win("SESSION_OPEN_REFUSED", { failure_class: "http_error", detail: "400" }, null)]],
  ];
  for (const [rule, recs] of cases) {
    const { c } = clocked();
    const got = recs.flatMap((r) => c.see(r)).map((b) => b.rule);
    assert.deepStrictEqual(got, [rule], `${rule}: ${JSON.stringify(got)}`);
  }
  const fresh = createChecker();
  assert.deepStrictEqual(fresh.see(srv("STORE_SCANNED", { sessions_found: 0, parked: 0, interrupted: 0 })).map((b) => b.rule), ["S1"], "S1: the server's first record");
  const { c, at } = clocked();
  c.see(main("SERVER_BOUND", { port: 5, ms: 100 }));
  at(15_001);
  assert.deepStrictEqual(c.tick().map((b) => b.rule), ["T2"]);
});

test("from the quit on, only the quit's own wait stays: a window's waits end and none opens", () => {
  const { c, at } = clocked();
  const seen: Broken[] = [];
  seen.push(...c.see(win("STREAM_ENVELOPE_APPENDED", { seq: 38, kind: EnvelopeKind.SessionEnded })));
  at(500);
  seen.push(...c.see(main("APP_QUIT_REQUESTED", { cause: "menu" })));
  seen.push(...c.see(win("STREAM_ENVELOPE_APPENDED", { seq: 39, kind: EnvelopeKind.RunFinalised })));
  at(20_000); seen.push(...c.tick());
  assert.deepStrictEqual(seen.map((b) => b.rule), []);
  at(46_000);
  assert.deepStrictEqual(c.tick().map((b) => b.rule), ["T3"], "the quit's own wait still breaks");
  const late = clocked();
  late.c.see(win("STREAM_ENVELOPE_APPENDED", { seq: 1, kind: EnvelopeKind.ModelReply }));
  late.at(1_500);
  assert.deepStrictEqual(late.c.see(main("APP_QUIT_REQUESTED", { cause: "menu" })).map((b) => b.rule), ["T4"], "a wait late before the quit breaks");
});
