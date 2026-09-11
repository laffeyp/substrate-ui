// src/reducer/ShellReducer.ts — the single reducer over ShellState.
// Pure: (state, action) -> {state, emissions}. Every emit queues here; the
// caller fires them through the Emitter after the reducer returns, so state
// and trace stay in lockstep.

import { emptyShellState, ShellState, Pane, Window, TranscriptRow } from "@/state/ShellState";
import { newId } from "@/state/ids";
import { splitPane, resizeSplit, atCap, movePane, closePane, Zone } from "@/state/SplitTree";

export type Action =
  | { type: "BOOT" }
  | { type: "SPLIT_PANE"; paneId: string; axis: "row" | "col" }
  | { type: "FOCUS_PANE"; paneId: string }
  | { type: "GUTTER_DRAG_START"; splitId: string }
  | { type: "GUTTER_DRAG_STOP"; splitId: string; ratio: number }
  | { type: "DROP_HINT_SHOW"; sourceId: string; targetId: string; zone: Zone }
  | { type: "DROP_HINT_ZONE"; sourceId: string; targetId: string; fromZone: Zone; toZone: Zone }
  | { type: "DROP_HINT_HIDE"; sourceId: string; targetId: string | null }
  | { type: "MOVE_PANE"; sourceId: string; targetId: string; zone: Zone }
  | { type: "CLOSE_PANE"; paneId: string; reason?: "user" }
  | { type: "PICKER_TEXT"; paneId: string; text: string }
  | { type: "PICKER_WALK"; paneId: string; index: number; path: string; shape: "flat" | "worktree" | "isolate" }
  | { type: "PICKER_COMMIT"; paneId: string; path: string; shape: "flat" | "worktree" | "isolate" }
  | { type: "SESSION_CREATE_START"; paneId: string; requestId: string; sessionId: string; sessionName: string; driver: string }
  | { type: "SESSION_CREATE_OK"; paneId: string; requestId: string; sessionId: string; sessionName: string; driver: string; workspacePath: string; workspaceShape: "flat" | "worktree" | "isolate" }
  | { type: "SESSION_CREATE_ERR"; paneId: string; requestId: string; reason: string }
  | { type: "PROBE_DRIVER_START"; paneId: string; requestId: string; driverName: string; driverParams: Record<string, unknown> }
  | { type: "PROBE_DRIVER_OK"; requestId: string; driverName: string; contextTokens: number | null; modelFamilies: string[] }
  | { type: "PROBE_DRIVER_ERR"; requestId: string; driverName: string; reason: string }
  | { type: "SESSION_RESUME_START"; paneId: string; requestId: string; sessionId: string }
  | { type: "SESSION_RESUME_OK"; paneId: string; requestId: string; sessionId: string; sessionName: string | null; workspacePath: string; workspaceShape: "flat" | "worktree" | "isolate"; status: "unbound" | "parked" | "running" | "interrupted" | "ended"; lastTurnIndex: number }
  | { type: "SESSION_RESUME_ERR"; paneId: string; requestId: string; reason: string }
  | { type: "SESSION_END_START"; paneId: string; requestId: string; sessionId: string; source: "menu" | "slash" | "shortcut" }
  | { type: "SESSION_END_OK"; paneId: string; requestId: string; sessionId: string; endReason: string; recordFinalised: boolean; envelopeSeq: number }
  | { type: "SESSION_END_ERR"; paneId: string; requestId: string; reason: string }
  | { type: "PROMPT_TEXT"; paneId: string; text: string }         // private — no emit
  | { type: "PROMPT_LENGTH_CHANGED"; paneId: string; length: number } // debounced emit
  | { type: "TURN_SUBMIT_START"; paneId: string; requestId: string; sessionId: string; textLength: number; timeoutSeconds: number }
  | { type: "TURN_SUBMIT_OK"; paneId: string; requestId: string; sessionId: string; turnIndex: number }
  | { type: "TURN_SUBMIT_ERR"; paneId: string; requestId: string; sessionId: string; reason: string }
  | { type: "TRANSCRIPT_ROWS_LOADED"; paneId: string; rows: TranscriptRow[] }
  ;

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
    case "BOOT":              return boot();
    case "SPLIT_PANE":        return doSplit(state, action.paneId, action.axis);
    case "FOCUS_PANE":        return doFocus(state, action.paneId);
    case "GUTTER_DRAG_START": return doGutterStart(state, action.splitId);
    case "GUTTER_DRAG_STOP":  return doGutterStop(state, action.splitId, action.ratio);
    case "DROP_HINT_SHOW":    return doDropShow(state, action.sourceId, action.targetId, action.zone);
    case "DROP_HINT_ZONE":    return doDropZone(state, action.sourceId, action.targetId, action.fromZone, action.toZone);
    case "DROP_HINT_HIDE":    return doDropHide(state, action.sourceId, action.targetId);
    case "MOVE_PANE":         return doMove(state, action.sourceId, action.targetId, action.zone);
    case "CLOSE_PANE":        return doClose(state, action.paneId, action.reason ?? "user");
    case "PICKER_TEXT":       return doPickerText(state, action.paneId, action.text);
    case "PICKER_WALK":       return doPickerWalk(state, action.paneId, action.index, action.path, action.shape);
    case "PICKER_COMMIT":     return doPickerCommit(state, action.paneId, action.path, action.shape);
    case "SESSION_CREATE_START":
      return doSessionCreateStart(state, action);
    case "SESSION_CREATE_OK":
      return doSessionCreateOk(state, action);
    case "SESSION_CREATE_ERR":
      return doSessionCreateErr(state, action);
    case "PROBE_DRIVER_START":
      // driver_params gets secret-stripped for logging separately from the wire payload,
      // which Layer 2 requires be exactly {request_id, driver}.
      void stripSecrets(action.driverParams);
      return { state, emissions: [{ kind: "PROBE_DRIVER_REQUESTED", payload: {
        request_id: action.requestId, driver: action.driverName,
      }}]};
    case "PROBE_DRIVER_OK":
      return { state, emissions: [{ kind: "PROBE_DRIVER_PROBED", payload: {
        request_id: action.requestId, driver: action.driverName, context_tokens: action.contextTokens,
      }}]};
    case "PROBE_DRIVER_ERR":
      return { state, emissions: [{ kind: "PROBE_DRIVER_FAILED", payload: {
        request_id: action.requestId, driver: action.driverName, reason: action.reason,
      }}]};
    case "SESSION_RESUME_START":
      return doResumeStart(state, action);
    case "SESSION_RESUME_OK":
      return doResumeOk(state, action);
    case "SESSION_RESUME_ERR":
      return doResumeErr(state, action);
    case "SESSION_END_START":
      return doEndStart(state, action);
    case "SESSION_END_OK":
      return doEndOk(state, action);
    case "SESSION_END_ERR":
      return doEndErr(state, action);
    case "PROMPT_TEXT": {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, promptDraft: action.text } } },
        emissions: [], // Private — draft never appears in the trace.
      };
    }
    case "PROMPT_LENGTH_CHANGED":
      return {
        state,
        emissions: [{ kind: "PROMPT_CHANGED", payload: { pane_id: action.paneId, length: action.length } }],
      };
    case "TURN_SUBMIT_START": {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      return {
        state: {
          ...state,
          panes: { ...state.panes, [action.paneId]: { ...pane, promptDraft: "", status: "running" } },
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
    case "TURN_SUBMIT_OK": {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, status: "parked" } } },
        emissions: [{ kind: "TURN_SUBMITTED", payload: {
          request_id: action.requestId, session_id: action.sessionId, turn_index: action.turnIndex,
        }}],
      };
    }
    case "TRANSCRIPT_ROWS_LOADED": {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      const newRows = action.rows.filter((r) => r.seq > pane.transcriptLastSeq);
      if (newRows.length === 0) return { state, emissions: [] };
      const emissions: Emission[] = [];
      let maxSeq = pane.transcriptLastSeq;
      for (const r of newRows) {
        if (r.kind === "Park") {
          const parkReason: "final_answer" | "model_error" | "interrupt" =
            r.park_reason === "final_answer" || r.park_reason === "model_error" || r.park_reason === "interrupt"
              ? r.park_reason : "final_answer";
          emissions.push({ kind: "TRANSCRIPT_PARK_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq, park_reason: parkReason,
          }});
        } else if (r.kind === "SessionEnded") {
          emissions.push({ kind: "TRANSCRIPT_SESSION_ENDED_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq,
            end_reason: r.end_reason || "user_end",
          }});
        } else if (r.kind === "TranscriptCompacted") {
          emissions.push({ kind: "TRANSCRIPT_COMPACTED_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq,
            tokens_before: r.tokens_before ?? 0,
            tokens_after: r.tokens_after ?? 0,
            strategy: r.compact_strategy ?? "unknown",
          }});
        } else if (r.kind === "RateLimitedWaiting") {
          emissions.push({ kind: "TRANSCRIPT_RATE_LIMITED_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq,
            retry_index: r.retry_index ?? 0,
            retry_max: r.retry_max ?? 0,
            retry_after_seconds: r.retry_after_seconds ?? 0,
          }});
        } else {
          emissions.push({ kind: "TRANSCRIPT_ROW_RENDERED", payload: {
            pane_id: action.paneId, envelope_seq: r.seq,
            envelope_kind: r.kind, envelope_producer_kind: r.producer_kind,
          }});
        }
        if (r.seq > maxSeq) maxSeq = r.seq;
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
    case "TURN_SUBMIT_ERR": {
      const pane = state.panes[action.paneId];
      if (!pane) return { state, emissions: [] };
      // Restore parked status; the turn didn't take.
      return {
        state: { ...state, panes: { ...state.panes, [action.paneId]: { ...pane, status: "parked" } } },
        emissions: [{ kind: "TURN_SUBMIT_FAILED", payload: {
          request_id: action.requestId, session_id: action.sessionId, reason: action.reason,
        }}],
      };
    }
  }
}

