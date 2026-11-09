// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The pane picker (sprint 283; plan PLAN-2026-11-04-shell-to-react-r5.md, C5, C6): the workspace
// column with each open row's sessions, the model column, the GUIDANCE, LENGTH and TONE lines, and the
// typed-path box with the keys' hint. An unbound pane draws it at its bottom. Styles and data-* hooks are
// copied from the picker block of the dc-runtime template (`web/reveal.html` at `d4322e1`) and its
// `web/partials/choice-line.html`; App writes the view (web/app/state/picker.ts).

import * as React from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { picker, type PickerView } from "./state/picker";
import "./hover.css";

const head: React.CSSProperties = { padding: "0 14px", fontSize: 9.5, letterSpacing: ".14em" };

/** The typed path keeps its own copy, so the caret stays put until App's view catches up; a change
 *  App makes (⇥ fills the path, a pick clears it) replaces it. */
function WsInput({ paneId, view }: { paneId: number; view: PickerView }): React.ReactElement {
  const [text, setText] = useState(view.wsQ);
  useEffect(() => { setText(view.wsQ); }, [view.wsQ]);
  return (
    <input data-ws-input={String(paneId)} value={text} placeholder={view.wsPlaceholder}
      onChange={(ev) => { setText(ev.target.value); view.onWsQ(ev); }} onKeyDown={(ev) => view.onWsKey(ev)}
      style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e5e9", fontFamily: "inherit", fontSize: 12 }} />
  );
}

