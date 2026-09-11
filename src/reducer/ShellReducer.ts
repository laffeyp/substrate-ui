// src/reducer/ShellReducer.ts — the single reducer over ShellState.
// Pure: (state, action) -> {state, emissions}. Every emit queues here; the
// caller fires them through the Emitter after the reducer returns, so state
// and trace stay in lockstep.

import { emptyShellState, ShellState, Pane, Window, TranscriptRow, Lens, WorkspaceShape, PaneStatus } from "@/state/ShellState";
import { SessionEndReason, ParkReason, isParkReason, SECRET_KEY_PATTERN, isPaneStatus, StreamLevel, StreamDir, RevealFocus } from "@/observability/reasons";
import {
  TOOL_CALL, TOOL_RESULT, TOOL_NAME_DELEGATE,
  PARK, SESSION_ENDED, TRANSCRIPT_COMPACTED, RATE_LIMITED_WAITING,
} from "@/observability/envelope-kinds";
import { newId } from "@/state/ids";
import { splitPane, resizeSplit, atCap, movePane, closePane, Zone, Axis } from "@/state/SplitTree";
import { RevealState } from "@/observability/reasons";

// The reducer's action-type discriminant. Every action's `type` field
// pulls its string from this const object. Value+type enum pattern:
// callers dispatch via ActionType.X, case labels are ActionType.X, and
// the TS discriminated union keeps its exhaustiveness check. No raw
// action-type literals live anywhere in the codebase.
export const ActionType = {
  BOOT: "BOOT",
  SPLIT_PANE: "SPLIT_PANE",
  FOCUS_PANE: "FOCUS_PANE",
  GUTTER_DRAG_START: "GUTTER_DRAG_START",
  GUTTER_DRAG_STOP: "GUTTER_DRAG_STOP",
  DROP_HINT_SHOW: "DROP_HINT_SHOW",
  DROP_HINT_ZONE: "DROP_HINT_ZONE",
  DROP_HINT_HIDE: "DROP_HINT_HIDE",
  MOVE_PANE: "MOVE_PANE",
  CLOSE_PANE: "CLOSE_PANE",
  PICKER_TEXT: "PICKER_TEXT",
  PICKER_WALK: "PICKER_WALK",
  PICKER_COMMIT: "PICKER_COMMIT",
  SESSION_CREATE_START: "SESSION_CREATE_START",
  SESSION_CREATE_OK: "SESSION_CREATE_OK",
  SESSION_CREATE_ERR: "SESSION_CREATE_ERR",
  PROBE_DRIVER_START: "PROBE_DRIVER_START",
  PROBE_DRIVER_OK: "PROBE_DRIVER_OK",
  PROBE_DRIVER_ERR: "PROBE_DRIVER_ERR",
  SESSION_RESUME_START: "SESSION_RESUME_START",
  SESSION_RESUME_OK: "SESSION_RESUME_OK",
  SESSION_RESUME_ERR: "SESSION_RESUME_ERR",
  SESSION_END_START: "SESSION_END_START",
  SESSION_END_OK: "SESSION_END_OK",
  SESSION_END_ERR: "SESSION_END_ERR",
  PROMPT_TEXT: "PROMPT_TEXT",
  PROMPT_LENGTH_CHANGED: "PROMPT_LENGTH_CHANGED",
  TURN_SUBMIT_START: "TURN_SUBMIT_START",
  TURN_SUBMIT_OK: "TURN_SUBMIT_OK",
  TURN_SUBMIT_ERR: "TURN_SUBMIT_ERR",
  TRANSCRIPT_ROWS_LOADED: "TRANSCRIPT_ROWS_LOADED",
  REVEAL_TOGGLE: "REVEAL_TOGGLE",
  LENS_SWITCH: "LENS_SWITCH",
  STREAM_LEVEL_TOGGLE: "STREAM_LEVEL_TOGGLE",
  STREAM_DIR_TOGGLE: "STREAM_DIR_TOGGLE",
  REVEAL_FOCUS_TOGGLE: "REVEAL_FOCUS_TOGGLE",
  DELEGATE_EXPAND_START: "DELEGATE_EXPAND_START",
  DELEGATE_EXPAND_ROWS_LOADED: "DELEGATE_EXPAND_ROWS_LOADED",
  DELEGATE_COLLAPSE: "DELEGATE_COLLAPSE",
  DESCENT_ENTER: "DESCENT_ENTER",
  DESCENT_ROWS_LOADED: "DESCENT_ROWS_LOADED",
  DESCENT_EXIT: "DESCENT_EXIT",
  FANOUT_EXPAND: "FANOUT_EXPAND",
  FANOUT_WALK: "FANOUT_WALK",
  FANOUT_COLLAPSE: "FANOUT_COLLAPSE",
} as const;
export type ActionTypeT = typeof ActionType[keyof typeof ActionType];

// The CloseReason literal is scoped small enough to inline in
// CLOSE_PANE's `reason?` field, but the value itself lives here so
// the reducer never compares against a raw string.
export const CloseReason = { USER: "user" } as const;
export type CloseReasonT = typeof CloseReason[keyof typeof CloseReason];

// Session-end initiators.
export const EndSource = { MENU: "menu", SLASH: "slash", SHORTCUT: "shortcut" } as const;
export type EndSourceT = typeof EndSource[keyof typeof EndSource];

