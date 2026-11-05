// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What meta's stream lens draws (sprint 291; plan PLAN-2026-11-04-shell-to-react-r5.md, D2). DCLogic
// owns the focused pane, the lit seq, the level and the direction until the meta view moves (plan row
// D7); after each render it writes them here with the focused session's envelopes, and registers the
// pick action and the side graph's scroll link. web/app/StreamLens.tsx derives the rows and the
// inspector from them, web/app/SideGraph.tsx the side graph (sprint 296).

import { createStore } from "../store";
import type { RawEnvelope } from "../derive/stream";
import type { LanguageView, TopologyGraph } from "../../vm/types";

export interface StreamState {
  /** The focused session's envelopes, the snapshot's own array. */
  envelopes: readonly RawEnvelope[];
  sel: number | null;
  /** The `app` level: plumbing rows hidden. */
  app: boolean;
  /** The down direction draws the lifelines' legend and cells. */
  down: boolean;
  /** The focused session's topology, which the structure lens lists (sprint 301). */
  topology: TopologyGraph | null;
  /** The focused session's language view, which the language lens draws (sprint 310). */
  language: LanguageView | null;
}

/** The side graph's scroller and its scroll, which DCLogic ties to the stream's scroller (the two scroll
 *  together in the side direction) until the meta view moves (plan row D7). */
export interface GraphLink { ref(el: HTMLElement | null): void; onScroll(el: HTMLElement): void; }
const NO_LINK: GraphLink = { ref: () => undefined, onScroll: () => undefined };

interface Shared { store: ReturnType<typeof createStore<StreamState>>; pick: { current: (seq: number) => void }; select: { current: (seq: number) => void }; graph: { current: GraphLink } }

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateStream";
const scope = globalThis as unknown as Record<string, Shared | undefined>;
const shared: Shared = scope[KEY] ?? (scope[KEY] = {
  store: createStore<StreamState>({ envelopes: [], sel: null, app: false, down: true, topology: null, language: null }),
  pick: { current: () => undefined },
  select: { current: () => undefined },
  graph: { current: NO_LINK },
});

export const stream = shared.store;

/** A click on a row lights it, or clears it when it is lit. */
export function pickSeq(seq: number): void {
  shared.pick.current(seq);
}

/** A click on a language lens row lights its turn's seq, lit or not. */
export function selectSeq(seq: number): void {
  shared.select.current(seq);
}

export function setSelectSeq(fn: (seq: number) => void): () => void {
  shared.select.current = fn;
  return () => { if (shared.select.current === fn) shared.select.current = () => undefined; };
}

export function setPickSeq(fn: (seq: number) => void): () => void {
  shared.pick.current = fn;
  return () => { if (shared.pick.current === fn) shared.pick.current = () => undefined; };
}

export function graphLink(): GraphLink {
  return shared.graph.current;
}

export function setGraphLink(link: GraphLink): () => void {
  shared.graph.current = link;
  return () => { if (shared.graph.current === link) shared.graph.current = NO_LINK; };
}
