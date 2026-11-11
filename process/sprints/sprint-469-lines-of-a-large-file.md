# Sprint 469 — the server sends a large text file's lines by range

```yaml
---
id: 469
status: closed
phase: code editor (roadmap r13), E14 (7 of 8)
pass_kind: functional
---
```

## scope

Roadmap r13 E14 (the Architect, 2026-11-11: "you just open a file … they could just scroll down and see the whole file"). A text file over the read limit (2 MB) still opens as `over the read limit`. This sprint is the server's half of showing it: `GET /api/session/<id>/lines?path=&from=&count=` sends lines `from` to `from + count - 1` (at most 2,000 lines a request) of a text file at any size, decoded by the file API's rule, with the file's line count, its encoding and its size. A line index is built once per file version (path, size, modified time): one pass in 1 MB blocks counts the line breaks, records the byte offset of every 1,024th line, and checks the bytes as UTF-8 (a file that fails is Latin-1, as `_decode_any` rules for a whole file); a byte-order mark names UTF-8 or UTF-16, and UTF-16 breaks lines at its own `\n` code unit. A request seeks to the nearest recorded line and reads forward. Lines are counted as the editor counts them (line breaks plus one), and a line's `\r` end is not sent. A line longer than 64 KB sends its first 64 KB and the count of bytes it holds past them (`more`), so a one-line file of any size answers at once; its whole bytes stay readable through the bytes view. Each request is one FILE_LINES_READ (vocabulary v0.64). The window's lines view is sprint 470.

## prerequisites

- 463 (the bytes route), 468.

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the `user` entries of 2026-11-11 on opening every file; its tail
- `ROADMAP-2026-11-09-code-editor-r13.md` E14
- `server.py` `_workspace_read`, `_decode_any`, `_workspace_bytes`, `_session_bytes`, the GET dispatch; `tests/test_file_bytes_463.py`
- Vocabulary 0.63: FILE_BYTES_READ, FILE_READ; `../sdd-kit-3/grammar/PRINCIPLES.md` (NEW_TAG_PROPOSED)
- Python `codecs.getincrementaldecoder` (UTF-8 checked across blocks)

## signal contract

### Emits

Vocabulary v0.64 (P-0.64-LINES): `FILE_LINES_READ` (server): `session_id`, `from` (the first line sent, from 0), `count` (lines sent).

### Consumes

- The file's bytes on disk.

### Invariants

- No path, line or byte in any payload (E1).
- A file up to the read limit is read as before; the route reads any text file, the window uses it past the limit.
- The index is rebuilt when the file's size or modified time changes.

## artifact contract

### Files created

- `tests/test_file_lines_469.py`
- `web/vm/signals/versions/0.64.json`, `0.64-rationale.md`

### Files modified

- `server.py`; the vocabulary files (`proposals.json`, `current.json`, the generated names)

### Content assertions

- `server.py` defines `_line_index` and `_workspace_lines`, routes `/api/session/<id>/lines`, and caps a request at 2,000 lines and a line at 64 KB.
- The test reads, from a 3 MB UTF-8 file, a Latin-1 file and a UTF-16 LE file, lines at the start, across a recorded 1,024-line step, and at the end, equal to the decoded file split at `\n`; the line count equals the editor's; a 5 MB one-line file sends 64 KB and `more`; a changed file is read again; a path outside the workspace is refused; FILE_LINES_READ carries `from` and `count`.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_file_lines_469.py tests/test_file_bytes_463.py tests/test_file_encodings_462.py` returns 0
- ruff, mypy on `server.py`, `npm run signals`, build return 0

## observation contract

### UI driving steps

None in the window this sprint; the observation is the route over HTTP from the test's served app: a 40 MB UTF-8 file of 1,000,000 numbered lines, read at line 0, at line 500,000 and at its last line; each answer's lines hold their own numbers. The installed bundle's server is observed through sprint 470's gate, whose lines view reads this route.

### Expected runtime signals

- server.jsonl: FILE_LINES_READ with `from` 0, 500000 and 999999 and the counts sent.

### Expected log substrings

- The first read of the 40 MB file builds the index once; later reads of it do not scan again (the test counts scans).

## done criteria

Any line of a text file of any size can be read from the server at once after one pass over the file.

## notes

UTF-16 files are rare at this size but are text, so they are read as text. The 64 KB line cap is the route's piece size, not a limit on the file: sprint 470 shows the rest of such a line through the bytes view.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (any range of lines of a large text file, read after one pass).
- [x] context_files cover the read, the decode rule, the bytes route as the model, the vocabulary.
- [x] Emits names FILE_LINES_READ in v0.64, ratified in this sprint.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] ≤2 files: `server.py` and its test, with the vocabulary bump.

## close

`server.py`: `_scan_lines` (one pass in 1 MB blocks: line breaks counted, block by block with `bytes.count` until a kept line falls inside; every 1,024th line's offset kept; UTF-8 checked by an incremental decoder; UTF-16 breaks found on code units), `_line_index` (kept per path, size and modified time, the last eight), `_read_line` (a line's first 64 KB and the count past them), `_workspace_lines`, and the route `/api/session/<id>/lines` with FILE_LINES_READ. Vocabulary v0.64 (P-0.64-LINES, 156 tags).

Test `test_file_lines_469.py`, 7 passed: ranges at the start, across the kept lines at 1,024 and 2,048, and at the end equal the decoded file split at `\n` for a 3 MB UTF-8 file, a Latin-1 CRLF file, a UTF-16 LE file and a UTF-8 file with its mark; a file over the limit reads anywhere after one pass (`line_index_scans` counts one), and once changed is indexed again; a request is held to 2,000 lines; a 5 MB one-line file sends 64 KB and `more` = size − 64 KB; over HTTP, the 1,000,001-line file (40 MB) reads lines 0, 500,000 and 999,999 at once; `../x` 400, a missing file 404; FILE_LINES_READ (0, 3), (500000, 3), (999999, 2), with no other field. Mutants: each kept UTF-8 line offset one byte early fails 5 tests; each kept UTF-16 offset one byte early fails 1.

Command exit codes: tests 469, 463, 462: 15 passed; ruff check 0, ruff format 0 (it reflowed `server.py` and the test); mypy 0; `npm run signals` 0 (v0.64, 156 tags); build 0. Installed: build 1794439487, whose `server.py` holds the route. The window's reading of it on the bundle is sprint 470's gate.

Rubber Duck Pass (the test's served trace). FILE_LINES_READ from 0 count 3; from 500000 count 3; from 999999 count 2 (the last line and the empty line after the final break, as the editor counts). Observations: none.
