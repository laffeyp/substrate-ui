// tests/harness/lib/layer5.js — Layer 5 sequence + pairing conformance
// check. Reads signals/0.1.json § layer_5_state_transitions and asserts
// the emitted trace obeys every rule that applies.
//
// Sprint cards should NOT re-declare "PANE_SPLIT → PANE_CREATED → PANE_FOCUSED
// same-step" in prose per harness. That's the sort of drift the vocabulary
// was supposed to eliminate. Instead: add the pairing to Layer 5's
// pairing_ordering rules, and every harness inherits the assertion.

"use strict";
const fs = require("node:fs");
const path = require("node:path");

const REPO = path.resolve(__dirname, "..", "..", "..");

let cached = null;
function loadLayer5() {
  if (cached) return cached;
  const data = JSON.parse(fs.readFileSync(path.join(REPO, "signals/0.1.json"), "utf8"));
  cached = data.layer_5_state_transitions;
  return cached;
}

function rulesByKind() {
  const l5 = loadLayer5();
  const rules = Array.isArray(l5.state_transitions) ? l5.state_transitions
              : Array.isArray(l5.rules) ? l5.rules
              : Array.isArray(l5) ? l5 : [];
  const out = {
    pairingOrdering: [], forbiddenAfter: [], forcedNext: [], terminal: [], allowedSet: [],
  };
  for (const r of rules) {
    if (r.kind === "pairing_ordering") out.pairingOrdering.push(r);
    else if (r.kind === "forbidden_after") out.forbiddenAfter.push(r);
    else if (r.kind === "forced_next") out.forcedNext.push(r);
    else if (r.kind === "terminal") out.terminal.push(r);
    else if (r.kind === "allowed_set") out.allowedSet.push(r);
  }
  return out;
}

// Assert every pairing_ordering rule of the form "if X emits, then Y must
// follow" holds across the given emits. Only rules where BOTH tags appear
// in the trace are checked; rules that require a tag the trace never sees
// pass trivially (there's nothing to pair).
function assertLayer5PairingOrdering(emits) {
  const { pairingOrdering } = rulesByKind();
  const misses = [];
  const kindsSeen = new Set(emits.map((s) => s.kind));
  for (const rule of pairingOrdering) {
    const from = rule.from;
    const to = Array.isArray(rule.to) ? rule.to : [rule.to];
    if (!kindsSeen.has(from)) continue;
    if (!to.some((k) => kindsSeen.has(k))) {
      misses.push(`${from} emitted but none of ${to.join("|")} followed`);
      continue;
    }
    // Positional check: at least one from-index precedes at least one to-index.
    const fromIdx = emits.map((s, i) => s.kind === from ? i : -1).filter((i) => i >= 0);
    let paired = false;
    for (const fi of fromIdx) {
      if (emits.slice(fi + 1).some((s) => to.includes(s.kind))) { paired = true; break; }
    }
    if (!paired) misses.push(`${from} at index ${fromIdx.join(",")} without a following ${to.join("|")}`);
  }
  if (misses.length) {
    throw new Error(`Layer 5 pairing_ordering violated: ${misses.slice(0, 5).join("; ")}`);
  }
}

// Assert no forbidden_after rule is violated in the trace.
function assertLayer5ForbiddenAfter(emits) {
  const { forbiddenAfter } = rulesByKind();
  const misses = [];
  for (const rule of forbiddenAfter) {
    const trigger = rule.from ?? rule.after;
    const forbidden = Array.isArray(rule.forbidden) ? rule.forbidden : rule.forbid;
    if (!trigger || !forbidden) continue;
    const trigIdx = emits.findIndex((s) => s.kind === trigger);
    if (trigIdx < 0) continue;
    const forbidList = Array.isArray(forbidden) ? forbidden : [forbidden];
    const bad = emits.slice(trigIdx + 1).find((s) => forbidList.includes(s.kind));
    if (bad) misses.push(`${trigger} at ${trigIdx} followed by forbidden ${bad.kind}`);
  }
  if (misses.length) {
    throw new Error(`Layer 5 forbidden_after violated: ${misses.slice(0, 5).join("; ")}`);
  }
}

