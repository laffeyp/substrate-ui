// UI sprint 140 — one setting opens or closes every tool card. `auto` (before the first flip) keeps
// each card's own rule: open while its tool runs. A flip to `expanded` or `collapsed` applies to
// every card, those already drawn and those that arrive later; `generation` counts flips, so a click
// on one card holds only until the next flip.
//
// Flipped by ⌘E (reveal_component.ts) and by /fold and /unfold (session_controller.ts); read by
// the tool cards (reveal/transcript/useToolOutputMode.ts). No React here, and no state of its own:
// reveal_component.ts is compiled as its own bundle, apart from the rest, and each bundle gets its
// own copy of this module, so the state lives on one global object the copies share.

export type ToolOutputMode = "auto" | "expanded" | "collapsed";

export interface ToolOutputState {
  mode: ToolOutputMode;
  generation: number;
}

interface Store {
  state: ToolOutputState;
  listeners: Set<() => void>;
}

const KEY = "__substrateToolOutputMode";

function store(): Store {
  const shared = globalThis as unknown as Record<string, Store | undefined>;
  let found = shared[KEY];
  if (!found) {
    found = { state: { mode: "auto", generation: 0 }, listeners: new Set() };
    shared[KEY] = found;
  }
  return found;
}

export function getToolOutputMode(): ToolOutputState {
  return store().state;
}

export function setToolOutputMode(next: ToolOutputMode): void {
  const shared = store();
  shared.state = { mode: next, generation: shared.state.generation + 1 };
  shared.listeners.forEach((fn) => fn());
}

/** The flip the toggle makes: expanded goes to collapsed; anything else goes to expanded. */
export function toggleToolOutputMode(): ToolOutputMode {
  const next: ToolOutputMode = store().state.mode === "expanded" ? "collapsed" : "expanded";
  setToolOutputMode(next);
  return next;
}

export function subscribeToolOutputMode(fn: () => void): () => void {
  const shared = store();
  shared.listeners.add(fn);
  return () => { shared.listeners.delete(fn); };
}

/** Whether a card is open, absent a click since the last flip. */
export function defaultOpen(mode: ToolOutputMode, toolRunning: boolean): boolean {
  if (mode === "expanded") return true;
  if (mode === "collapsed") return false;
  return toolRunning;
}
