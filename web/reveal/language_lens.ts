// The language lens (UI sprints 169-171): the kernel's language view of a session record, laid out
// as lanes. Rows are turns, time runs down; each watched measure is a lane; a setting change is a
// full-width rule; a shift is a mark at the reply that raised it; the selected turn's numbers sit
// in one readout row. Pure: the component adds the click handlers. Roadmap
// process/planning/ROADMAP-2026-10-13-language-in-the-app.md; design sheet
// process/planning/design-sheets/2026-10-13-language/.

import {
  LANGUAGE_INTENTS,
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

export const GROUP_COLOR: Record<string, string> = {
  [LanguageGroup.LENGTH]: "#82a5c8",
  [LanguageGroup.TONE]: "#7fb3b8",
  [LanguageGroup.GUIDANCE]: "#c9a0b8",
  [LanguageGroup.OTHER]: "#9aa0a8",
};
// The settings a group answers to, as the session's controls name them.
const GROUP_CONTROL: Record<string, string> = { [LanguageGroup.LENGTH]: "length", [LanguageGroup.TONE]: "tone" };

export const LANE_W = 84;
export const ROW_H = 18;
export const TURN_COL = 46;
const BAR_X = 6; // the bar's baseline inside its lane
const BAR_MAX = LANE_W - 14;
const RELATION_PAIRING_FINAL = "final";
const DIM = "#4a4e55";

export interface LensCell {
  left: number;
  barW: number;
  color: string;
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
  range: string;
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

function scaled(key: string, v: number): number {
  const m = LANGUAGE_MEASURES[key];
  const f = (v - m.low) / Math.max(m.high - m.low, 1e-9);
  return Math.max(0, Math.min(1, f));
}

interface Series {
  turns: { turn: number; seq: number }[];
  value: (key: string, turn: number) => number | null;
  window: (key: string, turn: number) => number | null;
  seqOf: (key: string, turn: number) => number | null;
  lane: (key: string) => LanguageLane | null;
}

function laneSeries(view: LanguageView, stream: string, keys: readonly string[]): Series {
  const lanes = view.lanes[stream] || {};
  const at = new Map<string, Map<number, { seq: number; value: number; window: number | null }>>();
  const turnSeq = new Map<number, number>();
  for (const key of keys) {
    const m = new Map<number, { seq: number; value: number; window: number | null }>();
    for (const p of lanes[key]?.points || []) {
      m.set(p.turn, { seq: p.seq, value: p.value, window: p.window });
      if (!turnSeq.has(p.turn)) turnSeq.set(p.turn, p.seq);
    }
    at.set(key, m);
  }
  return {
    turns: [...turnSeq.entries()].sort((a, b) => a[0] - b[0]).map(([turn, seq]) => ({ turn, seq })),
    value: (k, t) => at.get(k)?.get(t)?.value ?? null,
    window: (k, t) => at.get(k)?.get(t)?.window ?? null,
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

export function buildLanguageLens(
  view: LanguageView | null,
  opts: { stream: LanguageStreamIdValue; selTurn: number | null; lane: number },
): Lens {
  const empty: Lens = {
    has: false, empty: "", groups: [], lanes: [], rows: [], paths: [], width: 0, height: 0,
    readout: { label: "", cells: [] }, turns: [],
  };
  if (!view) return { ...empty, empty: "measuring this session's language…" };
  const keys: readonly string[] = opts.stream === LanguageStreamId.Relation ? LANGUAGE_RELATION_LANES : LANGUAGE_WATCHED;
  const s = opts.stream === LanguageStreamId.Relation ? relationSeries(view, keys) : laneSeries(view, opts.stream, keys);
  if (!s.turns.length) return { ...empty, empty: "no measured turns yet — measurements land as each turn returns." };

  const lanes: LensLane[] = keys.map((key, i) => {
    const m = LANGUAGE_MEASURES[key];
    return {
      key, short: m.short, range: `${m.unit === "per 1,000 words" ? "/1k " : ""}${fmt(m.low)}–${fmt(m.high)}`,
      explanation: m.explanation, color: GROUP_COLOR[m.group] || GROUP_COLOR.other,
      left: TURN_COL + i * LANE_W, focused: i === opts.lane,
    };
  });
  const groups: Lens["groups"] = [];
  for (const lane of lanes) {
    const group = LANGUAGE_MEASURES[lane.key].group;
    const label = group === LanguageGroup.OTHER ? "" : group.toUpperCase();
    const last = groups[groups.length - 1];
    if (last && last.label === label && last.color === GROUP_COLOR[group]) last.width += LANE_W;
    else groups.push({ label, color: GROUP_COLOR[group], left: lane.left, width: LANE_W });
  }

  const shifts = new Map<string, LanguageView["shifts"][number]>();
  for (const sh of view.shifts) if (sh.stream === opts.stream) shifts.set(`${sh.turn}|${sh.measure}`, sh);
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
      const where = opts.stream === LanguageStreamId.Relation ? "in this turn" : opts.stream === LanguageStreamId.User ? "in this message" : "in this reply";
      let title = `${m.short}: ${fmt(v)} ${m.unit} ${where}.`;
      if (win !== null) title += ` Over the latest window: ${fmt(win)}.`;
      const ln = s.lane(lane.key);
      if (ln && ln.warmup_span === null && opts.stream !== LanguageStreamId.Relation) {
        const n = ln.points.length;
        title += ` Shift marks start once ${LANGUAGE_WARMUP} values have varied; this lane has ${n}.`;
      }
      let markTitle = "";
      if (sh) {
        markTitle = `${m.short} ${sh.direction}, flagged at turn ${turn}.`;
        const control = GROUP_CONTROL[m.group];
        const position = control ? settingAt(view, s.seqOf(lane.key, turn), control) : null;
        const intent = control && position ? (LANGUAGE_INTENTS[control]?.[position] || []).find(([k]) => k === lane.key) : undefined;
        if (control && position) markTitle += ` ${control[0].toUpperCase()}${control.slice(1)} is ${position}`;
        if (intent) markTitle += `; its text asks for ${intent[1] === "down" ? "less" : "more"} of this.`;
        else if (control && position) markTitle += ".";
      }
      return {
        left: lane.left + BAR_X,
        barW: v === null || v === 0 ? 0 : Math.max(1, Math.round(scaled(lane.key, v) * BAR_MAX)),
        color: sh ? lane.color : v === 0 ? DIM : `${lane.color}88`,
        title,
        mark: sh ? (sh.direction === "up" ? "▲" : "▼") : "",
        markTitle,
      };
    });
    rows.push({ isTurn: true, isRule: false, turn, seq, label: `t${turn}`, top, selected: turn === selTurn, ruleText: "", cells });
    top += ROW_H;
  }

  const paths = lanes.map((lane) => {
    const pts = s.turns
      .map(({ turn }) => ({ win: s.window(lane.key, turn), y: (rowTop.get(turn) ?? 0) + ROW_H / 2 }))
      .filter((p): p is { win: number; y: number } => p.win !== null);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${(lane.left + BAR_X + scaled(lane.key, p.win) * BAR_MAX).toFixed(1)} ${p.y}`).join(" ");
    return { d, stroke: lane.color };
  }).filter((p) => p.d);

  const readoutCells = lanes.map((lane) => {
    const v = s.value(lane.key, selTurn);
    const sh = shifts.get(`${selTurn}|${lane.key}`);
    return {
      left: lane.left, text: `${fmt(v)}${sh ? (sh.direction === "up" ? " ▲" : " ▼") : ""}`,
      color: sh ? lane.color : v === 0 || v === null ? DIM : "#d7dade",
    };
  });

  return {
    has: true, empty: "", groups, lanes, rows, paths,
    width: TURN_COL + lanes.length * LANE_W, height: top,
    readout: { label: `t${selTurn}`, cells: readoutCells },
    turns: s.turns,
  };
}