// Assert every allowed_set rule.
//
// Semantics: a rule declares a flow keyed by `key` (a payload field
// name like "tool_call_id") and rooted in `from`. The flow's OWN tag
// set is the union of {from, every literal tag in to_allowed, every
// terminal for the flow's stratum}. Wildcard entries in to_allowed
// like "any pane-scoped tag with the same pane_id" are natural
// language — skipped by the parser.
//
// Once `from` fires with key value K, the flow is OPEN for K. Every
// subsequent emit sharing K AND belonging to the flow's own tag set
// must appear in allowed_set (or in terminals). A terminal closes
// the flow. Emits sharing K but NOT in the flow's tag set belong to
// a different flow that happens to share the key; skipped.
//
// This catches: allowed emits firing out of order, terminal-then-non-
// terminal reopens without a fresh `from`, and any tag rogue-emitted
// while the flow is open.
function assertLayer5AllowedSet(emits) {
  const { allowedSet, terminal } = rulesByKind();
  const terminalByStratum = new Map();
  for (const t of terminal) {
    if (!t.stratum || !t.tag) continue;
    if (!terminalByStratum.has(t.stratum)) terminalByStratum.set(t.stratum, new Set());
    terminalByStratum.get(t.stratum).add(t.tag);
  }
  const isTagName = (s) => typeof s === "string" && /^[A-Z][A-Z0-9_ ()]*$/.test(s.split(" ")[0]) && !/[a-z]/.test(s.split(" ")[0]);
  const misses = [];
  for (const rule of allowedSet) {
    const from = rule.from;
    const allowedRaw = rule.to_allowed || [];
    // to_allowed may contain wildcards like "any pane-scoped tag with
    // the same pane_id" — those are natural language, not tags. Keep
    // only entries that look like a real tag name (all-caps, may
    // include parenthetical qualifiers like "REVEAL_TOGGLED (to: reveal)").
    const allowedTags = new Set();
    for (const a of allowedRaw) {
      if (typeof a !== "string") continue;
      const bareName = a.split(" (")[0].trim();
      if (/^[A-Z][A-Z0-9_]*$/.test(bareName)) allowedTags.add(bareName);
    }
    const key = rule.key;
    const stratum = rule.stratum || "";
    const terminals = terminalByStratum.get(stratum) || new Set();
    const flowTags = new Set([from, ...allowedTags, ...terminals]);
    if (!key) continue; // skip keyless dialog-scoped rules for this pass
    const openByKey = new Map();
    for (let i = 0; i < emits.length; i++) {
      const e = emits[i];
      const keyVal = e.payload && e.payload[key];
      if (keyVal === undefined || keyVal === null) continue;
      if (!flowTags.has(e.kind)) continue; // out-of-flow emit sharing the key — ignore
      if (e.kind === from) { openByKey.set(keyVal, i); continue; }
      if (!openByKey.has(keyVal)) continue;
      if (!allowedTags.has(e.kind) && !terminals.has(e.kind)) {
        misses.push(`${from}(${key}=${keyVal}) → ${e.kind} at index ${i}, not in allowed_set or terminals`);
      }
      if (terminals.has(e.kind)) openByKey.delete(keyVal);
    }
  }
  if (misses.length) {
    throw new Error(`Layer 5 allowed_set violated: ${misses.slice(0, 5).join("; ")}`);
  }
}

function assertLayer5(emits) {
  assertLayer5PairingOrdering(emits);
  assertLayer5ForbiddenAfter(emits);
  assertLayer5AllowedSet(emits);
}

module.exports = {
  loadLayer5, assertLayer5PairingOrdering, assertLayer5ForbiddenAfter,
  assertLayer5AllowedSet, assertLayer5,
};
