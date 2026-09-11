// Pane.tsx — one pane frame with its header + 11 per-pane anchors.
// Layer 7 pixel-anchor slots per pane: focus, status, reveal, lens, level,
// dir, descent, surface, find, inspect, header_popover.

import { Pane as PaneModel, WorkspaceShape, Lens } from "@/state/ShellState";
import { PaneStatus, RevealState, StreamLevel, StreamDir } from "@/observability/reasons";
import { PaneHeader } from "./PaneHeader";
import { Anchor, AnchorScope } from "./Anchor";
import { UnboundPanePicker } from "./UnboundPanePicker";
import { Prompt } from "./Prompt";
import { RevealShell } from "./RevealShell";
import {
  USER_MESSAGE, MODEL_REPLY, PARK, SESSION_ENDED,
  TRANSCRIPT_COMPACTED, RATE_LIMITED_WAITING,
  TOOL_CALL, TOOL_NAME_DELEGATE,
} from "@/observability/envelope-kinds";
import { TranscriptDelegateRow } from "./TranscriptDelegateRow";
import { TranscriptDelegateExpanded } from "./TranscriptDelegateExpanded";

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
  onLensSwitch?: (paneId: string, to: Lens) => void;
  onStreamLevelToggle?: (paneId: string) => void;
  onStreamDirToggle?: (paneId: string) => void;
  onRevealFocusToggle?: (paneId: string) => void;
  onDelegateExpandToggle?: (paneId: string, toolCallId: string, childRecordRoot: string | null) => void;
}

const ROW_COLORS: Record<string, string> = {
  [USER_MESSAGE]: "#82a5c8",
  [MODEL_REPLY]: "#a7c893",
  [SESSION_ENDED]: "#c26058",
  [PARK]: "#c89a6b",
  [TRANSCRIPT_COMPACTED]: "#6b7ac2",
  [RATE_LIMITED_WAITING]: "#c2a86b",
};
const ROW_GLYPHS: Record<string, string> = {
  [USER_MESSAGE]: ">",
  [MODEL_REPLY]: "<",
  [SESSION_ENDED]: "!",
  [PARK]: "-",
  [TRANSCRIPT_COMPACTED]: "=",
  [RATE_LIMITED_WAITING]: "~",
};
function rowColor(kind: string): string { return ROW_COLORS[kind] ?? "#5f636b"; }
function rowGlyph(kind: string): string { return ROW_GLYPHS[kind] ?? "*"; }

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
      case PaneStatus.UNBOUND: return 0;
      case PaneStatus.PARKED: return 64;
      case PaneStatus.RUNNING: return 96;
      case PaneStatus.INTERRUPTED: return 56;
      case PaneStatus.ENDED: return 32;
    }
  }
  if (slot === "reveal") return pane.reveal === RevealState.REVEAL ? 128 : 0;
  if (slot === "lens") {
    switch (pane.lens) {
      case Lens.STREAM_GRAPH: return 0;
      case Lens.IO:          return 64;
      case Lens.STRUCTURE:    return 128;
      case Lens.SCENE:        return 192;
    }
  }
  if (slot === "level") return pane.streamLevel === StreamLevel.APP ? 255 : 0;
  if (slot === "dir")   return pane.streamDir === StreamDir.SIDE ? 255 : 0;
  return 0;
}

export function Pane({ pane, onFocus, onDragStart, onClose, onPickerText, onPickerWalk, onPickerCommit, onResume, onPromptText, onPromptLengthChanged, onPromptSubmit, onRevealToggle, onLensSwitch, onStreamLevelToggle, onStreamDirToggle, onRevealFocusToggle, onDelegateExpandToggle }: Props): JSX.Element {
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
        {pane.status === PaneStatus.UNBOUND && onPickerText && onPickerWalk && onPickerCommit && onResume ? (
          <UnboundPanePicker
            pane={pane}
            onText={onPickerText}
            onWalk={onPickerWalk}
            onCommit={onPickerCommit}
            onResume={onResume}
          />
        ) : pane.boundSessionId && pane.reveal === RevealState.REVEAL ? (
          <RevealShell
            pane={pane}
            onLensSwitch={onLensSwitch}
            onStreamLevelToggle={onStreamLevelToggle}
            onStreamDirToggle={onStreamDirToggle}
            onRevealFocusToggle={onRevealFocusToggle}
          />
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
                pane.transcriptRows.map((row) => {
                  if (row.kind === TOOL_CALL && row.tool_name === TOOL_NAME_DELEGATE) {
                    const tcId = row.tool_call_id ?? "";
                    const expanded = tcId in pane.delegateExpansions;
                    return (
                      <div key={row.seq}>
                        <TranscriptDelegateRow
                          paneId={pane.id}
                          row={row}
                          depth={1}
                          expanded={expanded}
                          onExpandToggle={onDelegateExpandToggle}
                        />
                        {expanded ? (
                          <TranscriptDelegateExpanded
                            paneId={pane.id}
                            toolCallId={tcId}
                            childRows={pane.delegateExpansions[tcId]}
                            depth={1}
                          />
                        ) : null}
                      </div>
                    );
                  }
                  return (
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
                  );
                })
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
          scope={AnchorScope.PANE}
          paneId={pane.id}
          slot={slot}
          byte={initialByte(slot, pane)}
        />
      ))}
    </div>
  );
}
