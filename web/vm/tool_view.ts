// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 517 — how a tool call draws its output: `cards`, the boxed card (sprints 074, 505–512), or
// `text`, the plain presentation (roadmap 2026-11-17-daily-driver-fixes E3; the Architect, 2026-11-17:
// "just all text … it just goes bash and then it doesn't show what the args are or whatever … and then
// that text just goes below"). The transcript imports web/vm, never web/app, so the setting lives here;
// web/app/state/settings.ts owns the persisted pick and mirrors it into this store on load and on a pick.
// No signal: the pick emits nothing, as the look and scheme picks do. The state lives on one global
// object that every copy of the module shares, as tool_output_mode.ts does.

export type ToolView = "cards" | "text";
export const TOOL_VIEWS: readonly ToolView[] = ["cards", "text"];

interface Store {
  state: { toolView: ToolView };
  listeners: Set<() => void>;
}

const KEY = "__substrateToolView";

function store(): Store {
  const shared = globalThis as unknown as Record<string, Store | undefined>;
  let found = shared[KEY];
  if (!found) {
    found = { state: { toolView: "cards" }, listeners: new Set() };
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
