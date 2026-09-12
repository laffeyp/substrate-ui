// src/render/Pane.tsx — Q2 pane frame + per-pane header.
//
// Ports v7 lines 37-52 (pane wrapper · header row with drag grip,
// wordmark + status dot, session name, driver chip, workspace
// popover chip, records/studio/reveal handles).
//
// Pane body is empty in Q2 — the transcript body lands in Q3 and the
// unbound workspace picker lands in Q4.

import type { Pane as PaneModel } from "@/state/ShellState";
import { PaneStatus, SurfaceKind } from "@/observability/reasons";

const C = {
  ground: "#212327",
  chrome: "#26292e",
  input: "#1a1c20",
  chromeHi: "#2e3138",
  text: "#b9bec5",
  textHi: "#e2e5e9",
  textDim: "#9aa0a8",
  textFaint: "#62676f",
  textFaintest: "#4a4e55",
  accent: "#82a5c8",
  amber: "#7fb3b8",
  revealBtn: "#3d434c",
} as const;

const DRIVER_OPTIONS: readonly string[] = [
  "kimi-k2",
  "deepseek-r1:8b",
  "qwen3-coder:480b-cloud",
  "nemotron-3-super",
  "claude (cli)",
  "gemini (cli)",
  "deterministic",
] as const;

function statusDotColor(status: PaneStatus): string {
  switch (status) {
    case PaneStatus.RUNNING: return C.amber;
    case PaneStatus.PARKED: return C.accent;
    case PaneStatus.ENDED: return C.textFaintest;
    case PaneStatus.INTERRUPTED: return "#c26058";
    default: return C.textFaint;
  }
}

interface Props {
  pane: PaneModel;
  focused: boolean;
  singlePane: boolean;
  onFocus: (paneId: string) => void;
  onDriverDropdownOpen: (paneId: string, options: readonly string[]) => void;
  onDriverDropdownClose: (paneId: string) => void;
  onDriverPick: (paneId: string, sessionId: string, fromDriver: string, toDriver: string) => void;
  onWorkspacePopoverOpen: (paneId: string) => void;
  onWorkspacePopoverClose: (paneId: string) => void;
  onRecordsToggle: (paneId: string) => void;
  onStudioToggle: (paneId: string) => void;
  onRevealToggle: (paneId: string) => void;
}

