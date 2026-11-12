// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The panes view (sprint 322; plan PLAN-2026-11-04-shell-to-react-r5.md, E2, F361): the grid of panes
// and its gutters. A pane with a session draws `PaneSession` (find, the transcript, the bar line, the
// task rows, the input bar); an unbound one draws its picker. Styles are copied from the panes block of
// the dc-runtime template (`web/reveal.html` at `d4322e1`); App writes the view (web/app/state/panes.ts).
//
// F361: each pane's transcript is a child of its pane. It was a React root of its own, which reveal.ts
// re-attached each time dc-runtime cleared its mount div.

import * as React from "react";
import { useSyncExternalStore } from "react";
import { Transcript } from "../reveal/transcript";
import { settings } from "./state/settings";
import { LOOK } from "./derive/look";
import { ActivityLine, TaskRows } from "./ActivityLine";
import { FindBar } from "./FindBar";
import { InputBar } from "./InputBar";
import { PanePicker } from "./PanePicker";
import { panes, type PaneCellView } from "./state/panes";

const gutter: React.CSSProperties = { position: "absolute", zIndex: 15 };

export function PaneSession({ paneId, fontSize }: { paneId: number; fontSize: number }): React.ReactElement {
  const look = useSyncExternalStore(settings.subscribe, settings.getSnapshot).look;
  return (
    <>
      <div data-view="panes" data-pane-id={String(paneId)} style={{ flex: "none" }}><FindBar view="panes" /></div>
      <div data-vm-transcript-scroller={String(paneId)} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 22px", lineHeight: LOOK[look].paneLineHeight, fontSize, minWidth: 0 }}>
        <div data-vm-transcript-mount="terminal" data-pane-id={String(paneId)}>
          <div data-vm-atom-root="terminal" data-pane-id={String(paneId)}><Transcript paneId={paneId} view="terminal" /></div>
        </div>
      </div>
      <div data-view="panes" data-pane-id={String(paneId)} style={{ flex: "none" }}><ActivityLine paneId={paneId} view="panes" /></div>
      <div data-view="panes" data-pane-id={String(paneId)} style={{ flex: "none" }}><TaskRows paneId={paneId} view="panes" /></div>
      <div data-view="panes" data-pane-id={String(paneId)} style={{ flex: "none", padding: "0 22px 16px" }}><InputBar paneId={paneId} /></div>
    </>
  );
}

function Pane({ pane, fontSize }: { pane: PaneCellView; fontSize: number }): React.ReactElement {
  return (
    <div data-pane={String(pane.id)} onClick={() => pane.focus()}
      style={{ background: "#212327", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, opacity: pane.opacity, position: "relative", gridColumn: pane.gridCol, gridRow: pane.gridRow }}>
      {pane.session ? <PaneSession paneId={pane.id} fontSize={fontSize} /> : <PanePicker paneId={pane.id} />}
    </div>
  );
}

export function PanesView(): React.ReactElement | null {
  const view = useSyncExternalStore(panes.subscribe, panes.getSnapshot).view;
  if (!view) return null;
  return (
    <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex" }}>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: view.cols, gridTemplateRows: view.rows, gap: 1, background: "rgba(255,255,255,.055)", minHeight: 0 }}>
        {view.panes.map((pane) => <Pane key={pane.id} pane={pane} fontSize={view.fontSize} />)}
      </div>
      {view.colGutters.map((gt, at) => <div key={"c" + at} onMouseDown={(ev) => gt.grab(ev)} title="drag to resize" style={{ ...gutter, top: 0, bottom: 0, left: gt.left, width: 11, transform: "translateX(-50%)", cursor: "col-resize" }} />)}
      {view.rowGutters.map((gt, at) => <div key={"r" + at} onMouseDown={(ev) => gt.grab(ev)} title="drag to resize" style={{ ...gutter, left: 0, right: 0, top: gt.top, height: 11, transform: "translateY(-50%)", cursor: "row-resize" }} />)}
    </div>
  );
}
