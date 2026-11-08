// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Main's signal checker (vocabulary v0.9; plan 2026-11-05-sdd-signals item 3, sprint 355). The rules
// and the cases are in web/vm/signals/checker-cases.json; the window (web/vm/instrumentation/check.ts)
// and the server (server.py _check_signal) implement the same rules and run the same cases. Answers
// { ok: true, payload } with long reasons cut (E2), or { ok: false, problem, field }: the payload
// of SIGNAL_REJECTED.
"use strict";

const RANGED = new Set(["port", "pid", "count", "seq", "turn_index", "proc_seq"]);
const CUT = new Set(["detail", "reason", "cause", "error"]);
const CUT_AT = 200;

function typeAdmits(spec, v) {
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

function inRange(field, v) {
  if (!(RANGED.has(field) || field.endsWith("_ms")) || typeof v !== "number") return true;
  if (!Number.isInteger(v) || v < 0) return false;
  return field !== "port" || (v >= 1 && v <= 65535);
}

function checkSignal(tags, name, payload) {
  const spec = Object.prototype.hasOwnProperty.call(tags, name) ? tags[name] : null;
  if (!spec) return { ok: false, problem: "unknown_tag", field: null };
  for (const f of spec.payload) if (!(f in payload)) return { ok: false, problem: "missing_field", field: f };
  const declared = new Set([...spec.payload, ...spec.optional_payload]);
  for (const f of Object.keys(payload)) if (!declared.has(f)) return { ok: false, problem: "extra_field", field: f };
  const types = spec.field_types || {};
  const fields = [...spec.payload, ...spec.optional_payload];
  for (const f of fields) {
    if (!(f in payload) || !(f in types)) continue;
    if (!typeAdmits(types[f], payload[f])) return { ok: false, problem: "wrong_type", field: f };
  }
  for (const f of fields) if (f in payload && !inRange(f, payload[f])) return { ok: false, problem: "out_of_range", field: f };
  let out = payload;
  for (const f of Object.keys(payload)) {
    const v = payload[f];
    if (!CUT.has(f) || typeof v !== "string") continue;
    const points = Array.from(v);
    if (points.length <= CUT_AT) continue;
    if (out === payload) out = { ...payload };
    out[f] = points.slice(0, CUT_AT).join("") + "…[cut " + (points.length - CUT_AT) + "]";
  }
  return { ok: true, payload: out };
}

// The vocabulary's tags keyed by name, as checkSignal takes them.
function tagsOf(vocab) {
  const tags = Object.create(null);
  for (const t of vocab.tags) tags[t.name] = t;
  return tags;
}

export { checkSignal, tagsOf };
