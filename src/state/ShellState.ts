// src/state/ShellState.ts — the shell's canonical state shape.
// Grows sprint-by-sprint. Sprint 002 plants windows + panes + focus.

// Canonical enums live in observability/reasons.ts (they read from
// signals/*.json). Re-exported here for the callers already importing from
// ShellState — no drift.
export { PaneStatus, WorkspaceShape, isPaneStatus, isWorkspaceShape } from "@/observability/reasons";
import type { PaneStatus, WorkspaceShape } from "@/observability/reasons";

export type Lens = "stream+graph" | "i/o" | "structure" | "scene";
export const LENSES: readonly Lens[] = ["stream+graph", "i/o", "structure", "scene"] as const;
export const Lens = {
  STREAM_GRAPH: "stream+graph", IO: "i/o", STRUCTURE: "structure", SCENE: "scene",
} as const satisfies Record<string, Lens>;

export interface TranscriptRow {
  seq: number;
  kind: string;
  producer_kind: string;
  summary: string;
  turn_index: number | null;
  // Kind-specific fields populated by the bridge from the envelope payload:
  park_reason?: "final_answer" | "model_error" | "interrupt" | null;
  end_reason?: string | null;
  tokens_before?: number | null;
  tokens_after?: number | null;
  compact_strategy?: string | null;
  retry_index?: number | null;
  retry_max?: number | null;
  retry_after_seconds?: number | null;
}

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
  promptDraft: string;              // never emitted; text_length is (privacy)
  transcriptRows: TranscriptRow[];
  transcriptLastSeq: number;        // highest envelope seq the shell has rendered
  reveal: "terminal" | "reveal";    // Sprint 016 — Layer 5 mutex: at most one open reveal-instance per pane
  lens: Lens;                        // Sprint 017 — current lens inside RevealShell
  // Later sprints extend: lens, reveal, surface, find, header_popover, etc.
}

export interface Split {
  id: string;                       // uuid4 hex 12-char
  axis: "row" | "col";              // row = side-by-side (splits width); col = stacked (splits height); mirrors Axis in ./SplitTree — declared inline to avoid the ShellState↔SplitTree circular import
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
