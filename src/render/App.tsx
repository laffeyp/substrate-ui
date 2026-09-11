// App.tsx — boot entry. Instantiates the reducer, fires WINDOW_OPENED +
// PANE_CREATED + PANE_FOCUSED same-step via ShellReducer.reduce("BOOT"),
// then renders WindowFrame. Also owns the four app-scoped anchors named
// in Layer 7 (dialog, window-strip, bridge, last-tag, heartbeat).

import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { initial, reduce, Action, Emission, ActionType, EndSource, type EndSourceT } from "@/reducer/ShellReducer";
import { ShellState, TranscriptRow } from "@/state/ShellState";
import { emit } from "@/observability/Emitter";
import { WindowFrame } from "./WindowFrame";
import { Anchor, AnchorScope } from "./Anchor";
import { DragLayer } from "./DragLayer";
import { Zone, Axis } from "@/state/SplitTree";
import { WorkspaceShape } from "@/state/ShellState";
import { newId } from "@/state/ids";
import { bridgeRequest } from "@/observability/BridgeClient";
import {
  BridgeStatus, PaneStatus, isPaneStatus, DriverKind,
} from "@/observability/reasons";

interface SubstrateBridge {
  onHello?: (cb: (msg: { substrate: string; protocol: number }) => void) => () => void;
  onDead?: (cb: () => void) => () => void;
}
declare global {
  // eslint-disable-next-line no-var
  var substrate: SubstrateBridge | undefined;
}
const bridgeApi = (): SubstrateBridge | undefined =>
  (globalThis as unknown as { substrate?: SubstrateBridge }).substrate;

