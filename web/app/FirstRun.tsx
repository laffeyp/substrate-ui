// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// First run (sprint 221; plan PLAN-2026-11-04-shell-to-react-r5.md, B2): the drivers this machine
// has, one row each, and the workspace a session gets by default. Styles are the first-run block's
// in the dc-runtime template (`web/reveal.html` at `d4322e1`), and so is its text: the top bar's
// "s-1a04" and the workspace line "~/Documents/substrate · default · created on bind". Sprint 221 had replaced those two texts;
// sprint 334 restored them, since a refactor changes no text (BLACKBOARD, 2026-11-05 failure entry).

import * as React from "react";
import { useSyncExternalStore } from "react";
import { cliAgents, firstRunRows } from "./derive/first_run";
import { chrome } from "./state/chrome";
import { firstRun, firstRunAsked, pickFirstRun } from "./state/first_run";
import { shell } from "./state/shell";
import "./hover.css";

const light: React.CSSProperties = { width: 12, height: 12, borderRadius: "50%", background: "#4a4e55" };
const chip: React.CSSProperties = { fontSize: 10.5, color: "#4a4e55", border: "1px dashed rgba(255,255,255,.12)", borderRadius: 4, padding: "1px 7px" };
const heading: React.CSSProperties = { padding: "0 15px", fontSize: 9.5, letterSpacing: ".14em", color: "#62676f" };

export function FirstRun(): React.ReactElement | null {
  const fr = useSyncExternalStore(firstRun.subscribe, firstRun.getSnapshot, firstRun.getSnapshot);
  const ch = useSyncExternalStore(chrome.subscribe, chrome.getSnapshot, chrome.getSnapshot);
  const snaps = useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot);
  if (fr.done || !(fr.forced || firstRunAsked(window.location.search))) return null;
  const snap = snaps.snapshots[ch.focusedPane];
  const rows = firstRunRows(snap?.driverRoster ?? [], snap?.driverDefault ?? null, cliAgents(snap?.driverGroups ?? []));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#212327", display: "flex", flexDirection: "column" }}>
      <div data-top-bar="1" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "#26292e", whiteSpace: "nowrap" }}>
        <div data-fake-lights="1" style={{ display: "flex", gap: 6, flex: "none" }}><span style={light} /><span style={light} /><span style={light} /></div>
        <span style={{ display: "inline-flex", alignItems: "baseline", flex: "none" }}>
          <span style={{ color: "#e2e5e9", fontWeight: 600 }}>substrate</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#62676f", display: "inline-block", marginLeft: 3 }} />
        </span>
        <span style={{ color: "#e2e5e9", fontSize: 11 }}>s-1a04</span>
        <span style={chip}>driver —</span>
        <span style={chip}>⌥ —</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: "0 40px 20px", maxWidth: 900, width: "100%", boxSizing: "border-box", alignSelf: "center" }}>
        <div style={{ border: "1px solid rgba(255,255,255,.13)", borderRadius: 6, background: "#1a1c20", overflow: "hidden", fontFamily: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", color: "#b9bec5" }}>
          <div style={{ padding: "6px 0", fontSize: 11.5, lineHeight: 2.1 }}>
            <div style={heading}>DRIVERS ON THIS MACHINE</div>
            {rows.map((row) => (
              <div key={row.driver} className="hover-first-run-row" onClick={() => pickFirstRun(row.driver)} style={{ padding: "0 15px", display: "flex", gap: 12, cursor: "pointer", background: row.preselected ? "#2e3138" : "transparent", whiteSpace: "nowrap", overflow: "hidden" }}>
                <span style={{ color: row.preselected ? "#e2e5e9" : "#b9bec5", width: 230, flex: "none", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</span>
                <span style={{ color: "#4a4e55", overflow: "hidden", textOverflow: "ellipsis" }}>{row.meta}</span>
                <span style={{ marginLeft: "auto", color: "#62676f", flex: "none" }}>{row.preselected ? "↵" : ""}</span>
              </div>
            ))}
            <div style={{ ...heading, marginTop: 6 }}>WORKSPACE</div>
            <div style={{ padding: "0 15px", display: "flex", gap: 12 }}>
              <span style={{ color: "#b9bec5", width: 230 }}>~/Documents/substrate</span>
              <span style={{ color: "#4a4e55" }}>default · created on bind</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "9px 14px", borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 11.5 }}>
            <span style={{ color: "#82a5c8" }}>›</span>
            <span style={{ color: "#4a4e55" }}>click a driver to start — everything changeable later: header ▾ · /model · settings ⌘,</span>
          </div>
        </div>
      </div>
    </div>
  );
}
