// Signal emitter for the reveal shell. Validates every emit against
// the reveal shell's own locked vocabulary. Unknown tags throw.
// Missing required payload fields throw. Buffer exposed as
// window.__vmSignals for the parity harness to read.
//
// Wholly separate from the classic shell's web/instrumentation/sdd.ts
// and its window.__signals buffer. The two shells share no runtime
// state.

import { VOCABULARY, VOCAB_VERSION } from "./vocabulary";

export type SignalRecord = {
  ts: number;
  name: string;
  category: string;
  stratum: string;
  payload: Record<string, unknown>;
};

const buffer: SignalRecord[] = [];
const sessionStart = nowMs();

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

export function emit(name: string, payload: Record<string, unknown> = {}): SignalRecord {
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
    name,
    category: spec.category,
    stratum: spec.stratum,
    payload,
  };
  buffer.push(record);
  if (typeof window !== "undefined") {
    (window as unknown as { __vmSignals: SignalRecord[] }).__vmSignals = buffer;
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