export type Action =
  | { type: typeof ActionType.BOOT }
  | { type: typeof ActionType.SPLIT_PANE; paneId: string; axis: Axis }
  | { type: typeof ActionType.FOCUS_PANE; paneId: string }
  | { type: typeof ActionType.GUTTER_DRAG_START; splitId: string }
  | { type: typeof ActionType.GUTTER_DRAG_STOP; splitId: string; ratio: number }
  | { type: typeof ActionType.DROP_HINT_SHOW; sourceId: string; targetId: string; zone: Zone }
  | { type: typeof ActionType.DROP_HINT_ZONE; sourceId: string; targetId: string; fromZone: Zone; toZone: Zone }
  | { type: typeof ActionType.DROP_HINT_HIDE; sourceId: string; targetId: string | null }
  | { type: typeof ActionType.MOVE_PANE; sourceId: string; targetId: string; zone: Zone }
  | { type: typeof ActionType.CLOSE_PANE; paneId: string; reason?: CloseReasonT }
  | { type: typeof ActionType.PICKER_TEXT; paneId: string; text: string }
  | { type: typeof ActionType.PICKER_WALK; paneId: string; index: number; path: string; shape: WorkspaceShape }
  | { type: typeof ActionType.PICKER_COMMIT; paneId: string; path: string; shape: WorkspaceShape }
  | { type: typeof ActionType.SESSION_CREATE_START; paneId: string; requestId: string; sessionId: string; sessionName: string; driver: string }
  | { type: typeof ActionType.SESSION_CREATE_OK; paneId: string; requestId: string; sessionId: string; sessionName: string; driver: string; workspacePath: string; workspaceShape: WorkspaceShape }
  | { type: typeof ActionType.SESSION_CREATE_ERR; paneId: string; requestId: string; reason: string }
  | { type: typeof ActionType.PROBE_DRIVER_START; paneId: string; requestId: string; driverName: string; driverParams: Record<string, unknown> }
  | { type: typeof ActionType.PROBE_DRIVER_OK; requestId: string; driverName: string; contextTokens: number | null; modelFamilies: string[] }
  | { type: typeof ActionType.PROBE_DRIVER_ERR; requestId: string; driverName: string; reason: string }
  | { type: typeof ActionType.SESSION_RESUME_START; paneId: string; requestId: string; sessionId: string }
  | { type: typeof ActionType.SESSION_RESUME_OK; paneId: string; requestId: string; sessionId: string; sessionName: string | null; workspacePath: string; workspaceShape: WorkspaceShape; status: PaneStatus; lastTurnIndex: number }
  | { type: typeof ActionType.SESSION_RESUME_ERR; paneId: string; requestId: string; reason: string }
  | { type: typeof ActionType.SESSION_END_START; paneId: string; requestId: string; sessionId: string; source: EndSourceT }
  | { type: typeof ActionType.SESSION_END_OK; paneId: string; requestId: string; sessionId: string; endReason: string; recordFinalised: boolean; envelopeSeq: number }
  | { type: typeof ActionType.SESSION_END_ERR; paneId: string; requestId: string; reason: string }
  | { type: typeof ActionType.PROMPT_TEXT; paneId: string; text: string }
  | { type: typeof ActionType.PROMPT_LENGTH_CHANGED; paneId: string; length: number }
  | { type: typeof ActionType.TURN_SUBMIT_START; paneId: string; requestId: string; sessionId: string; textLength: number; timeoutSeconds: number }
  | { type: typeof ActionType.TURN_SUBMIT_OK; paneId: string; requestId: string; sessionId: string; turnIndex: number }
  | { type: typeof ActionType.TURN_SUBMIT_ERR; paneId: string; requestId: string; sessionId: string; reason: string }
  | { type: typeof ActionType.TRANSCRIPT_ROWS_LOADED; paneId: string; rows: TranscriptRow[] }
  | { type: typeof ActionType.REVEAL_TOGGLE; paneId: string }
  | { type: typeof ActionType.LENS_SWITCH; paneId: string; to: Lens }
  | { type: typeof ActionType.STREAM_LEVEL_TOGGLE; paneId: string }
  | { type: typeof ActionType.STREAM_DIR_TOGGLE; paneId: string }
  | { type: typeof ActionType.REVEAL_FOCUS_TOGGLE; paneId: string }
  | { type: typeof ActionType.DELEGATE_EXPAND_START; paneId: string; toolCallId: string; childRecordRoot: string }
  | { type: typeof ActionType.DELEGATE_EXPAND_ROWS_LOADED; paneId: string; toolCallId: string; rows: TranscriptRow[] }
  | { type: typeof ActionType.DELEGATE_COLLAPSE; paneId: string; toolCallId: string; childRecordRoot: string }
  | { type: typeof ActionType.DESCENT_ENTER; paneId: string; toolCallId: string; childRecordRoot: string }
  | { type: typeof ActionType.DESCENT_ROWS_LOADED; paneId: string; depth: number; rows: TranscriptRow[] }
  | { type: typeof ActionType.DESCENT_EXIT; paneId: string }
  | { type: typeof ActionType.FANOUT_EXPAND; paneId: string; leaderToolCallId: string }
  | { type: typeof ActionType.FANOUT_WALK; paneId: string; leaderToolCallId: string; toIndex: number; siblingCount: number }
  | { type: typeof ActionType.FANOUT_COLLAPSE; paneId: string; leaderToolCallId: string }
  ;

