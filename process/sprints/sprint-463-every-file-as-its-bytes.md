# Sprint 463 — every file that is not text opens as its bytes, at any size

```yaml
---
id: 463
status: closed
phase: code editor (roadmap r13), E14 (2 of 3)
pass_kind: functional
---
```

## scope

Roadmap r13 E14 as corrected on 2026-11-11 (BLACKBOARD `user` entry: "I meant any file that's not text … You show what every file is"; "you just open a file … they could just scroll down and see the whole file"). The Architect opened JPEGs and WAVs in build 1794432244 and saw `binary file · N KB` and `over the read limit`. This sprint opens every file that is not text (a NUL byte in its first 8 KB) as its bytes, at any size, read-only:

- The server gains `GET /api/session/<id>/bytes?path=&offset=&length=`: a slice of the file, up to 256 KB, as base64 with the file's size; FILE_BYTES_READ on its trace. `_workspace_read` sniffs a file over 2 MB too, so a large file that is not text is named `binary`.
- The centre shows a binary file in `BytesView` in place of the `binary file` line. It draws only the rows in view and reads 64 KB pieces as the person scrolls, kept in a small cache; a file whose rows outgrow the browser's scroll height is scaled to it.
- Four forms, chosen in the status line, each in its standard layout (`derive/bytes.ts`): **hex** (the default; `hexdump -C`: an eight-digit hex offset, sixteen bytes in two groups of eight, the bytes as text between bars, a dot for each unprintable byte); **binary** (`xxd -b`: the offset and a colon, six bytes as eight 0s and 1s each, the text); **octal** (`od -b`: a seven-digit octal offset, sixteen bytes as three octal digits each); **text** (sixty-four bytes a row as Latin-1, a dot for each control byte). The form is kept per file while the editor is open. Each opening and each change of form is one EDITOR_BYTES_VIEWED.

A text file over 2 MB keeps `over the read limit` until sprint 464, which reads text in pieces by line.

## prerequisites

- 462 (the file API's encodings).

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the `user` entries of 2026-11-11 on binary files; its tail
- `RESEARCH-2026-11-11-binary-files-and-highlighting.md`; `ROADMAP-2026-11-09-code-editor-r13.md` E14
- `server.py` `_workspace_read`, `_session_files`, the GET dispatch; `web/app/editor/Centre.tsx` (the `binary file` line); `web/app/editor/StatusLine.tsx`; `web/app/state/editor.ts`
- `man xxd`, `od(1)`, `hexdump(1)` on this machine (the layouts)

## signal contract

### Emits

Vocabulary v0.62 (P-0.62-BYTES):
- `FILE_BYTES_READ` (server): `session_id`, `offset`, `length` — a slice of a file read for the bytes view.
- `EDITOR_BYTES_VIEWED` (window): `form` (hex | binary | octal | text), `how` (open | selector), `bytes` (the file's size).

### Consumes

- The file's bytes on disk, by range.

### Invariants

- No byte of a file and no path in any payload (E1).
- A text file under 2 MB opens as text, as before; a text file over it keeps its line.
- The bytes view never changes the file.

## artifact contract

### Files created

- `web/app/derive/bytes.ts` and `web/app/__tests__/bytes.spec.ts`; `web/app/editor/BytesView.tsx`
- `tests/test_file_bytes_463.py`; `harness/shakeout/editor_bytes.ts`
- `web/vm/signals/versions/0.62.json`, `0.62-rationale.md`

### Files modified

- `server.py`; `web/app/editor/Centre.tsx`, `web/app/editor/StatusLine.tsx`, `web/app/state/editor.ts`; the vocabulary files

### Content assertions

- `derive/bytes.ts` exports `BYTES_FORMS` and `bytesRow(form, offset, bytes)`; the spec checks each form's row for `PNG\r\n\x1a\n` against the layout `hexdump -C`, `xxd -b`, `od -b` print for the same bytes.
- `server.py` routes `/api/session/<id>/bytes` and caps `length` at 256 KB.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_file_bytes_463.py tests/test_file_encodings_462.py tests/test_workspace_files_348.py` returns 0
- ruff check and format, mypy on `server.py` return 0
- `npm run build`, `npm run test:unit` return 0

## observation contract

Gate `editor_bytes.ts` (new), from source and on the bundle. A repository written by the gate holds `pic.jpg` (a JPEG header and 600 KB of bytes), `sound.wav` (a RIFF/WAVE header and bytes), and `big.bin` (12 MB, each 16-byte row holding its own offset, so any row can be checked). The deterministic driver; in the editor:

1. Open pic.jpg: the bytes view, hex; the first row reads `00000000  ff d8 ff e0 …`; EDITOR_BYTES_VIEWED hex open.
2. Pick binary, octal, text in the status line: each first row in its layout; EDITOR_BYTES_VIEWED binary, octal, text by selector.
3. Open sound.wav: hex, its first row's text column `|RIFF….WAVEfmt |`.
4. Open big.bin (12 MB, past the old 2 MB limit): it opens; scrolled to the end, the last row's offset is the file's last row and its bytes are the offset written there.
5. No `binary file` or `over the read limit` line for any of them.

Record: server.jsonl FILE_BYTES_READ for each piece read, offsets within each file; window-1.jsonl EDITOR_BYTES_VIEWED in order. Screenshots of pic.jpg in each form and big.bin at its end.

## done criteria

Every file that is not text opens and shows its bytes in the form the person picks, however large the file.

## notes

Byte editing is not part of this sprint (read-only, as the Hex Editor extension's first view). The text form uses Latin-1, which reads every byte.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (any file that is not text shows its bytes, any size, four forms).
- [x] context_files cover the server, the centre, the status line, the store and the layouts' sources.
- [x] Emits names tags in v0.62, ratified in this sprint.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [ ] ≤2 files: no. The route, the view, its layouts, the selector and the store each own a part; logged as a bypass.

## close

The gate's first expectation of pic.jpg's text column was wrong (`|....JFIF…|`); `hexdump -C` prints `|......JFIF......|` for those bytes, as the view did. A mutant without the server's sniff of a large file fails the gate (big.bin never opens as bytes). Two gates expected the old `binary file` line and now expect the bytes view (`editor_centre`, `editor_encodings`). `editor_save` failed once on the bundle because dictation on the machine reached the gate's window; that is sprint 464's, and `editor_save` passes after it. The large text file (over 2 MB) keeps its line until sprint 465.

Command exit codes: bytes spec 5/5 (rows equal to `hexdump -C`, `xxd -b`, `od -b` on this machine); unit specs 229/229; `npm run test:py` 404 passed, 5 live-driver skips; ruff and mypy 0; build 0. Gates on the bundle (packaged true): `editor_bytes`, `editor_encodings`, `editor_centre`, `editor_status`, `editor_search`, `editor_save`, `editor_inspector` 0.
