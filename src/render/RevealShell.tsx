// RevealShell.tsx — the machinery view mounted when pane.reveal === "reveal".
// Sprint 016 mounts a placeholder frame; Sprint 017 fills in the four lenses
// (stream+graph, i/o, structure, scene); Sprint 018 adds level + dir toggles;
// Sprint 019 wires focus flip via REVEAL_FOCUS_MOVED.

import { Pane } from "@/state/ShellState";

interface Props { pane: Pane; }

export function RevealShell({ pane }: Props): JSX.Element {
  return (
    <div
      data-testid={`reveal-shell-${pane.id}`}
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        padding: "12px 16px", color: "#8a8f96",
      }}
    >
      <div className="label" style={{ color: "#5f636b", marginBottom: 8 }}>
        machinery view — session {pane.sessionName ?? pane.boundSessionId?.slice(0, 8)}
      </div>
      <div style={{ flex: 1, border: "1px solid #23262a", borderRadius: 3, padding: 12 }}>
        <div className="label" style={{ color: "#5f636b" }}>
          lenses arrive in Sprint 017 (stream+graph, i/o, structure, scene)
        </div>
        <div className="label" style={{ color: "#5f636b", marginTop: 8, fontSize: 11 }}>
          {pane.transcriptRows.length} envelopes on record
        </div>
      </div>
    </div>
  );
}
