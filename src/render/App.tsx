// src/render/App.tsx — Q0 stub of the port pass.
//
// Mounts the reducer, the observability spine, and v7's outer chrome
// (outer flex column · palette · wordmark header · bottom bar). No
// pane grid, no transcript body, no chips. Q1 adds header interactivity;
// Q2 adds the pane grid; Q3+ ports the interior surfaces.
//
// v7 source of truth: handoff_latest/prototypes/Substrate Prototype v7.dc.html
// lines 8-30 (outer + header), 446 (bottom bar).

import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { initial, reduce, Action, Emission } from "@/reducer/ShellReducer";
import { ShellState } from "@/state/ShellState";
import { ActionType } from "@/reducer/ShellReducer";
import { emit } from "@/observability/Emitter";
import { Tag } from "@/observability/tags";
import { Anchor, AnchorScope, AppSlot, appAnchorId } from "./Anchor";
import { BridgeStatus } from "@/observability/reasons";

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

const PALETTE = {
  ground: "#212327",
  chrome: "#26292e",
  input: "#1a1c20",
  chromeAlt: "#2a2d33",
  text: "#b9bec5",
  textHi: "#e2e5e9",
  textDim: "#9aa0a8",
  textFaint: "#62676f",
  textFaintest: "#4a4e55",
  accent: "#82a5c8",
} as const;

const shellStyle: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: PALETTE.ground,
  color: PALETTE.text,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 13,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, padding: "8px 16px",
  background: PALETTE.chrome, flex: "none", whiteSpace: "nowrap", minWidth: 0,
};

const bottomBarStyle: React.CSSProperties = {
  display: "flex", gap: 16, padding: "7px 16px",
  background: PALETTE.chromeAlt, fontSize: 11, color: PALETTE.textFaint,
  flex: "none",
};

function TrafficLights(): JSX.Element {
  const dot: React.CSSProperties = {
    width: 12, height: 12, borderRadius: "50%", background: PALETTE.textFaintest,
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
      <span style={{ color: PALETTE.textHi, fontWeight: 600 }}>substrate</span>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: dotColor, display: "inline-block", marginLeft: 3,
      }} />
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

  const bridgeByte = bridge === BridgeStatus.ALIVE ? 128 : bridge === BridgeStatus.DEAD ? 255 : 0;

  // v7 logoDot color per state — v0.1 keeps it at textFaint until session status wires up.
  const logoDot = bridge === BridgeStatus.DEAD ? "#c26058"
                : bridge === BridgeStatus.ALIVE ? PALETTE.textFaint
                : PALETTE.textFaintest;

  const footStatus = bridge === BridgeStatus.DEAD ? "◌ bridge dead"
                   : bridge === BridgeStatus.ALIVE ? `● substrate ${substrateVersion} alive`
                   : "connecting";
  const footStatusColor = bridge === BridgeStatus.DEAD ? "#c26058"
                        : bridge === BridgeStatus.ALIVE ? PALETTE.accent
                        : PALETTE.textFaint;

  return (
    <div style={shellStyle}>
      <div style={headerStyle}>
        <TrafficLights />
        <Wordmark dotColor={logoDot} />
        <span
          title=""
          style={{
            color: PALETTE.textDim, fontSize: 11,
            overflow: "hidden", textOverflow: "ellipsis",
            flex: "0 1 auto", minWidth: 64,
          }}
        />
        <span style={{ fontSize: 10.5, color: PALETTE.textFaint, flex: "none" }} />
        <span style={{ flex: 1, minWidth: 8 }} />
        <span
          className="label"
          style={{ fontSize: 11.5, cursor: "pointer", flex: "none", color: PALETTE.textDim }}
        >records</span>
        <span
          className="label"
          style={{ fontSize: 11.5, cursor: "pointer", flex: "none", color: PALETTE.textDim }}
        >studio</span>
        <button
          disabled
          style={{
            fontFamily: "inherit", cursor: "default", flex: "none", fontSize: 11.5,
            color: PALETTE.textDim, background: "#3d434c", border: "none",
            borderRadius: 5, padding: "3px 10px", fontWeight: 600,
          }}
        >⌃` reveal</button>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <div
          style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: PALETTE.textFaintest, fontSize: 11,
          }}
        >
          <span className="label">port in progress — Q1 lands the header · Q2 the pane grid</span>
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
