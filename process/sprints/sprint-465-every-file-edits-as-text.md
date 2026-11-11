# Sprint 465 — every file edits as text, and saves byte for byte or in its own encoding

```yaml
---
id: 465
status: closed
phase: code editor (roadmap r13), E14 (3 of 5)
pass_kind: functional
---
```

## scope

The Architect, 2026-11-11 (BLACKBOARD `user`): every file is editable by hand, by default; "this is a text editor and these are files that are made of text … It doesn't give you any arbitrary limitations." Sprints 462 and 463 opened every file read-only. This sprint makes every file up to the read limit editable as text:

- **A text file in another encoding** (Latin-1, UTF-16, UTF-8 with its mark) edits like any file and saves in its own encoding: UTF-16 keeps its byte order and mark, UTF-8 keeps its mark. The read-only state and the `not_utf8` refusal of sprint 462 go.
- **A file that is not text**, in its text form, opens in the code editor with every byte one character (Latin-1), and saves byte for byte: a byte changes only where a character was changed. The file route's `?as=latin-1` sends a binary file's bytes so; the editor splits lines only at `\n` (`EditorState.lineSeparator`), so a `\r` byte stays a byte, and draws control bytes as markers (`highlightSpecialChars`), never as dots.
- **The server's write** takes `encoding` (`utf-8`, the default, `utf-8-bom`, `utf-16`, `latin-1`) and writes the text in it; a character Latin-1 cannot hold is refused (400), never dropped. The old file must still match `base_sha256`. FILE_WRITTEN names the encoding.

Hex, binary and octal stay read views here; typing over a digit is sprint 467. A file over the read limit keeps its view until sprint 468.

## prerequisites

- 462 (encodings), 463 (the bytes view and its forms).

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the `user` entries of 2026-11-11 (every file openable; every file editable); its tail
- `ROADMAP-2026-11-09-code-editor-r13.md` E14; `RESEARCH-2026-11-11-binary-files-and-highlighting.md`
- `server.py` `_session_file_write`, `_workspace_read`, `_session_files`; `web/app/editor/Centre.tsx` (the file load, `normal`, `lineEnd`, `save`); `web/app/editor/StatusLine.tsx`; `web/app/editor/BytesView.tsx`
- `node_modules/@codemirror/state` (`lineSeparator`), `@codemirror/view` (`highlightSpecialChars`)
- Vocabulary 0.62: FILE_WRITTEN, EDITOR_KEY_REFUSED

## signal contract

### Emits

Vocabulary v0.63 (P-0.63-WRITE-ENCODING): `FILE_WRITTEN` gains `encoding` (utf8 | utf8_bom | utf16 | latin1 | bytes); `EDITOR_KEY_REFUSED.reason` `not_utf8` is no longer written (no file is refused for its encoding).

### Consumes

- The file's bytes; the buffer's text.

### Invariants

- A UTF-8 file saves as before (`encoding` utf8).
- Saving a file that is not text changes exactly the bytes whose characters changed; an unedited save writes the same bytes (same sha256).
- No path, text or byte in any payload (E1).

## artifact contract

### Files created

- `tests/test_file_write_encodings_465.py`; `harness/shakeout/editor_edit_any_file.ts`
- `web/vm/signals/versions/0.63.json`, `0.63-rationale.md`

### Files modified

- `server.py`; `web/app/editor/Centre.tsx`, `web/app/editor/StatusLine.tsx`, `web/app/editor/Inspector.tsx` (its encoding line said "read-only" for any file not in UTF-8); the vocabulary files
- `tests/test_workspace_write_387.py`, `tests/test_file_encodings_462.py`, `harness/shakeout/editor_encodings.ts`: their expectations of the read-only state this sprint removes

### Content assertions

- The write route reads `encoding` and writes `text` encoded in it, keeping a UTF-16 file's byte order.
- `Centre.tsx` gives a binary file's text form `EditorState.lineSeparator.of("\n")` and `highlightSpecialChars()`, and saves it with `encoding: "latin-1"` and no line-end change.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_file_write_encodings_465.py tests/test_file_encodings_462.py tests/test_workspace_write_387.py tests/test_file_bytes_463.py` returns 0
- ruff, mypy, build, unit specs return 0

## observation contract

Gate `editor_edit_any_file.ts` (new), from source and on the bundle. A repository written by the gate holds `latin.txt` (Latin-1), `wide.txt` (UTF-16 LE with its mark), and `blob.bin` (256 bytes, every value 0 to 255 once, `\r` and `\n` among them). The deterministic driver; in the editor:

1. latin.txt: type `ñ` at the end of line 1, ⌘S: the disk holds `café crèmeñ\n` in Latin-1 bytes.
2. wide.txt: type `Z`, ⌘S: the disk holds the text with `Z`, UTF-16 LE, its mark kept.
3. blob.bin: pick text in the status line; the code shows the bytes as characters; ⌘S with no change: the disk's sha256 is unchanged. Then replace the character for byte 0x41 (`A`) with `B`, ⌘S: the disk is the 256 bytes with byte 0x41 now 0x42, every other byte the same.

Record: server.jsonl FILE_WRITTEN encoding latin1, utf16, bytes, bytes in order; no EDITOR_KEY_REFUSED; EDITOR_FILE_SAVED ×4. Screenshots of blob.bin in its text form.

## done criteria

Any file the editor opens can be changed by hand and saved, and the save writes exactly what was typed and nothing else.

## notes

Typing over digits in hex, binary and octal is sprint 467; editing a file over the read limit in pieces is sprint 468. Found at the close: a file not in UTF-8 has no comparison with its base (sprint 466).

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (any file under the limit edits as text and saves exactly).
- [x] context_files cover the write, the read, the centre, the status line, CodeMirror's facets.
- [x] Emits names tags in v0.63, ratified in this sprint.
- [x] Artifact contract is gradable.
- [x] Observation contract present, byte for byte.
- [ ] ≤2 files: no. The server's write and read, the centre's buffer and save, the status line's selector each own a part; logged as a bypass.

## close

`editor_edit_any_file` passes from source and on the bundle (build 1794436469, packaged true): latin.txt saved as `636166e9206372e86d65f10a` (`café crèmeñ\n` in Latin-1); wide.txt saved as UTF-16 LE with its mark, 26 bytes; blob.bin in its text form as two lines (its one `\n` byte) with 64 control markers, the count of `highlightSpecialChars`' characters among the 256 bytes (0x00–08, 0x0b–1f, 0x7f–9f, 0xad); saved unchanged with the same sha256; byte 0x41 typed over is 0x42 and no other byte changed. Status line in the text form: `blob.bin · 1:1 · 256 bytes`, the form selector at the right.

Mutants: the centre's save with no `encoding` fails the gate (the server reads latin.txt as UTF-8, refuses the write, and the disk keeps `café crème\n`); the byte text without `EditorState.lineSeparator.of("\n")` fails it (the `\r` byte splits line 1 and blob.bin shows three lines; a save would write `\n` in its place).

Command exit codes: the four Python tests named, 13 passed; `mypy server.py` 0; `ruff check .` and `ruff format --check .` 0; `npm run signals` 0 (v0.63, 155 tags); unit specs 229/229; build 0. Gates from source and on the bundle: `editor_edit_any_file`, `editor_encodings` (now: INFO names each encoding with no "read-only", no key refused), `editor_bytes`, `editor_save`, `editor_centre`, `editor_inspector` 0; from source also `editor_status` 0.

Rubber Duck Pass (bundle trace, kept for the pass and removed after). Server: FILE_READ latin1 11 bytes; FILE_WRITTEN latin1 12 bytes (`ñ` is one byte in Latin-1), seq 35; FILE_READ latin1 12 bytes, the read after the write; FILE_READ utf16 24 bytes; FILE_WRITTEN utf16 26 bytes (`Z` is two); FILE_READ binary 256, twice (the hex form, then the text form's `?as=latin-1`); FILE_BYTES_READ offset 0 length 256 (the bytes view's piece, landing after the form changed); FILE_WRITTEN bytes 256, seq 39 and 41; FILE_READ binary after each. Window: EDITOR_FILE_OPENED tree ×3; EDITOR_HUNK_DRAWN hand 2 after each edit; EDITOR_FILE_SAVED menu_s ×4; EDITOR_BYTES_VIEWED hex open, text selector; no EDITOR_KEY_REFUSED. Observations: one. Payload anomaly, `resolved-here` as the next sprint: the second screenshot draws line 2's hunk from the buffer's own base, but `_workspace_hunks` gives no hunks for blob.bin and wide.txt (git calls them binary) and raises `UnicodeDecodeError` on latin.txt (`_git_out` decodes git's output as UTF-8), so after a save of such a file the centre takes the saved text as its base and INFO says "no changes against the base". Sprint 466 compares a file not in UTF-8 with its base in its own encoding.