// Layer 5 (delegate.py:353) caps descent at depth 2. The reducer
// refuses a third push; Sprint 023 wires the DELEGATE_DEPTH_CAP_REFUSED
// signal at the refusal site.
export const DESCENT_MAX_DEPTH = 2 as const;

// Sprint 023 — fan-out detection. A run of >= 2 consecutive delegate
// ToolCall envelopes at the same step forms a fan-out batch. The first
// sibling is the batch's leader (owns the tool_call_id used by
// TRANSCRIPT_FANOUT_LINE_RENDERED). Returns an array of {leaderSeq,
// leaderToolCallId, siblingSeqs, siblingToolCallIds}.
export interface FanoutGroup {
  leaderSeq: number;
  leaderToolCallId: string;
  siblingSeqs: number[];
  siblingToolCallIds: string[];
}
export function detectFanoutGroups(rows: readonly TranscriptRow[]): FanoutGroup[] {
  const groups: FanoutGroup[] = [];
  let i = 0;
  const isDelegate = (r: TranscriptRow): boolean =>
    r.kind === TOOL_CALL && r.tool_name === TOOL_NAME_DELEGATE && !!r.tool_call_id;
  while (i < rows.length) {
    if (!isDelegate(rows[i])) { i++; continue; }
    let j = i + 1;
    while (j < rows.length && isDelegate(rows[j])) j++;
    if (j - i >= 2) {
      const siblingSeqs: number[] = [];
      const siblingToolCallIds: string[] = [];
      for (let k = i; k < j; k++) {
        siblingSeqs.push(rows[k].seq);
        siblingToolCallIds.push(rows[k].tool_call_id!);
      }
      groups.push({
        leaderSeq: rows[i].seq,
        leaderToolCallId: rows[i].tool_call_id!,
        siblingSeqs,
        siblingToolCallIds,
      });
    }
    i = j;
  }
  return groups;
}

export interface Emission {
  kind: string;
  payload: Record<string, unknown>;
}

export interface Step {
  state: ShellState;
  emissions: Emission[];
}

export function initial(): ShellState {
  return emptyShellState();
}

