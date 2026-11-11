# Sprint 470 — a text file over the read limit shows by line, and a long line reads on

```yaml
---
id: 470
status: closed
phase: code editor (roadmap r13), E14 (8 of 8)
pass_kind: functional
---
```

## scope

Roadmap r13 E14 (the Architect, 2026-11-11: "you just open a file … they could just scroll down and see the whole file"). A text file over the read limit (2 MB) still draws `over the read limit · N KB`. This sprint shows it: the centre draws such a file in a lines view (`LinesView`), which reads the lines in sight from sprint 469's route in pages of 1,000, keeps the last 64 pages, numbers each line, and scales its scroll past the browser's tallest scroll area as the bytes view does. INFO names the file's encoding from the route; the status line reads `name · N bytes · read-only`. A line past 64 KB shows its first 2,000 characters after a link `whole line ›`, which opens the line reader: that one line wrapped at the view's width, read on through the bytes route (256 KB a read) from the byte the route names (`rest`, added to sprint 469's route with the cut moved onto a whole character, and the route's `codec`), decoded in the file's codec, as the person scrolls, until the line is whole. The view is read-only: a save of a file this size waits on the Architect's answer (BLACKBOARD 2026-11-11 surfaced), since a save puts the whole old and new text in the record.

## prerequisites

- 469.

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the `user` entries of 2026-11-11 on opening every file; the `surfaced` question on saving large files; its tail
- `ROADMAP-2026-11-09-code-editor-r13.md` E14
- `server.py` `_workspace_lines`, `_read_line`, `_workspace_bytes`; `tests/test_file_lines_469.py`
- `web/app/editor/BytesView.tsx` (the virtual rows, the scale), `web/app/editor/Centre.tsx` (the `over the read limit` line), `web/app/editor/StatusLine.tsx`, `web/app/editor/Inspector.tsx` (`encodingName`)
- WHATWG Encoding: `TextDecoder` with `stream`; its label `latin1` is windows-1252

## signal contract

### Emits

No new tag. FILE_LINES_READ (v0.64) per page read; FILE_BYTES_READ per piece of a long line read on; FILE_READ `too_large` for the file's facts, as before.

### Consumes

- The lines route's pages (`total`, `encoding`, `codec`, each line's `text`, `more`, `rest`); the bytes route's pieces.

### Invariants

- No path, line or byte in any payload (E1).
- A file up to the read limit opens as before.
- The view never writes the file.

## artifact contract

### Files created

- `web/app/editor/LinesView.tsx` (`LinesView`, `LineReader`); `harness/shakeout/editor_large_text.ts`

### Files modified

- `server.py` (`_whole_characters`; `rest` and `codec` in the lines route), `tests/test_file_lines_469.py`
- `web/app/editor/Centre.tsx`, `web/app/editor/StatusLine.tsx`; `web/app/editor/BytesView.tsx` (a comment that named sprint 469 for large saves)

### Content assertions

- `Centre.tsx` draws `LinesView` where it drew the `over the read limit` line, and no `data-editor-unreadable` element remains.
- The test: a cut on a two-byte character keeps whole characters, `rest` and `more` name the unsent bytes exactly; `codec` is sent.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_file_lines_469.py tests/test_file_bytes_463.py` returns 0
- ruff, mypy on `server.py`, `npm run test:unit`, build return 0

## observation contract

### UI driving steps

Gate `editor_large_text.ts`, from source and on the bundle. A repository written by the gate holds million.txt (1,000,000 numbered lines, 28 MB) and one.json (5 MB on one line). The deterministic driver; in the editor:

1. Open million.txt: the lines view; line 1 reads `line 0000000 of the million`; INFO's encoding `UTF-8`; the status line `million.txt · N bytes · read-only`; no `over the read limit` line.
2. Scroll to the end: line 1,000,000 reads `line 0999999 of the million`, and line 1,000,001 is empty.
3. Scroll to the middle: the first line in sight holds its own number.
4. Open one.json: line 1 shows `[1,1,…` (2,000 characters) after the link `whole line ›`, in sight; the link opens the reader; scrolled to its end, it reads on until it holds the file's 5,242,883 characters and its last row ends `1]`; `back to the lines` returns to line 1.

### Expected runtime signals

- server.jsonl: FILE_LINES_READ from 0, from a page in the middle, from 999,000; FILE_BYTES_READ at offsets 65,536, 327,680, … for one.json.

### Expected screenshot / visual state

- million.txt at its start, its end and its middle; one.json with its tail, and whole.

## done criteria

A text file of any size opens in the editor, scrolls to any line, and shows every byte of its longest line.

## notes

The card was written after the code; logged in the hand-author log.

## self-review checklist

Run 2026-11-11, after the code and before the gate.

- [x] Scope is concrete and bounded: one verifiable property (any line of a text file of any size is shown, whole).
- [x] context_files cover the route, the bytes view as the model, the centre, the status line, INFO, the decoder.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [ ] ≤2 files: no. The view (new), the centre, the status line, and the route's `rest`; logged as a bypass.

## close

The first gate run timed out clicking a tail drawn after a 65,536-character row, off the view's right edge. The design was wrong past that too: one row of a 5 MB line is wider than Chromium's widest box (about 33.5 million pixels, near 4 million characters), so its end could never be scrolled to. A long line's row now shows its first 2,000 characters after the link `whole line ›`, at the row's start, and the line reader wraps that line at the view's width and reads on as it scrolls. A second run found the link after character 2,000, out of sight; it was moved before the text, and the gate checks it lies inside the view.

Gate `editor_large_text` from source and on the bundle (build 1794440200, packaged true): million.txt (28,000,000 bytes) line 1 `line 0000000 of the million`, INFO `UTF-8`, status `million.txt · 28,000,000 bytes · read-only`; at the end `line 0999999 of the million` then an empty line 1,000,001; the middle shows line 499,986 holding its own number; one.json's reader read on in 20 pieces to its 5,242,883 characters, its last row ending `1]`, and back to the lines. A mutant naming the line's start as `rest` fails it (the last row ends `1,`, the reads having restarted at the line's first byte). Screenshots read: the lines with their numbers, the link in sight, the reader wrapped to `1]`.

Command exit codes: tests 469 and 463, 10 passed; ruff check and format 0; mypy 0; unit specs 231/231; build 0. Gates on the bundle: `editor_large_text`, `editor_bytes`, `editor_type_digits`, `editor_centre`, `editor_encodings`, `editor_edit_any_file` 0.

Rubber Duck Pass (the gate's trace, as its output reports it). FILE_LINES_READ from 0 (million.txt's first page), 1,000,000 (the page holding only the empty last line), 999,000, 499,000, 500,000, and 0 (one.json); FILE_BYTES_READ ×20 at 65,536 + k × 262,144 for one.json, in order. Observations: none.
