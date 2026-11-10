// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's footer (sprint 220; plan PLAN-2026-11-04-shell-to-react-r5.md, B2): the focused
// session's status, its name, and the key hint. Styles are the footer line's in
// the dc-runtime template (`web/reveal.html` at `d4322e1`).
// The status span is drawn when empty, as the template drew it, so the gaps stay where they were.

import * as React from "react";
import { useSyncExternalStore } from "react";
import { footerText } from "./derive/footer";
import { chrome } from "./state/chrome";
import { shell } from "./state/shell";
import { editor } from "./state/editor";
import { meta } from "./state/meta";

export function Footer(): React.ReactElement {
  const ch = useSyncExternalStore(chrome.subscribe, chrome.getSnapshot, chrome.getSnapshot);
  const snaps = useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot);
  const snap = snaps.snapshots[ch.focusedPane] ?? null;
  const showing = useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot).showing;
  const sel = useSyncExternalStore(meta.subscribe, meta.getSnapshot, meta.getSnapshot).sel;
  const text = footerText({ unbound: ch.unbound, title: ch.title, surfaceOpen: ch.surfaceOpen, editorOpen: ch.editorOpen, recordSeq: showing === "meta" ? sel : null, rateLimited: ch.rateLimited, snapshot: snap });
  return (
    <div data-footer="1" style={{ display: "flex", gap: 16, padding: "7px 16px", background: "#2a2d33", fontSize: 11, color: "#62676f", flex: "none" }}>
      <span data-footer-status="1" style={{ color: text.statusColor }}>{text.status}</span>
      <span>{text.record}</span>
      <span style={{ marginLeft: "auto" }}>{text.hint}</span>
    </div>
  );
}
