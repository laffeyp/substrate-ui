// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The records page (sprint 237; plan PLAN-2026-11-04-shell-to-react-r5.md, B4): every workspace on
// record, each opening to its sessions in pages of 50; a session opens in the focused pane. Styles
// are the template's (reveal.html records block); its host div is the page's scroll container.

import * as React from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { chrome } from "./state/chrome";
import { addWorkspace, canAddWorkspace, currentRecords, loadMore, openSession, recordsState, toggleWorkspace } from "./state/records";
import { shell } from "./state/shell";
import "./hover.css";

/** The relative times ("12s ago") read the clock; the page redraws once a second while open. */
function useSecondTick(): number {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function RecordsPage(): React.ReactElement {
  useSyncExternalStore(recordsState.subscribe, recordsState.getSnapshot, recordsState.getSnapshot);
  useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot);
  useSyncExternalStore(chrome.subscribe, chrome.getSnapshot, chrome.getSnapshot);
  const now = useSecondTick();
  const { groups } = currentRecords(now);
  const onListScroll = (path: string, hasMore: boolean) => (ev: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore) return;
    const el = ev.currentTarget;
    if (el.scrollHeight - (el.scrollTop + el.clientHeight) < 100) loadMore(path);
  };
  return (
    // UI sprint 157: the column is the picker box's width (the pane less 22px a side).
    <div data-records-column="1">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: ".14em", color: "#62676f" }}>WORKSPACES</div>
        {canAddWorkspace()
          ? <span className="hover-records-add" onClick={() => { void addWorkspace(); }} style={{ marginLeft: "auto", fontSize: 10.5, color: "#82a5c8", border: "1px solid rgba(255,255,255,.09)", borderRadius: 4, padding: "2px 9px", cursor: "pointer", userSelect: "none" }}>+ add workspace</span>
          : null}
      </div>
      {/* UI sprint 153: the workspace bar's box (picker box border, radius, background; rows at 14px). */}
      <div data-records-workspaces="1" style={{ border: "1px solid rgba(255,255,255,.13)", borderRadius: 6, background: "#1a1c20", padding: "0 0 16px" }}>
        {groups.map((ws) => (
          <div key={ws.path} style={{ marginTop: 16 }}>
            <div onClick={() => toggleWorkspace(ws.path)} data-records-lit={ws.lit ? "1" : "0"} className="hover-records-workspace" style={{ color: "#d7dade", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8, padding: "0 14px", background: ws.lit ? "#2e3138" : "transparent" }}>
              <span style={{ color: "#62676f", fontSize: 11, width: 12 }}>{ws.expanded ? "▾" : "▸"}</span>
              <span>{ws.path}</span>
              <span style={{ color: "#62676f", fontSize: 11 }}>{ws.shapeLabel}</span>
              <span style={{ marginLeft: "auto", color: "#62676f", fontSize: 11 }}>{ws.countLabel}</span>
            </div>
            {ws.expanded ? (
              <div onScroll={onListScroll(ws.path, ws.hasMore)} style={{ margin: "6px 14px 0 34px", maxHeight: 340, overflowY: "auto", border: "1px solid rgba(255,255,255,.05)", borderRadius: 6, background: "rgba(0,0,0,.12)", padding: "4px 0" }}>
                {ws.sessions.map((s) => (
                  <div key={s.row.sessionId} onClick={() => openSession(s.row)} data-records-session="1" data-records-lit={s.lit ? "1" : "0"} className="hover-records-session" style={{ padding: "8px 14px", fontSize: 12, display: "flex", gap: 9, alignItems: "center", cursor: "pointer", background: s.lit ? "#2e3138" : "transparent" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dotColor, flex: "none" }} />
                    <span style={{ color: "#e2e5e9" }}>{s.name}</span>
                    <span style={{ color: "#62676f", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.statusLabel} · {s.driver} · {s.when}</span>
                    <span style={{ marginLeft: "auto", color: "#62676f", fontSize: 11, flex: "none" }}>{s.idShort} · open ▸</span>
                  </div>
                ))}
                {ws.hasMore
                  ? <div onClick={() => loadMore(ws.path)} className="hover-records-more" style={{ padding: "8px 14px", color: "#82a5c8", fontSize: 11.5, cursor: "pointer", textAlign: "center" }}>{ws.remainingLabel}</div>
                  : null}
              </div>
            ) : null}
          </div>
        ))}
        {groups.length === 0
          ? <div style={{ padding: "8px 14px", color: "#62676f", fontSize: 11.5 }}>no workspaces on record — open one via + add workspace</div>
          : null}
      </div>
    </div>
  );
}
