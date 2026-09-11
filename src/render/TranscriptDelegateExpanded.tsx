// src/render/TranscriptDelegateExpanded.tsx — the child transcript
// rendered inline under a delegate row when the user has expanded it.
//
// Sprint 021 renders the child rows indented under the parent. No
// nested reveal, no sub-lens — Sprint 022 (descent) walks into the
// child session as a full-fledged pane; Sprint 021 keeps it flat.

import { TranscriptRow } from "@/state/ShellState";
import { depthAccent } from "@/lib/depthAccent";

interface Props {
  paneId: string;
  toolCallId: string;
  childRows: TranscriptRow[];
  depth: number;
}

export function TranscriptDelegateExpanded({ paneId, toolCallId, childRows, depth }: Props): JSX.Element {
  const accent = depthAccent(depth);
  return (
    <div
      data-testid={`delegate-expanded-${paneId}-${toolCallId}`}
      data-depth={String(depth)}
      style={{
        marginLeft: 22,
        borderLeft: `2px solid ${accent}`,
        paddingLeft: 8,
        background: "#1a1c20",
      }}
    >
      {childRows.length === 0 ? (
        <div style={{ padding: "4px 6px", color: "#5f636b", fontSize: 11 }}>
          loading child transcript…
        </div>
      ) : (
        childRows.map((r) => (
          <div
            key={r.seq}
            data-testid={`delegate-child-row-${paneId}-${toolCallId}-${r.seq}`}
            data-kind={r.kind}
            style={{
              padding: "2px 6px",
              borderBottom: "1px solid #23262a",
              fontSize: 11,
              color: "#8a8f96",
            }}
          >
            <span style={{ color: "#5f636b" }}>#{String(r.seq).padStart(3, " ")}</span>{" "}
            <span style={{ color: accent }}>{r.kind}</span>
            {r.summary ? <span> {r.summary}</span> : null}
          </div>
        ))
      )}
    </div>
  );
}
