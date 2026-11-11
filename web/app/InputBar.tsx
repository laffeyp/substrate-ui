// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The one input bar, with its slash menu and hint (sprint 260; plan PLAN-2026-11-04-shell-to-react-r5.md,
// C1). It serves the pane it is given (`paneId`), wherever it is mounted: the panes view, the meta
// view, and later the editor view and the pages (design D90, the prompt in every view). Styles are
// the dc-runtime template's (`web/partials/input-bar.html` at `d4322e1`); the data-* hooks are the
// ones the gates read.

import * as React from "react";
import { useSyncExternalStore } from "react";
import { INPUT_HINT } from "./derive/control_notes";
import { slashHint } from "./derive/slash";
import { barKey, catalogFor, inputBar, paneInput, pickRow, removeChip, rowsFor, setText } from "./state/input_bar";
import { InputChipRemovedHow } from "../vm/signals.gen";
import { shell } from "./state/shell";
import "./hover.css";

/** `compact`: the editor's sill (sprint 415; frame 16c, 28 px tall) draws the same bar with less padding. */
export function InputBar({ paneId, compact = false }: { paneId: number; compact?: boolean }): React.ReactElement {
  useSyncExternalStore(inputBar.subscribe, inputBar.getSnapshot, inputBar.getSnapshot);
  // The catalog's current choices and the placeholder read the pane's controller snapshot.
  const snaps = useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot);
  const pane = paneInput(paneId);
  const rows = rowsFor(paneId);
  const hint = slashHint(pane.text, catalogFor(paneId));
  // UI sprint 182: a run's pane says why it takes no typing.
  const placeholder = snaps.snapshots[paneId]?.viewOnly || INPUT_HINT;
  let choiceAt = -1;
  return (
    <>
      {rows.length ? (
        <div style={{ borderRadius: "6px 6px 0 0", background: "#1a1c20", padding: "6px 0", fontSize: 12.5, lineHeight: 2.2, borderBottom: "1px solid rgba(255,255,255,.055)" }}>
          {rows.map((r) => {
            const lit = r.choice && (choiceAt += 1) === pane.slashSel;
            return (
              <div key={r.cmd} data-slash-row={r.cmd} data-current={r.current ? "1" : "0"} data-lit={lit ? "1" : "0"} className="hover-slash-row" onClick={() => pickRow(paneId, r)} style={{ padding: "0 16px", display: "flex", gap: 16, cursor: "pointer", background: lit ? "#2e3138" : "transparent" }}>
                <span style={{ color: "#9aa0a8", width: 160, flex: "none" }}>{r.cmd}</span>
                <span style={{ color: "#62676f" }}>{r.desc}</span>
              </div>
            );
          })}
        </div>
      ) : null}
      {/* UI sprint 141: the one input bar. */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", borderRadius: rows.length ? "0 0 6px 6px" : "6px", padding: compact ? "4px 12px" : "11px 16px", background: "#1a1c20" }}>
        <span style={{ color: "#82a5c8", lineHeight: 1.4 }}>›</span>
        {/* Sprint 443 (D94; 24k): the chips that go with the next message; the path on hover, × removes one. */}
        {pane.chips.length > 0 && (
          <div data-input-chips="1" style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: "none", maxWidth: "60%" }}>
            {pane.chips.map((c, k) => (
              <span key={`${c.kind}:${c.ref}`} data-chip={c.ref} data-chip-kind={c.kind} title={c.ref}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "1px 7px", borderRadius: 4, background: "#2b2e33", color: "#d7dade", fontSize: 12, lineHeight: 1.4, whiteSpace: "nowrap" }}>
                {c.label}
                <span data-chip-x={c.ref} title="remove" onClick={() => removeChip(paneId, k, InputChipRemovedHow.X)} style={{ color: "#62676f", fontSize: 10, cursor: "pointer" }}>×</span>
              </span>
            ))}
          </div>
        )}
        <div style={{ position: "relative", flex: 1, display: "flex", minWidth: 0 }}>
          {/* UI sprints 163, 166: the slash hint, in one column (in ch of the bar's font) behind the textarea. */}
          {hint ? (
            <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, pointerEvents: "none", whiteSpace: "pre", overflow: "hidden", fontSize: 13, lineHeight: 1.4 }}>
              <span data-slash-hint="1" style={{ position: "absolute", left: hint.left, top: 0, color: "var(--tx-hint)" }}>{hint.text}</span>
            </div>
          ) : null}
          <textarea data-input-bar="1" rows={1} value={pane.text} placeholder={placeholder}
            onChange={(ev) => setText(paneId, ev.target.value)} onKeyDown={(ev) => barKey(paneId, ev)}
            style={{ position: "relative", flex: 1, background: "none", border: "none", outline: "none", color: "#e2e5e9", fontFamily: "inherit", fontSize: 13, lineHeight: 1.4, padding: 0, margin: 0, resize: "none", fieldSizing: "content", maxHeight: "40vh", overflowY: "auto" } as React.CSSProperties} />
        </div>
      </div>
    </>
  );
}
