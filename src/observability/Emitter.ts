// src/observability/Emitter.ts — the single call site for shell tags.
// Every shell-side observation flows here. Enforces vocabulary-as-contract:
// any tag name outside v0.1 fails loud (SDD hard rule 2).

import { isRatifiedTag } from "./vocab";

export interface ShellSignal {
  t: number;                        // ms since app start
  kind: string;                     // UPPER_SNAKE tag id
  payload: Record<string, unknown>;
}

declare global {
  interface Window {
    __substrateHarness?: { append: (sig: ShellSignal) => void };
  }
}

const START_T = performance.now();

export function emit(kind: string, payload: Record<string, unknown> = {}): ShellSignal {
  if (!isRatifiedTag(kind)) {
    // Halt loud — the vocabulary is the contract.
    throw new Error(`[Emitter] tag not in signals/0.1.json v0.1: ${kind}`);
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
