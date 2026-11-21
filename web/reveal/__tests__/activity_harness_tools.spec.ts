// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// UI sprint 135: a harness driver's own tool calls count in the session bar's turn line. Before,
// only Substrate's ToolCall counted, so a claude, codex or cursor-agent turn read "no tools".
// Sprint 530: the activity strip reads from indexed snapshot fields, not rawEnvelopes.
import { test } from "node:test";
import assert from "node:assert";
import { EnvelopeKind } from "../../vm/kinds";
import { liveActivity } from "../activity";
import { formatClock } from "../timeline";

const t0 = Date.now() / 1000 - 5;
const um = { seq: 10, kind: EnvelopeKind.UserMessage, t: t0, payload: { turn_index: 3 } };

test("a live harness turn counts its calls and names the one still running", () => {
  const a = liveActivity({ lastUserMessage: um, lastTurnEnd: null, turnToolCount: 2, turnLiveToolName: "Read" });
  assert.strictEqual(a?.kind, "live");
  assert.match(a!.restText, /· 2 tools · Read ·/);
});

test("a finished harness turn's recap counts its calls", () => {
  const done = { seq: 20, kind: EnvelopeKind.Returned, t: t0 + 4, payload: { reason: "replied" } };
  const a = liveActivity({ lastUserMessage: um, lastTurnEnd: done, turnToolCount: 2, turnLiveToolName: "" });
  assert.strictEqual(a?.kind, "recap");
  assert.match(a!.restText, /· 2 tools ·/);
});

test("the scan runs once per snapshot; the clock moves only the seconds (F350)", () => {
  const snap = { lastUserMessage: um, lastTurnEnd: null, turnToolCount: 1, turnLiveToolName: "Bash" };
  const a = liveActivity(snap, t0 + 7);
  const b = liveActivity(snap, t0 + 70);
  assert.ok(a!.restText.startsWith(`${formatClock(7)} · 1 tool · Bash`), a!.restText);
  assert.ok(b!.restText.startsWith(`${formatClock(70)} · 1 tool · Bash`), b!.restText);
});
