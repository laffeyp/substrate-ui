// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// web/reveal/timeline.ts — when each event happened, from the record's own clock.
//
// Every envelope carries `t`, the Unix time its write was committed, to the microsecond. Before
// 2026-10-10 the graph's time column read a table copied from the design prototype's sample
// record (seqs 214–244) and a fallback keyed on seq ranges, so a real session's events all read
// "t+0.0s" or "t+2s", and the selected event always said "into turn 9".
//
// The column is the time since the session's first event, so it only increases and the gap
// between turns shows. The selected event's line adds its time into its turn, measured from the
// turn's UserMessage.

import { EnvelopeKind } from "../vm/kinds";

export interface TimedEvent {
  seq: number;
  kind: string;
  t?: number | null;
  payload?: Record<string, unknown>;
}

export interface EventTime {
  /** Seconds since the session's first event. */
  sinceStart: number;
  /** Seconds since the event's turn began, or null before the first UserMessage. */
  intoTurn: number | null;
  /** The turn's index, or null before the first UserMessage. */
  turn: number | null;
}

/** Each event's time, by seq. Events with no `t` are left out. */
export function eventTimes(events: readonly TimedEvent[]): Map<number, EventTime> {
  const out = new Map<number, EventTime>();
  let start: number | null = null;
  let turnStart: number | null = null;
  let turn: number | null = null;
  for (const e of events) {
    if (typeof e.t !== "number") continue;
    if (start === null) start = e.t;
    if (e.kind === EnvelopeKind.UserMessage) {
      turnStart = e.t;
      const idx = e.payload?.turn_index;
      turn = typeof idx === "number" ? idx : turn === null ? 0 : turn + 1;
    }
    out.set(e.seq, {
      sinceStart: Math.max(0, e.t - start),
      intoTurn: turnStart === null ? null : Math.max(0, e.t - turnStart),
      turn,
    });
  }
  return out;
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

/** The two largest units that fit: `2m05s`, `1h04m`, `2d03h`, `1mo04d`. */
function coarse(seconds: number): string {
  const s = Math.floor(seconds);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (s < HOUR) return `${Math.floor(s / MINUTE)}m${pad(s % MINUTE)}s`;
  if (s < DAY) return `${Math.floor(s / HOUR)}h${pad(Math.floor((s % HOUR) / MINUTE))}m`;
  if (s < MONTH) return `${Math.floor(s / DAY)}d${pad(Math.floor((s % DAY) / HOUR))}h`;
  return `${Math.floor(s / MONTH)}mo${pad(Math.floor((s % MONTH) / DAY))}d`;
}

/** `143ms`, `2.31s`, `12.4s`, then the two largest units that fit: `2m05s`, `1h04m`, `2d03h`,
 *  `1mo04d` (a month counted as 30 days). */
export function formatDuration(seconds: number): string {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 10) return `${seconds.toFixed(2)}s`;
  if (seconds < MINUTE) return `${seconds.toFixed(1)}s`;
  return coarse(seconds);
}

/** A ticking clock in whole seconds: `12s`, then `2m05s`, `1h04m`, `2d03h`, `1mo04d`. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return s < MINUTE ? `${s}s` : coarse(s);
}

/** The column's label: time since the session's first event, `t+42.6s`. */
export function formatElapsed(seconds: number): string {
  return `t+${formatDuration(seconds)}`;
}

/** The selected event's line: `t+42.6s · 1.38s into turn 0`, or `t+4ms · session open`. */
export function describeEventTime(time: EventTime | undefined): string {
  if (!time) return "";
  const at = formatElapsed(time.sinceStart);
  if (time.turn === null || time.intoTurn === null) return `${at} · session open`;
  return `${at} · ${formatDuration(time.intoTurn)} into turn ${time.turn}`;
}
