// src/state/ShellState.ts — the shell's canonical state shape.
// Grows sprint-by-sprint. Sprint 002 plants windows + panes + focus.

export type PaneStatus = "unbound" | "parked" | "running" | "interrupted" | "ended";

export type WorkspaceShape = "flat" | "worktree" | "isolate";

export interface Pane {
  id: string;                       // uuid4 hex 12-char
  windowId: string;
  splitParentId: string | null;
  ratio: number;                    // 0..1 within the parent split
  focused: boolean;
  boundSessionId: string | null;
  status: PaneStatus;
  // Unbound-picker state — Sprint 006 populates; Sprint 007 consumes on commit.
  pickerText: string;
  pickerIndex: number;              // -1 = editing the text input; ≥0 = walking history
  pickerSelection: { path: string; shape: WorkspaceShape } | null;
  creating: string | null;          // request_id of an in-flight SESSION_CREATE
  sessionName: string | null;       // set after SESSION_CREATED
  workspacePath: string | null;
  workspaceShape: WorkspaceShape | null;
  // Later sprints extend: lens, reveal, surface, find, header_popover, etc.
}

export interface Split {
  id: string;                       // uuid4 hex 12-char
  axis: "row" | "col";              // row = side-by-side (splits width); col = stacked (splits height)
  aId: string;                      // child node id (pane or split)
  bId: string;                      // child node id (pane or split)
  ratio: number;                    // 0..1 — fraction the aId child occupies
}

export interface Window {
  id: string;                       // uuid4 hex 12-char
  rootId: string;                   // paneId or splitId
}

export interface ShellState {
  windows: Record<string, Window>;
  panes: Record<string, Pane>;
  splits: Record<string, Split>;
  windowOrder: string[];
  focusedPaneId: string | null;
}

export const emptyShellState = (): ShellState => ({
  windows: {},
  panes: {},
  splits: {},
  windowOrder: [],
  focusedPaneId: null,
});

export function isSplit(state: ShellState, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(state.splits, id);
}

export function paneCount(state: ShellState, windowId: string): number {
  const w = state.windows[windowId];
  if (!w) return 0;
  const walk = (id: string): number => isSplit(state, id)
    ? walk(state.splits[id].aId) + walk(state.splits[id].bId)
    : 1;
  return walk(w.rootId);
}

export const PANE_CAP_PER_WINDOW = 8;
