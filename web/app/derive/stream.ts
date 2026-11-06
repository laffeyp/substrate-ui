// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's stream and its graph (sprint 288; plan PLAN-2026-11-04-shell-to-react-r5.md, D1, F333). Moved
// from reveal_component.ts's renderVals: the rows, the spans on the three lifelines, the connectors,
// each row's lane cells, and the side graph's lanes.
//
// F333: the component stripped `substrate.` from each kind and compared bare names ('TriggerFired',
// 'ProducerStarted'), which the lint rule against raw kind strings cannot see; the one comparison
// against the enum (`EnvelopeKind.RunFinalised`, "substrate.RunFinalised") never matched a stripped
// kind. Every comparison here is against the wire kind and `EnvelopeKind`; the stripped name is kept
// only as the row's `kind`, for display.
//
// Three lifelines, as in a UML sequence diagram: the model (one span per stretch the session was
// open), the delegate (each producer from its start to its end, each tool call to its result), and
// the external (the wait from the trigger that starts the return producer to the next message).

import { EnvelopeKind } from "../../vm/kinds";
import { describeEventTime, formatElapsed, type EventTime } from "../../reveal/timeline";

export interface RawEnvelope {
  seq: number;
  kind: string;
  t?: number;
  schema?: string;
  payload?: Record<string, unknown>;
  producer?: { kind?: string; instance?: string } | null;
}

