# Sprint 369 — a pane's session actions are written (CONTROLS_PICKED, WORKSPACE_ADDED, SESSION_RENAMED, TASK_STOP_REQUESTED)

```yaml
---
id: 369
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 4, session actions. Each record is written in `web/vm/session_controller.ts`, at the method that decides it:

| Method | Record |
|---|---|
| `pickControls` | `CONTROLS_PICKED`, with the length and tone picks for the session the pane opens |
| `addWorkspace` | `WORKSPACE_ADDED`: `added` when the server takes the folder, `refused` otherwise |
| `renameSession` | `SESSION_RENAMED`: `renamed`, or `refused` when the server answers with an error (a name collision is 409) |
| `stopTask` | `TASK_STOP_REQUESTED`, before the request is sent |

A record whose payload carries `pane_id` is written only when the controller has a pane, as `TRANSCRIPT_ROW_SKIPPED` already is.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.18.json` (the four tags)
- `web/vm/session_controller.ts`, `web/vm/pane_registry.ts` (forwards to the active controller), `web/app/App.tsx` (`pickTone`, `commitPane`), `web/app/ActivityLine.tsx` (`TaskRows`)
- `server.py` `_session_patch` (409 on `NameCollision`) and `POST /api/workspaces` (400 only on an empty path)
- `harness/shakeout/length_tone_rows.ts`, `harness/shakeout/tasks_gate.ts`

## signal contract

### Emits

- `CONTROLS_PICKED` (`pane_id`, `length`, `tone`)
- `WORKSPACE_ADDED` (`pane_id`, `outcome`)
- `SESSION_RENAMED` (`pane_id`, `session_id`, `outcome`)
- `TASK_STOP_REQUESTED` (`session_id`, `task_id`)

### Invariants

- No behaviour changes. The pick, the add, the rename and the stop run as before.

## artifact contract

### Files created

- `harness/shakeout/session_action_signals.ts`

### Files modified

- `web/vm/session_controller.ts`; `web/vm/signals/unemitted.json`; `package.json` (`gates:electron`)

### Command exit codes

`npx tsc --noEmit` 0; `npx tsc -p harness --noEmit` 0; `npm run build` 0; `npm run signals` 0; `npm run test:unit` 0.

## observation contract

`harness/shakeout/session_action_signals.ts`, from source and packaged. Each failure row has its own fixture:

| Row | Fixture |
|---|---|
| rename refused | a real name collision: a second session already named `taken-name` |
| folder refused | a planted server refusal: the gate answers `POST /api/workspaces` with 400. The server refuses only an empty path, which the app never sends. |
| task stop | the gate answers the task list with one running task. No deterministic turn starts a task; `tasks_gate.ts` stops a real one with a real model. |

`window-1.jsonl` must hold exactly these seven records, in order:
1. pane 1's controls (terse, blunt);
2. pane 1's folder, added;
3. a rename, renamed;
4. a rename to `taken-name`, refused;
5. pane 2's controls;
6. pane 2's folder, refused;
7. the task stop.

Plant: a rename written as `renamed` whatever the server answers fails the gate with "/name taken-name wrote no SESSION_RENAMED refused".

## done criteria

Each of these session actions is in the trace with how it ended, the refusals included.

## result

- **Gate runs:** the gate's first run waited for a session after the tone pick. A session opens with the pane's first message, so the gate now sends one.
- **Commands:** `tsc` 0 for the window and for the harness; `npm run build` 0.
- **Gate:** `session_action_signals` 0 from source. The plant fails it.
- **Rubber Duck Pass**, on that trace:
  - pane 1 picked terse and blunt, and its folder was added;
  - the session was renamed, and then refused a name already taken;
  - pane 2 picked terse and blunt, and its folder was refused by the planted 400;
  - pane 1's task was asked to stop.

  Observations: none.
