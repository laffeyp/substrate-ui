# Sprint 468 — hex, binary and octal edit by typing over a digit

```yaml
---
id: 468
status: closed
phase: code editor (roadmap r13), E14 (6 of 7)
pass_kind: functional
---
```

## scope

Roadmap r13 E14 (the Architect, 2026-11-11: every file editable by hand, by default): "hex, binary and octal edit by typing over a digit". Sprint 465 made a file that is not text, up to the read limit, the code's buffer with every byte one character (Latin-1). This sprint makes hex, binary and octal views of that same buffer: the centre reads every binary file up to 2 MB as Latin-1 in every form; the bytes view draws its rows from the buffer, and a caret sits on one digit (placed by a click, moved by the arrows, Home and End); a digit of the form typed there replaces that byte in the buffer and the caret moves to the next digit. A key that is no digit of the form changes nothing, and an octal byte's first digit takes 0 to 3. Since the bytes are the code's buffer, ⌘S writes them (FILE_WRITTEN encoding `bytes`), undo takes them back, the tab's dot marks them, a send saves them, and every form shows them unsaved; a changed byte is drawn in the accent. The status line shows the caret's byte offset (`0x41`). A file over the read limit keeps its read-only view, read from the server; writing a file that size is sprint 469's, since FileWritten records a write's whole old and new text (kernel `FileWritten`) and the server refuses a write over 2 MB.

## prerequisites

- 465 (every file edits as text), 466, 467.

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the `user` entry of 2026-11-11 (every file editable by hand); its tail
- `ROADMAP-2026-11-09-code-editor-r13.md` E14; `RESEARCH-2026-11-11-binary-files-and-highlighting.md`
- `web/app/derive/bytes.ts` and its spec; `web/app/editor/BytesView.tsx`; `web/app/editor/Centre.tsx` (the read, `BYTE_TEXT`, the save, `onBufferEdit`); `web/app/editor/StatusLine.tsx`; `web/app/state/editor.ts`; `web/app/keymap.ts` (plain keys in the editor pass to the page)
- `../substrate/src/substrate/topologies/session/__init__.py` `FileWritten`; `server.py` `_session_file_write` (`WORKSPACE_READ_MAX`)

## signal contract

### Emits

No new tag. A digit typed is an edit of the buffer, which no tag records (as typing in the code); its save is EDITOR_FILE_SAVED and FILE_WRITTEN `encoding` bytes (v0.63). EDITOR_BYTES_VIEWED as before: one `open` per file opened, one `selector` per form picked.

### Consumes

- The code's buffer of the file; the file as read (DISK) for the changed marks.

### Invariants

- A typed digit changes exactly one byte, the one under the caret; a save writes the buffer's bytes and nothing else.
- A file over the read limit is never written from the bytes view.
- No byte, path or key in any payload (E1).

## artifact contract

### Files created

- `harness/shakeout/editor_type_digits.ts`

### Files modified

