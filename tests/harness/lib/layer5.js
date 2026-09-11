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

function rulesByKind(kind) {
  const l5 = loadLayer5();
  const rules = Array.isArray(l5.rules) ? l5.rules : Array.isArray(l5) ? l5 : [];
  return { pairingOrdering: [], forbiddenAfter: [], forcedNext: [], terminal: [], ...groupByKind(rules) };
  function groupByKind(rs) {
    const out = { pairingOrdering: [], forbiddenAfter: [], forcedNext: [], terminal: [] };
    for (const r of rs) {
      if (r.kind === "pairing_ordering") out.pairingOrdering.push(r);
      else if (r.kind === "forbidden_after") out.forbiddenAfter.push(r);
      else if (r.kind === "forced_next") out.forcedNext.push(r);
      else if (r.kind === "terminal") out.terminal.push(r);
    }
    return out;
  }
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

function assertLayer5(emits) {
  assertLayer5PairingOrdering(emits);
  assertLayer5ForbiddenAfter(emits);
}

module.exports = { loadLayer5, assertLayer5PairingOrdering, assertLayer5ForbiddenAfter, assertLayer5 };