function Shell(): JSX.Element {
  // The reducer path holds state in a ref and forces a render on each dispatch.
  // React StrictMode double-invokes state updaters; keeping emissions out of
  // that updater is what makes tag counts match reducer calls one-for-one.
  const stateRef = useRef<ShellState>(initial());
  const [, forceRender] = useState(0);
  const bootedRef = useRef(false);
  const [bridge, setBridge] = useState<BridgeStatus>(BridgeStatus.PRE);
  const [substrateVersion, setSubstrateVersion] = useState<string>("");
  const [drag, setDrag] = useState<{sourceId: string; targetId: string | null; zone: Zone | null} | null>(null);

  const dispatch = useMemo(() => (action: Action) => {
    const step = reduce(stateRef.current, action);
    stateRef.current = step.state;
    for (const e of step.emissions as Emission[]) emit(e.kind, e.payload);
    forceRender((v) => v + 1);
  }, []);
  const state = stateRef.current;

  const startSessionCreate = useMemo(() => (paneId: string, path: string, shape: WorkspaceShape) => {
    dispatch({ type: ActionType.PICKER_COMMIT, paneId, path, shape });
    const harnessDriver = (globalThis as unknown as {
      __substrateHarness?: { defaultDriver?: string | null };
    }).__substrateHarness?.defaultDriver;
    const driver = harnessDriver || DriverKind.DETERMINISTIC;
    const driverParams: Record<string, unknown> = {};

    // Probe the driver first per Layer 5 forced_next: PROBE_DRIVER_PROBED gates SESSION_CREATE_REQUESTED.
    const probeReq = newId();
    dispatch({ type: ActionType.PROBE_DRIVER_START, paneId, requestId: probeReq, driverName: driver, driverParams });
    bridgeRequest<{ available: boolean; context_tokens: number | null; model_families: string[] }>(
      "probe_driver", { driver_name: driver, driver_params: driverParams }, 10000,
    ).then((probe) => {
      dispatch({ type: ActionType.PROBE_DRIVER_OK, requestId: probeReq, driverName: driver,
        contextTokens: probe.context_tokens ?? null, modelFamilies: probe.model_families ?? [] });

      // Probe succeeded — fire create.
      const requestId = newId();
      const sessionId = newId();
      const sessionName = `session-${sessionId.slice(0, 6)}`;
      dispatch({ type: ActionType.SESSION_CREATE_START, paneId, requestId, sessionId, sessionName, driver });
      bridgeRequest<{
        session_id: string; session_name: string; workspace_path: string; workspace_shape: WorkspaceShape;
      }>("session_create", {
        session_id: sessionId, name: sessionName, driver,
        workspace_path: path, workspace_shape: shape, bundle: "", seed: "",
      }, 5000).then((result) => {
        dispatch({ type: ActionType.SESSION_CREATE_OK, paneId, requestId,
          sessionId: result.session_id, sessionName: result.session_name, driver,
          workspacePath: result.workspace_path, workspaceShape: result.workspace_shape });
        refreshTranscript(paneId, result.session_id);
      }).catch((reason) => {
        dispatch({ type: ActionType.SESSION_CREATE_ERR, paneId, requestId, reason: String(reason) });
      });
    }).catch((reason) => {
      // Probe failed — SESSION_CREATE never fires (fail-fast per D69).
      dispatch({ type: ActionType.PROBE_DRIVER_ERR, requestId: probeReq, driverName: driver, reason: String(reason) });
    });
  }, [dispatch]);

  const refreshTranscript = useMemo(() => (paneId: string, sessionId: string) => {
    bridgeRequest<{ session_id: string; envelopes: Array<{
      seq: number; kind: string; producer_kind: string; summary: string; turn_index: number | null;
    }> }>("record_read", { session_id: sessionId }, 5000).then((result) => {
      dispatch({ type: ActionType.TRANSCRIPT_ROWS_LOADED, paneId, rows: result.envelopes });
    }).catch(() => { /* transcript fetch is best-effort */ });
  }, [dispatch]);

  const descend = useMemo(() =>
    (paneId: string, toolCallId: string, childRecordRoot: string | null) => {
      if (!childRecordRoot) return; // no child record yet; descent has nowhere to go
      const pane = stateRef.current.panes[paneId];
      if (!pane) return;
      const nextDepth = pane.descentStack.length + 1;
      dispatch({ type: ActionType.DESCENT_ENTER, paneId, toolCallId, childRecordRoot });
      // Depth may have been capped; only load if the push actually happened.
      const after = stateRef.current.panes[paneId];
      if (!after || after.descentStack.length !== nextDepth) return;
      bridgeRequest<{ session_id: string; envelopes: TranscriptRow[] }>(
        "record_read", { record_root: childRecordRoot }, 5000,
      ).then((result) => {
        dispatch({ type: ActionType.DESCENT_ROWS_LOADED, paneId,
          depth: nextDepth, rows: result.envelopes });
      }).catch(() => { /* best-effort */ });
    }, [dispatch]);

  const exitDescent = useMemo(() =>
    (paneId: string) => {
      dispatch({ type: ActionType.DESCENT_EXIT, paneId });
    }, [dispatch]);

  const toggleDelegateExpand = useMemo(() =>
    (paneId: string, toolCallId: string, childRecordRoot: string | null) => {
      const pane = stateRef.current.panes[paneId];
      if (!pane) return;
      const alreadyExpanded = toolCallId in pane.delegateExpansions;
      if (alreadyExpanded) {
        dispatch({ type: ActionType.DELEGATE_COLLAPSE, paneId, toolCallId,
          childRecordRoot: childRecordRoot ?? "" });
        return;
      }
      dispatch({ type: ActionType.DELEGATE_EXPAND_START, paneId, toolCallId,
        childRecordRoot: childRecordRoot ?? "" });
      if (!childRecordRoot) return; // no child transcript to load (ToolResult not yet on record)
      bridgeRequest<{ session_id: string; envelopes: TranscriptRow[] }>(
        "record_read", { record_root: childRecordRoot }, 5000,
      ).then((result) => {
        dispatch({
          type: ActionType.DELEGATE_EXPAND_ROWS_LOADED,
          paneId, toolCallId, rows: result.envelopes,
        });
      }).catch(() => { /* best-effort */ });
    }, [dispatch]);

  const submitTurn = useMemo(() => (paneId: string, text: string) => {
    const pane = stateRef.current.panes[paneId];
    if (!pane?.boundSessionId) return;
    const requestId = newId();
    const timeoutSeconds = 60;
    dispatch({ type: ActionType.TURN_SUBMIT_START, paneId, requestId,
      sessionId: pane.boundSessionId, textLength: text.length, timeoutSeconds });
    bridgeRequest<{ session_id: string; turn_index: number }>(
      "turn_submit",
      { session_id: pane.boundSessionId, text, timeout_seconds: timeoutSeconds },
      (timeoutSeconds + 5) * 1000,
    ).then((result) => {
      dispatch({ type: ActionType.TURN_SUBMIT_OK, paneId, requestId,
        sessionId: result.session_id, turnIndex: result.turn_index });
      refreshTranscript(paneId, result.session_id);
    }).catch((reason) => {
      dispatch({ type: ActionType.TURN_SUBMIT_ERR, paneId, requestId,
        sessionId: pane.boundSessionId!, reason: String(reason) });
    });
  }, [dispatch]);

  const startSessionEnd = useMemo(() => (paneId: string, sessionId: string, source: EndSourceT) => {
    const requestId = newId();
    dispatch({ type: ActionType.SESSION_END_START, paneId, requestId, sessionId, source });
    bridgeRequest<{
      session_id: string; end_reason: string; record_finalised: boolean; envelope_seq: number;
    }>("session_end", { session_id: sessionId }, 30000).then((result) => {
      dispatch({ type: ActionType.SESSION_END_OK, paneId, requestId,
        sessionId: result.session_id, endReason: result.end_reason,
        recordFinalised: result.record_finalised, envelopeSeq: result.envelope_seq,
      });
    }).catch((reason) => {
      dispatch({ type: ActionType.SESSION_END_ERR, paneId, requestId, reason: String(reason) });
    });
  }, [dispatch]);

  const startSessionResume = useMemo(() => (paneId: string, sessionId: string) => {
    const requestId = newId();
    dispatch({ type: ActionType.SESSION_RESUME_START, paneId, requestId, sessionId });
    bridgeRequest<{
      session_id: string; session_name: string | null;
      workspace_path: string; workspace_shape: WorkspaceShape;
      status: string;
    }>("session_resume", { session_id: sessionId }, 5000).then((result) => {
      const r = result as unknown as { last_turn_index?: number } & typeof result;
      const status: PaneStatus = isPaneStatus(result.status) ? result.status : PaneStatus.PARKED;
      dispatch({ type: ActionType.SESSION_RESUME_OK, paneId, requestId,
        sessionId: result.session_id, sessionName: result.session_name,
        workspacePath: result.workspace_path, workspaceShape: result.workspace_shape,
        status,
        lastTurnIndex: typeof r.last_turn_index === "number" ? r.last_turn_index : -1,
      });
      refreshTranscript(paneId, result.session_id);
    }).catch((reason) => {
      dispatch({ type: ActionType.SESSION_RESUME_ERR, paneId, requestId, reason: String(reason) });
    });
  }, [dispatch]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    dispatch({ type: ActionType.BOOT });
  }, [dispatch]);

  useEffect(() => {
    const s = bridgeApi();
    if (!s) return;
    const offHello = s.onHello?.((msg: { substrate: string; protocol: number }) => {
      setBridge(BridgeStatus.ALIVE);
      setSubstrateVersion(msg.substrate);
      emit("BRIDGE_HELLO_RECEIVED", { substrate_version: msg.substrate, protocol: msg.protocol });
    });
    const offDead = s.onDead?.(() => {
      setBridge(BridgeStatus.DEAD);
      emit("BRIDGE_DEAD_SURFACED", { crash_count: 2 });
    });
    return () => { offHello?.(); offDead?.(); };
  }, []);

  const bridgeByte = bridge === BridgeStatus.ALIVE ? 128 : bridge === BridgeStatus.DEAD ? 255 : 0;

  const window = state.windowOrder.length > 0
    ? state.windows[state.windowOrder[0]]
    : null;

  const statusClass = bridge === BridgeStatus.ALIVE ? "alive" : bridge === BridgeStatus.DEAD ? "dead" : "";
  const statusText = bridge === BridgeStatus.ALIVE ? `substrate ${substrateVersion} alive`
                    : bridge === BridgeStatus.DEAD ? "bridge dead"
                    : "connecting";

  return (
    <>
      <div id="status" className={statusClass}
        style={{ position: "fixed", bottom: 4, right: 8, fontSize: 11, color: "#5f636b",
          whiteSpace: "nowrap", pointerEvents: "none" }}>
        <span className="label">{statusText}</span>
      </div>
      {window && (
        <WindowFrame
          window={window}
          state={state}
          gutter={{
            onStart: (splitId) => dispatch({ type: ActionType.GUTTER_DRAG_START, splitId }),
            onStop:  (splitId, ratio) => dispatch({ type: ActionType.GUTTER_DRAG_STOP, splitId, ratio }),
          }}
          pane={{
            onFocus: (paneId) => dispatch({ type: ActionType.FOCUS_PANE, paneId }),
            onDragStart: (paneId) => setDrag({ sourceId: paneId, targetId: null, zone: null }),
            onClose: (paneId) => dispatch({ type: ActionType.CLOSE_PANE, paneId }),
            onPickerText: (paneId, text) => dispatch({ type: ActionType.PICKER_TEXT, paneId, text }),
            onPickerWalk: (paneId, index, path, shape) => dispatch({ type: ActionType.PICKER_WALK, paneId, index, path, shape }),
            onPickerCommit: (paneId, path, shape) => startSessionCreate(paneId, path, shape),
            onResume: (paneId, sessionId) => startSessionResume(paneId, sessionId),
            onPromptText: (paneId, text) => dispatch({ type: ActionType.PROMPT_TEXT, paneId, text }),
            onPromptLengthChanged: (paneId, length) => dispatch({ type: ActionType.PROMPT_LENGTH_CHANGED, paneId, length }),
            onPromptSubmit: submitTurn,
            onRevealToggle: (paneId) => dispatch({ type: ActionType.REVEAL_TOGGLE, paneId }),
            onLensSwitch: (paneId, to) => dispatch({ type: ActionType.LENS_SWITCH, paneId, to }),
            onStreamLevelToggle: (paneId) => dispatch({ type: ActionType.STREAM_LEVEL_TOGGLE, paneId }),
            onStreamDirToggle: (paneId) => dispatch({ type: ActionType.STREAM_DIR_TOGGLE, paneId }),
            onRevealFocusToggle: (paneId) => dispatch({ type: ActionType.REVEAL_FOCUS_TOGGLE, paneId }),
            onDelegateExpandToggle: (paneId, toolCallId, childRecordRoot) =>
              toggleDelegateExpand(paneId, toolCallId, childRecordRoot),
            onDescend: (paneId, toolCallId, childRecordRoot) =>
              descend(paneId, toolCallId, childRecordRoot),
            onDescentExit: (paneId) => exitDescent(paneId),
          }}
        />
      )}
      {drag && (
        <DragLayer
          sourceId={drag.sourceId}
          activeTargetId={drag.targetId}
          activeZone={drag.zone}
          onZoneChange={(targetId, zone) => {
            if (drag.targetId !== targetId) {
              dispatch({ type: ActionType.DROP_HINT_SHOW, sourceId: drag.sourceId, targetId, zone });
            } else if (drag.zone !== zone && drag.zone) {
              dispatch({ type: ActionType.DROP_HINT_ZONE, sourceId: drag.sourceId, targetId, fromZone: drag.zone, toZone: zone });
            }
            setDrag({ sourceId: drag.sourceId, targetId, zone });
          }}
          onCommit={(targetId, zone) => {
            dispatch({ type: ActionType.MOVE_PANE, sourceId: drag.sourceId, targetId, zone });
            dispatch({ type: ActionType.DROP_HINT_HIDE, sourceId: drag.sourceId, targetId });
            setDrag(null);
          }}
          onCancel={() => {
            dispatch({ type: ActionType.DROP_HINT_HIDE, sourceId: drag.sourceId, targetId: drag.targetId });
            setDrag(null);
          }}
        />
      )}
      {window && (
        <ShellShortcuts
          dispatch={dispatch}
          focusedPaneId={state.focusedPaneId}
          focusedPane={state.focusedPaneId ? state.panes[state.focusedPaneId] : null}
          onEnd={startSessionEnd}
        />
      )}
      <Anchor id="anchor-dialog"        scope={AnchorScope.APP} slot="dialog"        byte={0} />
      <Anchor id="anchor-window-strip"  scope={AnchorScope.APP} slot="window-strip"  byte={0} />
      <Anchor id="anchor-bridge"        scope={AnchorScope.APP} slot="bridge"        byte={bridgeByte} />
      {substrateVersion && <span data-testid="substrate-version" style={{ display: "none" }}>{substrateVersion}</span>}
      <Anchor id="anchor-last-tag"      scope={AnchorScope.APP} slot="last-tag"      byte={0} />
      <Anchor id="anchor-heartbeat"     scope={AnchorScope.APP} slot="heartbeat"     byte={0} />
    </>
  );
}

