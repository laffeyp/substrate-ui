// Sprint 074 — tool card. Header + expandable body matching
// reveal.html:112-133. Local `useState({ open })` per card, keyed on
// callId; auto-open on `toolRunning` alone (streaming does not drive
// visibility); explicit `false` closes even against auto-open. The
// body carries `data-tool-card-body="1"` so the Sprint 075 caret-pin
// harness can select it.

import * as React from "react";
import type { TranscriptRow } from "../../vm";
import { ProgressStream } from "./ProgressStream";

interface Props {
  call: TranscriptRow;                 // the ToolCall row
  result?: TranscriptRow | undefined;  // paired ToolResult (or absent while running)
  progressText: string;
  progressEof: boolean;
  streamingShow: boolean;
  onDescend?: (recordRoot: string) => void;
}

function statusColor(toolRunning: boolean, failed: boolean): string {
  if (toolRunning) return "#7fb3b8";
  if (failed) return "#c26058";
  return "#9aa0a8";
}

const ToolCardInner: React.FC<Props> = ({ call, result, progressText, progressEof, streamingShow, onDescend }) => {
  const toolRunning = !result;
  const failed = result?.toolOk === false;
  const [openLocal, setOpenLocal] = React.useState<boolean | undefined>(undefined);
  const visiblyOpen = openLocal !== undefined ? openLocal : toolRunning;
  const onToggle = React.useCallback(() => {
    setOpenLocal(!visiblyOpen);
  }, [visiblyOpen]);

  const toolName = call.toolName ?? "";
  const toolPreview = call.args?.[0] ?? "";
  const status = toolRunning ? "running" : failed ? "err · " + (result?.error ?? "") : "ok";
  const cardCaret = visiblyOpen ? "▾" : "▸";
  const argList = (call.args ?? []).map((value, index) => ({ i: `[${index}]`, v: value }));

  // hasResult mirrors reveal_component.ts:1094: output is visible when
  // the tool is not running AND either there was no stream OR the
  // stream has sealed with eof.
  const hasResult = !toolRunning && (!streamingShow || progressEof);
  const outputText = result?.output ?? "";
  const errorText = result?.error ?? "";
  const hasError = !!errorText;

  // Descend affordance mirrors reveal_component.ts:1075. Only delegate
  // tool results carry a child_root; for now we surface it whenever
  // the paired ToolResult's output includes a child_root string.
  let descendPath: string | null = null;
  if (result && result.output && typeof result.output === "string") {
    try {
      const parsed = JSON.parse(result.output);
      if (parsed && typeof parsed.child_root === "string") descendPath = parsed.child_root;
    } catch (_) { /* not JSON, no descend */ }
  }
  const descendShow = !!descendPath;
  const onDescendClick = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (descendPath && onDescend) onDescend(descendPath);
  }, [descendPath, onDescend]);

  return (
    <span style={{ display: "inline-block", verticalAlign: "top", maxWidth: "calc(100% - 24px)" }}>
      <span
        onClick={onToggle}
        style={{ cursor: "pointer", display: "inline-block", maxWidth: "calc(100% - 24px)", verticalAlign: "top" }}
      >
        <span style={{ color: "#9aa0a8", fontFamily: "ui-monospace,'SF Mono',Menlo,monospace" }}>{toolName}</span>
        {" "}
        <span style={{ color: "#b9bec5", fontFamily: "ui-monospace,'SF Mono',Menlo,monospace" }}>{toolPreview}</span>
        <span style={{ color: "#4a4e55" }}>{" · "}</span>
        <span style={{ color: statusColor(toolRunning, failed), fontFamily: "ui-monospace,'SF Mono',Menlo,monospace" }}>{status}</span>
        <span style={{ color: "#4a4e55", marginLeft: 8 }}>{cardCaret}</span>
      </span>
      {descendShow ? (
        <span
          onClick={onDescendClick}
          style={{ cursor: "pointer", color: "#a08fc9", marginLeft: 8 }}
          title="descend into the child record — the pane's stream switches to the delegate's own envelopes"
        >· descend ⏎</span>
      ) : null}
      {visiblyOpen ? (
        <div data-tool-card-body="1" style={{
          margin: "6px 0 8px 24px",
          background: "#26292e",
          borderRadius: "0 0 6px 6px",
          padding: "10px 14px",
          fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
          fontSize: 11,
          lineHeight: 1.7,
          color: "#b9bec5",
        }}>
          <div style={{ color: "#62676f" }}>args</div>
          {argList.map((argRow) => (
            <div key={argRow.i} style={{ color: "#b9bec5" }}>
              {argRow.i} <span style={{ color: "#e2e5e9" }}>{argRow.v}</span>
            </div>
          ))}
          {streamingShow ? (
            <ProgressStream progressText={progressText} eof={progressEof} />
          ) : null}
          {hasResult ? (
            <>
              <div style={{ marginTop: 8, color: "#62676f" }}>output</div>
              <div style={{
                background: "#1a1c20",
                borderRadius: 5,
                padding: "8px 12px",
                maxHeight: 220,
                overflow: "auto",
                color: "#9aa0a8",
                whiteSpace: "pre-wrap",
              }}>{outputText}</div>
            </>
          ) : null}
          {hasError ? (
            <div style={{ marginTop: 6, color: "#c26058" }}>error {errorText}</div>
          ) : null}
          <div style={{ color: "#4a4e55", marginTop: 6 }}>
            call_id {call.callId ?? ""} · step {call.toolStep ?? ""} · {status} · {outputText.length} bytes
          </div>
        </div>
      ) : null}
    </span>
  );
};

export const ToolCard = React.memo(ToolCardInner);
