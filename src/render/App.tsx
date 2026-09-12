// src/render/App.tsx — Q1 lands header interactivity per v7 lines 15-30.
//
// The full-header shell holds: traffic lights · substrate wordmark +
// logoDot · crumb · driver dropdown (7 rows) · workspace popover · esc
// hint · records button · studio button · reveal toggle. Each control
// dispatches through the reducer to the ratified signals: DRIVER_
// DROPDOWN_OPENED/CLOSED, DRIVER_PICKED (routes through the change
// round-trip in Q?), WORKSPACE_POPOVER_OPENED/CLOSED, SURFACE_OPENED/
// CLOSED, REVEAL_TOGGLED.
//
// The pane grid (Q2), transcript body (Q3), unbound picker (Q4),
// revealed view (Q5+), records / assay / studio / dialogs / first
// run land in later Q-sprints. The middle of the shell reads
// "port in progress" until Q2.

import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { initial, reduce, Action, Emission, ActionType } from "@/reducer/ShellReducer";
import { ShellState, Pane as PaneModel } from "@/state/ShellState";
import { emit } from "@/observability/Emitter";
import { Tag } from "@/observability/tags";
import { Anchor, AnchorScope, AppSlot, appAnchorId } from "./Anchor";
import { Pane } from "./Pane";
import { BridgeStatus, SurfaceKind, RevealState } from "@/observability/reasons";

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

// v7 palette lifted verbatim from Substrate Prototype v7.dc.html.
const C = {
  ground: "#212327",
  chrome: "#26292e",
  chromeAlt: "#2a2d33",
  chromeHi: "#2e3138",
  input: "#1a1c20",
  text: "#b9bec5",
  textHi: "#e2e5e9",
  textDim: "#9aa0a8",
  textFaint: "#62676f",
  textFaintest: "#4a4e55",
  accent: "#82a5c8",
  accentHi: "#9db8d6",
  red: "#c26058",
  amber: "#7fb3b8",
  revealBtn: "#3d434c",
} as const;

// v7's driver options (per-pane menu, line 761 + first-run 1119).
const DRIVER_OPTIONS: readonly string[] = [
  "kimi-k2",
  "deepseek-r1:8b",
  "qwen3-coder:480b-cloud",
  "nemotron-3-super",
  "claude (cli)",
  "gemini (cli)",
  "deterministic",
] as const;

const shellStyle: React.CSSProperties = {
  height: "100vh", display: "flex", flexDirection: "column",
  background: C.ground, color: C.text,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 13, overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, padding: "8px 16px",
  background: C.chrome, flex: "none", whiteSpace: "nowrap", minWidth: 0,
};

const bottomBarStyle: React.CSSProperties = {
  display: "flex", gap: 16, padding: "7px 16px",
  background: C.chromeAlt, fontSize: 11, color: C.textFaint, flex: "none",
};

function TrafficLights(): JSX.Element {
  const dot: React.CSSProperties = {
    width: 12, height: 12, borderRadius: "50%", background: C.textFaintest,
  };
  return (
    <div style={{ display: "flex", gap: 6, flex: "none" }}>
      <span style={dot} /><span style={dot} /><span style={dot} />
    </div>
  );
}

function Wordmark({ dotColor }: { dotColor: string }): JSX.Element {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", flex: "none" }}>
      <span style={{ color: C.textHi, fontWeight: 600 }}>substrate</span>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: dotColor, display: "inline-block", marginLeft: 3,
      }} />
    </span>
  );
}

