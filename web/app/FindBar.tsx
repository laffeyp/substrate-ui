// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The find bar (sprint 270; plan PLAN-2026-11-04-shell-to-react-r5.md, C3): the query and what it
// matches in the scope, the transcript's lines of the focused pane or meta's stream events. Styles
// are the template's; the panes and meta views differ only in padding.

import * as React from "react";
import { useSyncExternalStore } from "react";
import type { PaneView } from "./ActivityLine";
import { chrome } from "./state/chrome";
import { closeFind, find, setFindQuery } from "./state/find";
import { shell } from "./state/shell";

export function findCount(q: string, scope: string, transcriptTexts: readonly string[], streamMatches: number): string {
  if (!q) return "scope: " + scope + " — click a lens to move it";
  if (scope === "stream") return streamMatches + " matching events · scope: stream";
  return transcriptTexts.filter((text) => text.includes(q)).length + " matching lines · scope: transcript";
}

export function FindBar({ view }: { view: PaneView }): React.ReactElement | null {
  const st = useSyncExternalStore(find.subscribe, find.getSnapshot, find.getSnapshot);
  const ch = useSyncExternalStore(chrome.subscribe, chrome.getSnapshot, chrome.getSnapshot);
  const snaps = useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot);
  if (!st.open) return null;
  const rows = snaps.snapshots[ch.focusedPane]?.transcript ?? [];
  const texts = rows.map((row) => String((row as { text?: unknown }).text || "").toLowerCase());
  const count = findCount(st.q.trim().toLowerCase(), st.scope, texts, st.streamMatches);
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: view === "panes" ? "8px 22px" : "8px 26px", borderBottom: "1px solid rgba(255,255,255,.055)", flex: "none" }}>
      <span style={{ color: "#62676f", fontSize: 11 }}>find</span>
      <div style={{ display: "flex", gap: 8, border: "1px solid rgba(255,255,255,.13)", borderRadius: 5, padding: "4px 10px", background: "#1a1c20", width: 230 }}>
        <input value={st.q} onChange={(ev) => setFindQuery(ev.target.value)} placeholder="find in transcript" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e5e9", fontFamily: "inherit", fontSize: 12 }} />
      </div>
      <span style={{ color: "#62676f", fontSize: 10.5 }}>{count}</span>
      <span onClick={closeFind} style={{ marginLeft: "auto", color: "#62676f", fontSize: 10.5, cursor: "pointer" }}>esc</span>
    </div>
  );
}
