// Pane.tsx — one pane frame with its header + 11 per-pane anchors.
// Layer 7 pixel-anchor slots per pane: focus, status, reveal, lens, level,
// dir, descent, surface, find, inspect, header_popover.

import { Pane as PaneModel, WorkspaceShape } from "@/state/ShellState";
import { PaneHeader } from "./PaneHeader";
import { Anchor } from "./Anchor";
import { UnboundPanePicker } from "./UnboundPanePicker";
import { Prompt } from "./Prompt";
import { RevealShell } from "./RevealShell";

interface Props {
  pane: PaneModel;
  onFocus?: (paneId: string) => void;
  onDragStart?: (paneId: string, ev: React.PointerEvent) => void;
  onClose?: (paneId: string) => void;
  onPickerText?: (paneId: string, text: string) => void;
  onPickerWalk?: (paneId: string, index: number, path: string, shape: WorkspaceShape) => void;
  onPickerCommit?: (paneId: string, path: string, shape: WorkspaceShape) => void;
  onResume?: (paneId: string, sessionId: string) => void;
  onPromptText?: (paneId: string, text: string) => void;
  onPromptLengthChanged?: (paneId: string, length: number) => void;
  onPromptSubmit?: (paneId: string, text: string) => void;
  onRevealToggle?: (paneId: string) => void;
}

function rowColor(kind: string): string {
  if (kind === "UserMessage") return "#82a5c8";
  if (kind === "ModelReply") return "#a7c893";
  if (kind === "SessionEnded") return "#c26058";
  if (kind === "Park") return "#c89a6b";
  if (kind === "TranscriptCompacted") return "#6b7ac2";
  if (kind === "RateLimitedWaiting") return "#c2a86b";
  return "#5f636b";
}

function rowGlyph(kind: string): string {
  if (kind === "UserMessage") return ">";
  if (kind === "ModelReply") return "<";
  if (kind === "SessionEnded") return "!";
  if (kind === "Park") return "-";
  if (kind === "TranscriptCompacted") return "=";
  if (kind === "RateLimitedWaiting") return "~";
  return "*";
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
  if (slot === "reveal") return pane.reveal === "reveal" ? 128 : 0;
  return 0;
}

export function Pane({ pane, onFocus, onDragStart, onClose, onPickerText, onPickerWalk, onPickerCommit, onResume, onPromptText, onPromptLengthChanged, onPromptSubmit, onRevealToggle }: Props): JSX.Element {
  return (
    <div
      data-testid={`pane-${pane.id}`}
      data-pane-id={pane.id}
      data-focused={pane.focused ? "true" : "false"}
      onMouseDown={onFocus ? () => onFocus(pane.id) : undefined}
      style={S.frame}
    >
      <PaneHeader pane={pane} onDragStart={onDragStart} onClose={onClose} onRevealToggle={onRevealToggle} />
      <div style={S.body}>
        {pane.status === "unbound" && onPickerText && onPickerWalk && onPickerCommit && onResume ? (
          <UnboundPanePicker
            pane={pane}
            onText={onPickerText}
            onWalk={onPickerWalk}
            onCommit={onPickerCommit}
            onResume={onResume}
          />
        ) : pane.boundSessionId && pane.reveal === "reveal" ? (
          <RevealShell pane={pane} />
        ) : pane.boundSessionId && onPromptText && onPromptLengthChanged && onPromptSubmit ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, overflow: "auto", padding: "6px 0" }}>
              <div className="label" style={{ color: "#5f636b", padding: "0 4px 4px" }}>
                session {pane.sessionName ?? pane.boundSessionId?.slice(0, 8)}
              </div>
              {pane.transcriptRows.length === 0 ? (
                <div className="label" style={{ color: "#5f636b", padding: "0 4px" }}>
                  ◐ parked — awaiting your first message
                </div>
              ) : (
                pane.transcriptRows.map((row) => (
                  <div
                    key={row.seq}
                    data-testid={`transcript-row-${pane.id}-${row.seq}`}
                    data-kind={row.kind}
                    style={{
                      padding: "3px 6px", borderBottom: "1px solid #23262a",
                      fontSize: 12, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const,
                    }}
                  >
                    <span className="label" style={{ color: rowColor(row.kind), marginRight: 6 }}>
                      {rowGlyph(row.kind)} {row.kind}
                    </span>
                    <span style={{ color: "#8a8f96" }}>{row.summary}</span>
                  </div>
                ))
              )}
            </div>
            <Prompt
              pane={pane}
              onText={onPromptText}
              onLengthChanged={onPromptLengthChanged}
              onSubmit={onPromptSubmit}
            />
          </div>
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
