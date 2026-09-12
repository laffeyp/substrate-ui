// src/render/WorkspaceChip.tsx — Sprint 032.
//
// The header chip shows the bound session's workspace_shape. Click
// opens a read-only popover of {path, shape}. Workspace is immutable
// on a bound session (D9c): changing it is a create-new-session
// gesture, not a mutate. No PATCH-workspace surface exists in this
// component or anywhere in the shell.

import type { Pane as PaneModel } from "@/state/ShellState";

interface Props {
  pane: PaneModel;
  onOpen: (paneId: string) => void;
  onClose: (paneId: string) => void;
}

const chipStyle: React.CSSProperties = {
  padding: "2px 6px", borderRadius: 3, background: "#252830",
  color: "#a7acb3", whiteSpace: "nowrap",
  cursor: "pointer", userSelect: "none",
};

const popoverStyle: React.CSSProperties = {
  position: "absolute", top: 28, left: 120,
  background: "#1a1c20", border: "1px solid #2a2d33",
  borderRadius: 4, padding: 8, minWidth: 260,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 12, color: "#b9bec5", zIndex: 30,
};

const rowStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "60px 1fr", gap: 6,
  marginBottom: 3,
};

export function WorkspaceChip({ pane, onOpen, onClose }: Props): JSX.Element {
  const shape = pane.workspaceShape ?? "";
  const path = pane.workspacePath ?? "";
  const disabled = !pane.boundSessionId;
  const label = shape || "workspace";
  return (
    <>
      <span
        data-testid={`workspace-chip-${pane.id}`}
        data-workspace-shape={shape}
        onClick={() => {
          if (disabled) return;
          if (pane.workspacePopover.open) onClose(pane.id);
          else onOpen(pane.id);
        }}
        onKeyDown={(e) => {
          if (pane.workspacePopover.open && e.key === "Escape") {
            e.preventDefault();
            onClose(pane.id);
          }
        }}
        tabIndex={0}
        style={chipStyle}
      >
        <span className="label">{label}</span>
      </span>
      {pane.workspacePopover.open ? (
        <div
          data-testid={`workspace-popover-${pane.id}`}
          data-workspace-shape={shape}
          style={popoverStyle}
        >
          <div style={rowStyle}>
            <span className="label" style={{ color: "#5f636b" }}>path</span>
            <span className="label" data-testid={`workspace-popover-path-${pane.id}`}
              style={{ color: "#e2e5e9", overflow: "hidden", textOverflow: "ellipsis" }}>
              {path || "(none)"}
            </span>
          </div>
          <div style={rowStyle}>
            <span className="label" style={{ color: "#5f636b" }}>shape</span>
            <span className="label" data-testid={`workspace-popover-shape-${pane.id}`}
              style={{ color: "#a7c893" }}>{shape || "(none)"}</span>
          </div>
          <div style={{ marginTop: 6, color: "#5f636b" }}>
            <span className="label">read-only — workspace is immutable per D9c</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
