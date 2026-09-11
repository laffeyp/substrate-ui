// Pane.tsx — one pane frame with its header + 11 per-pane anchors.
// Layer 7 pixel-anchor slots per pane: focus, status, reveal, lens, level,
// dir, descent, surface, find, inspect, header_popover.

import { Pane as PaneModel, WorkspaceShape } from "@/state/ShellState";
import { PaneHeader } from "./PaneHeader";
import { Anchor } from "./Anchor";
import { UnboundPanePicker } from "./UnboundPanePicker";

interface Props {
  pane: PaneModel;
  onFocus?: (paneId: string) => void;
  onDragStart?: (paneId: string, ev: React.PointerEvent) => void;
  onClose?: (paneId: string) => void;
  onPickerText?: (paneId: string, text: string) => void;
  onPickerWalk?: (paneId: string, index: number, path: string, shape: WorkspaceShape) => void;
  onPickerCommit?: (paneId: string, path: string, shape: WorkspaceShape) => void;
  onResume?: (paneId: string, sessionId: string) => void;
}

const PER_PANE_SLOTS = [
  "focus", "status", "reveal", "lens", "level", "dir",
  "descent", "surface", "find", "inspect", "header_popover",
] as const;

const S = {
  frame: { position: "relative" as const, display: "flex" as const,
    flexDirection: "column" as const, height: "100%", width: "100%",
    background: "#212327", color: "#b9bec5",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fontSize: 13,
  },
  body: { flex: 1, padding: "24px 32px", overflow: "auto" as const },
};

function initialByte(slot: string, pane: PaneModel): number {
  if (slot === "focus") return pane.focused ? 255 : 128;
  if (slot === "status") {
    switch (pane.status) {
      case "unbound": return 0;
      case "parked": return 64;
      case "running": return 96;
      case "interrupted": return 56;
      case "ended": return 32;
    }
  }
  return 0;
}

export function Pane({ pane, onFocus, onDragStart, onClose, onPickerText, onPickerWalk, onPickerCommit, onResume }: Props): JSX.Element {
  return (
    <div
      data-testid={`pane-${pane.id}`}
      data-pane-id={pane.id}
      data-focused={pane.focused ? "true" : "false"}
      onMouseDown={onFocus ? () => onFocus(pane.id) : undefined}
      style={S.frame}
    >
      <PaneHeader pane={pane} onDragStart={onDragStart} onClose={onClose} />
      <div style={S.body}>
        {pane.status === "unbound" && onPickerText && onPickerWalk && onPickerCommit && onResume ? (
          <UnboundPanePicker
            pane={pane}
            onText={onPickerText}
            onWalk={onPickerWalk}
            onCommit={onPickerCommit}
            onResume={onResume}
          />
        ) : (
          <div className="label">substrate — pane {pane.id.slice(0, 6)}</div>
        )}
      </div>
      {PER_PANE_SLOTS.map((slot) => (
        <Anchor
          key={slot}
          id={`anchor-pane-${pane.id}-${slot}`}
          scope="pane"
          paneId={pane.id}
          slot={slot}
          byte={initialByte(slot, pane)}
        />
      ))}
    </div>
  );
}
