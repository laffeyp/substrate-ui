// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's signal checker (vocabulary v0.9; plan 2026-11-05-sdd-signals item 3, sprint 355).
// One specification, web/vm/signals/checker-cases.json, holds the rules and the cases; main
// (electron/check_signal.js) and the server (server.py _check_signal) implement the same rules and
// run the same cases. The checker answers ok with the payload to write (long reasons cut, E2), or a
// rejection naming the problem and the field, which is SIGNAL_REJECTED's payload.

export type CheckTag = { payload: string[]; optional_payload: string[]; field_types?: Record<string, string> };
export type Problem = "unknown_tag" | "missing_field" | "extra_field" | "wrong_type" | "out_of_range";
export type Verdict =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; problem: Problem; field: string | null };

const RANGED = new Set(["port", "pid", "count", "seq", "turn_index", "proc_seq"]);
const CUT = new Set(["detail", "reason", "cause", "error"]);
const CUT_AT = 200;

function typeAdmits(spec: string, v: unknown): boolean {
  let t = spec.replace(/\s*\([^)]*\)/g, "").trim();
  const nullable = t.endsWith(" or null");
  if (nullable) t = t.slice(0, -" or null".length).trim();
  if (v === null) return nullable;
  if (t.startsWith("enum ")) return typeof v === "string" && t.slice(5).split("|").map((s) => s.trim()).includes(v);
  if (t.startsWith("list")) return Array.isArray(v);
  switch (t) {
    case "int": return typeof v === "number" && Number.isInteger(v);
    case "float": return typeof v === "number" && Number.isFinite(v);
    case "string": return typeof v === "string";
    case "bool": return typeof v === "boolean";
    case "object": return typeof v === "object" && !Array.isArray(v);
    default: return false;
  }
}

function inRange(field: string, v: unknown): boolean {
  if (!(RANGED.has(field) || field.endsWith("_ms")) || typeof v !== "number") return true;
  if (!Number.isInteger(v) || v < 0) return false;
  return field !== "port" || (v >= 1 && v <= 65535);
}

export function checkSignal(tags: Record<string, CheckTag>, name: string, payload: Record<string, unknown>): Verdict {
  const spec = Object.prototype.hasOwnProperty.call(tags, name) ? tags[name] : undefined;
  if (!spec) return { ok: false, problem: "unknown_tag", field: null };
  for (const f of spec.payload) if (!(f in payload)) return { ok: false, problem: "missing_field", field: f };
  const declared = new Set([...spec.payload, ...spec.optional_payload]);
  for (const f of Object.keys(payload)) if (!declared.has(f)) return { ok: false, problem: "extra_field", field: f };
  const types = spec.field_types ?? {};
  for (const f of [...spec.payload, ...spec.optional_payload]) {
    if (!(f in payload) || !(f in types)) continue;
    if (!typeAdmits(types[f], payload[f])) return { ok: false, problem: "wrong_type", field: f };
  }
  for (const f of [...spec.payload, ...spec.optional_payload]) {
    if (f in payload && !inRange(f, payload[f])) return { ok: false, problem: "out_of_range", field: f };
  }
  let out = payload;
  for (const f of Object.keys(payload)) {
    const v = payload[f];
    if (!CUT.has(f) || typeof v !== "string") continue;
    const points = Array.from(v);
    if (points.length <= CUT_AT) continue;
    if (out === payload) out = { ...payload };
    out[f] = points.slice(0, CUT_AT).join("") + `…[cut ${points.length - CUT_AT}]`;
  }
  return { ok: true, payload: out };
}
