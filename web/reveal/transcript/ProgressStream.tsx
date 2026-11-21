// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 074 — streaming pane inside a tool card. Reads
// `snapshot.progressByCallId[callId]` from the shared snapshot the
// Transcript already subscribed to. Rendered as a memoized component
// so streaming updates re-render only this pane, not sibling cards.

import * as React from "react";
import { TerminalText } from "./ToolText";
import { needsTerminal } from "../tool_format";

/** Sprint 505: past this, a stream redrawn on every chunk is drawn plain rather than through the terminal model.
 *  Exported for sprint 517's plain block, which draws the stream the same way. */
export const TERMINAL_MAX = 200_000;

interface Props {
  progressText: string;
  eof: boolean;
  droppedLines?: number;
}

const ProgressStreamInner: React.FC<Props> = ({ progressText, eof, droppedLines }) => {
  return (
    <>
      <div style={{ marginTop: 8, color: "#62676f" }}>
        streaming{eof ? <span style={{ color: "#4a4e55" }}> · eof</span> : null}
      </div>
      {(droppedLines ?? 0) > 0 ? (
        <div style={{ color: "#62676f", fontSize: 11, padding: "2px 12px 0" }}>{droppedLines} earlier lines not shown</div>
      ) : null}
      <div style={{
        background: "#1a1c20",
        borderRadius: 5,
        padding: "8px 12px",
        maxHeight: 220,
        overflow: "auto",
        color: "#7fb3b8",
        whiteSpace: "pre-wrap",
      }}>{needsTerminal(progressText) && progressText.length <= TERMINAL_MAX ? <TerminalText text={progressText} /> : progressText}</div>
    </>
  );
};

export const ProgressStream = React.memo(ProgressStreamInner);
