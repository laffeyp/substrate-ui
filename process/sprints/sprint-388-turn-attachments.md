# Sprint 388 — a turn's attachments reach the record with their text (vocabulary v0.27)

```yaml
---
id: 388
status: closed
phase: editor shared work 0(e), first half
pass_kind: functional
---
```

## scope

Editor plan round 2, item 0(e). Kernel K344 (`0301beca`) gives the session's `UserMessage` a tuple of `Attachment(kind, label, ref, span, text)`, and the transcript writes each one into the model's prompt (session vocabulary § AC).

**The turn route.** `POST /api/session/<id>/turn` takes an optional `attachments`, each `{kind, label, ref, span?}`. The server resolves each one's text before the turn queues:

- `file`: the file's UTF-8 text, up to the read cap (2 MiB);
- `lines`: lines `span[0]` to `span[1]` of the file, counted from 1;
- `event`: `ref` is `seq:<n>`; the text is that record entry's kind and payload as JSON;
- `folder`: checked to be a folder; no text (§ AC.1);
- `image`, `time_range`, `element`, `plan_item`: recorded with no text. Images to the model are 0(e)'s second half.

A bad attachment is a 400 and no turn runs: an unknown kind, an empty label, a path outside the workspace, a missing file, a binary or over-cap file, a bad span, a missing seq.

**The tag.** TURN_ACCEPTED gains `attachments`, the count (`P-0.27-TURN-ATTACHMENTS`). The bridge's task route writes 0.

## context_files

- `server.py` (`_session_turn`, the bridge's task route, `_workspace_target`, `_workspace_read`)
- `../substrate/src/substrate/topologies/session/vocabulary.py` (`Attachment`), `../substrate/process/signals/session-vocabulary.md` § AC
- `harness/shakeout/workspace_files_signals.ts` (the gate's pattern)

## signal contract

### Emits

- TURN_ACCEPTED with `attachments`, in the server process.
- API_REFUSED, area `turn`, status 400, for a bad attachment.

### Invariants

- No path or text in either (E1).
- A refused attachment writes no TURN_ACCEPTED and no `UserMessage`.

## artifact contract

- **Created:**
  - `tests/test_turn_attachments_388.py`;
  - `harness/shakeout/turn_attachments_signals.ts`;
  - `web/vm/signals/versions/0.27.json`, `0.27-rationale.md`;
  - `process/archive/WORKING_AGREEMENT-2026-11-08-v0.26.md`.
- **Modified:**
  - `server.py`;
  - `tests/test_server_signals.py`, `web/app/__tests__/invariants.spec.ts` (TURN_ACCEPTED's payload);
  - the generated files, `proposals.json`, `current.json`;
  - `package.json` (`gates:electron`);
  - `WORKING_AGREEMENT.md`.

## observation contract

**`tests/test_turn_attachments_388.py`:**

1. A turn with a file, a line range, a folder, an event and an image: the record's `UserMessage` at turn 1 holds all five with their text, and TURN_ACCEPTED reads `attachments: 5` with no path or text.
2. Nine bad attachments, each a 400 naming its fault, with no TURN_ACCEPTED and no second `UserMessage`.

**`harness/shakeout/turn_attachments_signals.ts`, from source and packaged.** After one turn in pane 1, the window:

1. writes `attached.txt` through the file API;
2. sends a turn with the file, lines 2–3 and the first `UserMessage`'s seq attached;
3. sends a turn with a path outside the workspace.

`server.jsonl` must hold TURN_ACCEPTED (0, 0), TURN_ACCEPTED (1, 3), then API_REFUSED (turn, 400). The record's second `UserMessage` must carry the three attachments with the file's text, the two lines and the event's kind.

**Plants:**

- Without `attachments=` on the `UserMessage`, the first test fails.
- With the count written as 0, the gate fails and prints the records.

## result

- **Checks:**
  - build 0, with mypy on `server.py`;
  - ruff check and format 0;
  - unit 161;
  - Python 317 passed, 5 skipped (the new file 10);
  - `npm run signals` 0 (vocabulary 0.27, 113 live tags emitted).
- **Gate:** `turn_attachments_signals` 0 from source and packaged.
- **Plants:** both fail as stated.
- **Packaged and installed:** in the BLACKBOARD's `built` entry.
- **Rubber Duck Pass**, on the gate's `server.jsonl`, for one session:
  - TURN_ACCEPTED, turn 0, attachments 0: the first turn, typed in the input bar, with none;
  - TURN_ACCEPTED, turn 1, attachments 3: the server handed the kernel a turn whose `UserMessage` carries three; the record holds them with their text at that turn;
  - API_REFUSED, area turn, status 400: the attachment outside the workspace, with no TURN_ACCEPTED after it.

  No observations. No path or text in the trace.
