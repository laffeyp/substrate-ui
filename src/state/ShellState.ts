// src/state/ShellState.ts — the shell's canonical state shape.
// Grows sprint-by-sprint. Sprint 002 plants windows + panes + focus.

// Canonical enums live in observability/reasons.ts (they read from
// signals/*.json). Re-exported here for the callers already importing from
// ShellState — no drift.
export { PaneStatus, WorkspaceShape, isPaneStatus, isWorkspaceShape,
  StreamLevel, StreamDir, isStreamLevel, isStreamDir,
  RevealFocus, isRevealFocus,
  SurfaceKind, isSurfaceKind, SURFACE_KIND_BYTES,
  StudioView, isStudioView,
  FindScope, isFindScope } from "@/observability/reasons";
import type { PaneStatus, WorkspaceShape, StreamLevel, StreamDir, RevealFocus, SurfaceKind, StudioView, FindScope, ParkReason } from "@/observability/reasons";

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
  park_reason?: ParkReason | null;
  end_reason?: string | null;
  tokens_before?: number | null;
  tokens_after?: number | null;
  compact_strategy?: string | null;
  retry_index?: number | null;
  retry_max?: number | null;
  retry_after_seconds?: number | null;
  // ToolCall specialization (Sprint 020) — the delegate row branch reads
  // these when kind === "ToolCall" && tool_name === "delegate".
  tool_name?: string | null;
  tool_call_id?: string | null;
  // Sprint 023 — a ToolResult's ok flag + error text. The reducer reads
  // these on ToolResult(tool="delegate") arrivals to pick the correct
  // Layer 5 terminal: DELEGATE_DEPTH_CAP_REFUSED when the error names
  // the max-depth guard, DELEGATE_CALL_FOLDED otherwise.
  tool_ok?: boolean | null;
  tool_error?: string | null;
  // Sprint 021 — delegate expand. The bridge pairs a ToolResult's
  // output.child_root with the parent ToolCall by call_id and attaches
  // it here so the shell can load the child transcript when the user
  // clicks the ↳ handle.
  child_record_root?: string | null;
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
  streamLevel: StreamLevel;          // Sprint 018 — all: every producer; app: filter framework noise
  streamDir: StreamDir;              // Sprint 018 — down: parent→child temporal; side: peer structural
  revealFocus: RevealFocus;          // Sprint 019 — Tab toggles focus between transcript half and stream half
  // Sprint 021 — delegate expand state. Key = tool_call_id; value =
  // the child transcript rows loaded from child_record_root. Key
  // present ⇒ expanded (even if the row list is still loading and
  // hence empty). Key absent ⇒ collapsed.
  delegateExpansions: Record<string, TranscriptRow[]>;
  // Sprint 022 — descent stack. Empty at base (depth 0). Each entry
  // holds the child record root the pane rebinds to and the rows
  // loaded for that record. Layer 5 caps depth at 2 (delegate.py
  // max_depth); the reducer refuses a third push.
  descentStack: Array<{ toolCallId: string; childRecordRoot: string; rows: TranscriptRow[] }>;
  // Sprint 023 — depth-cap refusal. Tool-call ids whose descent attempt
  // was refused because the stack was already at DESCENT_MAX_DEPTH. The
  // delegate row for each id renders a "refused (depth cap 2)" affordance.
  refusedToolCallIds: Set<string>;
  // Sprint 023 — fan-out expand state. Key = the leader tool_call_id
  // of a fan-out batch (the first delegate ToolCall in a run of >= 2
  // adjacent delegate calls at the same step). Value carries the
  // walked cursor within the sibling list. Absent ⇒ folded.
  fanoutExpansions: Record<string, { walkedIndex: number }>;
  // Sprint 024 — inspector surface. Layer 5 mutex says at most one
  // surface open per pane (Sprint 025+ will add records/assay/studio
  // into the same slot). null ⇒ closed. Number ⇒ envelope seq the
  // inspector currently displays. Same-click on the source row closes
  // it (D22): the reducer sees the incoming seq equal the current one
  // and fires INSPECTOR_CLOSED.
  inspectorSeq: number | null;
  // Sprint 025 — pane-scoped summoned surface (records/studio/assay).
  // Layer 5 mutex: opening a new surface while one is already open
  // fires SURFACE_CLOSED{kind: prior} then SURFACE_OPENED{kind: new,
  // prior_kind: prior} same-step. Distinct from the inspector slot —
  // both may sit open on the same pane simultaneously.
  surface: { kind: SurfaceKind } | null;
  // Sprint 027 — Studio state. Only meaningful when
  // surface.kind === SurfaceKind.STUDIO. Layer 2 constrains the
  // studio view enum to {form, canvas}; anything else stays local
  // to the form editor (topo_name draft, counts) with no signal.
  studioView: StudioView;
  studioDraft: {
    topoName: string;
    producerCount: number;
    viewCount: number;
    triggerCount: number;
    routeCount: number;
  };
  // Sprint 028 — find bar. `q` is state-local, never emitted (Layer 2
  // ships q_length + count only, per the ratified privacy contract).
  // scope tracks the FIND_OPENED enum; count and activeIndex feed
  // Sprint 029's silent walk. `open === false` clears the row-level
  // highlight; `q === ""` renders the bar empty with no matches.
  find: {
    open: boolean;
    scope: FindScope;
    q: string;
    count: number;
    activeIndex: number;
  };
  // Sprint 030 — slash router. Opens on a prompt draft that begins
  // with "/". The `index` walks the ratified command list. Layer 2's
  // SLASH_ROUTER_WALKED carries {from_index, to_index} — the reducer
  // holds `index` state, WALKED payloads derive from adjacent values.
  slashRouter: { open: boolean; index: number };
  // Sprint 031 — driver chip + driver popover state. `driver` is the
  // pane's currently bound driver name (populated on SESSION_CREATE_OK
  // and SESSION_RESUME_OK). `driverPopover` holds the popover's mount
  // state and the walked cursor while it is open.
  driver: string | null;
  driverPopover: { open: boolean; options: readonly string[]; index: number };
  // Later sprints extend: surface (records/assay/studio),
  // find, header_popover, etc.
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