import type { Pane as PaneModel } from "@/state/ShellState";

function ShellShortcuts({ dispatch, focusedPaneId, focusedPane, onEnd }: {
  dispatch: (a: Action) => void;
  focusedPaneId: string | null;
  focusedPane: PaneModel | null;
  onEnd: (paneId: string, sessionId: string, source: EndSourceT) => void;
}): JSX.Element | null {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!focusedPaneId) return;
      // Esc pops descent one level (Sprint 022). No modifier required.
      if (e.key === "Escape" && focusedPane && focusedPane.descentStack.length > 0) {
        e.preventDefault();
        dispatch({ type: ActionType.DESCENT_EXIT, paneId: focusedPaneId });
        return;
      }
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        const axis: Axis = e.shiftKey ? Axis.COL : Axis.ROW;
        dispatch({ type: ActionType.SPLIT_PANE, paneId: focusedPaneId, axis });
      } else if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        dispatch({ type: ActionType.CLOSE_PANE, paneId: focusedPaneId });
      } else if (e.key === "e" || e.key === "E") {
        if (!focusedPane?.boundSessionId) return;
        e.preventDefault();
        onEnd(focusedPaneId, focusedPane.boundSessionId, EndSource.SHORTCUT);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, focusedPaneId, focusedPane, onEnd]);
  return null;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<StrictMode><Shell /></StrictMode>);
}
