// src/render/Inspector.tsx — Sprint 024.
//
// The pane-scoped inspector surface. Renders the JSON of the envelope
// currently under focus (pane.inspectorSeq). Layer 5 mutex says at
// most one surface open per pane; the reducer's INSPECTOR_TOGGLE
// handler enforces it — opening this surface on a different envelope
// while it's already open first emits INSPECTOR_CLOSED for the prior
// seq, then INSPECTOR_OPENED for the new one.
//
// The row displayed here is the shell's local projection of the
// envelope (produced by op_record_read in the bridge). A later sprint
// may add a bridge op to fetch the raw envelope for deeper inspection;
// Sprint 024's contract is "render its JSON," and the projection is
// what the shell has.

import type { Pane as PaneModel, TranscriptRow } from "@/state/ShellState";

interface Props {
  pane: PaneModel;
}

function findRowBySeq(pane: PaneModel, seq: number): TranscriptRow | null {
  const rows = pane.descentStack.length > 0
    ? pane.descentStack[pane.descentStack.length - 1].rows
    : pane.transcriptRows;
  return rows.find((r) => r.seq === seq) ?? null;
}

export function Inspector({ pane }: Props): JSX.Element | null {
  if (pane.inspectorSeq === null) return null;
  const row = findRowBySeq(pane, pane.inspectorSeq);
  const json = row ? JSON.stringify(row, null, 2) : `(no row at seq ${pane.inspectorSeq})`;
  return (
    <div
      data-testid={`inspector-${pane.id}`}
      data-envelope-seq={String(pane.inspectorSeq)}
      style={{
        position: "absolute",
        right: 6,
        bottom: 6,
        top: 40,
        width: 320,
        background: "#1a1c20",
        border: "1px solid #2a2d33",
        borderRadius: 4,
        padding: 8,
        overflow: "auto",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        fontSize: 11,
        color: "#b9bec5",
        zIndex: 20,
      }}
    >
      <div className="label" style={{ color: "#5f636b", marginBottom: 4 }}>
        inspector — seq {pane.inspectorSeq}
      </div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{json}</pre>
    </div>
  );
}