- `web/app/derive/bytes.ts` (`DIGIT_FORMS`, `DIGITS`, `digitColumn`, `typeDigit`) and `web/app/__tests__/bytes.spec.ts`
- `web/app/editor/BytesView.tsx` (`ByteBuffer`, the caret, the keys, the changed marks)
- `web/app/editor/Centre.tsx` (`?as=latin-1` in every form, `byteBuffer`, the view's mounting)
- `web/app/editor/StatusLine.tsx`; `web/app/state/editor.ts` (`bytesCaret`)
- `harness/shakeout/editor_bytes.ts`: pic.jpg's text form is the code now, not a bytes-view row

### Content assertions

- The spec checks `digitColumn` against `bytesRow`'s text for every byte of a row in each digit form, and `typeDigit` for each form, a key that is no digit, and an octal first digit over 3.
- `BytesView` reads rows from `buffer.slice` when it has a buffer and fetches no piece then.

### Command exit codes

- `npm run test:unit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

Gate `editor_type_digits.ts`, from source and on the bundle. A repository written by the gate holds blob.bin (256 bytes, 0 to 255, committed) and big.bin (3 MB, a NUL byte first). The deterministic driver; in the editor:

1. Open blob.bin: hex, the view editable, the status line `blob.bin · 0x0 · 256 bytes`.
2. Click byte 0x41's first digit, type `42`: row 4 reads `00000040  40 42 42 43 …`, byte 0x41 marked changed, the tab's dot shown, the status line `0x42`.
3. Pick binary, click byte 0x42, type `01000100`: row 11 reads `00000042: 01000100 …`.
4. Pick octal, click byte 0x43, type `105`: row 4 reads `0000100   100 102 104 105 …`; menu Undo: byte 0x43 is `103` again, 0x42 still `104`.
5. Pick text: the code's line 2 holds `@BDCDE`. Pick hex, click byte 0x43, type `45`.
6. ⌘S: the disk is the 256 bytes with 0x41, 0x42, 0x43 now 0x42, 0x44, 0x45 and no other byte changed; no byte marked changed; the dot gone.
7. Open big.bin: hex, the view not editable, the status line ends `read-only`; a click on row 0 and `f` typed change nothing on disk.

### Expected runtime signals

- server.jsonl: FILE_WRITTEN `encoding` bytes once, for blob.bin; none for big.bin.
- window-1.jsonl: EDITOR_BYTES_VIEWED hex open, binary, octal, text, hex by selector, hex open; EDITOR_FILE_SAVED once; no EDITOR_KEY_REFUSED.

### Expected screenshot / visual state

- blob.bin in hex after step 2 (the caret lit, 0x41 in the accent), in binary and octal, and after the save.

## done criteria

In hex, binary and octal, a digit typed over a byte changes that byte, and ⌘S writes it, for any file the editor holds.

## notes

The card was written after the code; logged in the hand-author log.

## self-review checklist

Run 2026-11-11, after the code and before the gate.

- [x] Scope is concrete and bounded: one verifiable property (a digit typed over a byte changes that byte, saved by ⌘S).
- [x] context_files cover the layouts, the view, the centre's buffer, the status line, the store, the record's FileWritten.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [ ] ≤2 files: no. The layouts, the view, the centre's buffer, the status line and the store each own a part; logged as a bypass.

## close

The first gate run failed at step 4: Undo took back all three typed bytes, not the octal one. The bytes 0x41 to 0x43 are adjacent and were typed within CodeMirror's 500 ms grouping delay, so its history joined the three changes into one step. A click, an arrow or a form picked now starts a new undo step (`isolateHistory.of("before")` on the first byte typed after it); digits typed in a run stay one step, as typing in the code does. That run stands as the first mutant. A second mutant, the read as Latin-1 only in the text form (as sprint 465 had it), fails the gate at step 1 (blob.bin's hex not editable).

Gate `editor_type_digits` from source and on the bundle (build 1794438738, packaged true): opened `blob.bin · 0x0 · 256 bytes`; hex `00000040  40 42 42 43 …`; binary `00000042: 01000100 01000011 …`; octal `0000100   100 102 104 105 104 …`, after Undo `… 104 103 104 …`; the code's line 2 holds `@BDCDE`; saved, 0x41, 0x42, 0x43 now 0x42, 0x44, 0x45 and no other byte changed; big.bin `big.bin · 3,145,728 bytes · read-only`, unchanged. Screenshots read: the caret's digit lit, changed bytes in the accent, the text column following, CHANGES "by hand · unsaved".

Command exit codes: unit specs 231/231 (two new: each digit's column against `bytesRow`'s text in every form; `typeDigit`); build 0. Gates on the bundle: `editor_type_digits`, `editor_bytes` (pic.jpg's text form read as the code), `editor_edit_any_file`, `editor_centre`, `editor_encodings`, `editor_save`, `editor_undo` 0; from source also `editor_status`, `editor_inspector` 0.

Rubber Duck Pass (bundle trace, kept for the pass and removed after). Server: FILE_READ binary 256 (blob.bin as Latin-1, hex shown); DIFF_READ files 1 (big.bin, new), hunks 0; FILE_WRITTEN bytes 256, seq 35; FILE_READ binary 256; FILE_READ too_large 3,145,728 (big.bin; FILE_READ names a file over the limit `too_large`, as since sprint 462); DIFF_READ hunks 1 (blob.bin against main), hunks 0 (big.bin, over the limit); FILE_BYTES_READ offset 0 length 65,536 (big.bin's first piece). Window: EDITOR_FILE_OPENED tree; EDITOR_BYTES_VIEWED hex open 256; EDITOR_HUNK_DRAWN hand 2; binary, octal by selector; UNDO_ROUTED undo to the buffer; text, hex by selector; EDITOR_FILE_SAVED menu_s; EDITOR_FILE_OPENED tree; EDITOR_BYTES_VIEWED hex open 3,145,728. No EDITOR_KEY_REFUSED. Observations: none.
