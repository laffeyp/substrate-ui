// tests/harness/lib/assert.js — three-channel + sequence assertions shared
// across every sprint harness. Foundation 02 §"Required primitives" #7
// names assert_signal / assert_no_signal / assert_sequence; the functions
// below deliver them for the JavaScript side.

"use strict";

// A tiny check runner. Each harness constructs one via `check.new()`,
// then appends via `check(cond, msg)`. Prints ok/FAIL and tallies.
function makeCheck() {
  const fails = [];
  function check(cond, msg) {
    if (cond) console.log("  ok  " + msg);
    else fails.push(msg);
  }
  check.fails = fails;
  check.ok = (msg) => console.log("  ok  " + msg);
  check.summary = () => fails;
  return check;
}

// Assert one signal with the given kind exists in the trace. Optional
// partial-payload lets the caller match on specific fields. Returns the
// first matching signal.
function assertSignal(emits, kind, partialPayload = null) {
  for (const s of emits) {
    if (s.kind !== kind) continue;
    if (partialPayload) {
      const p = s.payload ?? {};
      let match = true;
      for (const [k, v] of Object.entries(partialPayload)) {
        if (p[k] !== v) { match = false; break; }
      }
      if (!match) continue;
    }
    return s;
  }
  const filter = partialPayload ? ` with payload⊇${JSON.stringify(partialPayload)}` : "";
  throw new Error(`assertSignal: no ${kind}${filter} in ${emits.length} emits`);
}

// Assert no signal with the given kind exists.
function assertNoSignal(emits, kind) {
  const bad = emits.filter((s) => s.kind === kind);
  if (bad.length) throw new Error(`assertNoSignal: found ${bad.length} × ${kind}`);
}

// Assert the emitted kinds contain the given sequence in order (not
// necessarily contiguous). Returns the indices of the matched signals.
function assertSequence(emits, kinds) {
  const kindsSeen = emits.map((s) => s.kind);
  const idx = [];
  let cursor = -1;
  for (const k of kinds) {
    const i = kindsSeen.indexOf(k, cursor + 1);
    if (i < 0) {
      throw new Error(
        `assertSequence: kind ${k} not found after index ${cursor} ` +
        `(seen: ${kindsSeen.slice(0, 20).join(",")})`,
      );
    }
    idx.push(i);
    cursor = i;
  }
  return idx;
}

module.exports = { makeCheck, assertSignal, assertNoSignal, assertSequence };
