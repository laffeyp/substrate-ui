# Sprint 444 — save before send

```yaml
---
id: 444
status: closed
phase: code editor (roadmap r13), E10.0
pass_kind: functional
---
```

## scope

What is on screen is what the model sees (the Architect, 2026-11-10). When a turn is posted, every buffer of the sending pane's session whose text differs from the file as read is saved first, through the existing `PUT …/file` with FileWritten view `send`. The model starts only after the saves have answered.

- **The hook.** `sendTurn` in `web/vm/session_controller.ts` is the one place a turn is posted. It awaits a registered step after the echo and before TURN_SUBMITTED and the POST. So a message, a `//` driver command and `/dellm` all save first. The editor registers its save from `editor/Centre.tsx`, and `web/vm` imports nothing from `web/app` (BLACKBOARD 2026-11-10, agent-resolved, where the save hooks in).
- **Which buffers.** The session's kept buffers and the shown buffer when the centre shows that session. The store's `unsaved` list and `conflict` change only when the store belongs to that session (BLACKBOARD 2026-11-10, agent-resolved, which buffers).
- **A stale file.** A 409 leaves the file unwritten and the message still goes. The transcript shows one warning row under the message naming the file. When the refused file is the one shown, the centre draws its reload-or-overwrite offer, as for any stale save.
- **The activity tab.** It names a `send` save "saved with the message", beside "saved by hand" and "history step". HISTORY lists it as a hand row, as any save.
- **Not in scope.** Telling the model of the saves (the Architect, 2026-11-10). A slash command that starts no turn (`/model`, `/help`) saves nothing.

