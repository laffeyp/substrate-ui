// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 074 — tool card: a header and an expandable body, as the dc-runtime page drew one. Local
// `useState({ open })` per card, keyed on callId; it opens on `toolRunning` alone (streaming does not
// drive visibility); an explicit `false` closes it even against that. The body carries
// `data-tool-card-body="1"` so the sprint 075 caret-pin harness can select it.

import * as React from "react";
import type { TranscriptRow } from "../../vm";
import { ProgressStream, TERMINAL_MAX } from "./ProgressStream";
import { defaultOpen } from "../../vm/tool_output_mode";
import { useToolOutputMode } from "./useToolOutputMode";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { Signal } from "../../vm/signals.gen";
import { SummaryText, TerminalText, ToolText } from "./ToolText";
import { argFormat, formatShellCommand, needsTerminal, outputFormat, shellResult, splitArg, summaryOf } from "../tool_format";
import { useToolView } from "./useToolView";

const hasResultText = (r: TranscriptRow | undefined) => !!r && typeof r.output === "string" && r.output.length > 0;

interface Props {
  call: TranscriptRow;                 // the ToolCall row
  result?: TranscriptRow | undefined;  // paired ToolResult (or absent while running)
  progressText: string;
  progressEof: boolean;
  droppedLines: number;
  streamingShow: boolean;
  onDescend?: (recordRoot: string) => void;
  /** The pane and session the card is drawn in, for TOOL_CARD_TOGGLED (v0.24). */
  paneId?: number | undefined;
  sessionId?: string | null;
}

/** A closed card's name and preview show at most this many lines (sprint 506). */
const SUMMARY_LINES = 3;

function statusColor(toolRunning: boolean, failed: boolean): string {
  if (toolRunning) return "#7fb3b8";
  if (failed) return "#c26058";
  return "#9aa0a8";
}

// The panes view and meta's transcript column each draw their own `<Transcript>`
// (web/app/PanesView.tsx, web/app/App.tsx), so a card unmounts and mounts again when the view
// changes, and a per-instance useState would lose its open flag. (Under dc-runtime the root remounted
// on every snapshot.) The map below outlives a remount and is keyed by callId.
// Each entry keeps the toggle generation it was clicked under (UI sprint 140): a flip of the
// expand/collapse-all toggle supersedes every earlier click.
const openByCallId: Map<string, { open: boolean; generation: number }> = new Map();

