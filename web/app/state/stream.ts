// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What meta's stream lens draws (sprint 291; plan PLAN-2026-11-04-shell-to-react-r5.md, D2). DCLogic
// owns the focused pane, the lit seq, the level and the direction until the meta view moves (plan row
// D7); after each render it writes them here with the focused session's envelopes, and registers the
// pick action. web/app/StreamLens.tsx derives the rows and the inspector from them.

import { createStore } from "../store";
import type { RawEnvelope } from "../derive/stream";

export interface StreamState {
  /** The focused session's envelopes, the snapshot's own array. */
  envelopes: readonly RawEnvelope[];
  sel: number | null;
  /** The `app` level: plumbing rows hidden. */
  app: boolean;
  /** The down direction draws the lifelines' legend and cells. */
  down: boolean;
}

interface Shared { store: ReturnType<typeof createStore<StreamState>>; pick: { current: (seq: number) => void } }

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateStream";
const scope = globalThis as unknown as Record<string, Shared | undefined>;
const shared: Shared = scope[KEY] ?? (scope[KEY] = {
  store: createStore<StreamState>({ envelopes: [], sel: null, app: false, down: true }),
  pick: { current: () => undefined },
});

export const stream = shared.store;

/** A click on a row lights it, or clears it when it is lit. */
export function pickSeq(seq: number): void {
  shared.pick.current(seq);
}

export function setPickSeq(fn: (seq: number) => void): () => void {
  shared.pick.current = fn;
  return () => { if (shared.pick.current === fn) shared.pick.current = () => undefined; };
}
