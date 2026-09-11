// RevealShell.tsx — the machinery view mounted when pane.reveal ===
// "reveal". Sprint 017 mounts four lens tabs + branches on pane.lens.
// Sprint 018 adds two sub-toggles beside the tabs: stream level (all vs
// app) and stream direction (down vs side). Both flips fire named
// signals with the ratified {pane_id, from, to} payload from Layer 2.

import { Pane, Lens, LENSES } from "@/state/ShellState";
import { StreamLevel, StreamDir } from "@/observability/reasons";
import { StreamGraphLens, IOLens, StructureLens, SceneLens } from "./lens/lenses";

interface Props {
  pane: Pane;
  onLensSwitch?: (paneId: string, to: Lens) => void;
  onStreamLevelToggle?: (paneId: string) => void;
  onStreamDirToggle?: (paneId: string) => void;
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

const chipStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 3,
  cursor: "pointer",
  color: "#b9bec5",
  background: "#252830",
  fontSize: 12,
  whiteSpace: "nowrap",
};

export function RevealShell({ pane, onLensSwitch, onStreamLevelToggle, onStreamDirToggle }: Props): JSX.Element {
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
      data-stream-level={pane.streamLevel}
      data-stream-dir={pane.streamDir}
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        padding: "8px 12px",
      }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 8, alignItems: "center" }}>
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
        <span style={{ flex: 1 }} />
        <span
          data-testid={`stream-level-toggle-${pane.id}`}
          data-level={pane.streamLevel}
          onClick={() => onStreamLevelToggle?.(pane.id)}
          style={chipStyle}
        >
          <span className="label">
            level: {pane.streamLevel === StreamLevel.ALL ? "all" : "app"}
          </span>
        </span>
        <span
          data-testid={`stream-dir-toggle-${pane.id}`}
          data-dir={pane.streamDir}
          onClick={() => onStreamDirToggle?.(pane.id)}
          style={chipStyle}
        >
          <span className="label">
            dir: {pane.streamDir === StreamDir.DOWN ? "down" : "side"}
          </span>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{body}</div>
    </div>
  );
}
