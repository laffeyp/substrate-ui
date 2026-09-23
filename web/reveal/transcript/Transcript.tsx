// Sprint 072 — Transcript subscribes to a pane's SessionController
// and renders each transcript row as a <Row>, keyed by callId+seq.
// ToolResult envelopes fold into their matching ToolCall (mirrors
// the dc-runtime filter at reveal_component.ts:519).
//
// The parent gates auto-follow-bottom (Sprint 075 wires the real
// scroll anchor); for now the container is the dc-runtime scroller,
// which stays sticky-bottom via reveal.ts's existing autoscroll.

import * as React from "react";
import { useController } from "./useController";
import { Row } from "./Row";
import { EnvelopeKind } from "../../vm/kinds";
import type { TranscriptRow } from "../../vm";

export interface TranscriptProps {
  paneId: number;
  view: "terminal" | "reveal";
}

function keyForRow(row: TranscriptRow): string {
  if (row.callId) return row.callId;
  return "seq:" + row.seq;
}

export function Transcript(props: TranscriptProps): React.ReactElement | null {
  const snapshot = useController(props.paneId);
  const rows: TranscriptRow[] = snapshot.transcript.filter((row) => row.kind !== EnvelopeKind.ToolResult);
  return (
    <>
      {rows.map((row) => <Row key={keyForRow(row)} row={row} />)}
    </>
  );
}
