// Lens components — one per lens ordinal, keyed on the pane's transcript.
// Sprint 017 mounts each lens as a distinct view. Full lens content
// (real graph, real scene) lands at Epic G + later widening sprints.

import { Pane, TranscriptRow } from "@/state/ShellState";

interface Props { pane: Pane; }

const box: React.CSSProperties = {
  padding: 12, border: "1px solid #23262a", borderRadius: 3,
  color: "#8a8f96", fontSize: 12, height: "100%",
  overflow: "auto",
};

function rows(pane: Pane): TranscriptRow[] { return pane.transcriptRows; }

export function StreamGraphLens({ pane }: Props): JSX.Element {
  return (
    <div data-testid={`lens-stream+graph`} style={box}>
      <div className="label" style={{ color: "#5f636b", marginBottom: 6 }}>stream + graph — {rows(pane).length} envelopes</div>
      {rows(pane).map((r) => (
        <div key={r.seq} style={{ fontFamily: "inherit", padding: "1px 0" }}>
          <span style={{ color: "#5f636b" }}>#{String(r.seq).padStart(3, " ")}</span>{" "}
          <span style={{ color: "#82a5c8" }}>{r.producer_kind}</span>{" → "}
          <span style={{ color: "#a7c893" }}>{r.kind}</span>
        </div>
      ))}
    </div>
  );
}

export function IOLens({ pane }: Props): JSX.Element {
  return (
    <div data-testid={`lens-i/o`} style={box}>
      <div className="label" style={{ color: "#5f636b", marginBottom: 6 }}>i/o — producer inputs and outputs</div>
      {rows(pane).map((r) => (
        <div key={r.seq} style={{ padding: "3px 0", borderBottom: "1px solid #23262a" }}>
          <div className="label" style={{ color: "#82a5c8" }}>{r.producer_kind}</div>
          <div style={{ paddingLeft: 12, color: "#8a8f96" }}>{r.kind}: {r.summary || "(no payload summary)"}</div>
        </div>
      ))}
    </div>
  );
}

export function StructureLens({ pane }: Props): JSX.Element {
  const producers = new Map<string, number>();
  for (const r of rows(pane)) producers.set(r.producer_kind, (producers.get(r.producer_kind) ?? 0) + 1);
  return (
    <div data-testid={`lens-structure`} style={box}>
      <div className="label" style={{ color: "#5f636b", marginBottom: 6 }}>structure — producers × counts</div>
      {[...producers.entries()].map(([kind, count]) => (
        <div key={kind} style={{ padding: "1px 0" }}>
          <span style={{ color: "#82a5c8" }}>{kind}</span>{" "}
          <span style={{ color: "#5f636b" }}>× {count}</span>
        </div>
      ))}
    </div>
  );
}

export function SceneLens({ pane }: Props): JSX.Element {
  const turns = rows(pane).filter((r) => typeof r.turn_index === "number").length;
  return (
    <div data-testid={`lens-scene`} style={box}>
      <div className="label" style={{ color: "#5f636b", marginBottom: 6 }}>scene — spatial view (placeholder)</div>
      <div style={{ color: "#8a8f96" }}>
        {rows(pane).length} envelopes across {turns} named turns. A full spatial
        render lands when a topology declares its scene grid.
      </div>
    </div>
  );
}
