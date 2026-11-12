# Sprint 471 — file size changes nothing: every file opens in the editor and saves

```yaml
---
id: 471
status: closed
phase: code editor (roadmap r13), E14
pass_kind: functional
---
```

## scope

The Architect, 2026-11-11 (BLACKBOARD `user`): "File size limits shouldn't change anything at all … There's no difference between editing a big file or a small file." The 2 MB limit is substrate-ui's own setting, `server.py` `WORKSPACE_READ_MAX`, and four places read it: the file read sends no text above it (`too_large`), the save refuses text above it, the base comparison of a file not in UTF-8 skips a file above it, and the workspace search skips a file above it. This sprint removes the limit from all four. Every file is read whole and decoded by the one rule, saved whole, compared with its base, and searched, at any size. The window needs no change: it already opens any file the read sends text for in the code editor (a file that is not text as Latin-1, in all four forms), so a 28 MB log or a 12 MB binary opens, edits and saves as a 4 KB one does. The attachment rule keeps its own threshold, renamed `ATTACH_READ_MAX` (a message's file past it is not read to count lines); what is sent to a model is not the editor's. FILE_READ no longer writes `too_large`. The views and routes built for files over the limit (the lines view, the line reader, the bytes view's reads from the server, `/lines`, `/bytes`) are left unused here and retired in sprint 472.

## prerequisites

- 465, 468, 470.

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the `user` entry of 2026-11-11 (file size changes nothing); its tail
- `server.py` `WORKSPACE_READ_MAX` and its readers: `_workspace_read`, `_session_file_write`, `_workspace_hunks`, `_read_text`, `_attachment_text`; the FILE_READ emit
- `web/app/editor/Centre.tsx` (the read, `bytesFile`, `largeText`), `web/app/editor/StatusLine.tsx`
- `tests/test_file_bytes_463.py`, `tests/test_file_encodings_462.py`, `tests/test_workspace_write_387.py`, the search tests

## signal contract

### Emits

No new tag. FILE_READ `encoding` is never `too_large` now (the value stays in the enum for records written before); FILE_WRITTEN for any size.

### Consumes

- The file's bytes.

### Invariants

- A file of any size reads and saves by the same code path as a small one.
- No path, text or byte in any payload (E1).

## artifact contract

### Files created

- `tests/test_no_size_limit_471.py`; `harness/shakeout/editor_any_size.ts`

### Files modified

- `server.py`; `tests/test_file_bytes_463.py` (its large text file now reads as text)
- `harness/shakeout/editor_type_digits.ts` (big.bin is editable now); `tests/test_session_search_435.py`, `tests/test_workspace_files_348.py`, `tests/test_file_lines_469.py` (their expectations of the limit)

### Content assertions

