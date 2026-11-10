# Sprint 427 — just an editor

```yaml
---
id: 427
status: closed
phase: code editor, the rest (roadmap r10), E4
pass_kind: functional
---
```

## scope

The Architect, 2026-11-09: "If the session is on, that's fine. If the session is off, that's fine. If the session is off, it's just an editor. You need to be able to edit"; vim and nano are options, the editor a normal editor by default. The server's file write writes the file when the session's record cannot take the edit (an ended session, or no record yet), off the record (`written: "off_record"`, seq null), instead of answering 409. The editor has no read-only state: the read-only rule of sprint 423 (`readOnlyReason`, the editable compartment, the save refusals `ended_session` and `view_only`, the status line's "read-only") is removed. The binding setting is standard, vim or nano, standard the default: CodeMirror's own keys, no mode. Vocabulary v0.36 (P-0.36-JUST-AN-EDITOR): FILE_WRITTEN.written `off_record`; `binding` `standard`; EDITOR_DRAWN.read_only removed; the anchor's third row a new layout (magic 0xB8). Round 9's kernel work (K345) is undone in the kernel.

Files: `server.py`, `tests/test_workspace_write_387.py`; `state/settings.ts`, `editor/bindings.ts`, `editor/Centre.tsx`, `editor/EditorView.tsx`, `editor/StatusLine.tsx`, `state/editor.ts`, `App.tsx`, `derive/anchor.ts` and its spec; the vocabulary; `harness/shakeout/lib/electron.ts` (`chooseBinding`) and the gates `editor_editing`, `editor_save`, `editor_status`, `editor_undo`.

## signal contract

Emits: FILE_WRITTEN with `written` `off_record`; EDITOR_OPENED and EDITOR_DRAWN with `binding` `standard`.

## artifact contract

- `tests/test_workspace_write_387.py` 4/4 (a session with no record and an ended one have the file written off the record); mypy server 0; unit specs 115; `npm run signals` 0 at v0.36; build 0.

## observation contract

From source and on the bundle: `editor_editing` (the default binding is standard; a click and typing edit the buffer; after the session ends the editor reopens on the unsaved buffer and takes typing), `editor_save` (after the session ends, typing and ⌘S write the file; FILE_WRITTEN `off_record`, the record unchanged), `editor_centre`; from source `editor_status`, `editor_undo` with vim chosen in settings.