export function reduce(state: ShellState, action: Action): Step {
  switch (action.type) {
    case ActionType.BOOT:              return boot();
    case ActionType.SPLIT_PANE:        return doSplit(state, action.paneId, action.axis);
    case ActionType.FOCUS_PANE:        return doFocus(state, action.paneId);
    case ActionType.GUTTER_DRAG_START: return doGutterStart(state, action.splitId);
    case ActionType.GUTTER_DRAG_STOP:  return doGutterStop(state, action.splitId, action.ratio);
    case ActionType.DROP_HINT_SHOW:    return doDropShow(state, action.sourceId, action.targetId, action.zone);
    case ActionType.DROP_HINT_ZONE:    return doDropZone(state, action.sourceId, action.targetId, action.fromZone, action.toZone);
    case ActionType.DROP_HINT_HIDE:    return doDropHide(state, action.sourceId, action.targetId);
    case ActionType.MOVE_PANE:         return doMove(state, action.sourceId, action.targetId, action.zone);
    case ActionType.CLOSE_PANE:        return doClose(state, action.paneId, action.reason ?? CloseReason.USER);
    case ActionType.PICKER_TEXT:       return doPickerText(state, action.paneId, action.text);
    case ActionType.PICKER_WALK:       return doPickerWalk(state, action.paneId, action.index, action.path, action.shape);
    case ActionType.PICKER_COMMIT:     return doPickerCommit(state, action.paneId, action.path, action.shape);
    case ActionType.SESSION_CREATE_START:
      return doSessionCreateStart(state, action);
    case ActionType.SESSION_CREATE_OK:
      return doSessionCreateOk(state, action);
    case ActionType.SESSION_CREATE_ERR:
      return doSessionCreateErr(state, action);
    case ActionType.PROBE_DRIVER_START:
      // driver_params gets secret-stripped for logging separately from the wire payload,
      // which Layer 2 requires be exactly {request_id, driver}.
      void stripSecrets(action.driverParams);
      return { state, emissions: [{ kind: "PROBE_DRIVER_REQUESTED", payload: {
        request_id: action.requestId, driver: action.driverName,
      }}]};
    case ActionType.PROBE_DRIVER_OK:
      return { state, emissions: [{ kind: "PROBE_DRIVER_PROBED", payload: {
        request_id: action.requestId, driver: action.driverName, context_tokens: action.contextTokens,
      }}]};
    case ActionType.PROBE_DRIVER_ERR:
      return { state, emissions: [{ kind: "PROBE_DRIVER_FAILED", payload: {
        request_id: action.requestId, driver: action.driverName, reason: action.reason,
      }}]};
    case ActionType.SESSION_RESUME_START:
      return doResumeStart(state, action);
    case ActionType.SESSION_RESUME_OK:
      return doResumeOk(state, action);
    case ActionType.SESSION_RESUME_ERR:
      return doResumeErr(state, action);
    case ActionType.SESSION_END_START:
      return doEndStart(state, action);
    case ActionType.SESSION_END_OK:
      return doEndOk(state, action);
    case ActionType.SESSION_END_ERR:
      return doEndErr(state, action);
    case ActionType.PROMPT_TEXT: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, promptDraft: action.text } } },
        emissions: [], // Private — draft never appears in the trace.
      };
    }
    case ActionType.PROMPT_LENGTH_CHANGED:
      return {
        state,
        emissions: [{ kind: "PROMPT_CHANGED", payload: { pane_id: action.paneId, length: action.length } }],
      };
    case ActionType.TURN_SUBMIT_START: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      return {
        state: {
          ...state,
          panes: { ...state.panes, [action.paneId]: { ...pane, promptDraft: "", status: PaneStatus.RUNNING } },
        },
        emissions: [
          { kind: "PROMPT_SUBMITTED", payload: { pane_id: action.paneId, text_length: action.textLength } },
          { kind: "TURN_SUBMIT_REQUESTED", payload: {
            request_id: action.requestId, pane_id: action.paneId, session_id: action.sessionId,
            text_length: action.textLength, timeout_seconds: action.timeoutSeconds,
          }},
        ],
      };
    }
    case ActionType.TURN_SUBMIT_OK: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, status: PaneStatus.PARKED } } },
        emissions: [{ kind: "TURN_SUBMITTED", payload: {
          request_id: action.requestId, session_id: action.sessionId, turn_index: action.turnIndex,
        }}],
      };
    }
    case ActionType.LENS_SWITCH: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (pane.lens === action.to) return { state, emissions: [] };
      const from = pane.lens;
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, lens: action.to } } },
        emissions: [{ kind: "LENS_SWITCHED", payload: { pane_id: action.paneId, from, to: action.to } }],
      };
    }
    case ActionType.REVEAL_TOGGLE: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      const from = pane.reveal;
      const to: RevealState = from === RevealState.TERMINAL ? RevealState.REVEAL : RevealState.TERMINAL;
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, reveal: to } } },
        emissions: [{ kind: "REVEAL_TOGGLED", payload: { pane_id: action.paneId, from, to } }],
      };
    }
    case ActionType.STREAM_LEVEL_TOGGLE: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      const from = pane.streamLevel;
      const to = from === StreamLevel.ALL ? StreamLevel.APP : StreamLevel.ALL;
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, streamLevel: to } } },
        emissions: [{ kind: "STREAM_LEVEL_TOGGLED", payload: { pane_id: action.paneId, from, to } }],
      };
    }
    case ActionType.STREAM_DIR_TOGGLE: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      const from = pane.streamDir;
      const to = from === StreamDir.DOWN ? StreamDir.SIDE : StreamDir.DOWN;
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, streamDir: to } } },
        emissions: [{ kind: "STREAM_DIR_TOGGLED", payload: { pane_id: action.paneId, from, to } }],
      };
    }
    case ActionType.REVEAL_FOCUS_TOGGLE: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      const from = pane.revealFocus;
      const to = from === RevealFocus.TRANSCRIPT ? RevealFocus.STREAM : RevealFocus.TRANSCRIPT;
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, revealFocus: to } } },
        emissions: [{ kind: "REVEAL_FOCUS_MOVED", payload: { pane_id: action.paneId, from, to } }],
      };
    }
    case ActionType.DELEGATE_EXPAND_START: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (action.toolCallId in pane.delegateExpansions) return { state, emissions: [] };
      return {
        state: {
          ...state,
          panes: {
            ...state.panes,
            [action.paneId]: {
              ...pane,
              delegateExpansions: { ...pane.delegateExpansions, [action.toolCallId]: [] },
            },
          },
        },
        emissions: [{ kind: "DELEGATE_INLINE_EXPANDED", payload: {
          pane_id: action.paneId, tool_call_id: action.toolCallId,
        }}],
      };
    }
    case ActionType.DELEGATE_EXPAND_ROWS_LOADED: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (!(action.toolCallId in pane.delegateExpansions)) return { state, emissions: [] };
      return {
        state: {
          ...state,
          panes: {
            ...state.panes,
            [action.paneId]: {
              ...pane,
              delegateExpansions: {
                ...pane.delegateExpansions,
                [action.toolCallId]: action.rows,
              },
            },
          },
        },
        emissions: [],
      };
    }
    case ActionType.DELEGATE_COLLAPSE: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (!(action.toolCallId in pane.delegateExpansions)) return { state, emissions: [] };
      const next = { ...pane.delegateExpansions };
      delete next[action.toolCallId];
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, delegateExpansions: next } } },
        emissions: [{ kind: "DELEGATE_INLINE_COLLAPSED", payload: {
          pane_id: action.paneId, tool_call_id: action.toolCallId,
        }}],
      };
    }
    case ActionType.DESCENT_ENTER: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (pane.descentStack.length >= DESCENT_MAX_DEPTH) {
        // Sprint 023 — depth cap refusal. Layer 2 pins depth to 2
        // (const). Same-step Layer-5 companion when the refusal is
        // triggered by an at-cap descent attempt. The pane records
        // the refused tool_call_id so the row renders its refusal
        // affordance ("delegate refused (depth cap 2)") on next paint.
        const refused = new Set(pane.refusedToolCallIds);
        refused.add(action.toolCallId);
        return {
          state: { ...state, panes: { ...state.panes, [action.paneId]: {
            ...pane, refusedToolCallIds: refused,
          } } },
          emissions: [{ kind: "DELEGATE_DEPTH_CAP_REFUSED", payload: {
            pane_id: action.paneId, tool_call_id: action.toolCallId, depth: DESCENT_MAX_DEPTH,
          }}],
        };
      }
      const nextStack = [
        ...pane.descentStack,
        { toolCallId: action.toolCallId, childRecordRoot: action.childRecordRoot, rows: [] },
      ];
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, descentStack: nextStack } } },
        emissions: [{ kind: "DESCENT_ENTERED", payload: {
          pane_id: action.paneId,
          child_record_root: action.childRecordRoot,
          depth: nextStack.length,
        }}],
      };
    }
    case ActionType.DESCENT_ROWS_LOADED: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (action.depth < 1 || action.depth > pane.descentStack.length) return { state, emissions: [] };
      const nextStack = pane.descentStack.map((frame, i) =>
        i === action.depth - 1 ? { ...frame, rows: action.rows } : frame,
      );
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, descentStack: nextStack } } },
        emissions: [],
      };
    }
    case ActionType.DESCENT_EXIT: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (pane.descentStack.length === 0) return { state, emissions: [] };
      const nextStack = pane.descentStack.slice(0, -1);
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, descentStack: nextStack } } },
        emissions: [{ kind: "DESCENT_EXITED", payload: {
          pane_id: action.paneId, to_depth: nextStack.length,
        }}],
      };
    }
    case ActionType.FANOUT_EXPAND: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (action.leaderToolCallId in pane.fanoutExpansions) return { state, emissions: [] };
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: {
          ...pane,
          fanoutExpansions: { ...pane.fanoutExpansions,
            [action.leaderToolCallId]: { walkedIndex: 0 } },
        } } },
        emissions: [{ kind: "FAN_OUT_INLINE_EXPANDED", payload: {
          pane_id: action.paneId, tool_call_id: action.leaderToolCallId,
        }}],
      };
    }
    case ActionType.FANOUT_WALK: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      const cur = pane.fanoutExpansions[action.leaderToolCallId];
      if (!cur) return { state, emissions: [] };
      const clamped = ((action.toIndex % action.siblingCount) + action.siblingCount) % action.siblingCount;
      if (clamped === cur.walkedIndex) return { state, emissions: [] };
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: {
          ...pane,
          fanoutExpansions: { ...pane.fanoutExpansions,
            [action.leaderToolCallId]: { walkedIndex: clamped } },
        } } },
        emissions: [{ kind: "FAN_OUT_INLINE_WALKED", payload: {
          pane_id: action.paneId, tool_call_id: action.leaderToolCallId,
          from_index: cur.walkedIndex, to_index: clamped,
        }}],
      };
    }
    case ActionType.FANOUT_COLLAPSE: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      if (!(action.leaderToolCallId in pane.fanoutExpansions)) return { state, emissions: [] };
      const next = { ...pane.fanoutExpansions };
      delete next[action.leaderToolCallId];
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, fanoutExpansions: next } } },
        emissions: [{ kind: "FAN_OUT_INLINE_COLLAPSED", payload: {
          pane_id: action.paneId, tool_call_id: action.leaderToolCallId,
        }}],
      };
    }
    case ActionType.TRANSCRIPT_ROWS_LOADED: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      const newRows = action.rows.filter((r) => r.seq > pane.transcriptLastSeq);
      if (newRows.length === 0) return { state, emissions: [] };
      const emissions: Emission[] = [];
      let maxSeq = pane.transcriptLastSeq;
      // Sprint 023 — fan-out detection over the whole loaded set.
      // Emits TRANSCRIPT_FANOUT_LINE_RENDERED once per group of >= 2
      // adjacent delegate ToolCalls; the individual delegate emits
      // for each sibling still fire below.
      const fanoutGroups = detectFanoutGroups(action.rows);
      const inFanoutGroup = new Set<number>();
      for (const g of fanoutGroups) for (const seq of g.siblingSeqs) inFanoutGroup.add(seq);
      for (const r of newRows) {
        if (r.kind === PARK) {
          const parkReason: ParkReason = isParkReason(r.park_reason)
            ? r.park_reason : ParkReason.FINAL_ANSWER;
          emissions.push({ kind: "TRANSCRIPT_PARK_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq, park_reason: parkReason,
          }});
        } else if (r.kind === SESSION_ENDED) {
          emissions.push({ kind: "TRANSCRIPT_SESSION_ENDED_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq,
            end_reason: r.end_reason || SessionEndReason.USER_END,
          }});
        } else if (r.kind === TRANSCRIPT_COMPACTED) {
          emissions.push({ kind: "TRANSCRIPT_COMPACTED_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq,
            tokens_before: r.tokens_before ?? 0,
            tokens_after: r.tokens_after ?? 0,
            strategy: r.compact_strategy ?? "unknown",
          }});
        } else if (r.kind === RATE_LIMITED_WAITING) {
          emissions.push({ kind: "TRANSCRIPT_RATE_LIMITED_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq,
            retry_index: r.retry_index ?? 0,
            retry_max: r.retry_max ?? 0,
            retry_after_seconds: r.retry_after_seconds ?? 0,
          }});
        } else if (r.kind === TOOL_CALL && r.tool_name === TOOL_NAME_DELEGATE && r.tool_call_id) {
          // Sprint 020 — delegate specialization. Depth in the current
          // pane's own record is always 1 (a nested delegate lives in a
          // child session's record, walked when that pane reveals).
          // Same-step pair per Layer 4: DELEGATE_CALL_RENDERED fires
          // with the semantic payload; TRANSCRIPT_DELEGATE_LINE_RENDERED
          // fires with the envelope anchor.
          emissions.push({ kind: "DELEGATE_CALL_RENDERED", payload: {
            pane_id: action.paneId, tool_call_id: r.tool_call_id, depth: 1,
          }});
          emissions.push({ kind: "TRANSCRIPT_DELEGATE_LINE_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq, tool_call_id: r.tool_call_id,
          }});
        } else if (r.kind === TOOL_RESULT && r.tool_name === TOOL_NAME_DELEGATE && r.tool_call_id && r.child_record_root) {
          // Sprint 021 — automatic fold. Layer 5 terminal for the
          // delegate_flow: the parent's turn resumes past the delegate
          // when its ToolResult arrives, so the whole flow ends here.
          // Distinct from an INLINE_COLLAPSED emitted by a manual fold
          // click (which does not terminate the flow — the flow was
          // already folded automatically when the ToolResult landed).
          emissions.push({ kind: "DELEGATE_CALL_FOLDED", payload: {
            pane_id: action.paneId, tool_call_id: r.tool_call_id,
            child_record_root: r.child_record_root,
          }});
        } else {
          emissions.push({ kind: "TRANSCRIPT_ROW_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq,
            envelope_kind: r.kind, envelope_producer_kind: r.producer_kind,
          }});
        }
        if (r.seq > maxSeq) maxSeq = r.seq;
      }
      // Same-step fan-out line — one per group leader.
      for (const g of fanoutGroups) {
        emissions.push({ kind: "TRANSCRIPT_FANOUT_LINE_RENDERED", payload: {
          pane_id: action.paneId,
          envelope_seq: g.leaderSeq,
          tool_call_id: g.leaderToolCallId,
          children_count: g.siblingToolCallIds.length,
        }});
      }
      return {
        state: {
          ...state,
          panes: {
            ...state.panes,
            [action.paneId]: {
              ...pane,
              transcriptRows: [...pane.transcriptRows, ...newRows],
              transcriptLastSeq: maxSeq,
            },
          },
        },
        emissions,
      };
    }
    case ActionType.TURN_SUBMIT_ERR: {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      // Restore parked status; the turn didn't take.
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, status: PaneStatus.PARKED } } },
        emissions: [{ kind: "TURN_SUBMIT_FAILED", payload: {
          request_id: action.requestId, session_id: action.sessionId, reason: action.reason,
        }}],
      };
    }
  }
}

