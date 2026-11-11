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
import { BYTES_FORMS } from "../derive/bytes";
import { formOf, pickBytesForm } from "./BytesView";

/** The nano keys this build has; ⌃W comes with FIND. */
const NANO_KEYS = "^O save · ^K cut · ^U paste · ^X leave · ^G close this";

export function StatusLine({ paneId }: { paneId?: number } = {}): React.ReactElement | null {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const binding = React.useSyncExternalStore(settings.subscribe, settings.getSnapshot, settings.getSnapshot).binding;
  if (!st.active || !st.file || st.file.path !== st.active) return null;
  const name = st.active.slice(st.active.lastIndexOf("/") + 1);
  // Sprint 463 (roadmap r13 E14): a file that is not text: its size, and the four forms to pick from. Sprint 465: in
  // its text form the code edits it, and the line shows the caret too. Sprint 468: hex, binary and octal type into the
  // same buffer, and the line shows the caret's byte offset; a file over the read limit is read-only until sprint 469.
  if (st.file.encoding === "binary") {
    const form = formOf(st.active), size = st.file.size, path = st.active, inBuffer = st.file.text !== null;
    const at = !inBuffer ? "" : form === "text" ? `${st.caretLine}:${st.caretCol} · ` : st.bytesCaret !== null ? `0x${st.bytesCaret.toString(16)} · ` : "";
    return (
      <div data-status-line="1" data-status-bytes="1" style={{ display: "flex", gap: 14, padding: "5px 14px", background: "#1a1c20", fontSize: 10, color: "#62676f", whiteSpace: "nowrap", overflow: "hidden", flex: "none" }}>
        <span data-status-pos="1">{name} · {at}{size.toLocaleString("en-US")} bytes{inBuffer ? "" : " · read-only"}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {BYTES_FORMS.map((f) => (
            <span key={f} data-bytes-form-pick={f} data-on={f === form ? "1" : "0"} onClick={() => pickBytesForm(paneId ?? 0, path, f, size)}
              style={{ cursor: "pointer", color: f === form ? "#e2e5e9" : "#62676f" }}>{f}</span>
          ))}
        </span>
      </div>
    );
  }
  if (st.file.text === null) return null;
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