- `server.py` has no `WORKSPACE_READ_MAX` and no `too_large`; `_workspace_read` takes no `max_bytes`; the save has no size refusal.
- The test reads a 3 MB UTF-8 file, a 3 MB Latin-1 file and a 3 MB binary file as Latin-1 whole, saves each with one character changed, and finds only that byte changed; the base comparison of the 3 MB Latin-1 file has its hunk; the search finds a word in the 3 MB file.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_no_size_limit_471.py tests/test_file_bytes_463.py tests/test_file_encodings_462.py tests/test_workspace_write_387.py tests/test_hunks_any_encoding_466.py` and the search tests return 0
- ruff, mypy on `server.py`, build return 0

## observation contract

### UI driving steps

Gate `editor_any_size.ts` (new; `editor_large_text.ts` tests the lines view and goes with it in sprint 472), from source and on the bundle. A repository written by the gate holds million.txt (1,000,000 numbered lines, 28 MB) and big.bin (12 MB, a NUL byte first). The deterministic driver; in the editor:

1. Open million.txt: the code editor (not the lines view); the last line holds `line 0999999 of the million`; INFO `UTF-8`; the status line has no `read-only`. Type `Z` at the end of line 1 and ⌘S: the disk holds the file with `Z` added and every other byte the same.
2. Open big.bin: the bytes view, editable; type `ff` over byte 0x10 and ⌘S: the disk's byte 0x10 is 0xff and no other byte changed.

Gate `editor_type_digits.ts`: its step 7 types over big.bin's byte too, and the save writes it.

### Expected runtime signals

- server.jsonl: FILE_READ with no `too_large`; FILE_WRITTEN utf8 and bytes for the two large files.

### Expected screenshot / visual state

- million.txt in the code editor at its end; big.bin after its byte is typed.

## done criteria

A file of any size opens in the editor, edits and saves exactly as a small one does.

## notes

The time to open a large file is recorded in the close, from the gate.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (no read, save, comparison or search depends on a file's size).
- [x] context_files cover every reader of the limit, the window's read, the tests that pinned the limit.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] ≤2 files of code: `server.py` and its test; the gates' expectations follow.

## close

`server.py`: `WORKSPACE_READ_MAX` and `too_large` are gone; `_workspace_read` reads any file whole; the save has no size refusal, and its body is read uncapped (`_read_json_body(capped=False)`; `_refuse_foreign_host` lets a PUT to `/api/session/<id>/file` past the 4 MiB cap every other request keeps); `_workspace_hunks` compares a file not in UTF-8 in its text at any size; the search reads a file at any size; the attachment rule's threshold is `ATTACH_READ_MAX`. The request body cap is a fifth place the limit lived that the card did not name: a 28 MB save is a 28 MB body.

Test `test_no_size_limit_471.py`: a 5 MB UTF-8 file, a 5 MB Latin-1 file and a 5 MB file that is not text, each past the 4 MiB body cap, read whole, saved with one character changed (only byte 2 differs on disk), compared with their base (one hunk at line 1), and the UTF-8 one searched; another POST over the cap is still 413; FILE_READ utf8, latin1, binary; FILE_WRITTEN utf8, latin1, bytes. Tests that pinned the limit follow it: 435 (big.txt is searched; its 2 MB single line became short lines, see below), 348, 463, 469.

Found running the search tests together: `test_replace_works_out_new_texts_and_writes_nothing` hung, because the pattern `(\w+) = (\d+)` over big.txt's 2 MB single line backtracks in Python's `re` (on the order of n² steps). The size skip had hidden it; any file under 2 MB with one long line hangs the same way. It is sprint 472's (BLACKBOARD `surfaced` of this date).

Gate `editor_any_size` from source and on the bundle (build 1794443432, packaged true): million.txt (28,000,000 bytes) opens in the code editor in 448 ms, INFO UTF-8, the status line `million.txt · 1:29`; `Z` saved in 1,610 ms with every other byte the same; its last line in view with ⌘↓; big.bin (12,582,912 bytes) editable in hex in 177 ms, byte 0x10 typed to `ff` and saved in 1,531 ms, no other byte changed; FILE_READ utf8, utf8, binary, binary, never `too_large`; FILE_WRITTEN utf8, bytes. A mutant with the save's 2 MB refusal put back fails it (million.txt keeps its 28,000,000 bytes). `editor_bytes` now finds no piece read from the server (its 12 MB file is the buffer); `editor_type_digits` finds big.bin editable.

Command exit codes: the file, search and security tests together, 53 passed; ruff check and format 0; mypy 0; `npm run signals` 0; unit specs 231/231; build 0. Gates on the bundle: `editor_any_size`, `editor_type_digits`, `editor_bytes`, `editor_edit_any_file`, `editor_search`, `editor_save` 0; from source also `editor_centre`, `editor_encodings` 0.

Rubber Duck Pass (the gate's trace, as it reports it). FILE_READ utf8 twice (million.txt opened, and read again after its save), binary twice (big.bin opened, and read again after its save); FILE_WRITTEN utf8 (million.txt), bytes (big.bin). Observations: none in the trace; the search hang is recorded above.
