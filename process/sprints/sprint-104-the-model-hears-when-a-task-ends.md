---
id: 104
status: closed
class: H. Prior work: Claude Code notifies the agent when a background command finishes, and wakes it if idle. Roadmap: process/planning/ROADMAP-2026-10-02-background-commands.md
---

# Sprint 104 — the model hears when a background task ends

## scope

- `TaskTable` records each task that ends without the model asking: it exits, it is stopped by the output cap, or it is stopped by an owner rule (a child or session ending). A stop the model asked for (`bash_stop`) is not reported back to it. `drain_ended(owner)` returns each unreported ending once, with the last 500 characters of its output.
- The session model producer drains its session's endings before every model step. Each becomes a `BackgroundTaskEnded` event on the record and a line in the prompt: `[background task bg_… (cmd) exited 0; last output: …]`. Mid-turn, the next step sees it. While the session is parked, the first step of the next turn sees it.
- The transcript renders past `BackgroundTaskEnded` events, so the notice stays in the model's history.
- substrate-ui: `envelope_kinds.gen.ts` regenerated; the session controller renders the event as a row (`task bg_… exited 0 · cmd`).

## invariants

1. A task that exits during a turn is recorded as `BackgroundTaskEnded` before the next model step, and that step's prompt contains its notice.
2. A task that exits while the session is parked appears in the prompt of the next turn's first step, once.
3. A task stopped with `bash_stop` produces no notice. A task stopped because its session's delegated child ended does.
4. Each ending is reported once.
5. The app shows the row; `KIND_DISPOSITION` stays exhaustive (`gen_kinds --check`).

## observation contract

- Kernel and UI tests; `gen_kinds --check`; client specs.
- Realmodel (kimi): the model starts `sleep 2; echo READY-104` in the background, then runs a foreground `sleep 4`. Its answer names READY-104, and the record holds `BackgroundTaskEnded` before the final answer.
- `release.sh` against the bundle.

## result (2026-10-02)

- `TaskTable.drain_ended(owner)` and `Task.reported`; `bash_stop` marks its stop reported (`by_model=True`).
- `session/__init__.py`: the `BackgroundTaskEnded` event and `background_notice()`. The model producer drains before every step, writes the event, and appends the notice to that step's prompt. `transcript.py` renders past notices.
- substrate-ui: generated kinds now 29; `KIND_DISPOSITION` flagged the new kind until it was classified, as designed. Row: `task bg_… exited 0 · cmd`.
- The bundled `session` and `daily` CI records were regenerated, because their RunStarted lists the model producer's schemas; the other 16 kept their bytes.

Tests:
- kernel `test_background_notice_104` (3), each failing with the drain disabled;
- client spec "a background task that ended shows as a row";
- realmodel `test_realmodel_background_notice_104` on kimi, 3 of 3. The model, told not to call `bash_output`, named READY-104 from the notice alone.

Tiers: kernel 1,225 passed, 2 skipped; UI 218; client specs 22/22; realmodel 43/43; `gen_kinds --check` current.

Committed: kernel `205b3724`; substrate-ui in the commit carrying this card.
