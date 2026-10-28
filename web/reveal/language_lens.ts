// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The language lens (UI sprints 169-171): the kernel's language view of a session record, laid out
// as lanes. Rows are turns, time runs down; each watched measure is a lane; a setting change is a
// full-width rule; a shift is a mark at the reply that raised it; the selected turn's numbers sit
// in one readout row. Pure: the component adds the click handlers. Roadmap
// process/planning/ROADMAP-2026-10-13-language-in-the-app.md; design sheet
// process/planning/design-sheets/2026-10-13-language/.

import {
  LANGUAGE_INTENTS,
  LANGUAGE_LSM_MIN_WORDS,
  LANGUAGE_MEASURES,
  LANGUAGE_RELATION_LANES,
  LANGUAGE_WARMUP,
  LANGUAGE_WATCHED,
  LanguageGroup,
} from "../vm/language_measures.gen";
import type { LanguageLane, LanguageLine, LanguageView } from "../vm/types";

export const LanguageStreamId = {
  Model: "model",
  User: "user",
  Relation: "relation",
} as const;
export type LanguageStreamIdValue = (typeof LanguageStreamId)[keyof typeof LanguageStreamId];

export const LANGUAGE_STREAM_TABS: { id: LanguageStreamIdValue; label: string }[] = [
  { id: LanguageStreamId.Model, label: "replies" },
  { id: LanguageStreamId.User, label: "messages" },
  { id: LanguageStreamId.Relation, label: "turns" },
];

export const LanguageViewMode = {
  Bars: "bars",
  Deviation: "deviation",
  Ribbons: "ribbons",
  // UI sprint 174: the turns stream's views.
  Sides: "side by side",
  Measures: "measures",
} as const;
export type LanguageViewModeValue = (typeof LanguageViewMode)[keyof typeof LanguageViewMode];

/** The views a stream offers: replies and messages are one text per row; turns pair a message with
 *  its reply, so they show both sides, or the measures that compare them. */
export function languageViewTabs(stream: LanguageStreamIdValue): LanguageViewModeValue[] {
  return stream === LanguageStreamId.Relation
    ? [LanguageViewMode.Sides, LanguageViewMode.Measures]
    : [LanguageViewMode.Bars, LanguageViewMode.Deviation, LanguageViewMode.Ribbons];
}

/** The view drawn: the one asked for when the stream offers it, else the stream's first. */
export function languageView(stream: LanguageStreamIdValue, view: LanguageViewModeValue | undefined): LanguageViewModeValue {
  const tabs = languageViewTabs(stream);
  return view && tabs.includes(view) ? view : tabs[0];
}

// Deviation view: ±4 warm-up SDs fill the lane; guides at ±2 SD; a value past them is emphasised.
const SD_SPAN = 4;
const SD_GUIDE = 2;

export const GROUP_COLOR: Record<string, string> = {
  [LanguageGroup.LENGTH]: "#82a5c8",
  [LanguageGroup.TONE]: "#7fb3b8",
  [LanguageGroup.GUIDANCE]: "#c9a0b8",
  [LanguageGroup.OTHER]: "#9aa0a8",
};
// The turns stream's pair measures answer to no setting but length ratio; they take the palette's
// colours by what they compare.
const RELATION_GROUPS: Record<string, { label: string; color: string }> = {
  length_ratio: { label: "LENGTH", color: GROUP_COLOR[LanguageGroup.LENGTH] },
  lexical_echo: { label: "ECHO", color: GROUP_COLOR[LanguageGroup.GUIDANCE] },
  phrase_copy_share: { label: "ECHO", color: GROUP_COLOR[LanguageGroup.GUIDANCE] },
  phrase_copy_longest_run: { label: "ECHO", color: GROUP_COLOR[LanguageGroup.GUIDANCE] },
  ncd: { label: "ECHO", color: GROUP_COLOR[LanguageGroup.GUIDANCE] },
  window_lsm: { label: "STYLE", color: GROUP_COLOR[LanguageGroup.TONE] },
};
export function relationGroup(key: string): { label: string; color: string } {
  return RELATION_GROUPS[key] || { label: "", color: GROUP_COLOR[LanguageGroup.OTHER] };
}
// The settings a group answers to, as the session's controls name them.
export const GROUP_CONTROL: Record<string, string> = { [LanguageGroup.LENGTH]: "length", [LanguageGroup.TONE]: "tone" };

