// src/render/FindBar.tsx — Sprint 028.
//
// A single-line find bar for the focused pane. Cmd-F opens it; the
// initial scope tracks pane.revealFocus at open time. Typing fires
// FIND_QUERY_CHANGED debounced 100ms with `q_length` and `count` —
// the raw `q` never crosses the emitter boundary (Layer 2's privacy
// contract). Tab flips reveal focus AND re-scopes the bar
// (FIND_SCOPE_CHANGED). Esc closes.

import { useEffect, useRef } from "react";
import type { Pane as PaneModel } from "@/state/ShellState";

interface Props {
  pane: PaneModel;
  onQueryType: (paneId: string, q: string) => void;
  onScopeTab: (paneId: string) => void;
  onStep: (paneId: string, delta: 1 | -1) => void;
  onClose: (paneId: string) => void;
}

const barStyle: React.CSSProperties = {
  position: "absolute", top: 6, right: 6,
  background: "#1a1c20", border: "1px solid #2a2d33",
  borderRadius: 3, padding: "3px 6px", display: "flex",
  alignItems: "center", gap: 6,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 11, color: "#b9bec5", zIndex: 20,
};

const inputStyle: React.CSSProperties = {
  background: "#0f1114", color: "#e2e5e9",
  border: "1px solid #2a2d33", borderRadius: 2,
  padding: "2px 5px", width: 140, outline: "none",
  fontFamily: "inherit", fontSize: 11,
};

export function FindBar({ pane, onQueryType, onScopeTab, onStep, onClose }: Props): JSX.Element {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  // The FindScope enum values are the display strings — Layer 2's
  // ratified {transcript, stream} enum doubles as the label copy, so
  // reading the reducer state avoids a shadow of the enum.
  const scopeLabel = pane.find.scope;
  return (
    <div
      data-testid={`find-bar-${pane.id}`}
      data-find-scope={pane.find.scope}
      style={barStyle}
    >
      <span className="label" style={{ color: "#5f636b" }}>{scopeLabel} /</span>
      <input
        ref={ref}
        data-testid={`find-input-${pane.id}`}
        style={inputStyle}
        value={pane.find.q}
        onChange={(e) => onQueryType(pane.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); onClose(pane.id); return; }
          if (e.key === "Tab") { e.preventDefault(); onScopeTab(pane.id); return; }
          if (e.key === "Enter") {
            e.preventDefault();
            onStep(pane.id, e.shiftKey ? -1 : 1);
          }
        }}
      />
      <span className="label" data-testid={`find-count-${pane.id}`} style={{ color: "#5f636b" }}>
        {pane.find.count > 0 ? `${pane.find.activeIndex + 1}/${pane.find.count}` : "0/0"}
      </span>
    </div>
  );
}
