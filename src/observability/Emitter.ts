// src/observability/Emitter.ts — the single call site for shell tags.
//
// Every shell-side observation flows here. Two mouth-side guards fire at
// emit time (PRINCIPLES commitment 2 — "schema enforced at the speaker's
// mouth"):
//
//   1. Vocabulary discipline (SDD hard rule 2). Any tag name outside the
//      108-tag Layer 1 v0.1 set fails loud. The set is derived at build
//      time from signals/0.1.json § layer_1_lexical.tags[].name; the
//      shell never hand-copies the vocabulary.
//   2. Payload shape discipline (Layer 2). Every emit's payload must carry
//      every required field named in signals/0.1.json § layer_2_payload.
//      payload_schemas[kind].required. A payload short a required key
//      throws at the emit call site, not after the harness reads the
//      JSONL back — the harness is a second gate, not the first.

import signalsV01 from "@/../signals/0.1.json";
import { isRatifiedTag } from "./vocab";

export interface ShellSignal {
  t: number;                        // ms since app start
  kind: string;                     // UPPER_SNAKE tag id
  payload: Record<string, unknown>;
}

interface Layer2Schema { required?: string[] }
interface SignalsV01 {
  layer_2_payload: { payload_schemas: Record<string, Layer2Schema> };
}

const SCHEMAS = (signalsV01 as unknown as SignalsV01).layer_2_payload.payload_schemas;

declare global {
  interface Window {
    __substrateHarness?: { append: (sig: ShellSignal) => void };
  }
}

const START_T = performance.now();

export function emit(kind: string, payload: Record<string, unknown> = {}): ShellSignal {
  if (!isRatifiedTag(kind)) {
    throw new Error(`[Emitter] tag not in signals/0.1.json v0.1: ${kind}`);
  }
  const required = SCHEMAS[kind]?.required ?? [];
  for (const field of required) {
    if (!(field in payload)) {
      throw new Error(
        `[Emitter] ${kind} payload missing required field '${field}' ` +
        `(present: ${Object.keys(payload).join(",") || "(empty)"})`,
      );
    }
  }
  const sig: ShellSignal = {
    t: Math.round(performance.now() - START_T),
    kind,
    payload,
  };
  const w = globalThis as unknown as Window;
  if (w.__substrateHarness) {
    try { w.__substrateHarness.append(sig); } catch { /* best-effort */ }
  }
  return sig;
}
