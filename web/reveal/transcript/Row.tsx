// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 072/074 — Row dispatch by role.
//
// Renders one transcript row keyed on `envelope.callId` (for tool rows) or `envelope.seq` (for
// everything else). Each role's glyph, colour and top margin are the ones the dc-runtime page drew;
// the pixel captures hold them.
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
import { byReference, chipTitle } from "./attachments";

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
      return { glyph: "›", glyphColor: "#82a5c8", textColor: "var(--transcript-message, #d7dade)", marginTop: "12px" };
    case "model":
      return { glyph: "◆", glyphColor: "#7fb3b8", textColor: "var(--transcript-reply, #e2e5e9)", marginTop: "6px" };
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
      {row.role === "user" && row.attachments?.length ? <SentChips row={row} paneId={paneId} /> : null}
    </div>
  );
};

/** Sprint 452 (ADD-TO-MESSAGE-2026-11-10-r3, what you see; D94): a sent message's chips beside its text, as the input
 *  bar draws them, the path on hover; one that went as its reference line is dashed, its hover adding the reason.
 *  A recorded message's chips are TRANSCRIPT_CHIPS_DRAWN, once. */
function SentChips({ row, paneId }: { row: TranscriptRow; paneId?: number }): React.ReactElement {
  const chips = row.attachments ?? [];
  const recorded = Number.isInteger(row.seq) && row.seq >= 0;
  React.useEffect(() => {
    if (paneId === undefined || !recorded) return;
    emitSignal(Signal.TRANSCRIPT_CHIPS_DRAWN, { pane_id: paneId, seq: row.seq, chips: chips.length, by_reference: chips.filter(byReference).length }, { pane_id: paneId });
  }, [recorded]);
  return (
    <span data-sent-chips="1" style={{ display: "inline-flex", flexWrap: "wrap", gap: 6, marginLeft: 10, verticalAlign: "top" }}>
      {chips.map((c) => {
        const ref = byReference(c);
        return (
          <span key={`${c.kind}:${c.ref}`} data-sent-chip={c.ref} data-by-reference={ref ? "1" : "0"} title={chipTitle(c)}
            style={{ display: "inline-flex", alignItems: "center", padding: "0 7px", borderRadius: 4, fontSize: 12, lineHeight: 1.4, whiteSpace: "nowrap", color: "#d7dade",
              ...(ref ? { border: "1px dashed #62676f", background: "transparent" } : { border: "1px solid transparent", background: "#2b2e33" }) }}>
            {c.label}
          </span>
        );
      })}
    </span>
  );
}

export const Row = React.memo(RowInner);
