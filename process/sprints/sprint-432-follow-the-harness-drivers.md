# Sprint 432 — following the harness drivers' edits

```yaml
---
id: 432
status: closed
phase: code editor, the rest (roadmap r10), E7
pass_kind: functional
---
```

## scope

The follow of sprint 431 reads the harness drivers' calls too (HarnessToolCall and its HarnessToolResult, session vocabulary § Q), in the shapes the kernel's stream parsers write (`substrate/adapters/harness_streams.py`): Substrate's own `edit_file {path, search, replace}` and `write_file {path, text}` through MCP, with or without the server in the name; Claude's tool_use passed through, `Write {file_path, content}`, `Edit {file_path, old_string, new_string}`, `MultiEdit {file_path, edits}`, `NotebookEdit {notebook_path}` (Claude Code's tool schemas); Cursor's `edit {path, streamContent}`; Codex's `file_change {changes: [{kind, path}]}`, which may arrive only completed and names no text. One call may change several files (Codex): it is one mark (S10) over each of them. A harness result is the first HarnessToolResult after the call with its call_id. ACTIVITY and HISTORY do not list harness calls yet.

Files: `derive/follow.ts` and its spec (hand-written examples), `editor/EditorView.tsx` (`Follow`: a call's files).

## signal contract

Emits, as sprint 431: EDITOR_FOLLOW_MARKED, CONFIRMED, WITHDRAWN, EDITOR_DRAWN.follow_marks; no vocabulary change.

## artifact contract

- The files above exist; follow spec 5/5 (the kernel; Claude's four edit tools; Substrate's tools through MCP with and without the server; Cursor's edit and Codex's two-file file_change; per-turn ids and a file outside the workspace); unit specs 123; build 0.

## observation contract

`editor_follow.ts` (the window's follow, shared by every driver) from source and on the bundle, with the live roster's model.
