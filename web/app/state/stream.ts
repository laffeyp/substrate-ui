// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The focused session's record as meta's lenses read it (sprints 291, 296, 301, 309; plan
// PLAN-2026-11-04-shell-to-react-r5.md, D2-D7): its envelopes, its topology and its language view.
// App owns the panes and their controllers; after each render it writes the focused pane's here.
// The meta view's own state (lens, direction, level, selection) is web/app/state/meta.ts (sprint
// 313).

import { createStore } from "../store";
import type { RawEnvelope } from "../derive/stream";
import type { LanguageView, TopologyGraph } from "../../vm/types";

export interface StreamState {
  /** The focused session's envelopes, the snapshot's own array, so a render that changes nothing
   *  notifies no one. */
  envelopes: readonly RawEnvelope[];
  /** The focused session's topology, which the structure lens lists. */
  topology: TopologyGraph | null;
  /** The focused session's language view, which the language lens draws. */
  language: LanguageView | null;
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateStream";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<StreamState>> | undefined>;
export const stream = scope[KEY] ?? (scope[KEY] = createStore<StreamState>({ envelopes: [], topology: null, language: null }));