export const LANE_W = 84;
export const ROW_H = 18;
export const TURN_COL = 46;
const BAR_X = 6; // the bar's baseline inside its lane
const BAR_MAX = LANE_W - 14;
const RELATION_PAIRING_FINAL = "final";
const DIM = "#4a4e55";

export interface LensCell {
  left: number;
  barLeft: number;
  barTop: number;
  barH: number;
  barW: number;
  hairLeft: number;
  hairW: number;
  /** Side by side: the reply's bar, right of the centre line (the message's is `bar*`). */
  bar2Left: number;
  bar2W: number;
  color: string;
  color2: string;
  title: string;
  mark: string;
  markTitle: string;
}
export interface LensRow {
  isTurn: boolean;
  isRule: boolean;
  turn: number;
  seq: number;
  label: string;
  top: number;
  selected: boolean;
  ruleText: string;
  cells: LensCell[];
}
export interface LensLane {
  key: string;
  short: string;
  /** The group header the lane sits under. */
  group: string;
  unit: string;
  /** Hover on the unit: what a full-width bar stands for now. */
  scaleTitle: string;
  /** The value a full-width bar stands for: the lane's highest value so far, rounded up. */
  top: number;
  explanation: string;
  color: string;
  left: number;
  focused: boolean;
}
export interface Lens {
  has: boolean;
  empty: string;
  groups: { label: string; color: string; left: number; width: number }[];
  lanes: LensLane[];
  rows: LensRow[];
  paths: { d: string; stroke: string }[];
  guides: { left: number; color: string }[];
  /** Fine lines at each lane's left edge, stronger where a group starts. */
  dividers: { left: number; color: string }[];
  /** A line above the rows; the deviation view says when its warm-up ends. */
  note: string;
  width: number;
  height: number;
  readout: { label: string; cells: { left: number; text: string; color: string }[] };
  turns: { turn: number; seq: number }[];
}

export function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 100) return String(Math.round(v));
  if (a >= 10) return v.toFixed(1).replace(/\.0$/, "");
  return v.toFixed(a >= 1 ? 1 : 2).replace(/\.?0+$/, "") || "0";
}

/** The hover text of one shift, in the lens and on the bar line: what moved, where it was flagged,
 *  and, where the setting's text states one, the direction that text asks for. */
export function shiftNote(measure: string, direction: string, turn: number, position: string | null): string {
  const m = LANGUAGE_MEASURES[measure];
  let note = `${m.short} ${direction}, flagged at turn ${turn}.`;
  const control = GROUP_CONTROL[m.group];
  if (!control || !position) return note;
  const intent = (LANGUAGE_INTENTS[control]?.[position] || []).find(([k]) => k === measure);
  note += ` ${control[0].toUpperCase()}${control.slice(1)} is ${position}`;
  note += intent ? `; its text asks for ${intent[1] === "down" ? "less" : "more"} of this.` : ".";
  return note;
}

export function fmtSigned(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
}

/** The smallest of 1, 2, 2.5 and 5 times a power of ten at or above `x`; 0 for 0. */
export function niceCeil(x: number): number {
  if (!(x > 0)) return 0;
  const p = 10 ** Math.floor(Math.log10(x));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * p >= x * (1 - 1e-12)) return f * p;
  return 10 * p;
}

/** Each lane runs from zero to its highest value or window so far, rounded up, so it grows as a
 *  session's replies do and no bar is clipped. Every measure the lens draws is zero or above. */
