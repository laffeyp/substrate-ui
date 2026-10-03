---
id: 105
status: closed
class: H. Prior work: Claude Code's `/tasks` lists running background shells and stops them; after the user stops one, "Claude moves on instead of waiting for it" (code.claude.com/docs/en/tools-reference). Roadmap: process/planning/ROADMAP-2026-10-02-background-commands.md
---

# Sprint 105 — background tasks in the app

## scope

- Daemon:
  - `GET /api/session/<id>/tasks` returns the session's tasks (`task_id`, `command`, `status`, `exit`, `runtime_s`, `stopped_because`).
  - `POST /api/session/<id>/tasks/<task_id>/stop` stops one. The stop is reported to the model (sprint 104's notice), so its next step knows the task is gone.
- Client: `SessionController.backgroundTasks` in the snapshot. Refreshed after every `ToolResult` and `BackgroundTaskEnded`, and every 3 s while any task runs. `stopTask(task_id)` posts the stop.
- Activity strip, terminal and reveal views: one line per running task, `bg_… · cmd · 2m · stop`. Clicking `stop` stops it.

## invariants

1. The tasks endpoint lists only that session's tasks; an unknown session is 404, an unknown task 404.
2. A stop from the app kills the task's process group and is reported once to the model.
3. The strip shows a running task within one refresh and drops it after the stop.

## observation contract

- UI pytest for the endpoints; client spec for the controller state.
- `harness/shakeout/tasks_gate.ts`, run by `release.sh` against the packaged app. A real kimi turn starts `sleep 300` with `run_in_background`; the strip shows the task; the gate clicks stop; the endpoint reports `stopped` and the process is gone.

## result (2026-10-02)

- `server.py`: `_session_tasks`, `_session_task_stop`. A stop from the app is not marked reported, so the model's next step hears it.
- Client:
  - `BackgroundTaskRow`, `Snapshot.backgroundTasks`, `refreshTasks()`, `stopTask()`;
  - a refresh after every bash `ToolResult` and `BackgroundTaskEnded`, and every 3 s while a task runs;
  - `reveal_component._taskBindings`, and task lines with a stop link in both views (`data-vm-tasks`, `data-vm-task-stop`).
- Found and fixed: the locked signal vocabulary (`web/vm/signals/versions/0.1.json`) said `tag_count: 30` while listing 31 tags. Sprint 087 added `DRIVER_VERSION_PICKED` without the count, and `check-vocabulary-parity` has failed since 2026-09-27 with no gate to notice. The count is 31; the parity check now runs in `release.sh` stage 2. No new tag was added this sprint; a stop from the app is recorded through sprint 104's notice.

Tests:
- UI `test_session_tasks_endpoints_105` (2);
- client spec for refresh and stop (23/23);
- `harness/shakeout/tasks_gate.ts` (`npm run gates:tasks`, `release.sh` stage 6). In source mode a kimi turn started `sleep 301`; the strip listed `task bg_… · sleep 301 · 0s · stop`; clicking stop removed the line; the daemon reported `stopped from the app`; no `sleep 301` was left. 5/5.

Tiers: kernel 1,224 passed, 3 skipped; UI 220; client specs 23/23; vocabulary parity OK.
