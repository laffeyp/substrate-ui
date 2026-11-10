# Sprint 421 — what the inspector draws, derived from the record

```yaml
---
id: 421
status: closed
phase: code editor, the rest (roadmap r8), E6
pass_kind: functional
---
```

## scope

`web/app/derive/inspector.ts` (new; no I/O, no state) derives, for one file of the workspace, from the session's record as the kernel writes it (UserMessage `turn_index`; ToolCall `call_id, tool, args, step`; ToolResult `call_id, ok, output`; FileWritten `path, old_text, new_text, view`): ACTIVITY (this file's calls newest first, each with turn, seq and gist: read_file, edit_file and write_file by their path argument, grep by the matches its output lists in the file, bash by a text match); HISTORY (every ok edit_file and write_file, every FileWritten, newest first, with + and − lines and whether the record holds the text a step back restores); each hunk's author; INFO's type line. Tool paths are named as the workspace names them (`relPath`). Kinds come from `envelope_kinds.gen.ts` (sprint 420).

## context_files

- frame 24a; spec r6 §5 "Code", §5.0; D6, D54, D81, D82; roadmap r8 E6; BLACKBOARD 2026-11-09 (HISTORY's earlier texts); `../substrate/src/substrate/topologies/tool_loop/tools.py` (`_read_file`, `_edit_file`)

## signal contract

Emits: none (a derivation; the inspector's tags are sprint 422's).

## artifact contract

- `web/app/derive/inspector.ts` exports `relPath`, `fileActivity`, `fileHistory`, `lineDelta`, `hunkAuthor`, `authorLabel`, `fileType`.
- `web/app/__tests__/inspector.spec.ts`: the record above, tool paths, ACTIVITY's rows and gists, HISTORY's rows, hunk authors, a write with no earlier text.
- Command exit codes: `npx tsx --test web/app/__tests__/inspector.spec.ts` 0; `npx tsc --noEmit` 0; `npx eslint web/app/derive/inspector.ts` 0.

## observation contract

Behaviour lands with sprint 422's gate on a real record.