export function Pane({
  pane, focused, singlePane, onFocus,
  onDriverDropdownOpen, onDriverDropdownClose, onDriverPick,
  onWorkspacePopoverOpen, onWorkspacePopoverClose,
  onRecordsToggle, onStudioToggle, onRevealToggle,
}: Props): JSX.Element {
  const driver = pane.driver ?? "";
  const shape = pane.workspaceShape ?? "";
  const branchLabel = pane.sessionName
    ? (shape === "worktree" ? `⌥ substrate/${pane.sessionName}` : `⌥ ${shape || pane.sessionName}`)
    : "⌥ —";
  const isRecords = pane.surface?.kind === SurfaceKind.RECORDS;
  const isStudio = pane.surface?.kind === SurfaceKind.STUDIO;

  const paneStyle: React.CSSProperties = {
    background: C.ground, display: "flex", flexDirection: "column",
    minWidth: 0, minHeight: 0, opacity: focused ? 1 : 0.55, position: "relative",
  };
  const headerRowStyle: React.CSSProperties = {
    display: "flex", gap: 8, padding: "6px 10px", background: C.chrome,
    fontSize: 10, alignItems: "center", whiteSpace: "nowrap",
    flex: "none", minWidth: 0, overflow: "hidden", cursor: "default",
  };
  const chipStyle: React.CSSProperties = {
    color: C.textDim, border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 4, padding: "0 6px", cursor: "pointer",
    display: "inline-block", userSelect: "none",
  };
  const handleStyle = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    cursor: "pointer", flex: "none", color, ...extra,
  });

  return (
    <div
      data-testid={`pane-${pane.id}`}
      data-pane-id={pane.id}
      style={paneStyle}
      onClick={() => onFocus(pane.id)}
    >
      <div style={headerRowStyle}>
        {singlePane ? (
          <div style={{ display: "flex", gap: 6, flex: "none" }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: C.textFaintest }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: C.textFaintest }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: C.textFaintest }} />
          </div>
        ) : (
          <span
            data-testid={`pane-drag-handle-${pane.id}`}
            title="drag to rearrange"
            style={{ color: C.textFaint, padding: "0 4px", cursor: "grab", userSelect: "none" }}
          >⋮⋮</span>
        )}
        <span style={{ display: "inline-flex", alignItems: "baseline", flex: "none" }}>
          <span style={{ color: C.textHi, fontWeight: 600, fontSize: 11 }}>substrate</span>
          <span
            title="the dot is this session's status"
            style={{
              width: 4, height: 4, borderRadius: "50%",
              background: statusDotColor(pane.status), display: "inline-block", marginLeft: 3,
            }}
          />
        </span>
        <span
          data-testid={`pane-name-${pane.id}`}
          style={{
            color: focused ? C.textHi : C.textDim, cursor: "text",
            overflow: "hidden", textOverflow: "ellipsis",
            flex: "0 1 auto", minWidth: 64,
          }}
        >
          <span className="label">{pane.sessionName ?? "(unbound)"}</span>
        </span>
        <span style={{ marginLeft: "auto", flex: "none" }} />

        {/* driver chip */}
        <span style={{ flex: "none", position: "relative", display: "inline-block" }}>
          <span
            data-testid={`pane-driver-chip-${pane.id}`}
            data-driver={driver}
            style={chipStyle}
            onClick={(e) => {
              e.stopPropagation();
              if (pane.driverPopover.open) onDriverDropdownClose(pane.id);
              else onDriverDropdownOpen(pane.id, DRIVER_OPTIONS);
            }}
          >
            <span className="label">{driver || "—"} ▾</span>
          </span>
          {pane.driverPopover.open && (
            <span
              data-testid={`pane-driver-popover-${pane.id}`}
              style={{
                position: "absolute", right: 0, top: 20, zIndex: 30,
                background: C.chrome, border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 6, padding: "5px 0", display: "flex",
                flexDirection: "column", minWidth: 180,
                boxShadow: "0 8px 24px rgba(0,0,0,.4)",
              }}
            >
              {DRIVER_OPTIONS.map((opt) => (
                <span
                  key={opt}
                  data-testid={`pane-driver-option-${pane.id}-${opt}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDriverPick(pane.id, pane.boundSessionId ?? "", driver, opt);
                  }}
                  style={{
                    padding: "4px 12px", cursor: "pointer", fontSize: 10.5,
                    color: opt === driver ? C.textHi : C.textDim, whiteSpace: "nowrap",
                  }}
                >
                  <span className="label">{opt}</span>
                </span>
              ))}
            </span>
          )}
        </span>

        {/* workspace popover chip */}
        <span style={{
          flex: "0 4 auto", minWidth: 34, position: "relative",
          display: "inline-block", overflow: "visible",
        }}>
          <span
            data-testid={`pane-workspace-chip-${pane.id}`}
            data-workspace-shape={shape}
            style={{
              color: C.textFaint, border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 4, padding: "0 6px", cursor: "pointer",
              display: "inline-block", maxWidth: "100%", boxSizing: "border-box",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              userSelect: "none",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (pane.workspacePopover.open) onWorkspacePopoverClose(pane.id);
              else onWorkspacePopoverOpen(pane.id);
            }}
          >
            <span className="label">{branchLabel}</span>
          </span>
          {pane.workspacePopover.open && (
            <span
              data-testid={`pane-workspace-popover-${pane.id}`}
              style={{
                position: "absolute", right: 0, top: 20, zIndex: 30,
                background: C.chrome, border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 6, padding: "9px 13px", display: "block",
                minWidth: 270, boxShadow: "0 8px 24px rgba(0,0,0,.4)",
                fontSize: 10.5, lineHeight: 1.8, color: C.textDim, whiteSpace: "nowrap",
              }}
            >
              <span className="label">workspace </span>
              <span style={{ color: C.textHi }} className="label">
                {pane.workspacePath ?? "(none)"}
              </span>
              <br />
              <span className="label">shape </span>
              <span style={{ color: C.textHi }} className="label">{shape || "(none)"}</span>
              <br />
              <span style={{ color: C.textFaint }} className="label">frozen at seq 1</span>
            </span>
          )}
        </span>

        <span
          data-testid={`pane-records-${pane.id}`}
          onClick={(e) => { e.stopPropagation(); onRecordsToggle(pane.id); }}
          style={handleStyle(isRecords ? C.textHi : C.textDim)}
        ><span className="label">records</span></span>
        <span
          data-testid={`pane-studio-${pane.id}`}
          onClick={(e) => { e.stopPropagation(); onStudioToggle(pane.id); }}
          style={handleStyle(isStudio ? C.textHi : C.textDim)}
        ><span className="label">studio</span></span>
        <span
          data-testid={`pane-reveal-${pane.id}`}
          onClick={(e) => { e.stopPropagation(); onRevealToggle(pane.id); }}
          style={{
            cursor: "pointer", flex: "none", color: C.textDim,
            background: C.revealBtn, borderRadius: 4, padding: "1px 6px", fontWeight: 600,
          }}
          title="⌃` reveal — expand this session over the window"
        ><span className="label">⌃` reveal</span></span>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          color: C.textFaintest, fontSize: 11,
        }}>
          <span className="label">
            {pane.boundSessionId
              ? "bound · transcript body lands in Q3"
              : "unbound · workspace picker lands in Q4"}
          </span>
        </div>
      </div>
    </div>
  );
}
