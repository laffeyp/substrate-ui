# Sprint 467 — the server's own write files stay out of the workspace's listings

```yaml
---
id: 467
status: closed
phase: code editor (roadmap r13), E14 (5 of 7)
pass_kind: functional
---
```

## scope

Found closing sprint 466 (BLACKBOARD `agent-resolved` entry after its `built` one): the gate's screenshot drew `.substrate-write-m9xsde61` in the file tree. `_session_file_write` writes the new bytes to a temp file beside the target (`tempfile.mkstemp(prefix=".substrate-write-")`), appends FileWritten to the record, then renames the temp over the file. The window re-lists the tree when the record entry arrives, inside that span, so the listing can draw the temp file until the next watch poll; the watch can report it created and deleted, and a search or quick open in the span can list it. This sprint names the prefix once (`WRITE_TEMP_PREFIX`) and skips a name that starts with it in the tree's listing (`_workspace_list`), the watch's snapshot (`_workspace_snapshot`) and the search walk (`_workspace_files`, which quick open also reads). Nothing else is hidden.

## prerequisites

- 466.

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the entries closing sprint 466; its tail
- `server.py` `_session_file_write` (the temp file, `append_event`, `os.replace`), `_workspace_list`, `_workspace_snapshot`, `_session_files_watch`, `_workspace_files` and its `walk`, `WORKSPACE_SKIP_NAMES`
- `web/app/editor/FileTree.tsx` (the tree's reloads)

## signal contract

### Emits

No new tag. `FILES_WATCH_OPENED.files` and the watch's changes no longer count a write's temp file.

### Consumes

- The workspace's directory entries.

### Invariants

- Every other name is listed as before, dot-files included.
- A write is still atomic: the temp file is beside the target and renamed over it.

## artifact contract

### Files created

- `tests/test_write_temp_hidden_467.py`

### Files modified

- `server.py`
- `harness/shakeout/editor_edit_any_file.ts`: a temp-named file in its repository, and a check that the tree never draws a `.substrate-write-` row

### Content assertions

- `server.py` defines `WRITE_TEMP_PREFIX = ".substrate-write-"`, and `mkstemp`, `_workspace_list`, `_workspace_snapshot` and the walk use it.
- The test puts `.substrate-write-x1` and `.keep` in a workspace: `_workspace_list`, `_workspace_snapshot` and `_workspace_files` list `.keep` and not the temp name.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_write_temp_hidden_467.py tests/test_workspace_files_348.py tests/test_workspace_write_387.py` returns 0
- ruff, mypy on `server.py`, build return 0

## observation contract

### UI driving steps

Gate `editor_edit_any_file.ts`, from source and on the bundle: its repository also holds `.substrate-write-gate` (a temp file as a write leaves it in its span, kept still so the check does not depend on timing). After the tree loads and after each of the four saves, no tree row's name starts with `.substrate-write-`; the other files are drawn.

### Expected runtime signals

- server.jsonl: FILES_WATCH_OPENED `files` counts the repository's files without the temp file.

### Expected screenshot / visual state

- blob.bin after its edit: the tree lists blob.bin, latin.txt, wide.txt and no `.substrate-write-` row.

## done criteria

A save never puts the server's own temp file in the tree, the watch, the search or quick open.

## notes

A temp file left by a killed server (the write unlinks it on any exception it sees) is hidden too; it is the server's, not the person's.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (no listing names a write's temp file).
- [x] context_files cover the write, the three listings, the tree.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] ≤2 files: `server.py` and its test; the gate's added check is the observation.

## close

`WRITE_TEMP_PREFIX = ".substrate-write-"` names the write's temp file (`mkstemp`) and is skipped by `_workspace_list`, `_workspace_snapshot` and the search walk. Test `test_write_temp_hidden_467.py`: a temp-named file and `.keep` in the top folder and in `sub/`; the listings, the snapshot and the walk list `.keep` and `sub/.keep` only. A mutant without the listing's skip fails the test and the gate ("the tree draws a write's temp file once loaded").

Command exit codes: tests 467, 348, 387: 13 passed; ruff check and format 0; mypy 0; build 0. Gates on the bundle (build 1794437574, packaged true): `editor_edit_any_file` (no `.substrate-write-` row after load or any of the four saves), `editor_tree`, `editor_search`, `editor_quick_open`, `workspace_files_signals` 0.

Rubber Duck Pass (bundle trace, kept for the pass and removed after). FILES_WATCH_OPENED files 3, twice (blob.bin, latin.txt, wide.txt; the temp-named file not counted); FILES_LISTED entries 4, three times (`.git` and the three files; with the temp-named file it was 5); FILE_WRITTEN latin1 seq 35, utf16 seq 37, bytes seq 39 and 41. Observations: none.
