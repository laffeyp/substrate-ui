// Each event's time into its turn, from the record's own clock (web/reveal/timeline.ts).
//
// 2026-10-10: the graph's time column showed "t+0.0s" or "t+2s" for every event of a real
// session, read from a table copied from the design prototype's sample record.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { describeEventTime, eventTimes, formatClock, formatElapsed } from "../timeline";
import { EnvelopeKind } from "../../vm/kinds";

const T0 = 1_791_688_700;

test("the unit fits the span", () => {
  assert.strictEqual(formatElapsed(0), "t+0ms");
  assert.strictEqual(formatElapsed(0.1432), "t+143ms");
  assert.strictEqual(formatElapsed(2.3149), "t+2.31s");
  assert.strictEqual(formatElapsed(12.44), "t+12.4s");
  assert.strictEqual(formatElapsed(125.9), "t+2m05s");
  assert.strictEqual(formatElapsed(3840), "t+1h04m");
  assert.strictEqual(formatElapsed(2 * 86400 + 3 * 3600 + 59), "t+2d03h");
  assert.strictEqual(formatElapsed(34 * 86400), "t+1mo04d");
});

test("a ticking clock counts whole seconds, then the two largest units", () => {
  assert.strictEqual(formatClock(0), "0s");
  assert.strictEqual(formatClock(59.9), "59s");
  assert.strictEqual(formatClock(60), "1m00s");
  assert.strictEqual(formatClock(3599), "59m59s");
  assert.strictEqual(formatClock(3600), "1h00m");
  assert.strictEqual(formatClock(86400 + 7200), "1d02h");
  assert.strictEqual(formatClock(30 * 86400), "1mo00d");
});

test("the column only increases; the detail adds the time into the turn", () => {
  const events = [
    { seq: 0, kind: EnvelopeKind.RunStarted, t: T0 },
    { seq: 16, kind: EnvelopeKind.PromptFragment, t: T0 + 0.004 },
    { seq: 17, kind: EnvelopeKind.UserMessage, t: T0 + 41.2, payload: { turn_index: 0 } },
    { seq: 22, kind: EnvelopeKind.ModelReply, t: T0 + 42.58 },
    { seq: 28, kind: EnvelopeKind.UserMessage, t: T0 + 75, payload: { turn_index: 1 } },
    { seq: 32, kind: EnvelopeKind.ModelReply, t: T0 + 76.25 },
    { seq: 33, kind: EnvelopeKind.PromptComposed },
  ];
  const times = eventTimes(events);
  const column = [0, 16, 17, 22, 28, 32].map((s) => formatElapsed(times.get(s)!.sinceStart));
  assert.deepStrictEqual(column, ["t+0ms", "t+4ms", "t+41.2s", "t+42.6s", "t+1m15s", "t+1m16s"]);
  const since = [0, 16, 17, 22, 28, 32].map((s) => times.get(s)!.sinceStart);
  assert.deepStrictEqual(since, [...since].sort((a, b) => a - b), "monotonic");
  assert.strictEqual(describeEventTime(times.get(16)), "t+4ms · session open");
  assert.strictEqual(describeEventTime(times.get(22)), "t+42.6s · 1.38s into turn 0");
  assert.strictEqual(describeEventTime(times.get(32)), "t+1m16s · 1.25s into turn 1");
  assert.strictEqual(times.has(33), false, "an event with no t has no time");
});
