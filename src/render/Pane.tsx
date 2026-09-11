// Pane.tsx — one pane frame with its header + 11 per-pane anchors.
// Layer 7 pixel-anchor slots per pane: focus, status, reveal, lens, level,
// dir, descent, surface, find, inspect, header_popover.

import { Pane as PaneModel, WorkspaceShape, Lens, TranscriptRow } from "@/state/ShellState";
import { PaneStatus, RevealState, StreamLevel, StreamDir } from "@/observability/reasons";
import { PaneHeader } from "./PaneHeader";
import { Anchor, AnchorScope, PaneSlot, PANE_SLOT_ORDER } from "./Anchor";
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
import { TranscriptDelegateRefused } from "./TranscriptDelegateRefused";
import { TranscriptFanOutList } from "./TranscriptFanOutList";
import { Inspector } from "./Inspector";
import { detectFanoutGroups } from "@/reducer/ShellReducer";

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
  onDescend?: (paneId: string, toolCallId: string, childRecordRoot: string | null) => void;
  onDescentExit?: (paneId: string) => void;
  onFanoutExpand?: (paneId: string, leaderToolCallId: string) => void;
  onFanoutWalk?: (paneId: string, leaderToolCallId: string, toIndex: number, siblingCount: number) => void;
  onFanoutCollapse?: (paneId: string, leaderToolCallId: string) => void;
  onInspectorToggle?: (paneId: string, envelopeSeq: number, envelopeKind: string, sourceIsStream: boolean) => void;
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

// PER_PANE_SLOTS is the render order — same list as Layer 7's
// PANE_SLOT_ORDER, sourced from the generated anchors table.
const PER_PANE_SLOTS = PANE_SLOT_ORDER;

const S = {
  frame: { position: "relative" as const, display: "flex" as const,
    flexDirection: "column" as const, height: "100%", width: "100%",
    background: "#212327", color: "#b9bec5",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fontSize: 13,
  },
  body: { flex: 1, padding: "24px 32px", overflow: "auto" as const },
};

function initialByte(slot: (typeof PANE_SLOT_ORDER)[number], pane: PaneModel): number {
  if (slot === PaneSlot.FOCUS) return pane.focused ? 255 : 128;
  if (slot === PaneSlot.STATUS) {
    switch (pane.status) {
      case PaneStatus.UNBOUND: return 0;
      case PaneStatus.PARKED: return 64;
      case PaneStatus.RUNNING: return 96;
      case PaneStatus.INTERRUPTED: return 56;
      case PaneStatus.ENDED: return 32;
    }
  }
  if (slot === PaneSlot.REVEAL) return pane.reveal === RevealState.REVEAL ? 128 : 0;
  if (slot === PaneSlot.LENS) {
    switch (pane.lens) {
      case Lens.STREAM_GRAPH: return 0;
      case Lens.IO:          return 64;
      case Lens.STRUCTURE:    return 128;
      case Lens.SCENE:        return 192;
    }
  }
  if (slot === PaneSlot.LEVEL) return pane.streamLevel === StreamLevel.APP ? 255 : 0;
  if (slot === PaneSlot.DIR)   return pane.streamDir === StreamDir.SIDE ? 255 : 0;
  if (slot === PaneSlot.DESCENT) return pane.descentStack.length; // 0 · 1 · 2 per Layer 7
  if (slot === PaneSlot.INSPECT) {
    // Layer 7: low byte of selected seq (0..255) · byte 0 when closed.
    return pane.inspectorSeq === null ? 0 : pane.inspectorSeq & 0xff;
  }
  return 0;
}

