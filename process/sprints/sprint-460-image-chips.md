# Sprint 460 — an image sent as a file chip goes as an image, and Claude Code opens it

```yaml
---
id: 460
status: closed
phase: code editor (roadmap r13), E10.5 (the part outside the kernel)
pass_kind: functional
---
```

## scope

Design rule 7 (`ADD-TO-MESSAGE-2026-11-10-r3.md`): "An image goes as its reference. Claude Code's Read opens it from the path today." The editor's chips are file, folder or lines, so an image picked in the tree reaches the server as a `file`. `server.py` `_attachment_text` then finds a NUL byte in its first 8 KB and writes `(not inlined: 1.2 KB, binary; src/red.png; read it with your file tools)`. The model is told the file is binary, not that it is an image it can open. This sprint makes the server recognise the four image formats Claude reads, JPEG, PNG, GIF and WebP (Claude API, "Vision"), by their first bytes. Such a file goes as `(not inlined: an image, PNG, 1.2 KB; src/red.png; read it with your file tools)`. A live gate then shows Claude Code opening the image from that line. Codex's `-i` and the Ollama models are kernel work and wait on the Architect's decision (roadmap r13 E10.5, corrected 2026-11-11).

## prerequisites

- 446 (never refuse: the reference lines), 452 (the sent message's chips).

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md`
- `web/vm/signals/versions/0.60.json` (TURN_ACCEPTED.by_reference; TRANSCRIPT_CHIPS_DRAWN)
- `BLACKBOARD.md` decision entries (2026-11-10: how the model gets an attachment's path; never refuse) and its tail
- `process/planning/2026-11-09-code-editor/ADD-TO-MESSAGE-2026-11-10-r3.md` (rules 2, 3, 7; sources: Claude API "Vision", Claude Code "Tools reference"); `ROADMAP-2026-11-09-code-editor-r13.md` E10.5
- `server.py` `_attachment_text`, `ATTACH_NOT_INLINED`, `ATTACH_FOLLOW`; `tests/test_turn_attachments_446.py`
- `harness/shakeout/sent_message_chips.ts` (the chip-to-record gate shape); `harness/shakeout/lib/electron.ts` (`launchArgs({ roster: "live" })`)
- The design canon for the chip on the sent message: D94 (the full path on hover); sprint 452's dashed mark for a chip sent by reference.

## signal contract

### Emits

No new tag; vocabulary v0.60 unchanged.
- `TURN_ACCEPTED` (`attachments`, `by_reference`): the image counts as by reference.
- `TRANSCRIPT_CHIPS_DRAWN` (`chips`, `by_reference`): the sent image chip drawn dashed.
- `EDITOR_CHIP_ADDED` (`kind` file, `how` alt_click).

### Consumes

- The chip as the page sends it (`kind` file); the file's first bytes on disk.

### Invariants

- A file whose first bytes are not one of the four image signatures goes as before: text by rule 3, or `binary`.
- A file named `.png` that holds text goes as text: the bytes decide, not the name.
- No label, path or image byte in any signal payload (E1).

## artifact contract

### Files created

- `tests/test_attachment_images_460.py`
- `harness/shakeout/image_chip_claude.ts`

### Files modified

- `server.py` (`_image_format`; `_attachment_text` uses it for `file` and `image`)
- `harness/shakeout/lib/electron.ts` (`bindPaneAsUser` waits for the roster with a named model too; found when this sprint's gate named `claude`)
- `tests/test_turn_attachments_446.py` (a JPEG sent as a file now reads `an image, JPEG`)

### Content assertions

- `server.py` defines `_image_format(head: bytes) -> str | None` returning `JPEG`, `PNG`, `GIF` or `WebP`.
- The test sends a PNG, a JPEG, a GIF, a WebP, a NUL-holding non-image, and a text file named `.png`, and expects `an image, PNG`, `an image, JPEG`, `an image, GIF`, `an image, WebP`, `binary`, and the text inline.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_attachment_images_460.py tests/test_turn_attachments_446.py tests/test_turn_attachments_453.py tests/test_attachment_marks_452.py` returns 0
- `uv run --project ../substrate mypy server.py`, `uv run --project ../substrate ruff check .`, `ruff format --check .` return 0
- `npm run build` returns 0

## observation contract

Gate `image_chip_claude.ts` (new), from source and on the bundle, with the live roster's `claude` driver (Claude Code on this machine). A repository holds `src/red.png`, a 64×64 PNG of one colour, red, written by the gate (no file from the machine). After "Reply with the single word ready. Use no tools.":

1. ⌥-click `src/red.png` in the editor's tree: chip "red.png".
2. Send "What single colour fills the attached image? Answer with the colour's name only."
3. The record's UserMessage attachment text is `(not inlined: an image, PNG, …; src/red.png; read it with your file tools)`.
4. The record holds a Read tool call naming `src/red.png` after that message, and the reply names red.
5. The sent message's chip is dashed, its hover the path and the line.

Record (window-1.jsonl and server.jsonl): EDITOR_CHIP_ADDED file alt_click; TURN_ACCEPTED attachments 1 by_reference 1; TRANSCRIPT_CHIPS_DRAWN chips 1 by_reference 1. A screenshot of the sent message with its chip and the reply.

## done criteria

An image the person adds goes to the model as an image named by its path, and Claude Code opens it and answers from what it shows.

## notes

The format names follow the Claude API's "Vision" page (JPEG, PNG, GIF, WebP). Signatures: PNG `89 50 4E 47 0D 0A 1A 0A`; JPEG `FF D8 FF`; GIF `GIF87a` or `GIF89a`; WebP `RIFF` then four size bytes then `WEBP` (the formats' own specifications, as `file(1)` reads them). The gate's reply check is the model's answer, so it reads "red" case-insensitively and nothing more.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (an image file chip reaches the model as an image line, and Claude Code opens it).
- [x] context_files cover the code, the vocabulary, the design rule and its sources, and the gate shape.
- [x] Emits names only tags in v0.60.
- [x] Artifact contract is gradable: a grep, a pytest and exit codes.
- [x] Observation contract present, with a live receiver.
- [x] ≤2 files modified at the start: `server.py`; two new files (a test, a gate). One concept. (The helper fix and test 446 came during the work; see the close.)

## close

Found during the work and fixed: the gate helper `bindPaneAsUser` did not wait for the driver roster when given a model by name, so a CLI agent's group header was never there to open (every earlier gate passed `deterministic` or no model). Test 446 expected a JPEG sent as a file to read `binary`, the fault this sprint fixes; it now reads `an image, JPEG`. The gate first checked the reply only in the controller's data; it now checks "◆ Red" drawn in the editor's terminal, and the trace holds TRANSCRIPT_ROW_DRAWN ModelReply at seq 41 after the HarnessToolCall at seq 39. The first screenshot scrolled the chip into view and pushed the reply below the terminal's edge; the gate no longer scrolls.

Command exit codes: attachment tests 38 passed; mypy, ruff check, ruff format --check 0; build 0. Gates on the bundle (packaged true): `image_chip_claude`, `sent_message_chips`, `turn_attachments_signals`, `message_refused_order`, `editor_chips`, `editor_context_menu`, `editor_escape_interrupt` (live), `input_bar` 0.
