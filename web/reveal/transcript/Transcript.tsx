// Sprint 072 — Transcript subscribes to a pane's SessionController
// and renders each transcript row as a <Row>, keyed by callId+seq.
// ToolResult envelopes fold into their matching ToolCall (mirrors
// the dc-runtime filter at reveal_component.ts:519).
//
// Scroll is owned by useScrollAnchor (UI sprint 102): follow the bottom while the user is
// there, hold the row being read once they scroll up, per pane per view.

import * as React from "react";
import { useController } from "./useController";
import { Row } from "./Row";
import { useScrollAnchor } from "./useScrollAnchor";
import { isToolResultRow } from "../../vm";
import type { Snapshot, TranscriptRow } from "../../vm";

export interface TranscriptProps {
  paneId: number;
  view: "terminal" | "reveal";
}

function keyForRow(row: TranscriptRow): string {
  const id = row.callKey ?? row.callId;
  if (id) return id;
  return "seq:" + row.seq;
}

function buildResultByCallId(snapshot: Snapshot): Map<string, TranscriptRow> {
  const paired = new Map<string, TranscriptRow>();
  for (const row of snapshot.transcript) {
    const id = row.callKey ?? row.callId;
    if (isToolResultRow(row) && id) paired.set(id, row);
  }
  return paired;
}

// UI sprint 144: "session started with <model> at <workspace>", the transcript's first line, so an
// empty pane shows where the conversation will appear. The home folder is written `~`.
function startLine(snapshot: Snapshot): string | null {
  if (!snapshot.driver) return null;
  const path = snapshot.workspacePath;
  // A per-session sandbox lives at <state>/sessions/<session id>/workspace; its path says nothing
  // a user needs, so it reads as what it is, before the session opens and after.
  const ownSandbox = !!path && !!snapshot.sessionId && path.endsWith(`/sessions/${snapshot.sessionId}/workspace`);
  const where = path && !ownSandbox ? path.replace(/^\/Users\/[^/]+/, "~") : "a per-session sandbox";
  return `session started with ${snapshot.driver} at ${where}`;
}

export function Transcript(props: TranscriptProps): React.ReactElement | null {
  const snapshot = useController(props.paneId);
  const { registerRow, attachTo } = useScrollAnchor(`${props.view}:${props.paneId}`);
  const resultByCallId = React.useMemo(() => buildResultByCallId(snapshot), [snapshot.transcript]);
  const rows: TranscriptRow[] = snapshot.transcript.filter((row) => !isToolResultRow(row));
  const start = startLine(snapshot);
  return (
    <div ref={attachTo}>
      {start ? <div data-session-start-line="1" style={{ color: "#62676f", marginBottom: 10 }}>{start}</div> : null}
      {rows.map((row) => {
        const id = row.callKey ?? row.callId;
        const paired = id ? resultByCallId.get(id) : undefined;
        const progressEntry = id ? snapshot.progressByCallId[id] : undefined;
        return (
          <Row
            key={keyForRow(row)}
            row={row}
            paired={paired}
            progressText={progressEntry?.text ?? ""}
            progressEof={progressEntry?.eof ?? false}
            registerRow={registerRow}
          />
        );
      })}
    </div>
  );
}
