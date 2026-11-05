// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The one top bar (sprint 228; plan PLAN-2026-11-04-shell-to-react-r5.md, B3): the focused pane's
// dot and name (double-click renames), its driver chip and model card, its workspace chip and card,
// the records button and the view button. Studio's button is gone with Studio (sprint 242). Styles are the template's (reveal.html top bar). The data-*
// attributes are the ones the gates and the Electron rules (reveal.ts) find the bar by.

import * as React from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { topBar, topBarActions } from "./state/top_bar";
import "./hover.css";

const light: React.CSSProperties = { width: 12, height: 12, borderRadius: "50%", background: "#4a4e55" };
const chip: React.CSSProperties = { fontSize: 10.5, border: "1px solid rgba(255,255,255,.08)", borderRadius: 4, padding: "1px 7px", cursor: "pointer", display: "inline-flex", alignItems: "center", lineHeight: 1, maxWidth: "100%", boxSizing: "border-box", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const card: React.CSSProperties = { position: "absolute", left: 0, top: 22, zIndex: 30, background: "#26292e", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, padding: "9px 13px", display: "block", minWidth: 270, boxShadow: "0 8px 24px rgba(0,0,0,.4)", fontSize: 10.5, lineHeight: 1.8, color: "#9aa0a8", whiteSpace: "nowrap" };
const bright: React.CSSProperties = { color: "#e2e5e9" };
const page: React.CSSProperties = { fontSize: 11.5, cursor: "pointer", flex: "none" };

/** The name editor: ↵ names the session, Escape cancels, an empty name changes nothing (UI sprint 145). */
function NameInput({ start }: { start: string }): React.ReactElement {
  const [value, setValue] = useState(start);
  useEffect(() => { setValue(start); }, [start]);
  const onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Escape") topBarActions().finishEdit(null);
    else if (ev.key === "Enter") topBarActions().finishEdit(value.trim() || null);
  };
  return (
    <input value={value} onChange={(ev) => setValue(ev.target.value)} onKeyDown={onKeyDown}
      style={{ background: "#1a1c20", border: "1px solid #82a5c8", borderRadius: 4, color: "#e2e5e9", fontFamily: "inherit", fontSize: 11, padding: "1px 6px", outline: "none", width: 160 }} />
  );
}

export function TopBar(): React.ReactElement {
  const bar = useSyncExternalStore(topBar.subscribe, topBar.getSnapshot, topBar.getSnapshot);
  const act = topBarActions;
  return (
    <div data-top-bar="1" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "#26292e", flex: "none", whiteSpace: "nowrap", minWidth: 0 }}>
      <div data-fake-lights="1" style={{ display: "flex", gap: 6, flex: "none" }}><span style={light} /><span style={light} /><span style={light} /></div>
      <span style={{ display: "inline-flex", alignItems: "baseline", flex: "none" }}>
        <span style={{ color: "#e2e5e9", fontWeight: 600 }}>substrate</span>
        <span title="the dot is this session's status" style={{ width: 6, height: 6, borderRadius: "50%", background: bar.dotBg, border: `1px solid ${bar.dot}`, boxSizing: "border-box", display: "inline-block", marginLeft: 3 }} />
      </span>
      {bar.editing
        ? <NameInput start={bar.nameVal} />
        : <span data-crumb="1" onDoubleClick={() => act().startEdit()} title={`${bar.crumb} · double-click to rename`} style={{ color: "#9aa0a8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto", minWidth: 24, cursor: "text" }}>{bar.crumb}</span>}
      {bar.showChips ? (
        <>
          {bar.showDriverChip ? (
            <span data-dropdown-region="driver" style={{ position: "relative", flex: "0 3 auto", minWidth: 18, maxWidth: "100%", display: "inline-flex", alignItems: "center" }}>
              {/* UI sprint 139 (U125): the chip is an indicator; the model is picked in the workspace bar, or changed with /model. */}
              <span data-model-chip="1" className="hover-top-bar-model-chip" onClick={() => act().toggleModelCard()} style={{ ...chip, color: "#9aa0a8" }}>{bar.driverName}</span>
              {bar.modelCardOpen ? (
                <span data-model-card="1" style={card}>
                  model <span data-model-card-driver="1" style={bright}>{bar.model}</span><br />
                  version <span style={bright}>{bar.modelVersion}</span> · guidance <span style={bright}>{bar.guidance}</span><br />
                  length <span style={bright}>{bar.length}</span> · tone <span style={bright}>{bar.tone}</span><br />
                  <span style={{ color: "#62676f" }}>change it with /model</span>
                </span>
              ) : null}
            </span>
          ) : null}
          <span data-dropdown-region="workspace" style={{ position: "relative", flex: "0 4 auto", minWidth: 18, display: "inline-flex", alignItems: "center" }}>
            <span className="hover-top-bar-ws-chip" onClick={() => act().toggleWsCard()} style={{ ...chip, color: "#62676f" }}>{bar.wsLabel}</span>
            {bar.wsCardOpen ? (
              <span style={card}>
                workspace <span style={bright}>{bar.workspace}</span><br />
                shape <span style={bright}>{bar.shape}</span>
              </span>
            ) : null}
          </span>
        </>
      ) : null}
      <span style={{ fontSize: 10.5, color: "#62676f", flex: "none" }}>{bar.escHint}</span>
      <span style={{ flex: 1, minWidth: 8 }} />
      <span className="hover-top-bar-records" onClick={() => act().openRecords()} style={{ ...page, color: bar.recordsColor }}>records</span>
      <button onClick={() => act().toggleReveal()} style={{ fontFamily: "inherit", cursor: "pointer", flex: "none", fontSize: 11.5, color: bar.revealColor, background: bar.revealBg, border: "none", borderRadius: 5, padding: "3px 10px", fontWeight: 600 }}>{bar.revealLabel}</button>
    </div>
  );
}
