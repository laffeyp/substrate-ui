# Sprint 370 — a CLI driver's sign-in is written (CLI_STATUS_CHECKED, CLI_LOGIN_PROMPTED, CLI_LOGIN_FINISHED)

```yaml
---
id: 370
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 4, drivers and CLI login.

- **`CLI_STATUS_CHECKED`:** written by `session_controller.ts` `maybeOpenAuthPrompt` after it asks `/api/cli/<cli>/status`. `authed` is null when the probe gives no answer.
- **`CLI_LOGIN_PROMPTED`:** written by `openAuthPrompt` when it adds the sign-in card's row.
- **`CLI_LOGIN_FINISHED`:** written by `web/reveal/transcript/AuthPromptCard.tsx`, once per run of its flow:
  - `signed_in` or `failed`, from the status check after the pty exits;
  - `failed` when the pty does not start;
  - `dismissed` on cancel, or when the card goes before its flow ends.

  A ref keeps the exit that follows a cancel from writing a second record, and a retry starts a new run. `Row.tsx` passes the card its pane.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.18.json` (the three tags)
- `web/vm/session_controller.ts` (`pickDriver`, `maybeOpenAuthPrompt`, `openAuthPrompt`), `web/reveal/transcript/AuthPromptCard.tsx`, `web/reveal/transcript/Row.tsx`
- `server.py` (`cli_login_supported`; the `/api/cli/<cli>/...` routes)

## signal contract

### Emits

- `CLI_STATUS_CHECKED` (`driver`, `authed`)
- `CLI_LOGIN_PROMPTED` (`pane_id`, `driver`)
- `CLI_LOGIN_FINISHED` (`pane_id`, `driver`, `outcome`)

### Invariants

- One `CLI_LOGIN_FINISHED` per run of the card's flow.
- No behaviour changes: the card's pty, stream, retry and cancel run as before.

## artifact contract

### Files created

- `harness/shakeout/cli_login_signals.ts`

### Files modified

- `web/vm/session_controller.ts`, `web/reveal/transcript/AuthPromptCard.tsx`, `web/reveal/transcript/Row.tsx` (one prop)
- `web/vm/signals/unemitted.json`, `package.json` (`gates:electron`)

### Command exit codes

`npx tsc --noEmit` 0; `npx tsc -p harness --noEmit` 0; `npm run build` 0; `npm run signals` 0; `npm run test:unit` 0.

## observation contract

`harness/shakeout/cli_login_signals.ts`, from source and packaged. The gate answers every CLI call itself, so no real CLI runs and the box's own sign-ins play no part:
- `/api/models` lists a fixture CLI, `codex`, as login-supported;
- its status answers not signed in, then signed in after the first login, then not;
- the pty stream exits twice, then only sends lines.

Steps:
1. pane 1's picker: the sandbox row, then codex, guidance, length and tone;
2. the card draws and its flow ends;
3. retry, and the flow ends;
4. retry, then cancel.

`window-1.jsonl` must hold exactly these records for codex, in order:
1. the status check, authed false;
2. the card prompted, in pane 1;
3. finished `signed_in`;
4. finished `failed`;
5. finished `dismissed`.

Plant: the signed-in and failed outcomes swapped fails the gate, which prints both records.

## done criteria

A CLI driver's status check, its sign-in card and how each sign-in ended are in the trace.

## result

- **Commands:** `tsc` 0 for the window and for the harness; lint 0; `npm run build` 0.
- **Gate:** `cli_login_signals` 0 from source. The plant fails it.
- **Rubber Duck Pass**, on that trace:
  - the status check found codex not signed in, and the card was prompted in pane 1;
  - the first run signed in;
  - the retry failed;
  - the second retry was cancelled.

  Observations: none.
- **Hand-author log:** three files (`session_controller.ts`, `AuthPromptCard.tsx`, one prop in `Row.tsx`).