function doEndStart(state: ShellState, a: Extract<Action, { type: "SESSION_END_START" }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || !pane.boundSessionId) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: { ...pane, creating: a.requestId } } },
    emissions: [{ kind: "SESSION_END_REQUESTED", payload: {
      request_id: a.requestId, session_id: a.sessionId, source: a.source,
    }}],
  };
}

function doEndOk(state: ShellState, a: Extract<Action, { type: "SESSION_END_OK" }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  const nextPane: Pane = {
    ...pane, creating: null,
    boundSessionId: null, sessionName: null,
    workspacePath: null, workspaceShape: null,
    status: "unbound",
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

function doEndErr(state: ShellState, a: Extract<Action, { type: "SESSION_END_ERR" }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: { ...pane, creating: null } } },
    emissions: [], // No SESSION_END_FAILED tag in Layer 1 v0.1 — failure surfaces as absent ACK
  };
}

function doResumeStart(state: ShellState, a: Extract<Action, { type: "SESSION_RESUME_START" }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: { ...pane, creating: a.requestId } } },
    emissions: [], // Layer 1 v0.1 has no SESSION_RESUME_REQUESTED tag; the bridge round-trip is silent
  };
}

function doResumeOk(state: ShellState, a: Extract<Action, { type: "SESSION_RESUME_OK" }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  const nextPane: Pane = {
    ...pane, creating: null,
    boundSessionId: a.sessionId, sessionName: a.sessionName,
    workspacePath: a.workspacePath, workspaceShape: a.workspaceShape,
    status: a.status === "ended" ? "ended" : (a.status === "unbound" ? "unbound" : a.status),
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

function doResumeErr(state: ShellState, a: Extract<Action, { type: "SESSION_RESUME_ERR" }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: { ...pane, creating: null } } },
    emissions: [], // Failure surfaces as UI banner; no tag in Layer 1 v0.1 for resume_failed
  };
}