function scaled(top: number, v: number): number {
  return top > 0 ? Math.max(0, Math.min(1, v / top)) : 0;
}

interface Series {
  turns: { turn: number; seq: number }[];
  value: (key: string, turn: number) => number | null;
  window: (key: string, turn: number) => number | null;
  deviation: (key: string, turn: number) => number | null;
  seqOf: (key: string, turn: number) => number | null;
  lane: (key: string) => LanguageLane | null;
}

function laneSeries(view: LanguageView, stream: string, keys: readonly string[]): Series {
  const lanes = view.lanes[stream] || {};
  const at = new Map<string, Map<number, { seq: number; value: number; window: number | null; deviation: number | null }>>();
  const turnSeq = new Map<number, number>();
  for (const key of keys) {
    const m = new Map<number, { seq: number; value: number; window: number | null; deviation: number | null }>();
    for (const p of lanes[key]?.points || []) {
      m.set(p.turn, { seq: p.seq, value: p.value, window: p.window, deviation: p.deviation });
      if (!turnSeq.has(p.turn)) turnSeq.set(p.turn, p.seq);
    }
    at.set(key, m);
  }
  return {
    turns: [...turnSeq.entries()].sort((a, b) => a[0] - b[0]).map(([turn, seq]) => ({ turn, seq })),
    value: (k, t) => at.get(k)?.get(t)?.value ?? null,
    window: (k, t) => at.get(k)?.get(t)?.window ?? null,
    deviation: (k, t) => at.get(k)?.get(t)?.deviation ?? null,
    seqOf: (k, t) => at.get(k)?.get(t)?.seq ?? null,
    lane: (k) => lanes[k] || null,
  };
}

function relationSeries(view: LanguageView, keys: readonly string[]): Series {
  const finals = view.lines.filter((l) => l.stream === LanguageStreamId.Relation && l.pairing === RELATION_PAIRING_FINAL);
  const byTurn = new Map<number, LanguageLine>();
  for (const l of finals) byTurn.set(Number(l.turn), l);
  const num = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) ? x : null);
  return {
    turns: [...byTurn.entries()].sort((a, b) => a[0] - b[0]).map(([turn, l]) => ({ turn, seq: l.seq })),
    value: (k, t) => (keys.includes(k) ? num(byTurn.get(t)?.values[k]) : null),
    window: () => null,
    deviation: () => null,
    seqOf: (_k, t) => byTurn.get(t)?.seq ?? null,
    lane: () => null,
  };
}

function settingAt(view: LanguageView, seq: number | null, control: string): string | null {
  if (seq === null) return null;
  const line = view.lines.find((l) => l.seq === seq) as (LanguageLine & Record<string, unknown>) | undefined;
  const v = line ? line[`setting_${control}`] : null;
  return typeof v === "string" ? v : null;
}

/** Words in a stream's trailing window as of `seq`: the latest line of that stream at or before it. */
function windowWords(view: LanguageView, stream: string, seq: number): number {
  let n = 0;
  for (const l of view.lines) {
    if (l.seq > seq) break;
    if (l.stream !== stream) continue;
    const words = (l.values.window as Record<string, unknown> | undefined)?.words;
    if (typeof words === "number") n = words;
  }
  return n;
}

// The header's unit, short enough for a lane; the hover keeps the catalog's full unit.
const UNIT_SHORT: Record<string, string> = { "per 1,000 words": "per 1k words" };

function wordCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function buildLanguageLens(
  view: LanguageView | null,
  opts: { stream: LanguageStreamIdValue; selTurn: number | null; lane: number; view?: LanguageViewModeValue },
): Lens {
  const empty: Lens = {
    has: false, empty: "", groups: [], lanes: [], rows: [], paths: [], guides: [], width: 0, height: 0,
    readout: { label: "", cells: [] }, turns: [], dividers: [], note: "",
  };
  if (!view) return { ...empty, empty: "measuring this session's language…" };
  const mode = languageView(opts.stream, opts.view);
  const sides = mode === LanguageViewMode.Sides;
  const relation = opts.stream === LanguageStreamId.Relation;
  // Side by side reads the replies' and the messages' lanes; the measures view reads the turns'.
  const keys: readonly string[] = relation && !sides ? LANGUAGE_RELATION_LANES : LANGUAGE_WATCHED;
  const s = relation && !sides ? relationSeries(view, keys) : laneSeries(view, sides ? LanguageStreamId.Model : opts.stream, keys);
  const msgs = sides ? laneSeries(view, LanguageStreamId.User, keys) : null;
  if (!s.turns.length) return { ...empty, empty: "no measured turns yet — measurements land as each turn returns." };

  const lanes: LensLane[] = keys.map((key, i) => {
    const m = LANGUAGE_MEASURES[key];
    let high = 0;
    for (const { turn } of s.turns) {
      high = Math.max(high, s.value(key, turn) ?? 0, sides ? 0 : s.window(key, turn) ?? 0, msgs ? msgs.value(key, turn) ?? 0 : 0);
    }
    const top = niceCeil(high);
    const rg = relation && !sides ? relationGroup(key) : null;
    return {
      key, short: m.short, unit: UNIT_SHORT[m.unit] || m.unit, top,
      group: rg ? rg.label : m.group === LanguageGroup.OTHER ? "" : m.group.toUpperCase(),
      scaleTitle: top > 0
        ? `A full ${sides ? "half " : ""}bar is ${fmt(top)} ${m.unit}: the highest value so far, rounded up. The scale grows when a value passes it.`
        : "Every value so far is zero.",
      explanation: m.explanation, color: rg ? rg.color : GROUP_COLOR[m.group] || GROUP_COLOR.other,
      left: TURN_COL + i * LANE_W, focused: i === opts.lane,
    };
  });
  const groups: Lens["groups"] = [];
  for (const lane of lanes) {
    const last = groups[groups.length - 1];
    if (last && last.label === lane.group && last.color === lane.color) last.width += LANE_W;
    else groups.push({ label: lane.group, color: lane.color, left: lane.left, width: LANE_W });
  }
  const dividers: Lens["dividers"] = lanes.map((lane, i) => ({
    left: lane.left - 3,
    color: i === 0 || lane.group !== lanes[i - 1].group ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.045)",
  }));

  const shifts = new Map<string, LanguageView["shifts"][number]>();
  if (!sides) for (const sh of view.shifts) if (sh.stream === opts.stream) shifts.set(`${sh.turn}|${sh.measure}`, sh);
  const changesAt = new Map<number, string[]>();
  for (const c of view.changes) {
    const list = changesAt.get(c.turn) || [];
    list.push(`${c.field} ${c.old} → ${c.new}`);
    changesAt.set(c.turn, list);
  }

  const selTurn = opts.selTurn !== null && s.turns.some((t) => t.turn === opts.selTurn)
    ? opts.selTurn : s.turns[s.turns.length - 1].turn;
  const rows: LensRow[] = [];
  const rowTop = new Map<number, number>();
  let top = 0;
  const ruled = new Set<number>();
  for (const { turn, seq } of s.turns) {
    for (const [ct, texts] of changesAt) {
      if (!ruled.has(ct) && ct <= turn) {
        ruled.add(ct);
        rows.push({ isTurn: false, isRule: true, turn: ct, seq, label: "", top, selected: false,
          ruleText: `${texts.join(" · ")} · turn ${ct}`, cells: [] });
        top += ROW_H;
      }
    }
    rowTop.set(turn, top);
    const cells: LensCell[] = lanes.map((lane) => {
      const m = LANGUAGE_MEASURES[lane.key];
      const v = s.value(lane.key, turn);
      const win = s.window(lane.key, turn);
      const sh = shifts.get(`${turn}|${lane.key}`);
      const where = relation && !sides ? "in this turn" : opts.stream === LanguageStreamId.User ? "in this message" : "in this reply";
      let title = sides
        ? `${m.short}: ${fmt(msgs?.value(lane.key, turn) ?? null)} ${m.unit} in the message, ${fmt(v)} in the reply.`
        : `${m.short}: ${fmt(v)} ${m.unit} ${where}.`;
      if (win !== null && !sides) title += ` Over the latest window: ${fmt(win)}.`;
      const ln = s.lane(lane.key);
      if (ln && ln.warmup_span === null && !relation) {
        const n = ln.points.length;
        title += ` Shift marks start once ${LANGUAGE_WARMUP} values have varied; this lane has ${n}.`;
      }
      const control = GROUP_CONTROL[m.group];
      const markTitle = sh
        ? shiftNote(lane.key, sh.direction, turn, control ? settingAt(view, s.seqOf(lane.key, turn), control) : null)
        : "";
      const cx = lane.left + BAR_X + BAR_MAX / 2;
      const base = {
        left: lane.left + BAR_X, title, mark: sh ? (sh.direction === "up" ? "▲" : "▼") : "", markTitle,
        hairLeft: 0, hairW: 0, bar2Left: 0, bar2W: 0, color2: "",
      };
      if (sides) {
        const half = BAR_MAX / 2 - 1;
        const uv = msgs?.value(lane.key, turn) ?? null;
        const uw = uv === null || uv === 0 ? 0 : Math.max(1, Math.round(scaled(lane.top, uv) * half));
        const rw = v === null || v === 0 ? 0 : Math.max(1, Math.round(scaled(lane.top, v) * half));
        return {
          ...base, barLeft: cx - 1 - uw, barTop: 5, barH: 8, barW: uw, color: `${lane.color}66`,
          bar2Left: cx + 1, bar2W: rw, color2: `${lane.color}cc`,
        };
      }
      if (mode === LanguageViewMode.Deviation) {
        const dev = s.deviation(lane.key, turn);
        if (dev === null) title += ` No deviation until the warm-up ends.`;
        else title += ` ${fmtSigned(dev)} SD from the warm-up's mean.`;
        const per = BAR_MAX / 2 / SD_SPAN;
        const clamped = dev === null ? 0 : Math.max(-SD_SPAN, Math.min(SD_SPAN, dev));
        return {
          ...base, title, barLeft: cx + Math.min(0, clamped) * per, barTop: 5, barH: 8,
          barW: dev === null ? 0 : Math.max(1, Math.round(Math.abs(clamped) * per)),
          color: dev !== null && Math.abs(dev) >= SD_GUIDE ? lane.color : `${lane.color}55`,
        };
      }
      if (mode === LanguageViewMode.Ribbons) {
        const ww = win === null ? 0 : Math.round(scaled(lane.top, win) * BAR_MAX);
        const vw = v === null ? 0 : Math.max(v === 0 ? 0 : 1, Math.round(scaled(lane.top, v) * BAR_MAX));
        return {
          ...base, barLeft: cx - ww / 2, barTop: 0, barH: ROW_H, barW: ww, color: `${lane.color}33`,
          hairLeft: cx - vw / 2, hairW: vw,
        };
      }
      if (relation && lane.key === "window_lsm" && v === null) {
        // Style match before each side's window holds its minimum: the shorter side's progress.
        const seqAt = s.seqOf(lane.key, turn) ?? seq;
        const mw = windowWords(view, LanguageStreamId.User, seqAt);
        const rw = windowWords(view, LanguageStreamId.Model, seqAt);
        const shorter = Math.min(mw, rw);
        return {
          ...base,
          title: `${m.short}: needs ${wordCount(LANGUAGE_LSM_MIN_WORDS)} words from each side; so far the messages have ${wordCount(mw)}, the replies ${wordCount(rw)}.`,
          barLeft: lane.left + BAR_X, barTop: 5, barH: 8,
          barW: shorter === 0 ? 0 : Math.max(1, Math.round(Math.min(1, shorter / LANGUAGE_LSM_MIN_WORDS) * BAR_MAX)),
          color: `${lane.color}26`,
        };
      }
      return {
        ...base, barLeft: lane.left + BAR_X, barTop: 5, barH: 8,
        barW: v === null || v === 0 ? 0 : Math.max(1, Math.round(scaled(lane.top, v) * BAR_MAX)),
        color: sh ? lane.color : v === 0 ? DIM : `${lane.color}88`,
      };
    });
    rows.push({ isTurn: true, isRule: false, turn, seq, label: `t${turn}`, top, selected: turn === selTurn, ruleText: "", cells });
    top += ROW_H;
  }

  const guides: Lens["guides"] = [];
  if (mode === LanguageViewMode.Deviation) {
    const per = BAR_MAX / 2 / SD_SPAN;
    for (const lane of lanes) {
      const cx = lane.left + BAR_X + BAR_MAX / 2;
      guides.push({ left: cx, color: "#33373d" }, { left: cx - SD_GUIDE * per, color: "#2a2d33" }, { left: cx + SD_GUIDE * per, color: "#2a2d33" });
    }
  }
  if (sides) for (const lane of lanes) guides.push({ left: lane.left + BAR_X + BAR_MAX / 2, color: "#33373d" });
  const paths = mode !== LanguageViewMode.Bars ? [] : lanes.filter((lane) => lane.top > 0).map((lane) => {
    const pts = s.turns
      .map(({ turn }) => ({ win: s.window(lane.key, turn), y: (rowTop.get(turn) ?? 0) + ROW_H / 2 }))
      .filter((p): p is { win: number; y: number } => p.win !== null);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${(lane.left + BAR_X + scaled(lane.top, p.win) * BAR_MAX).toFixed(1)} ${p.y}`).join(" ");
    return { d, stroke: lane.color };
  }).filter((p) => p.d);

  const selSeq = s.turns.find((t) => t.turn === selTurn)?.seq ?? 0;
  const readoutCells = lanes.map((lane) => {
    const v = mode === LanguageViewMode.Deviation ? s.deviation(lane.key, selTurn) : s.value(lane.key, selTurn);
    const sh = shifts.get(`${selTurn}|${lane.key}`);
    let text = `${mode === LanguageViewMode.Deviation ? fmtSigned(v) : fmt(v)}${sh ? (sh.direction === "up" ? " ▲" : " ▼") : ""}`;
    let quiet = v === 0 || v === null;
    if (sides) {
      const uv = msgs?.value(lane.key, selTurn) ?? null;
      text = `${fmt(uv)} · ${fmt(v)}`;
      quiet = !uv && !v;
    } else if (relation && lane.key === "window_lsm" && v === null) {
      const at = s.seqOf(lane.key, selTurn) ?? selSeq;
      text = `${wordCount(Math.min(windowWords(view, LanguageStreamId.User, at), windowWords(view, LanguageStreamId.Model, at)))} of ${wordCount(LANGUAGE_LSM_MIN_WORDS)}`;
    }
    return { left: lane.left, text, color: sh ? lane.color : quiet ? DIM : "#d7dade" };
  });

  let note = "";
  if (mode === LanguageViewMode.Deviation && lanes.every((l) => s.lane(l.key)?.warmup_span == null)) {
    const n = Math.max(0, ...lanes.map((l) => s.lane(l.key)?.points.length ?? 0));
    const unit = opts.stream === LanguageStreamId.User ? "messages" : "replies";
    note = `Deviation starts when a lane's warm-up ends: ${LANGUAGE_WARMUP} ${unit} whose values vary. This session has ${n} so far.`;
  }
  if (sides) note = "Each lane: the message left of the centre line, the reply right of it, on one scale. The readout reads message · reply.";

  return {
    has: true, empty: "", groups, lanes, rows, paths, guides, dividers, note,
    width: TURN_COL + lanes.length * LANE_W, height: top,
    readout: { label: `t${selTurn}`, cells: readoutCells },
    turns: s.turns,
  };
}
