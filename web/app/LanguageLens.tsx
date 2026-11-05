// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's language lens (sprint 310; plan PLAN-2026-11-04-shell-to-react-r5.md, D6; UI sprints 169,
// 174): lanes per measure, turns down, the window as a curve, a rule per setting change, marks where
// the drift detector fired, and one readout row for the selected turn. The geometry comes from
// web/reveal/language_lens.ts; the stream, view and lane from web/app/state/language.ts; the language
// view and the selection from web/app/state/stream.ts. Styles and hooks are the template's
// (reveal.html language block).

import * as React from "react";
import { useMemo, useSyncExternalStore } from "react";
import { buildLanguageLens, LANGUAGE_STREAM_TABS, languageView, languageViewTabs } from "../reveal/language_lens";
import { selectedTurn } from "./derive/language_keys";
import { language, setLanguageStream, setLanguageView } from "./state/language";
import { selectSeq, stream } from "./state/stream";

const ON = "#d7dade";
const OFF = "#62676f";
const abs: React.CSSProperties = { position: "absolute" };
const line = (left: number, color: string): React.CSSProperties => ({ position: "absolute", top: 0, bottom: 0, left, width: 1, background: color, pointerEvents: "none" });

export function LanguageLens(): React.ReactElement {
  const st = useSyncExternalStore(stream.subscribe, stream.getSnapshot);
  const lg = useSyncExternalStore(language.subscribe, language.getSnapshot);
  const selTurn = useMemo(() => selectedTurn(st.envelopes, st.sel), [st.envelopes, st.sel]);
  const lens = useMemo(() => buildLanguageLens(st.language, { stream: lg.stream, selTurn, lane: lg.lane, view: lg.view }), [st.language, lg.stream, lg.lane, lg.view, selTurn]);
  const viewNow = languageView(lg.stream, lg.view);
  return (
    <div data-lang="1" style={{ padding: "0 16px 16px", fontSize: 11 }}>
      <div style={{ display: "flex", gap: 12, padding: "0 0 8px", fontSize: 11, alignItems: "center" }}>
        {LANGUAGE_STREAM_TABS.map((tab) => (
          <span key={tab.id} data-lang-stream={tab.label} onClick={() => setLanguageStream(tab.id)} style={{ cursor: "pointer", color: lg.stream === tab.id ? ON : OFF }}>{tab.label}</span>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", border: "1px solid rgba(255,255,255,.09)", borderRadius: 4, overflow: "hidden" }}>
          {languageViewTabs(lg.stream).map((view) => (
            <span key={view} data-lang-view={view} onClick={() => setLanguageView(view)} style={{ cursor: "pointer", padding: "2px 9px", color: viewNow === view ? ON : OFF, background: viewNow === view ? "#2e3138" : "transparent" }}>{view}</span>
          ))}
        </span>
      </div>
      {!lens.has && <div data-lang-empty="1" style={{ color: OFF, fontSize: 11.5 }}>{lens.empty}</div>}
      {lens.has && <>
        {!!lens.note && <div data-lang-note="1" style={{ padding: "0 0 8px", color: OFF, fontSize: 10.5 }}>{lens.note}</div>}
        <div style={{ overflowX: "auto" }}>
          <div style={{ position: "relative", width: lens.width }}>
            <div style={{ position: "relative", height: 46 }}>
              {lens.groups.map((grp, at) => <span key={at} style={{ ...abs, top: 0, left: grp.left, width: grp.width, color: grp.color, fontSize: 9.5, letterSpacing: ".12em" }}>{grp.label}</span>)}
              <span style={{ ...abs, top: 16, left: 0, color: "#4a4e55", fontSize: 10 }}>turn</span>
              {lens.lanes.map((ln) => (
                <React.Fragment key={ln.key}>
                  <span data-lang-lane={ln.key} title={ln.explanation} style={{ ...abs, top: 16, left: ln.left, width: 78, color: "#b9bec5", fontSize: 10.5, cursor: "help", textDecoration: "underline dotted rgba(255,255,255,.22)", textUnderlineOffset: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ln.short}</span>
                  <span data-lang-unit={ln.key} title={ln.scaleTitle} style={{ ...abs, top: 31, left: ln.left, width: 78, color: "#5a5f66", fontSize: 9.5, cursor: "help", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ln.unit}</span>
                </React.Fragment>
              ))}
            </div>
            <div data-lang-body="1" style={{ position: "relative", height: lens.height, borderTop: "1px solid rgba(255,255,255,.06)" }}>
              {lens.rows.map((row, at) => (
                <React.Fragment key={at}>
                  {row.isRule && (
                    <div data-lang-rule={row.turn} style={{ ...abs, left: 0, right: 0, top: row.top, height: 18, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ flex: 1, borderTop: "1px solid #4a4e55" }} />
                      <span title={row.ruleText} style={{ position: "relative", zIndex: 1, background: "#1a1c20", padding: "0 6px", color: "#9aa0a8", fontSize: 10, whiteSpace: "nowrap", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{row.ruleText}</span>
                      <span style={{ flex: 3, borderTop: "1px solid #4a4e55" }} />
                    </div>
                  )}
                  {row.isTurn && (
                    <div data-lang-row={row.turn} onClick={() => selectSeq(row.seq)} style={{ ...abs, left: 0, right: 0, top: row.top, height: 18, cursor: "pointer", background: row.selected ? "#2a2d33" : "transparent" }}>
                      <span style={{ ...abs, left: 0, top: 2, color: OFF, fontSize: 10.5 }}>{row.label}</span>
                      {row.cells.map((cell, ci) => (
                        <React.Fragment key={ci}>
                          <span data-lang-bar={cell.barW} title={cell.title} style={{ ...abs, left: cell.barLeft, top: cell.barTop, width: cell.barW, height: cell.barH, borderRadius: 2, background: cell.color }} />
                          <span data-lang-bar2={cell.bar2W} style={{ ...abs, left: cell.bar2Left, top: 5, width: cell.bar2W, height: 8, borderRadius: 2, background: cell.color2 }} />
                          <span data-lang-hair={cell.hairW} style={{ ...abs, left: cell.hairLeft, top: 9, width: cell.hairW, height: 1, background: cell.color, filter: "brightness(2.6)" }} />
                          <span data-lang-mark={cell.mark} title={cell.markTitle} style={{ ...abs, left: cell.left, marginLeft: -8, top: 1, fontSize: 9, color: ON, cursor: "help" }}>{cell.mark}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
              {lens.dividers.map((dv, at) => <span key={"d" + at} data-lang-divider="1" style={line(dv.left, dv.color)} />)}
              {lens.guides.map((gd, at) => <span key={"g" + at} style={line(gd.left, gd.color)} />)}
              <svg width={lens.width} height={lens.height} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                {lens.paths.map((path, at) => <path key={at} d={path.d} stroke={path.stroke} strokeWidth="1.2" fill="none" opacity=".75" />)}
              </svg>
            </div>
            <div data-lang-readout="1" style={{ position: "relative", height: 22, marginTop: 6, borderTop: "1px solid rgba(255,255,255,.08)" }}>
              {lens.dividers.map((dv, at) => <span key={at} style={line(dv.left, dv.color)} />)}
              <span data-lang-readout-label="1" style={{ ...abs, left: 0, top: 5, color: ON, fontSize: 10.5 }}>{lens.readout.label}</span>
              {lens.readout.cells.map((cell, at) => <span key={at} data-lang-value="1" style={{ ...abs, left: cell.left, top: 5, color: cell.color, fontSize: 10.5 }}>{cell.text}</span>)}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8, color: "#4a4e55", fontSize: 10.5 }}>↑↓ turns · ←→ lanes · ↵ opens the turn in the stream · hover a lane for what it counts</div>
      </>}
    </div>
  );
}