const ToolCardInner: React.FC<Props> = ({ call, result, progressText, progressEof, droppedLines, streamingShow, onDescend, paneId, sessionId }) => {
  const toolRunning = !result;
  const failed = result?.toolOk === false;
  const callId = call.callId ?? "";
  // open state per call, not per recurring call id (UI sprint 101)
  const openKey = call.callKey ?? callId;
  const toggle = useToolOutputMode();
  const toolView = useToolView();
  const seeded = openKey ? openByCallId.get(openKey) : undefined;
  const initialOpen = seeded !== undefined && seeded.generation === toggle.generation
    ? seeded.open
    : defaultOpen(toggle.mode, toolRunning);
  const [isOpen, setIsOpen] = React.useState<boolean>(initialOpen);
  // A flip while this card is drawn opens or closes it at once.
  const seenGeneration = React.useRef(toggle.generation);
  React.useEffect(() => {
    if (seenGeneration.current === toggle.generation) return;
    seenGeneration.current = toggle.generation;
    setIsOpen(defaultOpen(toggle.mode, toolRunning));
  }, [toggle.generation, toggle.mode, toolRunning]);
  // The toggle event fires for a click and for React writing `open` from state; only a click makes the
  // element differ from the state, so only a click is TOOL_CARD_TOGGLED (v0.24, P-0.24-ACTIONS).
  const shown = React.useRef(isOpen);
  shown.current = isOpen;
  const onDetailsToggle = React.useCallback((event: React.SyntheticEvent<HTMLDetailsElement>) => {
    const next = event.currentTarget.open;
    if (next !== shown.current && paneId !== undefined) {
      emitSignal(Signal.TOOL_CARD_TOGGLED, { pane_id: paneId, session_id: sessionId ?? null, seq: typeof call.seq === "number" ? call.seq : null, open: next }, { pane_id: paneId });
    }
    setIsOpen(next);
    if (openKey) openByCallId.set(openKey, { open: next, generation: toggle.generation });
  }, [openKey, toggle.generation, paneId, sessionId, call.seq]);

  const toolName = call.toolName ?? "";
  // Sprint 509: the summary's text and its format, without a harness call's `key=`.
  const summary = summaryOf(toolName, call.args ?? []);
  // Raw (sprint 538): a chained shell command reads as a column — broken at its top-level && || ; .
  const previewText = toolView === "raw" && summary.format === "shell" ? formatShellCommand(summary.text) : summary.text;
  // Compact (sprint 538 follow-up): a variation of cards with a one-line preview, not three.
  const clampLines = toolView === "compact" ? 1 : SUMMARY_LINES;
  const status = toolRunning ? "running" : failed ? "err · " + (result?.error ?? "") : "ok";
  // Caret convention: ▸ points right when the card is closed (content
  // hidden), ▾ points down when the card is open (content flows below).
  const cardCaret = isOpen ? "▾" : "▸";
  // Sprint 511: an edit's old text before its new, whatever order the record's keys arrive in (they arrive sorted, so a
  // Claude Code Edit read new_string first). `at` is the arg's index in the call, for its format.
  const rows = (call.args ?? []).map((value, at) => ({ at, v: value }));
  const oldAt = rows.findIndex((r) => splitArg(r.v).key === "old_string");
  const newAt = rows.findIndex((r) => splitArg(r.v).key === "new_string");
  if (oldAt > newAt && newAt >= 0) [rows[oldAt], rows[newAt]] = [rows[newAt], rows[oldAt]];
  const argList = rows.map((row, index) => ({ i: `[${index}]`, v: row.v, at: row.at }));

  // Output shows when the tool is not running and either there was no stream or the stream has
  // sealed with eof.
  const hasResult = !toolRunning && (!streamingShow || progressEof);
  const outputText = result?.output ?? "";
  // Sprint 505: a kernel bash result, `{exit, stdout, stderr}`, drawn as what the command printed.
  const shell = React.useMemo(() => (hasResultText(result) ? shellResult(toolName, outputText) : null), [toolName, outputText, result]);
  const errorText = result?.error ?? "";
  const hasError = !!errorText;

  // Sprint 517: the plain presentation's content. A write or edit's body text first (old before new,
  // sprint 511's order in `rows`), then the output: the stream's text while the tool runs, the
  // result's when it lands — one block across the boundary. The kernel's bash result caps stdout at
  // 8,000 bytes (tools.py _BASH_STDOUT_BYTES) while the stream carried it all, so a stream longer
  // than the result's stdout is kept, and the result's stderr, exit and truncation note append.
  const plainBodies = argList
    .map((a) => ({ key: a.i, text: splitArg(a.v).value, format: argFormat(toolName, call.args ?? [], a.at) }))
    .filter((b) => b.format.kind === "code");
  const resultStdout = shell?.stdout ?? outputText;
  const keptStream = hasResult && streamingShow && progressText.length > resultStdout.length ? progressText : null;
  const cutNote = keptStream && shell ? (/\[bash: stdout cut[^\]]*\]/.exec(shell.stdout)?.[0] ?? null) : null;
  let plainOutput: React.ReactNode = null;
  if (!hasResult) {
    plainOutput = progressText
      ? needsTerminal(progressText) && progressText.length <= TERMINAL_MAX
        ? <TerminalText text={progressText} />
        : progressText
      : null;
  } else if (keptStream) {
    plainOutput = (
      <>
        {needsTerminal(keptStream) && keptStream.length <= TERMINAL_MAX ? <TerminalText text={keptStream} /> : keptStream}
        {shell?.stderr ? <><div data-tool-stderr="1" style={{ color: "#62676f", marginTop: 6 }}>stderr</div><ToolText text={shell.stderr} format={{ kind: "text" }} /></> : null}
        {shell && shell.exit !== null && shell.exit !== 0 ? <div data-tool-exit={String(shell.exit)} style={{ color: "#c26058", marginTop: 6 }}>exit {shell.exit}</div> : null}
        {cutNote ? <div style={{ color: "#62676f", marginTop: 6 }}>{cutNote}</div> : null}
      </>
    );
  } else if (shell) {
    plainOutput = (
      <>
        {shell.stdout ? <ToolText text={shell.stdout} format={outputFormat(toolName, call.args ?? [], shell.stdout)} /> : null}
        {shell.stderr ? <><div data-tool-stderr="1" style={{ color: "#62676f", marginTop: shell.stdout ? 6 : 0 }}>stderr</div><ToolText text={shell.stderr} format={{ kind: "text" }} /></> : null}
        {shell.exit !== null && shell.exit !== 0 ? <div data-tool-exit={String(shell.exit)} style={{ color: "#c26058", marginTop: 6 }}>exit {shell.exit}</div> : null}
      </>
    );
  } else {
    plainOutput = outputText ? <ToolText text={outputText} format={outputFormat(toolName, call.args ?? [], outputText)} /> : null;
  }

  // The descend control: only delegate tool results carry a child_root, and the control shows whenever
  // the paired ToolResult's output names one. (It does nothing: F329, left as it is, 2026-11-05.)
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
    <details
      // Controlled `open` — React writes the attribute from `isOpen`,
      // the browser reflects it on the DOM, `onToggle` reads it back.
      // Binding to `toolRunning` directly would flip the card closed
      // on the next snapshot tick that arrives after the tool result
      // lands, undoing the user's click.
      open={isOpen}
      onToggle={onDetailsToggle}
      // Sprint 506: a set width beside the row's glyph: shrink-to-fit took the clamped preview's narrowest wrap, and a
      // block card fell below the glyph.
      style={{ display: "inline-block", verticalAlign: "top", width: "calc(100% - 24px)" }}
    >
      <summary
        data-tool-summary="1"
        style={{
          cursor: "pointer",
          listStyle: "none",
          // Sprint 506 (the Architect, 2026-11-14: "two or three lines more of that summary when it's running a bash
          // command. One line isn't enough"): the name and preview wrap to at most three lines, the status and caret
          // sit beside the last of them, so a long command never pushes them out of sight.
          display: "flex",
          alignItems: "flex-end",
          maxWidth: "calc(100% - 24px)",
          verticalAlign: "top",
        }}
      >
        <span data-tool-preview="1" style={toolView === "raw" && isOpen ? {
          // Raw, expanded: the whole command in place (clamp lifts); its continuation lines hang-indent
          // under the first, to the right of the tool label — not flat against the left margin. The
          // command text takes the transcript's base size, like the other text, not the smaller 11px.
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          minWidth: 0,
          flex: "0 1 auto",
          paddingLeft: `${toolName.length + 1}ch`,
          textIndent: `-${toolName.length + 1}ch`,
        } : toolView === "raw" ? {
          // Raw, collapsed: three lines, the command's continuation lines hang-indent under the first.
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: SUMMARY_LINES,
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          minWidth: 0,
          flex: "0 1 auto",
          paddingLeft: `${toolName.length + 1}ch`,
          textIndent: `-${toolName.length + 1}ch`,
        } : {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: clampLines,
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          minWidth: 0,
          flex: "0 1 auto",
        }}>
          {/* One child: a -webkit-box makes each child a block, which would put the name on a line of its own. */}
          <span>
            <span style={{ color: "#9aa0a8", fontFamily: "ui-monospace,'SF Mono',Menlo,monospace" }}>{toolName}</span>
            {" "}
            <span style={{ fontFamily: "ui-monospace,'SF Mono',Menlo,monospace" }}><SummaryText text={previewText} format={summary.format} /></span>
          </span>
        </span>
        {toolView === "raw" ? null : (
        <span data-tool-status="1" style={{ flex: "none", marginLeft: 6, maxWidth: "40%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ color: "#4a4e55" }}>{" · "}</span>
          <span style={{ color: statusColor(toolRunning, failed), fontFamily: "ui-monospace,'SF Mono',Menlo,monospace" }}>{status}</span>
          <span style={{ color: "#4a4e55", marginLeft: 8 }}>{cardCaret}</span>
        </span>
        )}
      </summary>
      {descendShow ? (
        <span
          onClick={onDescendClick}
          style={{ cursor: "pointer", color: "#a08fc9", marginLeft: 8 }}
          title="descend into the child record — the pane's stream switches to the delegate's own envelopes"
        >· descend ⏎</span>
      ) : null}
      {toolView === "text" ? (plainBodies.length > 0 || plainOutput !== null || hasError) && (
        <div data-tool-plain="1" data-dropped-lines={droppedLines > 0 ? String(droppedLines) : undefined} style={{
          margin: "2px 0 8px 24px",
          background: "#1a1c20",
          borderRadius: 5,
          padding: "8px 12px",
          maxHeight: 220,
          overflow: "auto",
          fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
          fontSize: 11,
          lineHeight: 1.7,
          color: "#b9bec5",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}>
          {droppedLines > 0 ? <div style={{ color: "#62676f", fontSize: 11, marginBottom: 4 }}>{droppedLines} earlier lines not shown</div> : null}
          {plainBodies.map((b) => <ToolText key={b.key} text={b.text} format={b.format} />)}
          {plainOutput}
          {hasError ? <div style={{ marginTop: 6, color: "#c26058" }}>error {errorText}</div> : null}
        </div>
      ) : toolView === "raw" ? (plainBodies.length > 0 || plainOutput !== null || hasError) && (
        // Sprint 538 — the plain terminal column (RESEARCH-2026-11-20-tool-output-text-presentation-r2).
        // No box, no status chip, no caret: the command preview above clamps to three lines closed and shows
        // in full open (the clamp lifts in place — the command is not drawn again here), and this holds only
        // its output, on the pane ground. Clicking the command toggles open/closed. The ANSI model and the
        // sprints-505–512 language/diff/grep formatting are reused unchanged.
        <div data-tool-raw="1" data-dropped-lines={droppedLines > 0 ? String(droppedLines) : undefined} style={{
          // The output takes the transcript's base text size, like the other text — no 11px override.
          margin: "2px 0 8px 24px",
          fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
          lineHeight: 1.7,
          color: "#b9bec5",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}>
          {droppedLines > 0 ? <div style={{ color: "#62676f", fontSize: 11, marginBottom: 4 }}>{droppedLines} earlier lines not shown</div> : null}
          {plainBodies.map((b) => <ToolText key={b.key} text={b.text} format={b.format} />)}
          {plainOutput}
          {hasError ? <div style={{ marginTop: 6, color: "#c26058" }}>error {errorText}</div> : null}
        </div>
      ) : (
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
        {argList.map((argRow) => {
          const index = argRow.at;
          // Sprint 505: a command as shell, a file's body as that file's code; a short plain value stays on its line.
          const format = argFormat(toolName, call.args ?? [], index);
          const { key, value } = splitArg(argRow.v);
          if (format.kind === "text" && !value.includes("\n")) {
            return <div key={argRow.i} style={{ color: "#b9bec5" }}>{argRow.i} <span style={{ color: "#e2e5e9" }}>{argRow.v}</span></div>;
          }
          return (
            <div key={argRow.i} data-tool-arg={String(index)} style={{ color: "#b9bec5" }}>
              {argRow.i} {key ? <span style={{ color: "#62676f" }}>{key}</span> : null}
              <div style={{ background: "#1a1c20", borderRadius: 5, padding: "6px 12px", margin: "2px 0 4px", maxHeight: 220, overflow: "auto", color: "#d7dade" }}>
                <ToolText text={value} format={format} />
              </div>
            </div>
          );
        })}
        {toolView === "compact" ? (
          // Compact: one box. plainOutput is the live stream while the command runs and the stream-or-result
          // once it lands, so the stream IS the output — no separate streaming box and result box.
          plainOutput !== null ? (
            <>
              <div style={{ marginTop: 8, color: "#62676f" }}>output</div>
              <div data-tool-compact-output="1" style={{ background: "#1a1c20", borderRadius: 5, padding: "8px 12px", maxHeight: 220, overflow: "auto", color: "#9aa0a8" }}>
                {droppedLines > 0 ? <div style={{ color: "#62676f", fontSize: 11, marginBottom: 4 }}>{droppedLines} earlier lines not shown</div> : null}
                {plainOutput}
              </div>
            </>
          ) : null
        ) : (<>
        {streamingShow ? (
          <ProgressStream progressText={progressText} eof={progressEof} droppedLines={droppedLines} />
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
            }}>{shell ? (
              <>
                <ToolText text={shell.stdout} format={outputFormat(toolName, call.args ?? [], shell.stdout)} />
                {shell.stderr ? <><div data-tool-stderr="1" style={{ color: "#62676f", marginTop: shell.stdout ? 6 : 0 }}>stderr</div><ToolText text={shell.stderr} format={{ kind: "text" }} /></> : null}
                {shell.exit !== null && shell.exit !== 0 ? <div data-tool-exit={String(shell.exit)} style={{ color: "#c26058", marginTop: 6 }}>exit {shell.exit}</div> : null}
              </>
            ) : <ToolText text={outputText} format={outputFormat(toolName, call.args ?? [], outputText)} />}</div>
          </>
        ) : null}
        </>)}
        {hasError ? (
          <div style={{ marginTop: 6, color: "#c26058" }}>error {errorText}</div>
        ) : null}
        <div style={{ color: "#4a4e55", marginTop: 6 }}>
          call_id {call.callId ?? ""} · step {call.toolStep ?? ""} · {status} · {outputText.length} bytes
        </div>
      </div>
      )}
    </details>
  );
};

export const ToolCard = React.memo(ToolCardInner);