// v7 driver chip in the app header — ▾ opens the app-scoped picker.
function DriverPicker({
  pane, onOpen, onClose, onPick,
}: {
  pane: PaneModel;
  onOpen: () => void;
  onClose: () => void;
  onPick: (from: string, to: string) => void;
}): JSX.Element {
  const from = pane.driver ?? "";
  const label = from || "—";
  const chipStyle: React.CSSProperties = {
    fontSize: 10.5, color: C.textDim,
    border: "1px solid rgba(255,255,255,.08)", borderRadius: 4,
    padding: "1px 7px", cursor: "pointer", display: "inline-block",
    userSelect: "none",
  };
  return (
    <span style={{ position: "relative", flex: "none", display: "inline-block" }}>
      <span
        data-testid="app-driver-chip"
        data-driver={from}
        style={chipStyle}
        onClick={() => (pane.driverPopover.open ? onClose() : onOpen())}
      >
        <span className="label">{label} ▾</span>
      </span>
      {pane.driverPopover.open && (
        <span
          data-testid="app-driver-popover"
          style={{
            position: "absolute", left: 0, top: 22, zIndex: 30,
            background: C.chrome, border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 6, padding: "5px 0", display: "flex",
            flexDirection: "column", minWidth: 180,
            boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}
        >
          {DRIVER_OPTIONS.map((opt) => (
            <span
              key={opt}
              data-testid={`app-driver-option-${opt}`}
              onClick={() => onPick(from, opt)}
              style={{
                padding: "4px 12px", cursor: "pointer", fontSize: 10.5,
                color: opt === from ? C.textHi : C.textDim, whiteSpace: "nowrap",
              }}
            >
              <span className="label">{opt}</span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function WorkspacePopoverChip({
  pane, onOpen, onClose,
}: { pane: PaneModel; onOpen: () => void; onClose: () => void }): JSX.Element {
  const shape = pane.workspaceShape ?? "";
  const label = shape ? `⌥ ${shape}` : "⌥ —";
  const chipStyle: React.CSSProperties = {
    fontSize: 10.5, color: C.textFaint,
    border: "1px solid rgba(255,255,255,.08)", borderRadius: 4,
    padding: "1px 7px", cursor: "pointer", display: "inline-block",
    maxWidth: "100%", boxSizing: "border-box",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    userSelect: "none",
  };
  return (
    <span style={{
      position: "relative", flex: "0 4 auto", minWidth: 34, display: "inline-block",
    }}>
      <span
        data-testid="app-workspace-chip"
        data-workspace-shape={shape}
        style={chipStyle}
        onClick={() => (pane.workspacePopover.open ? onClose() : onOpen())}
      >
        <span className="label">{label}</span>
      </span>
      {pane.workspacePopover.open && (
        <span
          data-testid="app-workspace-popover"
          style={{
            position: "absolute", left: 0, top: 22, zIndex: 30,
            background: C.chrome, border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 6, padding: "9px 13px", display: "block",
            minWidth: 270, boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            fontSize: 10.5, lineHeight: 1.8, color: C.textDim,
            whiteSpace: "nowrap",
          }}
        >
          <span className="label">workspace </span>
          <span style={{ color: C.textHi }} className="label">
            {pane.workspacePath ?? "(none)"}
          </span>
          <br />
          <span className="label">shape </span>
          <span style={{ color: C.textHi }} className="label">{shape || "(none)"}</span>
          <br />
          <span style={{ color: C.textFaint }} className="label">
            frozen at seq 1
          </span>
        </span>
      )}
    </span>
  );
}

function Shell(): JSX.Element {
  const stateRef = useRef<ShellState>(initial());
  const [, forceRender] = useState(0);
  const bootedRef = useRef(false);
  const [bridge, setBridge] = useState<BridgeStatus>(BridgeStatus.PRE);
  const [substrateVersion, setSubstrateVersion] = useState<string>("");

  const dispatch = (action: Action): void => {
    const step = reduce(stateRef.current, action);
    stateRef.current = step.state;
    for (const e of step.emissions as Emission[]) emit(e.kind, e.payload);
    forceRender((v) => v + 1);
  };

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    dispatch({ type: ActionType.BOOT });
  }, []);

  useEffect(() => {
    const s = bridgeApi();
    if (!s) return;
    const offHello = s.onHello?.((msg) => {
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

  const state = stateRef.current;
  const focusedId = state.focusedPaneId;
  const focused: PaneModel | null = focusedId ? state.panes[focusedId] : null;

  const surfaceKind = focused?.surface?.kind ?? null;
  const revealed = focused?.reveal === RevealState.REVEAL;
  const paneCount = Object.keys(state.panes).length;
  // v7 lines 1057-1058: the app-scoped full header shows ONLY when a
  // surface is open or the focused pane is revealed. Otherwise a thin
  // multi-pane strip shows when there is more than one pane, and a
  // single pane draws nothing app-scoped — its own header is the
  // only chrome.
  const showFullHeader = !!surfaceKind || revealed;
  const showStrip = !surfaceKind && !revealed && paneCount > 1;
  const crumb = surfaceKind === SurfaceKind.RECORDS ? `${focused?.sessionName ?? ""} › records`
              : surfaceKind === SurfaceKind.STUDIO ? `${focused?.sessionName ?? ""} › studio`
              : surfaceKind === SurfaceKind.ASSAY ? `${focused?.sessionName ?? ""} › assays`
              : focused?.sessionName ?? "";

  const bridgeByte = bridge === BridgeStatus.ALIVE ? 128 : bridge === BridgeStatus.DEAD ? 255 : 0;
  const logoDot = bridge === BridgeStatus.DEAD ? C.red
                : bridge === BridgeStatus.ALIVE ? C.textFaint
                : C.textFaintest;
  const footStatus = bridge === BridgeStatus.DEAD ? "◌ bridge dead"
                   : bridge === BridgeStatus.ALIVE ? `● substrate ${substrateVersion} · live · clean`
                   : "connecting";
  const footStatusColor = bridge === BridgeStatus.DEAD ? C.red
                        : bridge === BridgeStatus.ALIVE ? C.accent
                        : C.textFaint;

  const toggleSurface = (kind: SurfaceKind): void => {
    if (!focusedId) return;
    if (focused?.surface?.kind === kind) {
      dispatch({ type: ActionType.SURFACE_CLOSE, paneId: focusedId });
    } else {
      dispatch({ type: ActionType.SURFACE_OPEN, paneId: focusedId, kind });
    }
  };

  const recordsColor = surfaceKind === SurfaceKind.RECORDS ? C.textHi : C.textDim;
  const studioColor = surfaceKind === SurfaceKind.STUDIO ? C.textHi : C.textDim;
  const revealLabel = revealed ? "⌃` terminal" : "⌃` reveal";
  const revealBtnColor = revealed && !surfaceKind ? C.ground : C.textDim;
  const revealBtnBg = revealed && !surfaceKind ? C.accent : C.revealBtn;

  return (
    <div style={shellStyle}>
      {showStrip && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 16px", background: C.chrome, flex: "none",
        }}>
          <div style={{ display: "flex", gap: 6, flex: "none" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: C.textFaintest }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: C.textFaintest }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: C.textFaintest }} />
          </div>
        </div>
      )}
      {showFullHeader && (
      <div style={headerStyle}>
        <TrafficLights />
        <Wordmark dotColor={logoDot} />
        <span
          title={crumb}
          className="label"
          data-testid="app-crumb"
          style={{
            color: C.textDim, fontSize: 11,
            overflow: "hidden", textOverflow: "ellipsis",
            flex: "0 1 auto", minWidth: 64,
          }}
        >{crumb}</span>
        {focused && (
          <DriverPicker
            pane={focused}
            onOpen={() => dispatch({
              type: ActionType.DRIVER_DROPDOWN_OPEN,
              paneId: focused.id, options: DRIVER_OPTIONS,
            })}
            onClose={() => dispatch({
              type: ActionType.DRIVER_DROPDOWN_CLOSE, paneId: focused.id,
            })}
            onPick={(from, to) => dispatch({
              type: ActionType.DRIVER_PICK_START,
              paneId: focused.id,
              requestId: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
              sessionId: focused.boundSessionId ?? "",
              fromDriver: from, toDriver: to,
            })}
          />
        )}
        {focused && (
          <WorkspacePopoverChip
            pane={focused}
            onOpen={() => dispatch({ type: ActionType.WORKSPACE_POPOVER_OPEN, paneId: focused.id })}
            onClose={() => dispatch({ type: ActionType.WORKSPACE_POPOVER_CLOSE, paneId: focused.id })}
          />
        )}
        <span style={{ flex: 1, minWidth: 8 }} />
        <span
          data-testid="app-records-btn"
          className="label"
          onClick={() => toggleSurface(SurfaceKind.RECORDS)}
          style={{ fontSize: 11.5, cursor: "pointer", flex: "none", color: recordsColor }}
        >records</span>
        <span
          data-testid="app-studio-btn"
          className="label"
          onClick={() => toggleSurface(SurfaceKind.STUDIO)}
          style={{ fontSize: 11.5, cursor: "pointer", flex: "none", color: studioColor }}
        >studio</span>
        <button
          data-testid="app-reveal-btn"
          onClick={() => focusedId && dispatch({ type: ActionType.REVEAL_TOGGLE, paneId: focusedId })}
          style={{
            fontFamily: "inherit", cursor: "pointer", flex: "none", fontSize: 11.5,
            color: revealBtnColor, background: revealBtnBg, border: "none",
            borderRadius: 5, padding: "3px 10px", fontWeight: 600,
          }}
        >{revealLabel}</button>
      </div>
      )}

      <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex" }}>
        <div style={{
          flex: 1, display: "grid",
          gridTemplateColumns: "1fr", gridTemplateRows: "1fr",
          gap: 1, background: "rgba(255,255,255,.055)", minHeight: 0,
        }}>
          {Object.values(state.panes).map((pn) => (
            <Pane
              key={pn.id}
              pane={pn}
              focused={pn.id === focusedId}
              singlePane={Object.keys(state.panes).length === 1}
              onFocus={(paneId) => dispatch({ type: ActionType.FOCUS_PANE, paneId })}
              onDriverDropdownOpen={(paneId, options) =>
                dispatch({ type: ActionType.DRIVER_DROPDOWN_OPEN, paneId, options })}
              onDriverDropdownClose={(paneId) =>
                dispatch({ type: ActionType.DRIVER_DROPDOWN_CLOSE, paneId })}
              onDriverPick={(paneId, sessionId, fromDriver, toDriver) =>
                dispatch({
                  type: ActionType.DRIVER_PICK_START,
                  paneId,
                  requestId: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                  sessionId, fromDriver, toDriver,
                })}
              onWorkspacePopoverOpen={(paneId) =>
                dispatch({ type: ActionType.WORKSPACE_POPOVER_OPEN, paneId })}
              onWorkspacePopoverClose={(paneId) =>
                dispatch({ type: ActionType.WORKSPACE_POPOVER_CLOSE, paneId })}
              onRecordsToggle={(paneId) => {
                const p = stateRef.current.panes[paneId];
                if (p?.surface?.kind === SurfaceKind.RECORDS) {
                  dispatch({ type: ActionType.SURFACE_CLOSE, paneId });
                } else {
                  dispatch({ type: ActionType.SURFACE_OPEN, paneId, kind: SurfaceKind.RECORDS });
                }
              }}
              onStudioToggle={(paneId) => {
                const p = stateRef.current.panes[paneId];
                if (p?.surface?.kind === SurfaceKind.STUDIO) {
                  dispatch({ type: ActionType.SURFACE_CLOSE, paneId });
                } else {
                  dispatch({ type: ActionType.SURFACE_OPEN, paneId, kind: SurfaceKind.STUDIO });
                }
              }}
              onRevealToggle={(paneId) => dispatch({ type: ActionType.REVEAL_TOGGLE, paneId })}
            />
          ))}
        </div>
      </div>

      <div style={bottomBarStyle}>
        <span style={{ color: footStatusColor }} className="label">{footStatus}</span>
        <span className="label" />
        <span style={{ marginLeft: "auto" }} className="label">⌃` toggles the reveal</span>
      </div>

      <Anchor id={appAnchorId(AppSlot.DIALOG)}       scope={AnchorScope.APP} slot={AppSlot.DIALOG}       byte={0} />
      <Anchor id={appAnchorId(AppSlot.WINDOW_STRIP)} scope={AnchorScope.APP} slot={AppSlot.WINDOW_STRIP} byte={0} />
      <Anchor id={appAnchorId(AppSlot.BRIDGE)}       scope={AnchorScope.APP} slot={AppSlot.BRIDGE}       byte={bridgeByte} />
      {substrateVersion && (
        <span data-testid="substrate-version" style={{ display: "none" }}>{substrateVersion}</span>
      )}
      <Anchor id={appAnchorId(AppSlot.LAST_TAG)}     scope={AnchorScope.APP} slot={AppSlot.LAST_TAG}     byte={0} />
      <Anchor id={appAnchorId(AppSlot.HEARTBEAT)}    scope={AnchorScope.APP} slot={AppSlot.HEARTBEAT}    byte={0} />
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<StrictMode><Shell /></StrictMode>);
}
