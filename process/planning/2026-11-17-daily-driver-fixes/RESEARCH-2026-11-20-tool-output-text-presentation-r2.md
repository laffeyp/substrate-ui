# Research — tool output as plain terminal text (round 2)

*2026-11-20. Supersedes round 1, which wrongly called the minimal all-text shape "already built / mostly built." It is not built. The `text` option (sprint 517) exists and was rejected in the installed build as not minimal enough (`BLACKBOARD` 2026-11-17 user). This round answers one question: can a tool call be shown all as text, as a real terminal, in the standard fashion, given that the record underneath is a Substrate session topology. Written during the 2026-11-18 freeze; research, not a build.*

---

## The answer

Yes. The record holds everything a plain terminal stream needs. The current boxed presentation is a choice of container, not a limit of the data.

## What the data already carries, per tool call

- **The command.** `summaryOf` (`web/reveal/tool_format.ts:221`) recovers a bash call's command text as `ls -la`, without the `command=` key a harness call carries. The prompt line is a string already in hand.
- **The output.** A kernel `bash` result arrives as `{exit, stdout, stderr}` and is read apart by `shellResult` (`tool_format.ts:206`); Claude Code's `Bash` returns the printed text directly; the live stream arrives as plain stdout in `snapshot.progressByCallId` (`Transcript.tsx:232`). All plain strings.
- **The control codes.** `web/reveal/transcript/ansi.ts` models a terminal — SGR color, carriage return, cursor moves — and `TerminalText` (`ToolText.tsx:70`) renders through it; `needsTerminal` (`tool_format.ts:200`) decides when. A spinner, a progress bar, or colored output paints as a terminal paints it.

## The standard shape, and what changes to reach it

The well-known terminal shape is one monospace column: a prompt line, the command, then its output on the lines below, then the next thing. No box, no inset, no label, no byte-count footer.

Substrate already draws user messages, model replies, and tool rows as rows in one scrolling column (`Transcript.tsx:229`). The insets are local to `ToolCard`: the `#1a1c20` boxes, the `maxHeight: 220` inner scroll, the `args`/`output`/`streaming` labels, and the `call_id … · N bytes` footer (`ToolCard.tsx:240`–`296`). Dropping them and flowing the command line and the output straight onto the pane's ground is the whole change. Everything below the command/output split — the formatting of sprints 505–512, the ANSI model, the language parse — stays.

## Why this is cleaner on Substrate than on a terminal

A real terminal reads one PTY byte stream and must tell the echoed command from its output by position. Substrate has them separated already: the command is in the `ToolCall` envelope, the output in the paired `ToolResult`, folded by `callId` (`Transcript.tsx:111`, `:231`). The shell calls render as literal terminal output. The agent's other typed tools map to their nearest terminal form — a `read_file` as the file's text under a `cat`-style line, an `edit` as a diff, a `grep` as its hits — which `outputFormat` and `commandFormat` (`tool_format.ts:51`, `:94`) already compute. This is the shape Claude Code shows in its own terminal, which is a structured TUI, not a raw PTY.

---

*Round 2. The answer is yes: the command, the output, and the control codes are all in the record as plain strings, so the standard all-text terminal column is a container change, cleaner here than on a PTY because the command and output arrive already separated.*
