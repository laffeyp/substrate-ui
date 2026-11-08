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
import { checkSignal } from "./check";

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

/** A broken emit is written as SIGNAL_REJECTED in every build; source and test builds then raise,
 *  and the packaged app goes on (v0.9 E6). preload.js sets native.packaged from main's app.isPackaged. */
function packaged(): boolean {
  return typeof window !== "undefined" && (window as unknown as { native?: { packaged?: boolean } }).native?.packaged === true;
}

/** The emitting line: the first stack frame above emit. Frame 0 is callSite, frame 1 emit; a
 *  method named emit (the pane controller's wrapper) is passed over too. Names survive in source
 *  builds; a packaged build's frames are minified and give the bundle's line and column. */
function callSite(): string {
  const frames = (new Error().stack ?? "").split("\n").map((l) => l.trim()).filter((l) => l.startsWith("at "));
  const caller = frames.slice(2).find((l) => !/(^|\.)emit$/.test(l.slice(3).split(" (")[0]));
  return (caller ?? "unknown").slice(3, 203);
}

export function emit(name: string, payload: Record<string, unknown> = {}, context: { pane_id?: number | null } = {}): SignalRecord | null {
  const verdict = checkSignal(VOCABULARY, name, payload);
  if (!verdict.ok) {
    const site = callSite();
    const message = `[vm-sdd] signal "${name}" rejected: ${verdict.problem}${verdict.field ? ` (${verdict.field})` : ""} at ${site}`;
    // Written in every build, so the trace holds it even where a caller swallows the throw.
    const rejected: Record<string, unknown> = { process: "window", tag: name.slice(0, 80), problem: verdict.problem, call_site: site };
    if (verdict.field) rejected.field = verdict.field;
    emit("SIGNAL_REJECTED", rejected, context);
    if (!packaged()) throw new Error(message);
    return null;
  }
  payload = verdict.payload;
  const spec = VOCABULARY[name];
  const record: SignalRecord = {
    ts: +(nowMs() - sessionStart).toFixed(4),
    proc_seq: procSeq++,
    pane_id: context.pane_id ?? null,
    name,
    category: spec.category,
    stratum: spec.stratum,
    payload,
  };
  storeSeq(procSeq);
  buffer.push(record);
  if (buffer.length > SIGNAL_CAP) buffer.splice(0, buffer.length - SIGNAL_CAP);
  if (typeof window !== "undefined") {
    (window as unknown as { __vmSignals: SignalRecord[] }).__vmSignals = buffer;
    // The gates reach the emitter here to drive the checker in a packaged app (sprint 355).
    (window as unknown as { __vmEmit: typeof emit }).__vmEmit = emit;
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