export function Pane({ pane, onFocus, onDragStart, onClose, onPickerText, onPickerWalk, onPickerCommit, onResume, onPromptText, onPromptLengthChanged, onPromptSubmit, onRevealToggle, onLensSwitch, onStreamLevelToggle, onStreamDirToggle, onRevealFocusToggle, onDelegateExpandToggle, onDescend, onDescentExit, onFanoutExpand, onFanoutWalk, onFanoutCollapse, onInspectorToggle }: Props): JSX.Element {
  const depth = pane.descentStack.length;
  const inDescent = depth > 0;
  const activeRows: TranscriptRow[] = inDescent
    ? pane.descentStack[depth - 1].rows
    : pane.transcriptRows;
  const fanoutGroups = detectFanoutGroups(activeRows);
  const fanoutLeaderSeq = new Map<number, typeof fanoutGroups[number]>();
  const suppressedSeqs = new Set<number>();
  for (const g of fanoutGroups) {
    fanoutLeaderSeq.set(g.leaderSeq, g);
    for (const s of g.siblingSeqs) if (s !== g.leaderSeq) suppressedSeqs.add(s);
  }
  return (
    <div
      data-testid={`pane-${pane.id}`}
      data-pane-id={pane.id}
      data-focused={pane.focused ? "true" : "false"}
      onMouseDown={onFocus ? () => onFocus(pane.id) : undefined}
      style={S.frame}
    >
      <PaneHeader pane={pane} onDragStart={onDragStart} onClose={onClose} onRevealToggle={onRevealToggle} />
      <Inspector pane={pane} />
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
              <div
                className="label"
                data-testid={`pane-header-crumb-${pane.id}`}
                data-descent-depth={String(depth)}
                style={{ color: "#5f636b", padding: "0 4px 4px" }}
              >
                {inDescent
                  ? `session ▸ ${pane.descentStack.map(() => "child").join(" ▸ ")}`
                  : `session ${pane.sessionName ?? pane.boundSessionId?.slice(0, 8)}`}
                {inDescent && onDescentExit ? (
                  <span
                    data-testid={`descent-exit-${pane.id}`}
                    onClick={() => onDescentExit(pane.id)}
                    style={{ cursor: "pointer", marginLeft: 8, color: "#82a5c8" }}
                  >⌫ back</span>
                ) : null}
              </div>
              {activeRows.length === 0 ? (
                <div className="label" style={{ color: "#5f636b", padding: "0 4px" }}>
                  {inDescent ? "loading descent transcript…" : "◐ parked — awaiting your first message"}
                </div>
              ) : (
                activeRows.map((row) => {
                  if (suppressedSeqs.has(row.seq)) return null;
                  const rowDepth = Math.min(depth + 1, 2);
                  const fanoutGroup = fanoutLeaderSeq.get(row.seq);
                  if (fanoutGroup) {
                    const leaderTcId = fanoutGroup.leaderToolCallId;
                    const expansion = pane.fanoutExpansions[leaderTcId];
                    return (
                      <TranscriptFanOutList
                        key={row.seq}
                        paneId={pane.id}
                        group={fanoutGroup}
                        expanded={!!expansion}
                        walkedIndex={expansion?.walkedIndex ?? 0}
                        depth={rowDepth}
                        onExpand={onFanoutExpand}
                        onWalk={onFanoutWalk}
                        onCollapse={onFanoutCollapse}
                      />
                    );
                  }
                  if (row.kind === TOOL_CALL && row.tool_name === TOOL_NAME_DELEGATE) {
                    const tcId = row.tool_call_id ?? "";
                    const expanded = !inDescent && tcId in pane.delegateExpansions;
                    const refused = pane.refusedToolCallIds.has(tcId);
                    return (
                      <div key={row.seq}>
                        <TranscriptDelegateRow
                          paneId={pane.id}
                          row={row}
                          depth={rowDepth}
                          expanded={expanded}
                          onExpandToggle={inDescent ? undefined : onDelegateExpandToggle}
                          onDescend={onDescend}
                        />
                        {refused ? (
                          <TranscriptDelegateRefused paneId={pane.id} toolCallId={tcId} />
                        ) : null}
                        {expanded ? (
                          <TranscriptDelegateExpanded
                            paneId={pane.id}
                            toolCallId={tcId}
                            childRows={pane.delegateExpansions[tcId]}
                            depth={rowDepth}
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
                      onClick={onInspectorToggle
                        ? () => onInspectorToggle(pane.id, row.seq, row.kind, false)
                        : undefined}
                      style={{
                        padding: "3px 6px", borderBottom: "1px solid #23262a",
                        fontSize: 12, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const,
                        cursor: onInspectorToggle ? "pointer" : "default",
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
      {PER_PANE_SLOTS.map((slot: (typeof PANE_SLOT_ORDER)[number]) => (
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