Files: `web/vm/session_controller.ts`, `web/app/editor/Centre.tsx`, `web/app/derive/inspector.ts` (the `send` view's name), `web/app/derive/activity_files.ts` and its spec, the vocabulary files, gate `harness/shakeout/editor_save_on_send.ts`.

## prerequisites

- 425 (saving), 436 (kept buffers saved through the file API), 443 (chips).

## context_files

- `../sdd-kit-3/AGENTS.md`; `WORKING_AGREEMENT.md`; `web/vm/signals/versions/0.49.json` and `0.49-rationale.md`; `web/vm/signals/proposals.json`
- BLACKBOARD: the `user` entries of 2026-11-10 (save before send; telling the model is out of scope); the agent-resolved save policy of 2026-11-09, superseded for sends; the two agent-resolved entries of 2026-11-10 above
- `process/planning/2026-11-09-code-editor/SAVE-BEFORE-SEND-2026-11-10.md`; `ROADMAP-2026-11-09-code-editor-r13.md` E10.0; `ADD-TO-MESSAGE-2026-11-10-r3.md` rule 5
- Design canon (hard rule 8): `../design/received/handoff 5/docs/DESIGN-DECISIONS -through 2026-11-04-.md` D6 (nothing drawn is invented) and D92 (every action lands on the record); `DESIGN-SPEC -2026-11-04- r6.md` §4 (the editor). The canon says nothing of saving on send.
- Code: `web/vm/session_controller.ts` `sendTurn`, `submitLine`; `web/app/editor/Centre.tsx` `BUFFERS`, `DISK`, `SHAS`, `ENDS`, `WRITES`, `activeBuffer`, `writeBuffer`, `save`; `web/app/derive/activity_files.ts`; `web/app/derive/inspector.ts` `HISTORY_VIEW`; `server.py` `_session_file_write`; gates `editor_chips.ts`, `editor_left_tabs.ts`

## signal contract

### Emits

Vocabulary v0.50, proposal P-0.50-SAVE-FOR-SEND:

- `EDITOR_SAVED_FOR_SEND` (`files`, `refused`), new. Written once for a turn whose session had buffers to save. `files` counts the saves written and `refused` the saves refused as stale. No paths in the trace (E1).
- `TURN_SUBMITTED` gains `saved`, the count of buffers saved for the turn (0 when there were none).
- `FILE_WRITTEN` on the server, one per save (existing).

### Invariants

- No out-of-vocabulary tag; the vocabulary changes only through the proposal and the version bump.
- For a pane, EDITOR_SAVED_FOR_SEND precedes that turn's TURN_SUBMITTED, and its `files` equals the TURN_SUBMITTED's `saved`.
- Every send save's FileWritten on the record precedes the turn's UserMessage when the session is at rest.

## artifact contract

### Files created

- `web/vm/signals/versions/0.50.json`, `0.50-rationale.md`
- `harness/shakeout/editor_save_on_send.ts`

### Files modified

- `web/vm/session_controller.ts`, `web/app/editor/Centre.tsx`, `web/app/derive/inspector.ts`, `web/app/derive/activity_files.ts`, `web/app/__tests__/activity_files.spec.ts`
- `web/vm/signals/proposals.json`, `web/vm/signals/versions/current.json` → `0.50.json`, the generated `signals.gen.ts` files and `signals_gen.py`
- `harness/shakeout/editor_follow.ts`: turn 2's typing now happens after ↵ while the model runs `sleep 3`, since typing before ↵ is saved with the message. The typing is several lines, and the model's edit replaces two lines with three (the Architect, 2026-11-10: "complicated multi-line edits").
- `WORKING_AGREEMENT.md` (the vocabulary row; the hand-author log)

### Content assertions

- `session_controller.ts` exports `setBeforeTurn`; `sendTurn` awaits it before it emits TURN_SUBMITTED.
- `Centre.tsx` defines `saveForSend` and registers it with `setBeforeTurn`; it writes `view: SEND_VIEW`.
- `inspector.ts` exports `SEND_VIEW = "send"`. `activity_files.ts` names no view by a string literal.
- `0.50.json` parses: 149 tags, `EDITOR_SAVED_FOR_SEND` among them, and `TURN_SUBMITTED.payload` includes `saved`.

### Command exit codes

- `python3 scripts/gen_signals.py --check` 0; `npm run signals` 0; `npm run build` 0
- `npx tsx --test web/app/__tests__/activity_files.spec.ts web/reveal/__tests__/before_turn.spec.ts` 0
- `npx tsx harness/shakeout/editor_save_on_send.ts` 0 from source; with `SHAKEOUT_APP` on the bundle 0
- The editor gates that send turns or save, from source and on the bundle: `editor_left_tabs`, `editor_chips`, `editor_follow`, `editor_inspector`, `editor_history`, `editor_save`, `editor_editing` 0

## observation contract

### UI driving steps (`editor_save_on_send.ts`)

The gate writes a repository with `src/cart.ts`, `src/menu.ts` and `src/tax.ts` and binds the deterministic driver.

1. Make multi-line edits and leave them unsaved (the Architect, 2026-11-10: "complicated multi-line edits"):
   - cart.ts: a line replaced by two, a line deleted, a function added at the end;
   - menu.ts, a CRLF file: two lines inserted and the last deleted;
   - tax.ts: two lines inserted.
2. tax.ts is shown last. Change it on disk behind its buffer, so its save will be stale and its offer is drawn.
3. Send a message from the editor's terminal.
4. Wait for the turn's Returned.

### Expected runtime signals

- `EDITOR_SAVED_FOR_SEND` with files 2 and refused 1, then `TURN_SUBMITTED` with saved 2, both for pane 1, in that order.
- `FILE_WRITTEN` ×2 on the server for the send.

### Expected record and disk

- The disk holds cart.ts's and menu.ts's buffers line for line, and menu.ts keeps its CRLF. tax.ts holds the on-disk change, not the buffer.
- Each send save's FileWritten.new_text equals the disk.
- The record has two FileWritten with view `send`, for src/cart.ts and src/menu.ts, before the turn's UserMessage.
- The transcript has one warning row naming src/tax.ts.
- The activity tab lists menu.ts, whose latest touch is its save, as "saved with the message".
- The tabs' unsaved dots are gone from cart.ts and menu.ts and still on tax.ts.

### Live model (the roster's default)

- The whole gate runs on the live roster's model. The message is "Use read_file on src/cart.ts. Then reply done."
- The record's read_file ToolResult holds cart.ts's new lines and not its deleted ones.

### Expected screenshot

- The warning row under the message, at 1512 points.

## done criteria

A turn posted from a pane saves that session's unsaved buffers first. The model's read returns the typed text. A stale file is refused and named in a warning while the message goes. The packaged trace shows EDITOR_SAVED_FOR_SEND before TURN_SUBMITTED, with equal counts.

## notes

Hard rule 6 is bypassed and logged in `WORKING_AGREEMENT.md`. The hook is in the controller, the save in the centre, the label in the derivation, and the tag in the vocabulary. None of them works without the rest.

## self-review checklist

- [x] Scope concrete: one verifiable property (the model's read of a file returns the buffer's text).
- [x] context_files cover the code, the vocabulary, the design canon and the decisions.
- [x] Emits names only v0.50 tags, ratified in this sprint.
- [x] Artifact contract gradable.
- [x] Observation contract present.
- [ ] ≤2 files: no; logged as a bypass (hard rule 10).

## close

Recorded in BLACKBOARD's `built` entry of 2026-11-10 for sprint 444.
