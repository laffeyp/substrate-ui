// App.tsx — boot entry. Instantiates the reducer, fires WINDOW_OPENED +
// PANE_CREATED + PANE_FOCUSED same-step via ShellReducer.reduce("BOOT"),
// then renders WindowFrame. Also owns the four app-scoped anchors named
// in Layer 7 (dialog, window-strip, bridge, last-tag, heartbeat).

import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { initial, reduce, Action, Emission, ActionType, EndSource, type EndSourceT } from "@/reducer/ShellReducer";
import { ShellState, TranscriptRow } from "@/state/ShellState";
import { emit } from "@/observability/Emitter";
import { Tag } from "@/observability/tags";
import { WindowFrame } from "./WindowFrame";
import { Anchor, AnchorScope, AppSlot, appAnchorId } from "./Anchor";
import { DragLayer } from "./DragLayer";
import { Zone, Axis } from "@/state/SplitTree";
import { WorkspaceShape } from "@/state/ShellState";
import { newId } from "@/state/ids";
import { bridgeRequest } from "@/observability/BridgeClient";
import { BridgeOp } from "@/observability/bridge-ops";
import { computeMatches } from "@/lib/findMatches";
import type { Pane as PaneModel } from "@/state/ShellState";
import {
  BridgeStatus, PaneStatus, isPaneStatus, DriverKind, SurfaceKind,
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
      BridgeOp.probe_driver, { driver_name: driver, driver_params: driverParams }, 10000,
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
      }>(BridgeOp.session_create, {
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
    }> }>(BridgeOp.record_read, { session_id: sessionId }, 5000).then((result) => {
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
        BridgeOp.record_read, { record_root: childRecordRoot }, 5000,
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
        BridgeOp.record_read, { record_root: childRecordRoot }, 5000,
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
      BridgeOp.turn_submit,
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
    }>(BridgeOp.session_end, { session_id: sessionId }, 30000).then((result) => {
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
      status: string; driver: string;
    }>(BridgeOp.session_resume, { session_id: sessionId }, 5000).then((result) => {
      const r = result as unknown as { last_turn_index?: number } & typeof result;
      const status: PaneStatus = isPaneStatus(result.status) ? result.status : PaneStatus.PARKED;
      dispatch({ type: ActionType.SESSION_RESUME_OK, paneId, requestId,
        sessionId: result.session_id, sessionName: result.session_name,
        workspacePath: result.workspace_path, workspaceShape: result.workspace_shape,
        status, driver: result.driver,
        lastTurnIndex: typeof r.last_turn_index === "number" ? r.last_turn_index : -1,
      });
      refreshTranscript(paneId, result.session_id);
    }).catch((reason) => {
      dispatch({ type: ActionType.SESSION_RESUME_ERR, paneId, requestId, reason: String(reason) });
    });
  }, [dispatch]);

  const studioValidate = useMemo(() => (paneId: string, draft: PaneModel["studioDraft"]) => {
    dispatch({ type: ActionType.STUDIO_VALIDATE_START, paneId,
      topoName: draft.topoName });
    bridgeRequest<{
      topo_name: string; producer_count: number; view_count: number;
      trigger_count: number; route_count: number;
    }>(BridgeOp.topology_validate, {
      topo_name: draft.topoName,
      producer_count: draft.producerCount, view_count: draft.viewCount,
      trigger_count: draft.triggerCount, route_count: draft.routeCount,
    }, 5000).then((result) => {
      dispatch({ type: ActionType.STUDIO_VALIDATE_OK, paneId,
        topoName: result.topo_name,
        producerCount: result.producer_count, viewCount: result.view_count,
        triggerCount: result.trigger_count, routeCount: result.route_count });
    }).catch((reason) => {
      let errors: string[];
      try {
        const parsed = JSON.parse(String(reason));
        errors = Array.isArray(parsed.errors) ? parsed.errors : [String(reason)];
      } catch { errors = [String(reason)]; }
      dispatch({ type: ActionType.STUDIO_VALIDATE_ERR, paneId,
        topoName: draft.topoName, errors });
    });
  }, [dispatch]);

  const startDriverChange = useMemo(() => (
    paneId: string, sessionId: string, fromDriver: string, toDriver: string,
  ) => {
    const requestId = newId();
    dispatch({ type: ActionType.DRIVER_PICK_START, paneId, requestId,
      sessionId, fromDriver, toDriver });
    bridgeRequest<{ session_id: string; from_driver: string; to_driver: string }>(
      BridgeOp.driver_change,
      { session_id: sessionId, driver: toDriver, driver_params: {} },
      15000,
    ).then((result) => {
      dispatch({ type: ActionType.DRIVER_PICK_OK, paneId, requestId,
        sessionId: result.session_id,
        fromDriver: result.from_driver, toDriver: result.to_driver });
    }).catch((reason) => {
      dispatch({ type: ActionType.DRIVER_PICK_ERR, paneId, requestId,
        sessionId, reason: String(reason) });
    });
  }, [dispatch]);

  const findDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});
  const findQueryType = useMemo(() => (paneId: string, q: string) => {
    dispatch({ type: ActionType.FIND_QUERY_TYPE, paneId, q });
    const prev = findDebounceRef.current[paneId];
    if (prev) clearTimeout(prev);
    findDebounceRef.current[paneId] = setTimeout(() => {
      const pane = stateRef.current.panes[paneId];
      if (!pane || !pane.find.open) return;
      const matches = computeMatches(pane.transcriptRows, q);
      dispatch({ type: ActionType.FIND_QUERY_COMMIT, paneId, q, count: matches.length });
    }, 100);
  }, [dispatch]);

  const studioBuild = useMemo(() => (paneId: string, topoName: string) => {
    dispatch({ type: ActionType.STUDIO_BUILD_START, paneId, topoName });
    bridgeRequest<{ topo_name: string; record_root: string }>(
      BridgeOp.topology_build, { topo_name: topoName }, 10000,
    ).then((result) => {
      dispatch({ type: ActionType.STUDIO_BUILD_OK, paneId,
        topoName: result.topo_name, recordRoot: result.record_root });
    }).catch((reason) => {
      let errors: string[];
      try {
        const parsed = JSON.parse(String(reason));
        errors = Array.isArray(parsed.errors) ? parsed.errors : [String(reason)];
      } catch { errors = [String(reason)]; }
      dispatch({ type: ActionType.STUDIO_BUILD_ERR, paneId, topoName, errors });
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
      emit(Tag.BRIDGE_HELLO_RECEIVED, { substrate_version: msg.substrate, protocol: msg.protocol });
    });
    const offDead = s.onDead?.(() => {
      setBridge(BridgeStatus.DEAD);
      emit(Tag.BRIDGE_DEAD_SURFACED, { crash_count: 2 });
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
            onFanoutExpand: (paneId, leaderToolCallId) =>
              dispatch({ type: ActionType.FANOUT_EXPAND, paneId, leaderToolCallId }),
            onFanoutWalk: (paneId, leaderToolCallId, toIndex, siblingCount) =>
              dispatch({ type: ActionType.FANOUT_WALK, paneId, leaderToolCallId, toIndex, siblingCount }),
            onFanoutCollapse: (paneId, leaderToolCallId) =>
              dispatch({ type: ActionType.FANOUT_COLLAPSE, paneId, leaderToolCallId }),
            onInspectorToggle: (paneId, envelopeSeq, envelopeKind, sourceIsStream) =>
              dispatch({ type: ActionType.INSPECTOR_TOGGLE, paneId, envelopeSeq, envelopeKind, sourceIsStream }),
            onSurfaceClose: (paneId) => dispatch({ type: ActionType.SURFACE_CLOSE, paneId }),
            onResumeFromSurface: (paneId, sessionId) => {
              dispatch({ type: ActionType.SURFACE_CLOSE, paneId });
              startSessionResume(paneId, sessionId);
            },
            onStudioDraftSet: (paneId, draft) =>
              dispatch({ type: ActionType.STUDIO_DRAFT_SET, paneId, draft }),
            onStudioViewToggle: (paneId) =>
              dispatch({ type: ActionType.STUDIO_VIEW_TOGGLE, paneId }),
            onStudioValidate: (paneId, draft) => studioValidate(paneId, draft),
            onStudioBuild: (paneId, topoName) => studioBuild(paneId, topoName),
            onFindQueryType: (paneId, q) => findQueryType(paneId, q),
            onFindScopeTab: (paneId) => {
              dispatch({ type: ActionType.REVEAL_FOCUS_TOGGLE, paneId });
              dispatch({ type: ActionType.FIND_SCOPE_TOGGLE, paneId });
            },
            onFindStep: (paneId, delta) => dispatch({ type: ActionType.FIND_STEP, paneId, delta }),
            onFindClose: (paneId) => dispatch({ type: ActionType.FIND_CLOSE, paneId }),
            onSlashRouterWalk: (paneId, delta) =>
              dispatch({ type: ActionType.SLASH_ROUTER_WALK, paneId, delta }),
            onSlashRouterCancel: (paneId) =>
              dispatch({ type: ActionType.SLASH_ROUTER_CANCEL, paneId }),
            onSlashCommandRoute: (paneId, command, arg) =>
              dispatch({ type: ActionType.SLASH_COMMAND_ROUTE, paneId, command, arg }),
            onDriverDropdownOpen: (paneId, options) =>
              dispatch({ type: ActionType.DRIVER_DROPDOWN_OPEN, paneId, options }),
            onDriverDropdownClose: (paneId) =>
              dispatch({ type: ActionType.DRIVER_DROPDOWN_CLOSE, paneId }),
            onDriverDropdownWalk: (paneId, delta) =>
              dispatch({ type: ActionType.DRIVER_DROPDOWN_WALK, paneId, delta }),
            onDriverPick: (paneId, sessionId, fromDriver, toDriver) =>
              startDriverChange(paneId, sessionId, fromDriver, toDriver),
            onWorkspacePopoverOpen: (paneId) =>
              dispatch({ type: ActionType.WORKSPACE_POPOVER_OPEN, paneId }),
            onWorkspacePopoverClose: (paneId) =>
              dispatch({ type: ActionType.WORKSPACE_POPOVER_CLOSE, paneId }),
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
      <Anchor id={appAnchorId(AppSlot.DIALOG)}       scope={AnchorScope.APP} slot={AppSlot.DIALOG}        byte={0} />
      <Anchor id={appAnchorId(AppSlot.WINDOW_STRIP)} scope={AnchorScope.APP} slot={AppSlot.WINDOW_STRIP}  byte={0} />
      <Anchor id={appAnchorId(AppSlot.BRIDGE)}       scope={AnchorScope.APP} slot={AppSlot.BRIDGE}        byte={bridgeByte} />
      {substrateVersion && <span data-testid="substrate-version" style={{ display: "none" }}>{substrateVersion}</span>}
      <Anchor id={appAnchorId(AppSlot.LAST_TAG)}     scope={AnchorScope.APP} slot={AppSlot.LAST_TAG}      byte={0} />
      <Anchor id={appAnchorId(AppSlot.HEARTBEAT)}    scope={AnchorScope.APP} slot={AppSlot.HEARTBEAT}     byte={0} />
    </>
  );
}

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
      } else if (e.key === "r" || e.key === "R") {
        // Sprint 025 — Cmd-R opens the Records surface on the
        // focused pane. Second press on an already-open records
        // surface closes it (SURFACE_OPEN is idempotent, so we
        // dispatch SURFACE_CLOSE when the current surface already
        // matches).
        e.preventDefault();
        if (focusedPane?.surface?.kind === SurfaceKind.RECORDS) {
          dispatch({ type: ActionType.SURFACE_CLOSE, paneId: focusedPaneId });
        } else {
          dispatch({ type: ActionType.SURFACE_OPEN, paneId: focusedPaneId, kind: SurfaceKind.RECORDS });
        }
      } else if (e.key === "a" || e.key === "A") {
        // Sprint 026 — Cmd-A opens the Assay surface. Same
        // idempotency rule as Cmd-R.
        e.preventDefault();
        if (focusedPane?.surface?.kind === SurfaceKind.ASSAY) {
          dispatch({ type: ActionType.SURFACE_CLOSE, paneId: focusedPaneId });
        } else {
          dispatch({ type: ActionType.SURFACE_OPEN, paneId: focusedPaneId, kind: SurfaceKind.ASSAY });
        }
      } else if (e.key === "f" || e.key === "F") {
        // Sprint 028 — Cmd-F opens the find bar on the focused pane.
        // Second Cmd-F closes (same idempotency as Cmd-R/A/S).
        e.preventDefault();
        if (focusedPane?.find.open) {
          dispatch({ type: ActionType.FIND_CLOSE, paneId: focusedPaneId });
        } else {
          dispatch({ type: ActionType.FIND_OPEN, paneId: focusedPaneId });
        }
      } else if (e.key === "s" || e.key === "S") {
        // Sprint 027 — Cmd-S opens the Studio surface. Same
        // idempotency rule as Cmd-R / Cmd-A.
        e.preventDefault();
        if (focusedPane?.surface?.kind === SurfaceKind.STUDIO) {
          dispatch({ type: ActionType.SURFACE_CLOSE, paneId: focusedPaneId });
        } else {
          dispatch({ type: ActionType.SURFACE_OPEN, paneId: focusedPaneId, kind: SurfaceKind.STUDIO });
        }
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