export interface StreamRow {
  seq: number;
  /** The kind as it arrives, e.g. "substrate.TriggerFired". */
  rawKind: string;
  /** The kind as the stream writes it, without the `substrate.` prefix. */
  kind: string;
  t: number | null;
  schema: string;
  prod: string;
  producerInstance: string;
  gist: string;
  /** The lanes the row touches: m(odel), t(ool). */
  lanes: "mt" | "m" | "";
  /** The record's payload with the producer's kind and instance merged in, which the lanes read. */
  payload: Record<string, unknown>;
  /** The record's payload as it arrived, which the inspector shows (F328). */
  record: Record<string, unknown>;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
export const bareKind = (k: string): string => (k.startsWith("substrate.") ? k.slice("substrate.".length) : k);
const isTurnEnd = (k: string) => k === EnvelopeKind.Returned || k === EnvelopeKind.Park;
/** A turn ends with `Returned` from the `return` producer (vocabulary v0.3); older records with `Park`
 *  from the `park` producer. */
export const isReturnProducer = (k: unknown) => k === "return" || k === "park";

/** Participant messages are bright; runtime plumbing grey (shown only at the `all` level). */
export const KIND_COLOR: Readonly<Record<string, string>> = {
  [EnvelopeKind.ToolCall]: "#a08fc9", [EnvelopeKind.ToolResult]: "#7fb3b8",
  [EnvelopeKind.UserMessage]: "#88b0d0", [EnvelopeKind.ModelReply]: "#88b0d0", [EnvelopeKind.FinalAnswer]: "#88b0d0",
  [EnvelopeKind.Park]: "#82a5c8", [EnvelopeKind.Returned]: "#82a5c8", [EnvelopeKind.SessionEnded]: "#88b0d0",
  [EnvelopeKind.TriggerFired]: "#62676f", [EnvelopeKind.ProducerStarted]: "#62676f", [EnvelopeKind.ProducerCompleted]: "#62676f",
  [EnvelopeKind.RunStarted]: "#62676f", [EnvelopeKind.RunFinalised]: "#62676f", [EnvelopeKind.TerminationMatched]: "#62676f",
  [EnvelopeKind.SessionStarted]: "#62676f", [EnvelopeKind.PromptFragment]: "#62676f", [EnvelopeKind.PromptComposed]: "#62676f",
  [EnvelopeKind.LanguageProfile]: "#62676f", [EnvelopeKind.LanguageDrift]: "#62676f",
};

/** Runtime plumbing: the rows the `app` level hides. Kept as its own set so a colour change cannot
 *  move a kind in or out of view. */
export const PLUMBING: ReadonlySet<string> = new Set([
  EnvelopeKind.TriggerFired, EnvelopeKind.ProducerStarted, EnvelopeKind.ProducerCompleted,
  EnvelopeKind.RunStarted, EnvelopeKind.RunFinalised, EnvelopeKind.TerminationMatched,
  EnvelopeKind.SessionStarted, EnvelopeKind.PromptFragment, EnvelopeKind.PromptComposed,
  EnvelopeKind.LanguageProfile, EnvelopeKind.LanguageDrift,
]);

const RUNTIME_KINDS: ReadonlySet<string> = new Set([
  EnvelopeKind.TriggerFired, EnvelopeKind.ProducerStarted, EnvelopeKind.ProducerCompleted, EnvelopeKind.RunStarted,
  EnvelopeKind.RunFinalised, EnvelopeKind.TerminationMatched, EnvelopeKind.UserMessage,
  EnvelopeKind.PromptFragment, EnvelopeKind.PromptComposed, EnvelopeKind.SessionStarted,
]);

/** The `prod` column. */
export function producerLabel(kind: string, producerKind: string, payload: Record<string, unknown>): string {
  if (RUNTIME_KINDS.has(kind)) return "runtime";
  if (kind === EnvelopeKind.ToolCall) return "model";
  if (kind === EnvelopeKind.ToolResult) return payload.tool ? `tool · ${str(payload.tool)}` : "tool";
  if (kind === EnvelopeKind.FinalAnswer || kind === EnvelopeKind.ModelReply) return "model";
  if (isTurnEnd(kind)) return "return";
  return producerKind || "runtime";
}

/** The row's gist, from the fields the envelope carries. */
export function envelopeGist(kind: string, payload: Record<string, unknown>): string {
  if (kind === EnvelopeKind.UserMessage) return String(payload.text || payload.assembled_prompt || "").slice(0, 160);
  if (kind === EnvelopeKind.ModelReply) return String(payload.text || "").slice(0, 160);
  if (kind === EnvelopeKind.FinalAnswer) return "turn done";
  if (kind === EnvelopeKind.ToolCall) {
    const tool = str(payload.tool) || "tool";
    const args = Array.isArray(payload.args) ? payload.args.join(" ") : (payload.args ? String(payload.args) : "");
    return args ? `${tool} ${args}`.slice(0, 160) : tool;
  }
  if (kind === EnvelopeKind.ToolResult) {
    const ok = payload.ok !== false;
    const out = payload.output as unknown;
    const shaped = out as { stdout?: unknown; text?: unknown } | null;
    const tail = ok
      ? (typeof out === "string" ? out.slice(0, 80) : (shaped && (shaped.stdout || shaped.text) ? String(shaped.stdout || shaped.text).slice(0, 80) : "ok"))
      : `err · ${str(payload.error) || "failed"}`;
    return `${ok ? "ok" : "err"} · ${tail}`;
  }
  if (kind === EnvelopeKind.TriggerFired) {
    const tid = String(payload.factory || payload.trigger_id || "trigger");
    return payload.starts ? `${tid} fired → ${str(payload.starts)}` : `${tid} fired`;
  }
  if (kind === EnvelopeKind.ProducerStarted || kind === EnvelopeKind.ProducerCompleted) {
    const producer = payload.producer as { kind?: unknown } | undefined;
    return String(payload.kind || (producer && producer.kind) || "producer");
  }
  if (kind === EnvelopeKind.Park) return `await ${str(payload.awaiting) || EnvelopeKind.UserMessage}`;
  if (kind === EnvelopeKind.Returned) return `returned · ${str(payload.reason)}`;
  if (kind === EnvelopeKind.SessionStarted) return `seed · driver ${str(payload.driver_model) || "?"}`;
  if (kind === EnvelopeKind.SessionEnded) return `end · ${str(payload.reason) || "server_end"}`;
  return "";
}

export function streamRows(envs: readonly RawEnvelope[]): StreamRow[] {
  return envs.map((env) => {
    const raw = env.payload || {};
    // ProducerStarted and ProducerCompleted carry the producer on `payload.producer` (the wire); the
    // lanes read it as `payload.kind` and `payload.instance`.
    const fromPayload = raw.producer as { kind?: string; instance?: string } | undefined;
    const producerKind = env.producer?.kind || fromPayload?.kind || "";
    const producerInstance = env.producer?.instance || fromPayload?.instance || "";
    const payload: Record<string, unknown> = { ...raw, kind: producerKind || raw.kind, instance: producerInstance || raw.instance };
    const kind = env.kind;
    return {
      seq: env.seq, rawKind: kind, kind: bareKind(kind),
      t: typeof env.t === "number" ? env.t : null, schema: env.schema || "",
      prod: producerLabel(kind, producerKind, raw), producerInstance, gist: envelopeGist(kind, raw),
      lanes: (kind === EnvelopeKind.ToolCall || kind === EnvelopeKind.ToolResult) ? "mt"
        : (isTurnEnd(kind) || (kind === EnvelopeKind.TriggerFired && isReturnProducer(payload.starts))) ? "" : "m",
      payload,
      record: raw,
    };
  });
}

export interface Span { start: number; end: number; color: string; bright: string; kind?: string; }
export type Lane = "model" | "delegation" | "external";
export interface Spans { model: Span[]; delegation: Span[]; external: Span[]; calls: Record<string, { start: number; tool: string }>; }

export function streamSpans(rows: readonly StreamRow[]): Spans {
  const spans: Spans = { model: [], delegation: [], external: [], calls: {} };
  if (!rows.length) return spans;
  const lastSeq = rows[rows.length - 1].seq;
  // One model span per stretch the session was open: each SessionEnded closes one, the next envelope
  // (a resume) opens the next.
  let modelOpen: number | null = rows[0].seq;
  for (const row of rows) {
    if (modelOpen === null) modelOpen = row.seq;
    if (row.rawKind === EnvelopeKind.SessionEnded) { spans.model.push({ start: modelOpen, end: row.seq, color: "#3d5166", bright: "#82a5c8" }); modelOpen = null; }
  }
  if (modelOpen !== null) spans.model.push({ start: modelOpen, end: lastSeq, color: "#3d5166", bright: "#82a5c8" });
  const starts: Record<string, { seq: number; kind: string }> = {};
  let parkOpen: number | null = null;
  for (const row of rows) {
    const pkind = str(row.payload.kind);
    if (row.rawKind === EnvelopeKind.ProducerStarted && row.producerInstance && pkind && !isReturnProducer(pkind)) {
      starts[row.producerInstance] = { seq: row.seq, kind: pkind };
    }
    if (row.rawKind === EnvelopeKind.ProducerCompleted && row.producerInstance && starts[row.producerInstance]) {
      const started = starts[row.producerInstance];
      delete starts[row.producerInstance];
      if (started.kind !== "model") spans.delegation.push({ start: started.seq, end: row.seq, color: "#4d6b6e", bright: "#7fb3b8", kind: started.kind });
      continue;
    }
    if (row.rawKind === EnvelopeKind.TriggerFired && isReturnProducer(row.payload.starts) && parkOpen === null) parkOpen = row.seq;
    if (row.rawKind === EnvelopeKind.UserMessage && parkOpen !== null) {
      spans.external.push({ start: parkOpen, end: row.seq, color: "#3d5166", bright: "#82a5c8", kind: "park" });
      parkOpen = null;
    }
    if (row.rawKind === EnvelopeKind.ToolCall) spans.calls[str(row.payload.call_id)] = { start: row.seq, tool: str(row.payload.tool) };
    if (row.rawKind === EnvelopeKind.ToolResult) {
      const call = spans.calls[str(row.payload.call_id)];
      if (call) spans.delegation.push({
        start: call.start, end: row.seq,
        color: call.tool === "delegate" ? "#665f7d" : "#4d6b6e", bright: call.tool === "delegate" ? "#a08fc9" : "#7fb3b8",
        kind: call.tool || "tool",
      });
    }
  }
  // Producers still open run to the last row; an open wait stays a dot.
  for (const st of Object.values(starts)) {
    if (st.kind !== "model") spans.delegation.push({ start: st.seq, end: lastSeq, color: "#4d6b6e", bright: "#7fb3b8", kind: st.kind });
  }
  if (parkOpen !== null) spans.external.push({ start: parkOpen, end: parkOpen, color: "#3d5166", bright: "#82a5c8", kind: "park" });
  for (const lane of ["model", "delegation", "external"] as const) spans[lane].sort((a, b) => a.start - b.start);
  return spans;
}

export const LANES: readonly { kind: Lane; label: string }[] = [
  { kind: "model", label: "model" }, { kind: "delegation", label: "delegate" }, { kind: "external", label: "external" },
];

/** The lifeline a row belongs to; its cell there draws bright. */
export function laneOf(row: StreamRow): Lane {
  const pkind = str(row.payload.kind);
  if (isReturnProducer(pkind) || isTurnEnd(row.rawKind) || row.rawKind === EnvelopeKind.UserMessage) return "external";
  if (row.rawKind === EnvelopeKind.ToolCall || row.rawKind === EnvelopeKind.ToolResult) return "delegation";
  if (pkind && pkind !== "model") return "delegation";
  if (row.rawKind === EnvelopeKind.TriggerFired) {
    const starts = row.payload.starts;
    if (isReturnProducer(starts)) return "external";
    if (starts && starts !== "model") return "delegation";
  }
  return "model";
}

export interface Connector { c: string; l: number; w: number; dot: number; }
const cx = (lane: Lane) => LANES.findIndex((ld) => ld.kind === lane) * 12 + 4;

/** The sequence-diagram arrow on a row: a tool call runs model → delegate, its result back; the
 *  trigger that starts the return producer runs model → external, and the message that ends the wait
 *  back; other triggers and messages are stubs into the lane they start. */
export function connector(row: StreamRow, closesPark: ReadonlySet<number>): Connector | null {
  const arrow = (from: Lane, to: Lane, c: string): Connector => { const a = cx(from), b = cx(to); return { c, l: Math.min(a, b), w: Math.abs(b - a), dot: b }; };
  const stub = (to: Lane, c: string): Connector => { const b = cx(to); return { c, l: 0, w: b, dot: b }; };
  const dot = (on: Lane, c: string): Connector => { const b = cx(on); return { c, l: b, w: 0, dot: b }; };
  const k = row.rawKind;
  if (k === EnvelopeKind.ToolCall) return arrow("model", "delegation", row.payload.tool === "delegate" ? "#a08fc9" : "#7fb3b8");
  if (k === EnvelopeKind.ToolResult) return arrow("delegation", "model", "#7fb3b8");
  if (k === EnvelopeKind.TriggerFired) {
    const starts = row.payload.starts;
    if (isReturnProducer(starts)) return arrow("model", "external", "#82a5c8");
    return stub(starts && starts !== "model" ? "delegation" : "model", "#c9a0b8");
  }
  if (k === EnvelopeKind.UserMessage) return closesPark.has(row.seq) ? arrow("external", "model", "#82a5c8") : stub("model", "#88b0d0");
  if (k === EnvelopeKind.ProducerCompleted) {
    const pkind = str(row.payload.kind);
    return pkind && pkind !== "model" && !isReturnProducer(pkind) ? arrow("delegation", "model", "#7fb3b8") : dot("model", "#82a5c8");
  }
  if (k === EnvelopeKind.FinalAnswer || k === EnvelopeKind.SessionEnded) return stub("model", "#82a5c8");
  if (isTurnEnd(k)) return dot("external", "#82a5c8");
  return null;
}

/** Each lifeline's cell on a row: the span's colour where one covers it, bright on the row's own lane. */
export function laneCells(row: StreamRow, spans: Spans): string[] {
  const own = laneOf(row);
  return LANES.map((ld) => {
    const sp = spans[ld.kind].find((s) => s.start <= row.seq && row.seq <= s.end);
    return sp ? (ld.kind === own ? sp.bright : sp.color) : "transparent";
  });
}

export interface SideSeg { from: number; to: number; base: string; seq: number; }
export interface SideLane { label: string; color: string; segs: SideSeg[]; }

/** The side graph: the model's spans, one lane per tool by name (delegate calls as "⑂ delegate"), and
 *  the turn ends. */
export function sideLanes(rows: readonly StreamRow[], spans: Spans): SideLane[] {
  const lanes: SideLane[] = [];
  if (spans.model.length) lanes.push({ label: "model", color: "#82a5c8", segs: spans.model.map((sp) => ({ from: sp.start, to: sp.end + 0.6, base: sp.bright, seq: sp.start })) });
  const byName = new Map<string, { start: number; end: number }[]>();
  for (const row of rows) {
    if (row.rawKind !== EnvelopeKind.ToolResult) continue;
    const call = spans.calls[str(row.payload.call_id)];
    if (!call) continue;
    const name = call.tool || "tool";
    byName.set(name, [...(byName.get(name) ?? []), { start: call.start, end: row.seq }]);
  }
  for (const [name, list] of byName) {
    const delegate = name === "delegate";
    lanes.push({ label: delegate ? "⑂ delegate" : name, color: delegate ? "#a08fc9" : "#7fb3b8", segs: list.map((sp) => ({ from: sp.start, to: sp.end + 0.6, base: delegate ? "#665f7d" : "#4d6b6e", seq: sp.start })) });
  }
  const ends = rows.filter((row) => isTurnEnd(row.rawKind)).map((row) => row.seq);
  if (ends.length) lanes.push({ label: "returned", color: "#82a5c8", segs: ends.map((seq) => ({ from: Math.max(0, seq - 0.5), to: seq + 0.6, base: "#82a5c8", seq })) });
  return lanes;
}

/** The side graph's seq axis: the first row's seq to the last's, at least one apart. */
export interface SideAxis { first: number; last: number; }

export function sideAxis(rows: readonly StreamRow[]): SideAxis {
  if (!rows.length) return { first: 0, last: 1 };
  const first = rows[0].seq;
  return { first, last: Math.max(rows[rows.length - 1].seq, first + 1) };
}

/** A segment's left edge and width along the axis, as percentages to one decimal. */
export function segBox(seg: SideSeg, axis: SideAxis): { l: string; w: string } {
  const span = axis.last - axis.first;
  return { l: (((seg.from - axis.first) / span) * 100).toFixed(1) + "%", w: (((seg.to - seg.from) / span) * 100).toFixed(1) + "%" };
}

/** Find's text for a row: its kind, producer and gist, lowercased. */
export function findText(row: StreamRow): string {
  return (row.kind + " " + row.prod + " " + row.gist).toLowerCase();
}

export interface LensRow {
  seq: number;
  /** Time since the session's first event, "t+1.20s"; empty when the record has no `t`. */
  t: string;
  kind: string;
  kindColor: string;
  /** The producer and the gist, "model · bash ls". */
  line: string;
  sel: boolean;
  bg: string;
  opacity: number;
  cells: string[];
  conn: Connector | null;
}

export interface LensInput {
  sel: number | null;
  /** The `app` level hides the runtime's plumbing rows. */
  app: boolean;
  /** Find's query on the stream, lowercased; empty when find is closed or on the transcript. */
  query: string;
}

/** The stream lens's rows: the lit row, find's matches lit and the rest dimmed, each row's lane cells
 *  and arrow. */
export function lensRows(rows: readonly StreamRow[], spans: Spans, times: ReadonlyMap<number, EventTime>, input: LensInput): LensRow[] {
  const closesPark = new Set(spans.external.map((sp) => sp.end));
  const shown = input.app ? rows.filter((r) => !PLUMBING.has(r.rawKind)) : rows;
  return shown.map((r) => {
    const time = times.get(r.seq);
    const hit = !!input.query && findText(r).includes(input.query);
    const sel = r.seq === input.sel;
    return {
      seq: r.seq, t: time ? formatElapsed(time.sinceStart) : "", kind: r.kind, kindColor: KIND_COLOR[r.rawKind] || "#9aa0a8",
      line: r.prod + " · " + r.gist, sel,
      bg: sel ? "#2e3138" : hit ? "#26292e" : "transparent",
      opacity: input.query && !hit ? 0.3 : 1,
      cells: laneCells(r, spans), conn: connector(r, closesPark),
    };
  });
}

export interface InspectorView {
  kind: string;
  seq: number;
  color: string;
  schema: string;
  time: string;
  producer: string;
  /** The record's payload as it arrived, as JSON. The producer's fields show on their own line. */
  payload: string;
}

export function inspectorView(row: StreamRow, times: ReadonlyMap<number, EventTime>): InspectorView {
  return {
    kind: row.kind, seq: row.seq, color: KIND_COLOR[row.rawKind] || "#9aa0a8", schema: row.schema,
    time: describeEventTime(times.get(row.seq)), producer: row.prod, payload: JSON.stringify(row.record, null, 1),
  };
}
