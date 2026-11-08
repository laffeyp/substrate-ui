// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Signal emitter for the window. The tag and its payload are typed from the vocabulary
// (web/vm/signals.gen.ts, generated from current.json; sprint 363), so the compiler rejects an
// unknown tag, a missing or extra field, or a value outside its enum. Buffer exposed as
// window.__vmSignals for the gates to read.
//
// The classic shell's emitter (window.__signals) is in _deprecated/classic-tree/web/instrumentation/;
// the two share no runtime state (sprint 341, plan row F6, F348: this comment named a
// web/instrumentation/ that no longer exists).

import { VOCABULARY, VOCAB_VERSION } from "./vocabulary";
import { Signal, TraceLostProcess, type SignalPayloads } from "../signals.gen";

export type SignalRecord = {
  ts: number;
  /** The window's record number from 0 within the boot, on across reloads (v0.7 record context): the order key in the trace. */
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

// The window's record number goes on across a reload: the boot and its window-<id>.jsonl do, and two
// records with one order key in a file cannot be ordered (sprint 360 found the reload starting it again
// at 0). sessionStorage lives as long as the window, not the page. Without it (node tests) it starts at 0.
const SEQ_KEY = "substrate.proc_seq";
function storedSeq(): number {
  try { return typeof sessionStorage === "undefined" ? 0 : Number(sessionStorage.getItem(SEQ_KEY) ?? 0) || 0; } catch { return 0; }
}
function storeSeq(next: number): void {
  try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(SEQ_KEY, String(next)); } catch { /* the number still rises within the page */ }
}
let procSeq = storedSeq();
/** Records native.signal refused since the last one it took; reported as TRACE_LOST (v0.7). */
let sendLost = 0;
let reportingLoss = false;

export function emit<K extends Signal>(name: K, payload: SignalPayloads[K], context: { pane_id?: number | null } = {}): SignalRecord {
  const spec = VOCABULARY[name];
  const record: SignalRecord = {
    ts: +(nowMs() - sessionStart).toFixed(4),
    proc_seq: procSeq++,
    pane_id: context.pane_id ?? null,
    name,
    category: spec.category,
    stratum: spec.stratum,
    payload: payload as Record<string, unknown>,
  };
  storeSeq(procSeq);
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
        try { emit(Signal.TRACE_LOST, { process: TraceLostProcess.WINDOW, count }); } finally { reportingLoss = false; }
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