function doEndStart(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_END_START }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || !pane.boundSessionId) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: { ...pane, creating: a.requestId } } },
    emissions: [{ kind: "SESSION_END_REQUESTED", payload: {
      request_id: a.requestId, session_id: a.sessionId, source: a.source,
    }}],
  };
}

function doEndOk(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_END_OK }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  const nextPane: Pane = {
    ...pane, creating: null,
    boundSessionId: null, sessionName: null,
    workspacePath: null, workspaceShape: null,
    status: PaneStatus.UNBOUND,
    pickerText: "", pickerIndex: -1, pickerSelection: null,
  };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: nextPane } },
    emissions: [
      { kind: "SESSION_ENDED_ACK", payload: {
        request_id: a.requestId, session_id: a.sessionId,
        end_reason: a.endReason, record_finalised: a.recordFinalised,
      }},
      { kind: "TRANSCRIPT_SESSION_ENDED_RENDERED", payload: {
        pane_id: a.paneId, envelope_seq: a.envelopeSeq, end_reason: a.endReason,
      }},
    ],
  };
}

function doEndErr(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_END_ERR }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: { ...pane, creating: null } } },
    emissions: [], // No SESSION_END_FAILED tag in Layer 1 v0.1 — failure surfaces as absent ACK
  };
}

