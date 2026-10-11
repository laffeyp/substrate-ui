// web/reveal/timeline.ts — each event's time into its turn, from the record's own clock.
//
// Every envelope carries `t`, the Unix time its write was committed, to the microsecond. Before
// 2026-10-10 the graph's time column read a table copied from the design prototype's sample
// record (seqs 214–244) and a fallback keyed on seq ranges, so a real session's events all read
// "t+0.0s" or "t+2s", and the selected event always said "into turn 9".
//
// An event's time is measured from the start of its turn, the turn's UserMessage. Events before
// the first message are measured from the session's first event.

import { EnvelopeKind } from "../vm/kinds";

export interface TimedEvent {
  seq: number;
  kind: string;
  t?: number | null;
  payload?: Record<string, unknown>;
}

export interface EventTime {
  /** Seconds since the start of the event's turn (or of the session, before the first turn). */
  elapsed: number;
  /** The turn's index, or null before the first UserMessage. */
  turn: number | null;
}

/** Each event's time into its turn, by seq. Events with no `t` are left out. */
export function eventTimes(events: readonly TimedEvent[]): Map<number, EventTime> {
  const out = new Map<number, EventTime>();
  let base: number | null = null;
  let turn: number | null = null;
  for (const e of events) {
    if (typeof e.t !== "number") continue;
    if (e.kind === EnvelopeKind.UserMessage) {
      base = e.t;
      const idx = e.payload?.turn_index;
      turn = typeof idx === "number" ? idx : turn === null ? 0 : turn + 1;
    } else if (base === null) {
      base = e.t;
    }
    out.set(e.seq, { elapsed: Math.max(0, e.t - base), turn });
  }
  return out;
}

/** `t+143ms`, `t+2.31s`, `t+12.4s`, `t+2m05s`: the unit that fits the span. */
export function formatElapsed(seconds: number): string {
  if (seconds < 1) return `t+${Math.round(seconds * 1000)}ms`;
  if (seconds < 10) return `t+${seconds.toFixed(2)}s`;
  if (seconds < 60) return `t+${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds - m * 60);
  return `t+${m}m${String(s).padStart(2, "0")}s`;
}

/** The selected event's line: `t+2.31s into turn 3`, or `t+40ms after session open`. */
export function describeEventTime(time: EventTime | undefined): string {
  if (!time) return "";
  const label = formatElapsed(time.elapsed);
  return time.turn === null ? `${label} after session open` : `${label} into turn ${time.turn}`;
}
