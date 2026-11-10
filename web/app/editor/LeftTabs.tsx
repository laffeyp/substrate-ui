// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The left column's open and activity tabs (sprint 440; design spec r6 §5.1; roadmap r10 E8). Open lists the
// files open in the editor in tab order, the shown one lit, an accent dot on each with unsaved changes; a click
// shows its tab. Activity lists every workspace file the session's calls touched, newest first, with the turn,
// seq and tool of the latest touch (derive/activity_files.ts); a click opens the file (EDITOR_FILE_OPENED
// how=activity when it opens a tab).

import * as React from "react";
import { editor } from "../state/editor";
import { shell } from "../state/shell";
import { activityFiles } from "../derive/activity_files";
import { EditorFileOpenedHow } from "../../vm/signals.gen";
import { openFile } from "./Centre";

const SELECT = "#2e3138";
const FAINT = "#4a4e55";
const DIM = "#62676f";
const TEXT = "#b9bec5";
const ACCENT = "#82a5c8";

function Row({ rel, lit, kind, children, onClick }: { rel: string; lit: boolean; kind: string; children?: React.ReactNode; onClick: () => void }): React.ReactElement {
  const slash = rel.lastIndexOf("/");
  return (
    <div data-left-row={kind} data-path={rel} data-lit={lit ? "1" : "0"} title={rel} onClick={onClick}
      style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "2px 10px 2px 12px", cursor: "pointer", fontSize: 11, whiteSpace: "nowrap", minWidth: 0, background: lit ? SELECT : undefined }}>
      <span style={{ color: TEXT, flex: "none" }}>{rel.slice(slash + 1)}</span>
      <span style={{ color: FAINT, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{slash > 0 ? rel.slice(0, slash) : ""}</span>
      {children}
    </div>
  );
}

export function OpenTab(): React.ReactElement {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  return (
    <div data-editor-open-tab="1" style={{ paddingTop: 6, flex: 1, overflow: "auto", minHeight: 0, minWidth: 0 }}>
      {st.tabs.length === 0 && <div style={{ padding: "2px 12px", fontSize: 10.5, color: DIM }}>no files open</div>}
      {st.tabs.map((rel) => (
        <Row key={rel} rel={rel} kind="open" lit={rel === st.active} onClick={() => editor.set({ active: rel })}>
          {st.unsaved.includes(rel) && <span data-open-unsaved={rel} title="unsaved changes" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: ACCENT, flex: "none", alignSelf: "center" }} />}
        </Row>
      ))}
    </div>
  );
}

export function ActivityTab({ paneId, workspace }: { paneId: number; workspace: string | null }): React.ReactElement {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const envs = React.useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot).snapshots[paneId]?.rawEnvelopes;
  const files = React.useMemo(() => activityFiles(envs ?? [], workspace), [envs, workspace]);
  return (
    <div data-editor-activity-tab="1" style={{ paddingTop: 6, flex: 1, overflow: "auto", minHeight: 0, minWidth: 0 }}>
      {files.length === 0 && <div style={{ padding: "2px 12px", fontSize: 10.5, color: DIM }}>no files touched yet</div>}
      {files.map((f) => (
        <Row key={f.path} rel={f.path} kind="activity" lit={f.path === st.active} onClick={() => openFile(f.path, paneId, EditorFileOpenedHow.ACTIVITY)}>
          <span data-activity-last={f.path} title={`${f.tool} · seq ${f.seq}${f.touches > 1 ? ` · ${f.touches} touches` : ""}`} style={{ marginLeft: "auto", color: DIM, fontSize: 10, flex: "none", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis" }}>{f.turn !== null ? `t${f.turn} ` : ""}{f.seq}</span>
        </Row>
      ))}
    </div>
  );
}
