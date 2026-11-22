// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 517 — how a tool call draws its output: `cards`, the boxed card (sprints 074, 505–512), or
// `text`, the plain presentation on the inset's ground (roadmap 2026-11-17-daily-driver-fixes E3; the
// Architect, 2026-11-17: "just all text … it just goes bash and then it doesn't show what the args are or
// whatever … and then that text just goes below"). Sprint 538 adds `raw`, the plain terminal column
// (RESEARCH-2026-11-20-tool-output-text-presentation-r2): the command line, then its output on the lines
// below, flowed onto the pane's ground with no box, no inset, no label and no call_id footer — the shape a
// terminal draws. `cards` and `text` are unchanged; the viewer cycles between the three in Settings. The
// transcript imports web/vm, never web/app, so the setting lives here; web/app/state/settings.ts owns the
// persisted pick and mirrors it into this store on load and on a pick. No signal: the pick emits nothing,
// as the look and scheme picks do. The state lives on one global object that every copy of the module
// shares, as tool_output_mode.ts does.

// Sprint 538 follow-up adds `compact`, a variation of `cards`: the boxed card with a one-line preview
// (not three), and no duplicate output box — when a command streamed, the stream is the output, drawn once.
export type ToolView = "cards" | "text" | "raw" | "compact";
export const TOOL_VIEWS: readonly ToolView[] = ["cards", "text", "raw", "compact"];

interface Store {
  state: { toolView: ToolView };
  listeners: Set<() => void>;
}

const KEY = "__substrateToolView";

function store(): Store {
  const shared = globalThis as unknown as Record<string, Store | undefined>;
  let found = shared[KEY];
  if (!found) {
    found = { state: { toolView: "raw" }, listeners: new Set() };
    shared[KEY] = found;
  }
  return found;
}

export function getToolView(): ToolView {
  return store().state.toolView;
}

export function setToolView(next: ToolView): void {
  const shared = store();
  if (shared.state.toolView === next) return;
  shared.state = { toolView: next };
  shared.listeners.forEach((fn) => fn());
}

export function subscribeToolView(fn: () => void): () => void {
  const shared = store();
  shared.listeners.add(fn);
  return () => { shared.listeners.delete(fn); };
}
