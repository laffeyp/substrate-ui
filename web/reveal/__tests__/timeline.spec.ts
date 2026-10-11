// Each event's time into its turn, from the record's own clock (web/reveal/timeline.ts).
//
// 2026-10-10: the graph's time column showed "t+0.0s" or "t+2s" for every event of a real
// session, read from a table copied from the design prototype's sample record.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { describeEventTime, eventTimes, formatElapsed } from "../timeline";
import { EnvelopeKind } from "../../vm/kinds";

const T0 = 1_791_688_700;

test("the unit fits the span", () => {
  assert.strictEqual(formatElapsed(0), "t+0ms");
  assert.strictEqual(formatElapsed(0.1432), "t+143ms");
  assert.strictEqual(formatElapsed(2.3149), "t+2.31s");
  assert.strictEqual(formatElapsed(12.44), "t+12.4s");
  assert.strictEqual(formatElapsed(125.9), "t+2m05s");
});

test("times run from the start of each turn, and from the session's first event before that", () => {
  const events = [
    { seq: 0, kind: EnvelopeKind.RunStarted, t: T0 },
    { seq: 5, kind: EnvelopeKind.PromptFragment, t: T0 + 0.04 },
    { seq: 17, kind: EnvelopeKind.UserMessage, t: T0 + 3, payload: { turn_index: 0 } },
    { seq: 22, kind: EnvelopeKind.HarnessToolCall, t: T0 + 3.143 },
    { seq: 30, kind: EnvelopeKind.ModelReply, t: T0 + 9.5 },
    { seq: 40, kind: EnvelopeKind.UserMessage, t: T0 + 100, payload: { turn_index: 1 } },
    { seq: 41, kind: EnvelopeKind.PromptComposed, t: T0 + 100.002 },
    { seq: 42, kind: EnvelopeKind.ModelReply },
  ];
  const times = eventTimes(events);
  assert.strictEqual(describeEventTime(times.get(5)), "t+40ms after session open");
  assert.strictEqual(describeEventTime(times.get(17)), "t+0ms into turn 0");
  assert.strictEqual(describeEventTime(times.get(22)), "t+143ms into turn 0");
  assert.strictEqual(describeEventTime(times.get(30)), "t+6.50s into turn 0");
  assert.strictEqual(describeEventTime(times.get(41)), "t+2ms into turn 1");
  assert.strictEqual(times.has(42), false, "an event with no t has no time");
});
