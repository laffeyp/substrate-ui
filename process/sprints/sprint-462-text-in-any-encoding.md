# Sprint 462 — a text file in any encoding opens as text

```yaml
---
id: 462
status: closed
phase: code editor (roadmap r13), E14 (1 of 2)
pass_kind: functional
---
```

## scope

Roadmap r13 E14, first sprint (`RESEARCH-2026-11-11-binary-files-and-highlighting.md`). The file API (`server.py` `_workspace_read`) decodes only UTF-8 and calls every other file `binary`, so a Latin-1 or UTF-16 text file opens as the line `binary file · N KB`. This sprint makes the file API decode a file by the rule the attachments already use (`_decode_any`, sprint 446: a byte-order mark names UTF-8 or UTF-16; with no NUL byte in the first 8 KB, UTF-8, else Latin-1) and name its encoding: `utf-8`, `utf-8-bom`, `utf-16`, `latin-1`, or `binary` for a file with a NUL byte. A file that is not plain UTF-8 also carries `read_only: true`. The editor opens it as text, read-only (CodeMirror's `EditorState.readOnly`), since the server's write refuses a file that is not UTF-8 text; ⌘S on it is refused with its own reason; the inspector's INFO names the encoding and says read-only. A binary file keeps today's line until sprint 463.

## prerequisites

- 446 (`_decode_any`), 418 (the file API's read in the editor).

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `BLACKBOARD.md`: the `user` and `agent-resolved` entries of 2026-11-11 on binary files; the `user` entry of 2026-11-10 (every file is made of text); its tail
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-binary-files-and-highlighting.md`; `ROADMAP-2026-11-09-code-editor-r13.md` E14
- `server.py` `_workspace_read`, `_decode_any`, the file route's FILE_READ, the write's refusal of non-UTF-8; `tests/test_workspace_files_348.py`
- `web/app/editor/Centre.tsx` (`FileFacts`, the file's `EditorState.create`, `save`); `web/app/editor/Inspector.tsx` (INFO)
- `web/vm/signals/versions/0.60.json`: FILE_READ, EDITOR_KEY_REFUSED

## signal contract

### Emits

Vocabulary v0.61 (P-0.61-ENCODINGS):
- `FILE_READ` (`session_id`, `bytes`, `encoding`): `encoding` gains `utf8_bom`, `utf16`, `latin1`.
- `EDITOR_KEY_REFUSED` (`key`, `reason`): `reason` gains `not_utf8`, ⌘S on a file opened read-only for its encoding.

### Consumes

- The file's bytes on disk.

### Invariants

- A plain UTF-8 file reads and saves as before (`encoding: "utf-8"`, `read_only: false`).
- A file with a NUL byte in its first 8 KB stays `binary` with no text.
- No path or text in any payload (E1).

## artifact contract

### Files created

- `tests/test_file_encodings_462.py`
- `harness/shakeout/editor_encodings.ts`
- `web/vm/signals/versions/0.61.json`, `0.61-rationale.md`

### Files modified

- `server.py` (`_workspace_read`; FILE_READ's encoding)
- `web/app/editor/Centre.tsx` (read-only state; the refused save), `web/app/editor/Inspector.tsx` (INFO)
- `web/vm/signals/proposals.json`, `web/vm/signals/versions/current.json`, the generated files

### Content assertions

- `_workspace_read` calls `_decode_any` and returns `read_only`.
- `Centre.tsx` adds `EditorState.readOnly.of(true)` for a `read_only` file and refuses its save with `EditorKeyRefusedReason.NOT_UTF8`.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_file_encodings_462.py tests/test_workspace_files_348.py tests/test_workspace_write_387.py` returns 0
- `uv run --project ../substrate mypy server.py`, `ruff check .`, `ruff format --check .` return 0
- `npm run build`, `npm run test:unit` return 0

## observation contract

Gate `editor_encodings.ts` (new), from source and on the bundle. A repository written by the gate holds `latin.txt` (`café crème`, Latin-1 bytes), `wide.txt` (UTF-16 with its mark), `bom.txt` (UTF-8 with its mark), `plain.txt` (UTF-8) and `img.bin` (a NUL byte). The deterministic driver; in the editor:

1. Open each text file: the code shows its text (`café crème` for latin.txt); INFO's encoding reads `Latin-1 · read-only`, `UTF-16 · read-only`, `UTF-8 with BOM · read-only`, `UTF-8`.
2. In latin.txt, type a character: the text is unchanged. ⌘S: refused.
3. In plain.txt, type and ⌘S: saved, as before.
4. img.bin: the line `binary file · N KB`, as before.

Record: server.jsonl FILE_READ encoding latin1, utf16, utf8_bom, utf8, binary (in the order opened); window-1.jsonl EDITOR_KEY_REFUSED key Meta+s reason not_utf8 once; EDITOR_FILE_SAVED once (plain.txt). A screenshot of latin.txt open with INFO.

## done criteria

A Latin-1, UTF-16 or BOM-marked file opens as its text, named by its encoding, and cannot be saved into the wrong encoding.

## notes

Saving a file in its own encoding is later work; until then the server's write refuses it and the editor does not offer it.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (each encoding's text shows, read-only, named).
- [x] context_files cover the server, the centre, the inspector, the vocabulary and the research.
- [x] Emits names tags in v0.61, ratified in this sprint.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [ ] ≤2 files: no. The server, the centre and the inspector each own a part (the decode, the read-only buffer, the named encoding); logged as a bypass.

## close

A false lead, recorded so it is not repeated: the gate's first runs had latin.txt take a typed "Z". The cause was the gate: all five files hold the same words, so its wait for latin.txt's text passed while plain.txt was still placed, and the "Z" went into plain.txt. The gate now waits for INFO's encoding line, which names the placed file. A `changeFilter` added while chasing it was removed: CodeMirror's view ignores typed changes while `readOnly` is set (`@codemirror/view`, "Ignore changes when the editor is read-only"). A mutant without the read-only state fails the gate ("latin.txt took a character").

Found in the screenshot and fixed: INFO's size read "1 lines", and ACTIVITY's read and write lines did the same; `derive/inspector.ts` `linesText` writes "1 line" (spec added).

Command exit codes: ruff check and format 0; mypy 0; signals 0; `npm run test:py` 402 passed, 5 live-driver skips; unit specs 224/224; build 0. Gates on the bundle (packaged true): `editor_encodings`, `editor_centre`, `editor_save`, `editor_inspector`, `editor_search`, `editor_save_on_send` 0.