function ChoiceLine({ line, modelArmed, guidancePos }: { line: PickerView["lines"][number]; modelArmed: string; guidancePos: string }): React.ReactElement {
  const attrs = { [`data-${line.key}-half`]: "1", "data-armed": modelArmed };
  return (
    <div {...attrs} style={{ position: guidancePos as React.CSSProperties["position"], left: 0, right: 0, bottom: line.bottom, height: 31, boxSizing: "border-box", display: "flex", gap: 4, alignItems: "center", padding: "0 14px", borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden" }}>
      <span style={{ fontSize: 9.5, letterSpacing: ".14em", color: line.headColor, marginRight: 8 }}>{line.head}</span>
      {line.rows.map((gr) => {
        const row = { [`data-${line.key}-row`]: gr.label, "data-lit": gr.lit, title: gr.meta };
        return gr.live
          ? <span key={gr.label} {...row} className="hover-choice-row" onClick={() => gr.pick()} style={{ color: gr.color, background: gr.bg, borderRadius: 4, padding: "0 8px", cursor: "pointer" }}>{gr.label}</span>
          : <span key={gr.label} {...row} style={{ color: gr.greyColor, padding: "0 8px", cursor: "default" }}>{gr.label}</span>;
      })}
      <span className={line.noteClass} style={{ marginLeft: "auto", color: line.noteColor, overflow: "hidden", textOverflow: "ellipsis" }}>{line.note}</span>
    </div>
  );
}

export function PanePicker({ paneId }: { paneId: number }): React.ReactElement | null {
  const st = useSyncExternalStore(picker.subscribe, picker.getSnapshot, picker.getSnapshot);
  const view = st.views[paneId];
  if (!view) return null;
  return (
    <>
      <div style={{ flex: 1 }} />
      <div style={{ flex: "none", padding: "0 22px 16px" }}>
        <div style={{ border: "1px solid rgba(255,255,255,.13)", borderRadius: 6, background: "#1a1c20", overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: view.pickerDir as React.CSSProperties["flexDirection"] }}>
            <div style={{ flex: 1, minWidth: 0, padding: "6px 0", fontSize: 11.5, lineHeight: 2.1 }}>
              <div data-ws-scroll="1" onClick={(ev) => view.onWsListClick(ev)} style={{ height: view.wsListH, overflowY: "auto" }}>
                <div style={{ ...head, color: "#62676f" }}>WORKSPACE</div>
                {view.wsRows.map((wr) => (
                  <React.Fragment key={wr.path}>
                    <div data-ws-lit={wr.litAttr} style={{ padding: "0 14px", display: "flex", gap: 8, background: wr.bg, whiteSpace: "nowrap", overflow: "hidden", alignItems: "center" }}>
                      <span onClick={(ev) => wr.toggleExpand(ev)} style={{ color: "#62676f", width: 12, flex: "none", cursor: "pointer", textAlign: "center", fontSize: 11 }}>{wr.chevron}</span>
                      <div onClick={() => wr.pick()} className="hover-picker-row" style={{ flex: 1, display: "flex", gap: 12, cursor: "pointer", overflow: "hidden" }}>
                        <span style={{ color: wr.c, width: 218, flex: "none", overflow: "hidden", textOverflow: "ellipsis" }}>{wr.path}</span>
                        <span style={{ color: "#4a4e55", overflow: "hidden", textOverflow: "ellipsis" }}>{wr.meta}</span>
                        <span style={{ marginLeft: "auto", color: "#62676f", flex: "none" }}>{wr.key}</span>
                      </div>
                    </div>
                    {wr.expanded ? wr.sessions.map((ws) => (
                      <div key={ws.sessionIdShort} onClick={() => ws.pick()} data-ws-lit={ws.litAttr} className="hover-picker-row" style={{ padding: "2px 14px 2px 40px", display: "flex", gap: 8, cursor: "pointer", fontSize: 10.5, overflow: "hidden", whiteSpace: "nowrap", alignItems: "center", background: ws.bg }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: ws.dotColor, flex: "none" }} />
                        <span style={{ color: "#b9bec5", overflow: "hidden", textOverflow: "ellipsis", flex: "none", maxWidth: 200 }}>{ws.name}</span>
                        <span style={{ color: "#62676f", overflow: "hidden", textOverflow: "ellipsis" }}>{ws.statusLabel} · {ws.driver}</span>
                        <span style={{ marginLeft: "auto", color: "#62676f", flex: "none" }}>{ws.sessionIdShort}</span>
                      </div>
                    )) : null}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div data-model-half="1" data-armed={view.modelArmed} style={{ flex: 1, minWidth: 0, position: "relative", borderLeft: view.modelBorderL, borderTop: view.modelBorderT }}>
              <div data-model-scroll="1" style={{ position: view.modelInnerPos as React.CSSProperties["position"], top: 0, left: 0, right: 0, bottom: view.modelScrollBottom, maxHeight: view.modelMaxH, overflowY: "auto", padding: "6px 0", fontSize: 11.5, lineHeight: 2.1 }}>
                <div style={{ ...head, color: view.modelHeadColor }}>MODEL</div>
                {view.modelRows.map((mr, i) => (mr.liveRow || mr.greyRow) ? (
                  <div key={i} data-model-row={mr.label} data-lit={mr.lit} className={mr.liveRow ? "hover-picker-row" : undefined} style={{ display: "flex", gap: 8, padding: `0 14px 0 ${mr.indent}px`, background: mr.bg, whiteSpace: "nowrap", overflow: "hidden", alignItems: "center", cursor: mr.cursor }}>
                    <span onClick={(ev) => mr.pick(ev)} style={{ flex: 1, color: mr.color, overflow: "hidden", textOverflow: "ellipsis" }}>{mr.label}</span>
                    <span onClick={(ev) => mr.toggleExpand(ev)} style={{ color: "#62676f", width: 12, flex: "none", textAlign: "center", cursor: mr.cursor, fontSize: 11 }}>{mr.chevron}</span>
                  </div>
                ) : null)}
              </div>
              {view.lines.map((line) => <ChoiceLine key={line.key} line={line} modelArmed={view.modelArmed} guidancePos={view.guidancePos} />)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "9px 13px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
            <span style={{ color: "#82a5c8" }}>›</span>
            <WsInput paneId={paneId} view={view} />
          </div>
        </div>
      </div>
    </>
  );
}
