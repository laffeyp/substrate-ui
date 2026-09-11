// RevealShell.tsx — the machinery view mounted when pane.reveal ===
// "reveal". Sprint 017 mounts four lens tabs + branches on pane.lens.
// Sprint 018 adds level + dir chips beside the tabs. Sprint 019 splits
// the shell into a transcript half (left) and a stream half (right)
// with a focus token that Tab flips. The focused half wears a ring; the
// Find scope (Epic H) will read pane.revealFocus.

import { useEffect, useRef } from "react";
import { Pane, Lens, LENSES } from "@/state/ShellState";
import { StreamLevel, StreamDir, RevealFocus } from "@/observability/reasons";
import { StreamGraphLens, IOLens, StructureLens, SceneLens } from "./lens/lenses";

interface Props {
  pane: Pane;
  onLensSwitch?: (paneId: string, to: Lens) => void;
  onStreamLevelToggle?: (paneId: string) => void;
  onStreamDirToggle?: (paneId: string) => void;
  onRevealFocusToggle?: (paneId: string) => void;
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

const halfStyle = (focused: boolean): React.CSSProperties => ({
  flex: 1,
  minWidth: 0,
  border: focused ? "1px solid #4a5265" : "1px solid transparent",
  borderRadius: 3,
  padding: 6,
  overflow: "auto",
});

export function RevealShell({
  pane, onLensSwitch, onStreamLevelToggle, onStreamDirToggle, onRevealFocusToggle,
}: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Tab" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onRevealFocusToggle?.(pane.id);
      }
    }
    el.addEventListener("keydown", handler);
    el.focus();
    return () => el.removeEventListener("keydown", handler);
  }, [pane.id, onRevealFocusToggle]);

  const body = (() => {
    switch (pane.lens) {
      case Lens.STREAM_GRAPH: return <StreamGraphLens pane={pane} />;
      case Lens.IO:          return <IOLens pane={pane} />;
      case Lens.STRUCTURE:    return <StructureLens pane={pane} />;
      case Lens.SCENE:        return <SceneLens pane={pane} />;
    }
  })();

  const transcriptFocused = pane.revealFocus === RevealFocus.TRANSCRIPT;
  const streamFocused     = pane.revealFocus === RevealFocus.STREAM;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      data-testid={`reveal-shell-${pane.id}`}
      data-lens={pane.lens}
      data-stream-level={pane.streamLevel}
      data-stream-dir={pane.streamDir}
      data-reveal-focus={pane.revealFocus}
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        padding: "8px 12px", outline: "none",
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
          <span className="label">level: {pane.streamLevel === StreamLevel.ALL ? "all" : "app"}</span>
        </span>
        <span
          data-testid={`stream-dir-toggle-${pane.id}`}
          data-dir={pane.streamDir}
          onClick={() => onStreamDirToggle?.(pane.id)}
          style={chipStyle}
        >
          <span className="label">dir: {pane.streamDir === StreamDir.DOWN ? "down" : "side"}</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flex: 1, minHeight: 0 }}>
        <div
          data-testid={`transcript-half-${pane.id}`}
          data-focused={transcriptFocused ? "true" : "false"}
          className={transcriptFocused ? "focus-ring" : undefined}
          style={halfStyle(transcriptFocused)}
        >
          <div className="label" style={{ color: "#5f636b", marginBottom: 6 }}>
            transcript — {pane.transcriptRows.length} envelopes
          </div>
          {pane.transcriptRows.map((r) => (
            <div key={r.seq} style={{ padding: "2px 0", fontSize: 12 }}>
              <span style={{ color: "#5f636b" }}>#{String(r.seq).padStart(3, " ")}</span>{" "}
              <span style={{ color: "#a7c893" }}>{r.kind}</span>
              {r.summary ? <span style={{ color: "#8a8f96" }}> {r.summary}</span> : null}
            </div>
          ))}
        </div>
        <div
          data-testid={`stream-half-${pane.id}`}
          data-focused={streamFocused ? "true" : "false"}
          className={streamFocused ? "focus-ring" : undefined}
          style={halfStyle(streamFocused)}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
