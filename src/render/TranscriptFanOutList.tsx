// TranscriptFanOutList.tsx — Sprint 023.
//
// Renders one fan-out row in the transcript for a group of >= 2
// adjacent delegate ToolCalls at the same step. Click to expand into
// a walked list. ↑↓ walks through siblings while the list is open.
// Layer 5 signals: FAN_OUT_INLINE_EXPANDED / FAN_OUT_INLINE_WALKED /
// FAN_OUT_INLINE_COLLAPSED / DELEGATE_CALL_FOLDED (terminal).

import { useEffect, useRef } from "react";
import type { FanoutGroup } from "@/reducer/ShellReducer";
import { depthAccent } from "@/lib/depthAccent";
import { TOOL_CALL } from "@/observability/envelope-kinds";

interface Props {
  paneId: string;
  group: FanoutGroup;
  expanded: boolean;
  walkedIndex: number;
  depth: number;
  onExpand?: (paneId: string, leaderToolCallId: string) => void;
  onWalk?: (paneId: string, leaderToolCallId: string, toIndex: number, siblingCount: number) => void;
  onCollapse?: (paneId: string, leaderToolCallId: string) => void;
}

export function TranscriptFanOutList({
  paneId, group, expanded, walkedIndex, depth,
  onExpand, onWalk, onCollapse,
}: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const accent = depthAccent(depth);
  const siblingCount = group.siblingToolCallIds.length;

  useEffect(() => {
    if (!expanded) return;
    const el = containerRef.current;
    if (!el) return;
    el.focus();
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        onWalk?.(paneId, group.leaderToolCallId, walkedIndex + 1, siblingCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onWalk?.(paneId, group.leaderToolCallId, walkedIndex - 1, siblingCount);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCollapse?.(paneId, group.leaderToolCallId);
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [expanded, walkedIndex, siblingCount, paneId, group.leaderToolCallId, onWalk, onCollapse]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      data-testid={`transcript-row-${paneId}-${group.leaderSeq}`}
      data-kind={TOOL_CALL}
      data-fanout="true"
      data-tool-call-id={group.leaderToolCallId}
      data-children-count={String(siblingCount)}
      data-expanded={expanded ? "true" : "false"}
      data-walked-index={String(walkedIndex)}
      onClick={() => {
        if (expanded) onCollapse?.(paneId, group.leaderToolCallId);
        else          onExpand?.(paneId, group.leaderToolCallId);
      }}
      style={{
        padding: "3px 6px",
        borderLeft: `3px solid ${accent}`,
        borderBottom: "1px solid #23262a",
        background: "#1e2024",
        fontSize: 12,
        cursor: "pointer",
        outline: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span className="label" style={{ color: accent, fontWeight: 600 }}>
          fan-out
        </span>
        <span style={{ color: "#8a8f96" }}>{siblingCount} delegates</span>
        <span className="label" style={{ color: accent }}>{expanded ? "-" : "+"}</span>
        <span style={{ color: "#5f636b", marginLeft: "auto", fontSize: 10 }}>
          depth {depth}
        </span>
      </div>
      {expanded ? (
        <div
          data-testid={`fanout-list-${paneId}-${group.leaderToolCallId}`}
          style={{ marginTop: 6, marginLeft: 22, borderLeft: `2px solid ${accent}`, paddingLeft: 8 }}
        >
          {group.siblingToolCallIds.map((tcId, i) => (
            <div
              key={tcId}
              data-testid={`fanout-child-${paneId}-${group.leaderToolCallId}-${i}`}
              data-active={i === walkedIndex ? "true" : "false"}
              data-tool-call-id={tcId}
              style={{
                padding: "2px 6px",
                fontSize: 11,
                color: i === walkedIndex ? "#e2e5e9" : "#8a8f96",
                background: i === walkedIndex ? "#2a2d33" : "transparent",
                borderRadius: 3,
              }}
            >
              [{i}] {tcId}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