function doResumeStart(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_RESUME_START }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: { ...pane, creating: a.requestId } } },
    emissions: [], // Layer 1 v0.1 has no SESSION_RESUME_REQUESTED tag; the bridge round-trip is silent
  };
}

function doResumeOk(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_RESUME_OK }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  const nextPane: Pane = {
    ...pane, creating: null,
    boundSessionId: a.sessionId, sessionName: a.sessionName,
    workspacePath: a.workspacePath, workspaceShape: a.workspaceShape,
    status: isPaneStatus(a.status) ? a.status : PaneStatus.PARKED,
  };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: nextPane } },
    emissions: [
      { kind: "WORKSPACE_BOUND", payload: {
        request_id: a.requestId, session_id: a.sessionId,
        workspace_path: a.workspacePath, shape: a.workspaceShape,
      }},
      { kind: "PANE_UNBOUND_BOUND", payload: {
        pane_id: a.paneId, session_id: a.sessionId,
        workspace_path: a.workspacePath, shape: a.workspaceShape,
      }},
      ...(a.lastTurnIndex < 0
        ? [{ kind: "TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED", payload: {
            pane_id: a.paneId, session_id: a.sessionId,
          }}]
        : []),
    ],
  };
}

function doResumeErr(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_RESUME_ERR }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: { ...pane, creating: null } } },
    emissions: [], // Failure surfaces as UI banner; no tag in Layer 1 v0.1 for resume_failed
  };
}