function stripSecrets(obj: unknown): unknown {
  const rx = /key|token|secret|password/i;
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = rx.test(k) ? "<stripped>" : stripSecrets(v);
    }
    return out;
  }
  if (Array.isArray(obj)) return obj.map(stripSecrets);
  return obj;
}

function doSessionCreateStart(state: ShellState, a: Extract<Action, { type: "SESSION_CREATE_START" }>): Step {
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

function doSessionCreateOk(state: ShellState, a: Extract<Action, { type: "SESSION_CREATE_OK" }>): Step {
  const pane = state.panes[a.paneId];
  if (!pane || pane.creating !== a.requestId) return { state, emissions: [] };
  const nextPane: Pane = {
    ...pane,
    creating: null,
    boundSessionId: a.sessionId,
    sessionName: a.sessionName,
    workspacePath: a.workspacePath,
    workspaceShape: a.workspaceShape,
    status: "parked",
  };
  return {
    state: { ...state, panes: { ...state.panes, [a.paneId]: nextPane } },
    emissions: [
      { kind: "SESSION_CREATED", payload: {
        request_id: a.requestId, session_id: a.sessionId, name: a.sessionName,
        driver: a.driver, workspace: a.workspacePath, workspace_shape: a.workspaceShape,
        status: "running",
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

function doSessionCreateErr(state: ShellState, a: Extract<Action, { type: "SESSION_CREATE_ERR" }>): Step {
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

function doPickerWalk(state: ShellState, paneId: string, index: number, path: string, shape: "flat" | "worktree" | "isolate"): Step {
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

function doPickerCommit(state: ShellState, paneId: string, path: string, shape: "flat" | "worktree" | "isolate"): Step {
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

function doClose(state: ShellState, paneId: string, reason: "user"): Step {
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
    status: "unbound",
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

function doSplit(state: ShellState, paneId: string, axis: "row" | "col"): Step {
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
