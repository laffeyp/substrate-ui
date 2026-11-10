// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's status line (sprint 424; roadmap 2026-11-09-code-editor r8, E4; spec r6 §5 "Code"; frame
// 24a, whose markup in the sheet of record gives its values): under vim the mode, then `file · line:col`,
// then `+N −M vs <base>` for the buffer as typed (left out outside git), the binding at the right. Under
// nano there is no mode field, and ⌃G replaces the fields with nano's keys until the next action.

import * as React from "react";
import { editor } from "../state/editor";
import { settings } from "../state/settings";
import { modeLabel } from "../derive/status_line";

/** The nano keys this build has; ⌃W comes with FIND. */
const NANO_KEYS = "^O save · ^K cut · ^U paste · ^X leave · ^G close this";

export function StatusLine(): React.ReactElement | null {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const binding = React.useSyncExternalStore(settings.subscribe, settings.getSnapshot, settings.getSnapshot).binding;
  if (!st.active || !st.file || st.file.path !== st.active || st.file.text === null) return null;
  const name = st.active.slice(st.active.lastIndexOf("/") + 1);
  const mode = binding === "vim" ? modeLabel(st.mode) : null;
  return (
    <div data-status-line="1" style={{ display: "flex", gap: 14, padding: "5px 14px", background: "#1a1c20", fontSize: 10, color: "#62676f", whiteSpace: "nowrap", overflow: "hidden", flex: "none" }}>
      {st.nanoHelp ? <span data-status-help="1" style={{ color: "#9aa0a8" }}>{NANO_KEYS}</span> : <>
        {mode && <span data-status-mode="1" style={{ color: "#9aa0a8" }}>{mode}</span>}
        <span data-status-pos="1">{name} · {st.caretLine}:{st.caretCol}</span>
        {st.vsBase && <span data-status-vs="1">+{st.vsBase.plus} −{st.vsBase.minus} vs {st.vsBase.base}</span>}
      </>}
      <span data-status-binding="1" style={{ marginLeft: "auto" }}>{binding}</span>
    </div>
  );
}
