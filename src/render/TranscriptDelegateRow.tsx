// src/render/TranscriptDelegateRow.tsx — the delegate call line.
//
// A tool_loop turn's ToolCall(tool="delegate") envelope renders as a
// "reviewer-a … ↳" line with a depth-hue accent border (D70). Sprint
// 020 renders the LINE only — the expand (child transcript inline) is
// Sprint 021. All the shell knows about the child at this point is the
// tool_call_id; whether it is "talkable" or how deep it goes wire in
// with later sprints (Sprint 022 descent, Sprint 023 fan-out cap).

import { TranscriptRow } from "@/state/ShellState";
import { depthAccent } from "@/lib/depthAccent";

interface Props {
  paneId: string;
  row: TranscriptRow;
  depth: number;
}

export function TranscriptDelegateRow({ paneId, row, depth }: Props): JSX.Element {
  const accent = depthAccent(depth);
  return (
    <div
      data-testid={`transcript-row-${paneId}-${row.seq}`}
      data-kind={row.kind}
      data-tool-name={row.tool_name || ""}
      data-tool-call-id={row.tool_call_id || ""}
      data-depth={String(depth)}
      style={{
        padding: "3px 6px",
        borderLeft: `3px solid ${accent}`,
        borderBottom: "1px solid #23262a",
        background: "#1e2024",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span className="label" style={{ color: accent, fontWeight: 600 }}>
        reviewer-{String.fromCharCode(96 + depth)}
      </span>
      <span style={{ color: "#8a8f96" }}>…</span>
      <span className="label" style={{ color: accent }}>↳</span>
      <span style={{ color: "#5f636b", marginLeft: "auto", fontSize: 10 }}>
        depth {depth}
      </span>
    </div>
  );
}