function stripSecrets(obj: unknown): unknown {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = SECRET_KEY_PATTERN.test(k) ? "<stripped>" : stripSecrets(v);
    }
    return out;
  }
  if (Array.isArray(obj)) return obj.map(stripSecrets);
  return obj;
}

function doSessionCreateStart(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_CREATE_START }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || !pane.pickerSelection) return { state, emissions: [] };
  const { path, shape } = pane.pickerSelection;
  const nextPane: Pane = { ...pane, creating: a.requestId };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: nextPane } },
    emissions: [{ kind: "SESSION_CREATE_REQUESTED", payload: {
      request_id: a.requestId,
      pane_id: a.paneId,
      session_id: a.sessionId,
      name: a.sessionName,
      driver: a.driver,
      workspace_path: path,
      workspace_shape: shape,
      bundle: "",
      seed: "",
    }}],
  };
}

function doSessionCreateOk(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_CREATE_OK }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  const nextPane: Pane = {
    ...pane,
    creating: null,
    boundSessionId: a.sessionId,
    sessionName: a.sessionName,
    workspacePath: a.workspacePath,
    workspaceShape: a.workspaceShape,
    status: PaneStatus.PARKED,
  };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: nextPane } },
    emissions: [
      { kind: "SESSION_CREATED", payload: {
        request_id: a.requestId, session_id: a.sessionId, name: a.sessionName,
        driver: a.driver, workspace: a.workspacePath, workspace_shape: a.workspaceShape,
        status: PaneStatus.RUNNING,
      }},
      { kind: "WORKSPACE_BOUND", payload: {
        request_id: a.requestId, session_id: a.sessionId,
        workspace_path: a.workspacePath, shape: a.workspaceShape,
      }},
      { kind: "PANE_UNBOUND_BOUND", payload: {
        pane_id: a.paneId, session_id: a.sessionId,
        workspace_path: a.workspacePath, shape: a.workspaceShape,
      }},
      { kind: "TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED", payload: {
        pane_id: a.paneId, session_id: a.sessionId,
      }},
    ],
  };
}

function doSessionCreateErr(state: ShellState, a: Extract<Action, { type: typeof ActionType.SESSION_CREATE_ERR }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  const nextPane: Pane = { ...pane, creating: null };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: nextPane } },
    emissions: [{ kind: "SESSION_CREATE_FAILED", payload: {
      request_id: a.requestId, reason: a.reason,
    }}],
  };
}

function doPickerText(state: ShellState, paneId: string, text: string): Step {
  const pane = state.panes[paneId];
  if (!pane) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [paneId]: { ...pane, pickerText: text, pickerIndex: -1 } } },
    emissions: [],
  };
}

function doPickerWalk(state: ShellState, paneId: string, index: number, path: string, shape: WorkspaceShape): Step {
  const pane = state.panes[paneId];
  if (!pane) return { state, emissions: [] };
  return {
    state: {
      ...state,
      panes: {
        ...state.panes,
        [paneId]: { ...pane, pickerIndex: index, pickerText: path, pickerSelection: { path, shape } },
      },
    },
    emissions: [{ kind: "WORKSPACE_PICKER_WALKED", payload: {
      pane_id: paneId, from_index: pane.pickerIndex, to_index: index,
    }}],
  };
}

function doPickerCommit(state: ShellState, paneId: string, path: string, shape: WorkspaceShape): Step {
  const pane = state.panes[paneId];
  if (!pane) return { state, emissions: [] };
  return {
    state: {
      ...state,
      panes: {
        ...state.panes,
        [paneId]: { ...pane, pickerText: path, pickerSelection: { path, shape } },
      },
    },
    emissions: [],
  };
}

function doClose(state: ShellState, paneId: string, reason: CloseReasonT): Step {
  const pane = state.panes[paneId];
  if (!pane) return { state, emissions: [] };
  const windowId = pane.windowId;
  const result = closePane(state, paneId);
  if (!result) return { state, emissions: [] };
  const emissions: Emission[] = [{ kind: "PANE_CLOSED", payload: { pane_id: paneId } }];
  void reason;
  if (result.windowClosed) {
    emissions.push({ kind: "WINDOW_CLOSED", payload: { window_id: windowId }});
  } else if (result.walkedFocusPaneId && result.walkedFocusPaneId !== state.focusedPaneId) {
    emissions.push({ kind: "PANE_FOCUSED", payload: {
      pane_id: result.walkedFocusPaneId,
      prior_pane_id: state.focusedPaneId,
    }});
  }
  return { state: result.state, emissions };
}

