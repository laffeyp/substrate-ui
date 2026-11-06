// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Signal emitter for the reveal shell. Validates every emit against
// the reveal shell's own locked vocabulary. Unknown tags throw.
// Missing required payload fields throw. Buffer exposed as
// window.__vmSignals for the parity harness to read.
//
// The classic shell's emitter (window.__signals) is in _deprecated/classic-tree/web/instrumentation/;
// the two share no runtime state (sprint 341, plan row F6, F348: this comment named a
// web/instrumentation/ that no longer exists).

import { VOCABULARY, VOCAB_VERSION } from "./vocabulary";

export type SignalRecord = {
  ts: number;
  /** The window's record number from 0 (vocabulary v0.7 record context): the order key in the trace. */
  proc_seq: number;
  /** The pane whose controller emitted it; null for window-level code (v0.7 record context). */
  pane_id: number | null;
  name: string;
  category: string;
  stratum: string;
  payload: Record<string, unknown>;
};

const buffer: SignalRecord[] = [];
/** The buffer keeps the latest SIGNAL_CAP signals (sprint 340, plan row F5, F347): it gained one per
 *  streamed envelope and was never trimmed, so a long session grew it without end. The gates read it
 *  by position from a session's start, far under the cap. */
export const SIGNAL_CAP = 10_000;
const sessionStart = nowMs();

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

let procSeq = 0;
/** Records native.signal refused since the last one it took; reported as TRACE_LOST (v0.7). */
let sendLost = 0;
let reportingLoss = false;

export function emit(name: string, payload: Record<string, unknown> = {}, context: { pane_id?: number | null } = {}): SignalRecord {
  const spec = VOCABULARY[name];
  if (!spec) {
    throw new Error(
      `[vm-sdd] unknown signal tag "${name}". Define it in web/vm/signals/versions/current.json before emitting.`
    );
  }
  const missing = spec.payload.filter((f) => !(f in payload));
  if (missing.length > 0) {
    throw new Error(
      `[vm-sdd] signal "${name}" missing required payload fields: ${missing.join(", ")}`
    );
  }
  const record: SignalRecord = {
    ts: +(nowMs() - sessionStart).toFixed(4),
    proc_seq: procSeq++,
    pane_id: context.pane_id ?? null,
    name,
    category: spec.category,
    stratum: spec.stratum,
    payload,
  };
  buffer.push(record);
  if (buffer.length > SIGNAL_CAP) buffer.splice(0, buffer.length - SIGNAL_CAP);
  if (typeof window !== "undefined") {
    (window as unknown as { __vmSignals: SignalRecord[] }).__vmSignals = buffer;
    // The trace on disk (v0.7, plan 2026-11-05-sdd-signals item 2): inside Electron each record also
    // goes to main, which writes it to this launch's window-<id>.jsonl with the boot and window ids.
    // A send that throws is counted, and the next send that works is followed by a TRACE_LOST with
    // the count, so a lost record is never silent. A failed send never stops an emit.
    const native = (window as unknown as { native?: { signal?: (r: SignalRecord) => void } }).native;
    if (native?.signal) {
      let sent = false;
      try { native.signal(record); sent = true; } catch { sendLost += 1; }
      if (sent && sendLost > 0 && !reportingLoss) {
        const count = sendLost;
        sendLost = 0;
        reportingLoss = true;
        try { emit("TRACE_LOST", { process: "window", count }); } finally { reportingLoss = false; }
      }
    }
  }
  return record;
}

export function snapshot(): SignalRecord[] {
  return buffer.slice();
}

export function clearBuffer(): void {
  buffer.length = 0;
}

export { VOCAB_VERSION };
