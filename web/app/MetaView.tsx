// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The meta view's machinery column (sprint 316; plan PLAN-2026-11-04-shell-to-react-r5.md, D7): the
// lens chips, the stream's level and direction, the side graph, the scroller and the lens on show,
// and the gutter between the transcript and the machinery. Its state is web/app/state/meta.ts. The
// transcript column beside it stays in the template until the panes move (plan group E).
//
// Every lens takes its width from this column (D81): none reads the window's width, so each draws the
// same in meta's right half and in the editor view's 400px column. The structure lens's narrow layout
// is a container query on its own box (web/app/structure.css).

import * as React from "react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { GraphDirection, GraphMode, RevealLevel } from "../vm/kinds";
import { followBottom } from "../reveal/follow_bottom";
import { dragSplit, meta, setDir, setLevel, setMode, type MetaMode } from "./state/meta";
import { setFindScope } from "./state/find";
import { IoLens } from "./IoLens";
import { LanguageLens } from "./LanguageLens";
import { SceneLens } from "./SceneLens";
import { SideGraph } from "./SideGraph";
import { StreamLens } from "./StreamLens";
import { StructureLens } from "./StructureLens";

const ON = "#d7dade";
const OFF = "#62676f";
const LIT_BG = "#2e3138";

/** The lens chips, in the order the design gives them. */
export const LENSES: readonly { mode: MetaMode; label: string }[] = [
  { mode: GraphMode.Stream, label: "stream+graph" }, { mode: GraphMode.IO, label: "i/o" }, { mode: GraphMode.Structure, label: "structure" },
  { mode: GraphMode.Language, label: "language" }, { mode: GraphMode.Scene, label: "scene" },
];

interface Controller { refreshLanguage?(): void }
const controller = (paneId: number): Controller | null => {
  const vm = (window as unknown as { __vm?: { get?(id: number): Controller | null } }).__vm;
  return vm && typeof vm.get === "function" ? vm.get(paneId) : null;
};

function pickLens(mode: MetaMode, paneId: number): void {
  setMode(mode);
  // The language lens asks for a fresh measure of the record when it opens.
  if (mode === GraphMode.Language) controller(paneId)?.refreshLanguage?.();
}

const toggles: React.CSSProperties = { flex: "none", display: "flex", border: "1px solid rgba(255,255,255,.09)", borderRadius: 4, overflow: "hidden", fontSize: 11 };
const toggle = (on: boolean): React.CSSProperties => ({ cursor: "pointer", padding: "2px 9px", whiteSpace: "nowrap", color: on ? ON : OFF, background: on ? LIT_BG : "transparent" });

function Lens({ mode }: { mode: MetaMode }): React.ReactElement | null {
  if (mode === GraphMode.Stream) return <StreamLens />;
  if (mode === GraphMode.IO) return <IoLens />;
  if (mode === GraphMode.Structure) return <StructureLens />;
  if (mode === GraphMode.Language) return <LanguageLens />;
  if (mode === GraphMode.Scene) return <SceneLens />;
  return null;
}

export function MetaView({ paneId }: { paneId: number }): React.ReactElement {
  const mt = useSyncExternalStore(meta.subscribe, meta.getSnapshot);
  const side = mt.mode === GraphMode.Stream && mt.dir === GraphDirection.Side;
  const streamEl = useRef<HTMLDivElement | null>(null);
  const graphEl = useRef<HTMLDivElement | null>(null);
  // Set while one scroller moves the other, so the other's scroll event does not move it back.
  const syncing = useRef(false);
  const release = () => requestAnimationFrame(() => { syncing.current = false; });
  const streamRef = useCallback((el: HTMLDivElement | null) => { streamEl.current = el; if (el) followBottom(el); }, []);

  // In the side direction the graph scrolls across as the stream scrolls down, in proportion.
  const onStreamScroll = (el: HTMLDivElement) => {
    const graph = graphEl.current;
    if (syncing.current || !side || !graph) return;
    const share = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    syncing.current = true; graph.scrollLeft = share * Math.max(0, graph.scrollWidth - graph.clientWidth); release();
  };
  const onGraphScroll = (el: HTMLDivElement) => {
    const list = streamEl.current;
    if (syncing.current || !list) return;
    const share = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth);
    syncing.current = true; list.scrollTop = share * Math.max(0, list.scrollHeight - list.clientHeight); release();
  };

  // The gutter: a drag moves the split while the button is down.
  const dragging = useRef(false);
  useEffect(() => {
    const move = (ev: MouseEvent) => { if (dragging.current) dragSplit(ev.movementX, window.innerWidth); };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  return (
    <>
      <div data-meta-view={String(paneId)} style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#1a1c20" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 8px", padding: "10px 16px 8px", fontSize: 11.5, flex: "none", alignItems: "center" }}>
          {LENSES.map((ln) => (
            <span key={ln.mode} data-lens-chip={ln.mode} onClick={() => pickLens(ln.mode, paneId)} style={{ cursor: "pointer", padding: "2px 10px", borderRadius: 4, color: mt.mode === ln.mode ? ON : OFF, background: mt.mode === ln.mode ? LIT_BG : "transparent" }}>{ln.label}</span>
          ))}
          {mt.mode === GraphMode.Stream && <>
            <span style={{ ...toggles, marginLeft: "auto" }}>
              <span onClick={() => setLevel(RevealLevel.All)} style={toggle(mt.level === RevealLevel.All)} title="every event on the record, lifecycle included">all</span>
              <span onClick={() => setLevel(RevealLevel.App)} style={toggle(mt.level === RevealLevel.App)} title="hide the low-level machinery: TriggerFired · ProducerStarted · ProducerCompleted">app</span>
            </span>
            <span style={toggles}>
              <span onClick={() => setDir(GraphDirection.Down)} style={toggle(mt.dir === GraphDirection.Down)}>⇅ down</span>
              <span onClick={() => setDir(GraphDirection.Side)} style={toggle(mt.dir === GraphDirection.Side)}>→ side</span>
            </span>
          </>}
        </div>
        {side && <SideGraph scrollRef={graphEl} onScroll={onGraphScroll} />}
        <div ref={streamRef} data-stream-scroll="1" onScroll={(ev) => onStreamScroll(ev.currentTarget)} onClick={() => setFindScope("stream")} style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Lens mode={mt.mode} />
        </div>
      </div>
      <div data-meta-gutter="1" onMouseDown={(ev) => { ev.preventDefault(); dragging.current = true; }} title="drag — more transcript or more machinery"
        style={{ position: "absolute", top: 0, bottom: 0, left: (mt.split / (mt.split + 1) * 100).toFixed(2) + "%", width: 11, transform: "translateX(-50%)", cursor: "col-resize", zIndex: 15 }} />
    </>
  );
}