function boot(): Step {
  const windowId = newId();
  const paneId = newId();
  const pane: Pane = {
    id: paneId,
    windowId,
    splitParentId: null,
    ratio: 1.0,
    focused: true,
    boundSessionId: null,
    status: PaneStatus.UNBOUND,
    pickerText: "",
    pickerIndex: -1,
    pickerSelection: null,
    creating: null,
    sessionName: null,
    workspacePath: null,
    workspaceShape: null,
    promptDraft: "",
    transcriptRows: [],
    transcriptLastSeq: -1,
    reveal: RevealState.TERMINAL,
    lens: Lens.STREAM_GRAPH,
    streamLevel: StreamLevel.ALL,
    streamDir: StreamDir.DOWN,
    revealFocus: RevealFocus.TRANSCRIPT,
    delegateExpansions: {},
    descentStack: [],
    refusedToolCallIds: new Set(),
    fanoutExpansions: {},
  };
  const window: Window = { id: windowId, rootId: paneId };
  const next: ShellState = {
    windows: { [windowId]: window },
    panes: { [paneId]: pane },
    splits: {},
    windowOrder: [windowId],
    focusedPaneId: paneId,
  };
  return {
    state: next,
    emissions: [
      { kind: "WINDOW_OPENED", payload: { window_id: windowId } },
      { kind: "PANE_CREATED", payload: {
        pane_id: paneId, window_id: windowId, session_id: null, from_split: null,
      }},
      { kind: "PANE_FOCUSED", payload: { pane_id: paneId, prior_pane_id: null } },
    ],
  };
}

function doSplit(state: ShellState, paneId: string, axis: Axis): Step {
  const pane = state.panes[paneId];
  if (!pane) return { state, emissions: [] };
  if (atCap(state, pane.windowId)) return { state, emissions: [] };
  const result = splitPane(state, paneId, axis);
  if (!result) return { state, emissions: [] };
  const priorPaneId = state.focusedPaneId;
  const nextState: ShellState = {
    ...result.state,
    panes: {
      ...result.state.panes,
      [paneId]: { ...result.state.panes[paneId], focused: false },
      [result.newPaneId]: { ...result.state.panes[result.newPaneId], focused: true },
    },
    focusedPaneId: result.newPaneId,
  };
  return {
    state: nextState,
    emissions: [
      { kind: "PANE_SPLIT", payload: {
        from_pane_id: result.parentPaneId, new_pane_id: result.newPaneId, axis,
      }},
      { kind: "PANE_CREATED", payload: {
        pane_id: result.newPaneId, window_id: pane.windowId,
        session_id: null, from_split: result.newSplitId,
      }},
      { kind: "PANE_FOCUSED", payload: {
        pane_id: result.newPaneId, prior_pane_id: priorPaneId,
      }},
    ],
  };
}

function doFocus(state: ShellState, paneId: string): Step {
  if (state.focusedPaneId === paneId) return { state, emissions: [] };
  if (!state.panes[paneId]) return { state, emissions: [] };
  const prior = state.focusedPaneId;
  const panes = { ...state.panes };
  if (prior) panes[prior] = { ...panes[prior], focused: false };
  panes[paneId] = { ...panes[paneId], focused: true };
  return {
    state: { ...state, panes, focusedPaneId: paneId },
    emissions: [{ kind: "PANE_FOCUSED", payload: { pane_id: paneId, prior_pane_id: prior } }],
  };
}

function gutterIndex(splitId: string): number {
  return parseInt(splitId.slice(0, 6), 16);
}

function doGutterStart(state: ShellState, splitId: string): Step {
  const split = state.splits[splitId];
  if (!split) return { state, emissions: [] };
  return {
    state,
    emissions: [{ kind: "GUTTER_DRAG_STARTED", payload: {
      kind: split.axis, gutter_index: gutterIndex(splitId),
    }}],
  };
}

function doDropShow(state: ShellState, sourceId: string, targetId: string, zone: Zone): Step {
  return {
    state,
    emissions: [{ kind: "DROP_HINT_SHOWN", payload: {
      source_pane_id: sourceId, target_pane_id: targetId, zone,
    }}],
  };
}

function doDropZone(state: ShellState, sourceId: string, targetId: string, fromZone: Zone, toZone: Zone): Step {
  return {
    state,
    emissions: [{ kind: "DROP_HINT_ZONE_CHANGED", payload: {
      source_pane_id: sourceId, target_pane_id: targetId, from_zone: fromZone, to_zone: toZone,
    }}],
  };
}

function doDropHide(state: ShellState, sourceId: string, targetId: string | null): Step {
  if (!targetId) return { state, emissions: [] };
  return {
    state,
    emissions: [{ kind: "DROP_HINT_HIDDEN", payload: {
      source_pane_id: sourceId, target_pane_id: targetId,
    }}],
  };
}

function doMove(state: ShellState, sourceId: string, targetId: string, zone: Zone): Step {
  const next = movePane(state, sourceId, targetId, zone);
  if (!next) return { state, emissions: [] };
  return {
    state: next,
    emissions: [{ kind: "PANE_MOVED", payload: {
      a_pane_id: sourceId, b_pane_id: targetId, zone,
    }}],
  };
}

function doGutterStop(state: ShellState, splitId: string, ratio: number): Step {
  const split = state.splits[splitId];
  if (!split) return { state, emissions: [] };
  const startRatio = split.ratio;
  const nextState = resizeSplit(state, splitId, ratio);
  const finalRatio = nextState.splits[splitId].ratio;
  return {
    state: nextState,
    emissions: [{ kind: "GUTTER_DRAG_STOPPED", payload: {
      kind: split.axis, gutter_index: gutterIndex(splitId), delta: finalRatio - startRatio,
    }}],
  };
}
