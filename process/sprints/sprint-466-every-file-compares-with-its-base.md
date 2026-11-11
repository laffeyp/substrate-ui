# Sprint 466 — a file not in UTF-8 compares with its base in its own encoding

```yaml
---
id: 466
status: closed
phase: code editor (roadmap r13), E14 (4 of 6)
pass_kind: functional
---
```

## scope

Found closing sprint 465 (BLACKBOARD `built` entry, its Rubber Duck observation). The file route's hunks (`_workspace_hunks`, sprint 418) come from `git diff -U0` over the file's bytes. For a file that is not plain UTF-8 they are wrong: git prints "Binary files differ" and no hunk for a file with a NUL byte (blob.bin) or in UTF-16 (wide.txt), and `_git_out` decodes git's output as UTF-8, so a Latin-1 file's diff raises `UnicodeDecodeError` and the route answers 500. The editor then takes the saved text as its base, and INFO says "no changes against the base" for a file that differs from main. This sprint compares such a file in the text the editor shows: when the file or its base is not plain UTF-8 (a BOM, UTF-16, Latin-1, or a NUL byte), each side is decoded by the file API's rule (`_decode_any`; a file that is not text, every byte one character as Latin-1), and git compares the two texts (`git diff --no-index -U0 --text` over two scratch files written in UTF-8), so the ranges are git's own. Lines split only at `\n`, as the editor's do. A file over the read limit (2 MB), which the editor never shows as text, keeps git's answer. A plain UTF-8 file is diffed as before.

## prerequisites

- 465 (every file edits as text).

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the `built` entry of sprint 465 and the ordering entry after it; its tail
- `ROADMAP-2026-11-09-code-editor-r13.md` E14
- `server.py` `_workspace_hunks`, `_diff_base`, `_scratch_index`, `_git_out`, `_decode_any`, `_session_diff`; `tests/test_session_hunks_418.py`
- `web/app/derive/status_line.ts` `baseText` (the window rebuilds the base from the file's text and the hunks' `-` lines); `web/app/editor/Inspector.tsx` (CHANGES)
- git-diff(1): `--no-index`, `--text`, `-U0`; git-show(1) `<rev>:<path>`, `./` relative to the current directory; git-check-ignore(1)

## signal contract

### Emits

No new tag. `DIFF_READ` (`base`, `files`, `hunks`) counts the hunks of such a file, which were 0 or a 500.

### Consumes

- The file's bytes and its base's bytes (`git show <base>:./<path>`).

### Invariants

- A plain UTF-8 file's hunks are git's own over its bytes, as before (test 418 unchanged).
- A file new since the base reads as all added; an ignored file has no hunk, as the scratch-index path gives.
- No path, text or byte in any payload (E1).

## artifact contract

### Files created

- `tests/test_hunks_any_encoding_466.py`

### Files modified

- `server.py`
- `harness/shakeout/editor_edit_any_file.ts`: a step after each save reading INFO's CHANGES

### Content assertions

- `server.py` defines `_decoded_hunks` and `_workspace_hunks` calls it for a file at most `WORKSPACE_READ_MAX` bytes whose bytes or base bytes are not plain UTF-8.
- The test commits latin.txt (Latin-1), wide.txt (UTF-16 LE), blob.bin (256 bytes), bom.txt (UTF-8 with its mark), changes one line or byte in each, and reads one hunk each with the decoded text in its `-` and `+` lines; a new Latin-1 file reads all added; an ignored one none.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_hunks_any_encoding_466.py tests/test_session_hunks_418.py tests/test_session_diff_412.py` returns 0
- ruff, mypy on `server.py`, build return 0

## observation contract

### UI driving steps

Gate `editor_edit_any_file.ts`, from source and on the bundle, as sprint 465 wrote it, with one check after each save: once the save's read lands, INFO's CHANGES lists one hunk card (`data-hunk-card`) and not "no changes against the base": latin.txt at line 1, wide.txt at line 1, blob.bin at line 2 after the byte is changed (its unchanged save lists none).

### Expected runtime signals

- server.jsonl: DIFF_READ with `hunks` 1 for each of the three files after its edit; no 500 on `/diff`.

### Expected screenshot / visual state

- blob.bin after its edit: INFO's CHANGES with one card `@@ 2`.

## done criteria

A file in any encoding, or not text, shows its changes against the base in the text the editor shows, after any save.

## notes

`baseText` in the window rebuilds the base from the file's text and the `-` lines, so hunks in the decoded text are what the centre's marks and the status line's count need; nothing in the window changes.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (a file not in plain UTF-8 has git's hunks over its decoded text).
- [x] context_files cover the route, the base, the decode rule, the window's use of hunks, git's docs.
- [x] No tag needed; DIFF_READ as it is.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] ≤2 files: `server.py` and its test; the gate's added step is the observation.

## close

`_workspace_hunks` sends a file of at most 2 MB through `_decoded_hunks` when its bytes or its base's (`git show <base>:./<path>`) are not plain UTF-8: each side decoded as the editor shows it (`_shown_text`: text by `_decode_any` with its line ends as `\n`, a file that is not text as Latin-1 with its `\r` bytes kept), compared by `git diff --no-index -U0 --text` over two scratch files in UTF-8, lines split at `\n` only. A file not in the base reads as all added, an ignored one has none (`git check-ignore`). The `-U0` parse is one function now (`_parse_hunks`), used by both paths; `_git_bytes` runs git for bytes and takes the exit codes `diff --no-index` uses.

Test `test_hunks_any_encoding_466.py`: latin.txt (Latin-1, CRLF) `-café +cañe` at line 1; wide.txt (UTF-16 LE) `-crème +crèmeZ` at line 2; bom.txt `-café +caféZ`; blob.bin one hunk at line 2 with its `\r` byte in both lines; a new Latin-1 file all added; an ignored one none; a plain UTF-8 file through git as before. A mutant that skips the decoded path fails three of the four tests (latin.txt with the `UnicodeDecodeError` the route answered 500 with) and fails the gate at its first new check (latin.txt's CHANGES empty after its save).

Command exit codes: tests 466, 418, 412: 16 passed; ruff check and format 0 (the formatter reflowed `server.py`); mypy 0; build 0. Gates on the bundle (build 1794437073, packaged true): `editor_edit_any_file` (CHANGES one card for latin.txt and wide.txt at line 1, blob.bin at line 2; DIFF_READ hunks 1 ×4), `editor_centre`, `editor_status`, `editor_inspector`, `editor_encodings` 0.

Rubber Duck Pass (bundle trace, kept for the pass and removed after). FILE_READ latin1 11; DIFF_READ main hunks 0 (the file as committed); FILE_WRITTEN latin1 12, seq 35; FILE_READ latin1 12; DIFF_READ hunks 1. FILE_READ utf16 24; DIFF_READ hunks 0; FILE_WRITTEN utf16 26, seq 37; FILE_READ utf16 26; DIFF_READ hunks 1. FILE_READ binary 256 twice (hex, then the text form), DIFF_READ hunks 0 each; FILE_WRITTEN bytes seq 39 and 41; FILE_READ binary twice; DIFF_READ hunks 1 twice. The workspace's DIFF_READ counts files 0, 1, 2, 3 as each file is changed. Observations: one, a timing note, `recorded`: no read landed between the unchanged save (seq 39) and the edit's write (seq 41), since the window drops a read when a write began while it was out (sprint 438); the gate's "no card after the unchanged save" check was met by the state before that save, and the sha256 check is the one that proves the unchanged save. Found in the screenshot, not the trace: the tree drew `.substrate-write-…`, the write's temp file, between the record entry and the rename; sprint 467.
