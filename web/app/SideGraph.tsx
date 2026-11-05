// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's side graph (sprint 296; plan PLAN-2026-11-04-shell-to-react-r5.md, D3): the stream's spans
// along the seq axis, one lane for the model, one per tool by name, one for the turn ends. A click on a
// segment lights its seq, as a click on its row does. The lane names are drawn twice: hidden in the
// scrolling track, to size it, and over it, fixed at the left, so they stay in view as the graph
// scrolls. Styles are the template's (reveal.html side block); the lanes come from
// web/app/derive/stream.ts, the record from web/app/state/stream.ts, the selection from
// web/app/state/meta.ts.

import * as React from "react";
import { useMemo, useSyncExternalStore } from "react";
import { segBox, sideAxis, sideLanes, streamRows, streamSpans } from "./derive/stream";
import { stream } from "./state/stream";
import { meta, pickSeq } from "./state/meta";
import "./hover.css";

const LIT = "#9db8d6";
const lanesCol: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 9, fontSize: 11 };
const laneRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10 };

/** The meta view ties the graph's scroll to the stream's (web/app/MetaView.tsx). */
export interface SideGraphProps { scrollRef: React.Ref<HTMLDivElement>; onScroll(el: HTMLDivElement): void; }

export function SideGraph({ scrollRef, onScroll }: SideGraphProps): React.ReactElement {
  const st = useSyncExternalStore(stream.subscribe, stream.getSnapshot);
  const sel = useSyncExternalStore(meta.subscribe, meta.getSnapshot).sel;
  const rows = useMemo(() => streamRows(st.envelopes), [st.envelopes]);
  const lanes = useMemo(() => sideLanes(rows, streamSpans(rows)), [rows]);
  const axis = sideAxis(rows);
  return (
    <div style={{ position: "relative", borderBottom: "1px solid rgba(255,255,255,.055)", flex: "none" }}>
      <div data-side-scroll="1" ref={scrollRef} onScroll={(ev) => onScroll(ev.currentTarget)} style={{ background: "#1a1c20", padding: "12px 16px 14px", overflowX: "auto" }}>
        <div style={{ minWidth: 540 }}>
          <div style={{ display: "flex", fontSize: 11, color: "#62676f", marginBottom: 10 }}>
            <span>seq {axis.first}</span><span style={{ flex: 1, borderBottom: "1px dashed rgba(255,255,255,.12)", margin: "0 8px 5px" }} /><span>{axis.last}</span>
          </div>
          <div style={lanesCol}>
            {lanes.map((ln, at) => (
              <div key={at} data-side-lane={ln.label} style={laneRow}>
                <span style={{ width: 92, flex: "none", visibility: "hidden", whiteSpace: "nowrap", overflow: "hidden" }}>{ln.label}</span>
                <div style={{ position: "relative", flex: 1, height: 12 }}>
                  {ln.segs.map((sg) => {
                    const box = segBox(sg, axis);
                    return <div key={sg.seq + ":" + sg.from} className="hover-side-seg" onClick={() => pickSeq(sg.seq)} title={"seq " + sg.seq + " — click to inspect"}
                      style={{ position: "absolute", left: box.l, width: box.w, top: 1, height: 10, borderRadius: 2, background: sel === sg.seq ? LIT : sg.base, cursor: "pointer" }} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 16, top: 12, bottom: 14, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ display: "flex", fontSize: 11, marginBottom: 10, visibility: "hidden" }}><span>seq 214</span></div>
        <div style={lanesCol}>
          {lanes.map((ln, at) => (
            <div key={at} style={laneRow}>
              <span style={{ color: ln.color, whiteSpace: "nowrap", overflow: "hidden", textShadow: "0 0 6px #1a1c20,0 0 10px #1a1c20,0 0 3px #1a1c20" }}>{ln.label}</span>
              <div style={{ width: 1, height: 12, flex: "none" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
