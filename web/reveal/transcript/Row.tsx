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
import { ModelReply } from "./ModelReply";
import { ToolCard } from "./ToolCard";
import { AuthPromptCard } from "./AuthPromptCard";

export interface RowProps {
  row: TranscriptRow;
  paired?: TranscriptRow;
  progressText: string;
  progressEof: boolean;
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

const RowInner: React.FC<RowProps> = ({ row, paired, progressText, progressEof }) => {
  const style = styleFor(row);
  const text = row.text ?? "";
  const isModel = row.role === "model";
  const isTool = row.role === "tool" && row.kind === "ToolCall";
  // Sprint 085b — AuthPrompt row renders AuthPromptCard using `text`
  // as the CLI name (openAuthPrompt writes {kind:"AuthPrompt", role:"system", text:cli}).
  const isAuthPrompt = row.role === "system" && row.kind === "AuthPrompt";
  const streamingShow = progressText.length > 0;
  return (
    <div style={{
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
        />
      ) : isAuthPrompt ? (
        <AuthPromptCard cli={text} />
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
};

export const Row = React.memo(RowInner);
