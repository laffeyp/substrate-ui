// PaneHeader.tsx — the identical full pane header per D42. Every bound or
// unbound pane renders this shell from the first frame. Chip content fills
// in across Sprints 031 (DriverChip), 032 (WorkspaceChip), 034 (Bundle),
// 035 (Tools). Sprint 002 mounts the shell with placeholders; Sprint 004
// adds the drag handle for pane rearrange.

import { Pane } from "@/state/ShellState";
import { RevealState } from "@/observability/reasons";

interface Props {
  pane: Pane;
  onDragStart?: (paneId: string, ev: React.PointerEvent) => void;
  onClose?: (paneId: string) => void;
  onRevealToggle?: (paneId: string) => void;
}

const S = {
  wrap: { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
    borderBottom: "1px solid #2a2d33", fontSize: 12, color: "#8a8f96",
    background: "#1c1e22", whiteSpace: "nowrap" as const, overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
  },
  slot: { whiteSpace: "nowrap" as const },
  chip: { padding: "2px 6px", borderRadius: 3, background: "#252830",
    color: "#a7acb3", whiteSpace: "nowrap" as const },
  spacer: { flex: 1 },
  handle: { color: "#5f636b", cursor: "pointer", padding: "0 2px" },
};

export function PaneHeader({ pane, onDragStart, onClose, onRevealToggle }: Props): JSX.Element {
  return (
    <div data-testid="pane-header" style={S.wrap}>
      <span
        data-testid={`pane-drag-handle-${pane.id}`}
        data-drag-source-pane={pane.id}
        onPointerDown={onDragStart ? (e) => onDragStart(pane.id, e) : undefined}
        title="drag to rearrange"
        style={{ cursor: "grab", color: "#5f636b", padding: "0 4px", userSelect: "none" }}
      >⋮⋮</span>
      <span className="label" style={S.chip}>driver</span>
      <span className="label" style={S.chip}>workspace</span>
      <span className="label" style={S.slot}>{pane.boundSessionId ? "session" : "(unbound)"}</span>
      <span style={S.spacer} />
      <span
        data-testid={`pane-reveal-toggle-${pane.id}`}
        data-reveal={pane.reveal}
        onClick={onRevealToggle ? () => onRevealToggle(pane.id) : undefined}
        style={{ ...S.handle, cursor: onRevealToggle ? "pointer" : "default",
          color: pane.reveal === RevealState.REVEAL ? "#82a5c8" : S.handle.color }}
        title={pane.reveal === RevealState.REVEAL ? "back to transcript" : "reveal machinery"}
      >◐</span>
      <span style={S.handle} title="records">▤</span>
      <span
        data-testid={`pane-close-${pane.id}`}
        onClick={onClose ? () => onClose(pane.id) : undefined}
        style={{ ...S.handle, cursor: onClose ? "pointer" : "default" }}
        title="close"
      >×</span>
    </div>
  );
}
