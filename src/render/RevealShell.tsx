// RevealShell.tsx — the machinery view mounted when pane.reveal === "reveal".
// Sprint 017 mounts four lens tabs + branches on pane.lens. Sprint 018 will
// add level + dir toggles. Sprint 019 wires focus flip via REVEAL_FOCUS_MOVED.

import { Pane, Lens, LENSES } from "@/state/ShellState";
import { StreamGraphLens, IOLens, StructureLens, SceneLens } from "./lens/lenses";

interface Props {
  pane: Pane;
  onLensSwitch?: (paneId: string, to: Lens) => void;
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 3,
  cursor: active ? "default" : "pointer",
  color: active ? "#e2e5e9" : "#8a8f96",
  background: active ? "#252830" : "transparent",
  fontSize: 12,
  whiteSpace: "nowrap",
});

export function RevealShell({ pane, onLensSwitch }: Props): JSX.Element {
  const body = (() => {
    switch (pane.lens) {
      case Lens.STREAM_GRAPH: return <StreamGraphLens pane={pane} />;
      case Lens.IO:          return <IOLens pane={pane} />;
      case Lens.STRUCTURE:    return <StructureLens pane={pane} />;
      case Lens.SCENE:        return <SceneLens pane={pane} />;
    }
  })();
  return (
    <div
      data-testid={`reveal-shell-${pane.id}`}
      data-lens={pane.lens}
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        padding: "8px 12px",
      }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {LENSES.map((lens) => (
          <span
            key={lens}
            data-testid={`lens-tab-${lens}`}
            data-active={pane.lens === lens ? "true" : "false"}
            onClick={() => { if (pane.lens !== lens) onLensSwitch?.(pane.id, lens); }}
            style={tabStyle(pane.lens === lens)}
          >
            <span className="label">{lens}</span>
          </span>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{body}</div>
    </div>
  );
}
