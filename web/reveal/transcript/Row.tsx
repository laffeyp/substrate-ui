// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 072/074 — Row dispatch by role.
//
// Renders one transcript row keyed on `envelope.callId` (for tool
// rows) or `envelope.seq` (for everything else). Role-specific glyph
// + colour + marginTop mirror the dc-runtime template
// (reveal.html:91-136) and the row provider
// (reveal_component.ts:326-343).
//
// Real subtrees:
//   role=user, park, ended, warning — full markup as text-only spans.
//   role=model — <ModelReply> with block-parsed content (Sprint 073).
//   role=tool  — <ToolCard> with args + streaming + output + descend
//               (Sprint 074).

import * as React from "react";
import type { TranscriptRow } from "../../vm";
import { isToolCallRow } from "../../vm";
import { ModelReply } from "./ModelReply";
import { ToolCard } from "./ToolCard";
import { AuthPromptCard } from "./AuthPromptCard";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { Signal } from "../../vm/signals.gen";

export interface RowProps {
  row: TranscriptRow;
  paired?: TranscriptRow;
  progressText: string;
  progressEof: boolean;
  registerRow?: (seq: number, el: HTMLElement | null) => void;
  /** The pane and its session, for TRANSCRIPT_ROW_DRAWN (v0.12); absent outside a pane. */
  paneId?: number;
  sessionId?: string | null;
}

interface Style {
  glyph: string;
  glyphColor: string;
  textColor: string;
  marginTop: string;
}

function styleFor(row: TranscriptRow): Style {
  switch (row.role) {
    case "user":
      return { glyph: "›", glyphColor: "#82a5c8", textColor: "#e2e5e9", marginTop: "12px" };
    case "model":
      return { glyph: "◆", glyphColor: "#7fb3b8", textColor: "#b9bec5", marginTop: "6px" };
    case "tool": {
      const failed = row.toolOk === false;
      return {
        glyph: failed ? "⚠" : "⚙",
        glyphColor: failed ? "#c26058" : "#62676f",
        textColor: failed ? "#c26058" : "#62676f",
        marginTop: "2px",
      };
    }
    case "park":
      return { glyph: "◐", glyphColor: "#82a5c8", textColor: "#82a5c8", marginTop: "10px" };
    case "ended":
      return { glyph: "◇", glyphColor: "#62676f", textColor: "#62676f", marginTop: "10px" };
    case "warning":
      return { glyph: "!", glyphColor: "#c26058", textColor: "#c26058", marginTop: "2px" };
    default:
      return { glyph: "·", glyphColor: "#4a4e55", textColor: "#9aa0a8", marginTop: "2px" };
  }
}

// A row the window made itself (a local echo, a note, help, a model-error line) has a negative or
// fractional seq: it carries no record seq, and its kind says it is local.
function drawnSeq(row: TranscriptRow): { seq: number | null; kind: string } {
  return Number.isInteger(row.seq) && row.seq >= 0
    ? { seq: row.seq, kind: row.kind }
    : { seq: null, kind: `local:${row.kind || row.role}` };
}

const RowInner: React.FC<RowProps> = ({ row, paired, progressText, progressEof, registerRow, paneId, sessionId }) => {
  const style = styleFor(row);
  const text = row.text ?? "";
  const isModel = row.role === "model";
  const isTool = row.role === "tool" && isToolCallRow(row);
  const isAuthPrompt = row.role === "system" && row.kind === "AuthPrompt";
  const streamingShow = progressText.length > 0;
  // T4 (v0.12): a row on screen is TRANSCRIPT_ROW_DRAWN, once per mount; Transcript keys rows by
  // seq or call, so a local echo replaced by its record entry mounts again with the record's seq.
  React.useEffect(() => {
    if (paneId === undefined) return;
    const { seq, kind } = drawnSeq(row);
    emitSignal(Signal.TRANSCRIPT_ROW_DRAWN, { pane_id: paneId, session_id: sessionId ?? null, seq, kind }, { pane_id: paneId });
  }, []);
  const refCb = React.useCallback(
    (el: HTMLDivElement | null) => { registerRow?.(row.seq, el); },
    [registerRow, row.seq],
  );
  return (
    <div ref={refCb} style={{
      marginTop: style.marginTop,
      color: style.textColor,
      whiteSpace: "normal",
      maxWidth: 840,
      overflowWrap: "anywhere",
    }}>
      <span style={{ color: style.glyphColor, marginRight: 6, verticalAlign: "top" }}>{style.glyph}</span>
      {isModel ? (
        <ModelReply text={text} />
      ) : isTool ? (
        <ToolCard
          call={row}
          result={paired}
          progressText={progressText}
          progressEof={progressEof}
          streamingShow={streamingShow}
          paneId={paneId}
          sessionId={sessionId ?? null}
        />
      ) : isAuthPrompt ? (
        <AuthPromptCard cli={text} paneId={paneId} />
      ) : row.helpRows ? (
        // UI sprint 162: /help as the menu draws commands: usage, then its description in grey.
        <span style={{ display: "inline-block", verticalAlign: "top" }}>
          {row.helpRows.map((help) => (
            <span key={help.usage} data-help-row="1" style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "#9aa0a8", minWidth: 260 }}>{help.usage}</span>
              <span style={{ color: "#62676f" }}>{help.about}</span>
            </span>
          ))}
        </span>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
};

export const Row = React.memo(RowInner);
