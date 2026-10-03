---
id: 103
status: closed
class: H (agent work modelled as a short request). Prior work: Claude Code's Bash tool (code.claude.com/docs/en/tools-reference, "Background commands"). Practice: POSIX process groups; Twelve-Factor XI; Nygard, steady state.
research: process/planning/RESEARCH-2026-10-02-background-commands.md
roadmap: process/planning/ROADMAP-2026-10-02-background-commands.md
---

# Sprint 103 — supervised background commands

## scope

`bash` gains Claude Code's background behaviour, and the daemon supervises what it starts.

- **Output to files, not pipes.** Every command writes stdout and stderr to files. The foreground path tails them, and still posts each stdout line as ToolProgress. Returns when the shell exits.
- **`bash(cmd, timeout_s?, run_in_background?)`.**
  - `run_in_background: true` returns `{task_id, output_file, pid}` at once.
  - A foreground command still running at its deadline moves to the background (unless it starts with `sleep`), returning `{moved_to_background: true, task_id, stdout, stderr}`.
  - A foreground command whose shell exits while children it started are still alive registers them as a task: `{background_task_id}` in the result.
- **Task table** (`substrate/topologies/tool_loop/background.py`).
  - Keyed by owner: a session id, or a delegated child's workspace.
  - Each entry holds command, pid, pgid, output file, start time, and end time with exit code.
  - Status is read from the process each time it is asked.
- **Tools.**
  - `bash_output(task_id, offset?)` → `{status, exit, output, next_offset}`.
  - `bash_stop(task_id)` → `{stopped, status}`.
  - `bash_tasks()` → the owner's tasks.
- **Stop rules.**
  - A delegated child's tasks stop when the child's run ends.
  - A session's tasks stop when the session ends or is deleted.
  - All tasks stop on daemon shutdown.
  - Stopping SIGKILLs the process group, then any descendant found by walking the process tree.
- **Limits.**
  - No time limit on a background task (an attended, local session).
  - Output over 5 GB kills the task, with a note in its output file.

## invariants (each with a test that fails on the pre-103 code)

1. `bash(cmd, run_in_background=true)` returns within 2 s for a command that runs 30 s, and `bash_output` later shows its output and `exited 0`.
2. A foreground `sleep 5; echo done` with `timeout_s=1` is killed (the `sleep` exemption). A foreground `python3 -c "import time; time.sleep(5); print('done')"` with `timeout_s=1` moves to the background, and `bash_output` reads `done` after it finishes.
3. `bash_stop` kills the task's process group and a descendant that called `setsid` itself.
4. `node server.js &`-style leftovers: `sleep 30 & echo hi` returns `hi` at once; its `background_task_id` names a running task; stopping the owner kills the `sleep`.
5. A delegated child's background task stops when the child's run returns.
6. Ending a session (`SessionEndRequested`), deleting it, and daemon shutdown each stop that session's tasks.
7. A task whose output passes the cap (set small in the test) is killed, and its output file says why.
8. `bash_output` on a finished or stopped task reports that state, never "running".

## observation contract

- Kernel and UI pytest.
- A realmodel test: a model starts `python3 -m http.server` in the background, reads its log with `bash_output`, fetches a page, and stops it. The port is free afterwards.
- `release.sh` against the packaged bundle.

## result (2026-10-02)

- `substrate/topologies/tool_loop/background.py`: `TaskTable` (owner-scoped, status polled from the process, 5 GB output cap enforced by a monitor thread, stop = process group + tree walk). `tools.py`: `bash` on files with `run_in_background` and move-to-background; `bash_output`, `bash_stop`, `bash_tasks`; `full_suite(root, owner=…)`.
- The bash schema now carries `timeout_s` and `run_in_background`. It had only `cmd`, so since sprint 101 a native tool call could not pass `timeout_s` at all.
- Stops are wired in four places:
  - delegate (`finally` around the child run);
  - `SessionRegistry.turn_sync`, when a turn ends the session;
  - `SessionRegistry.delete`;
  - the daemon's shutdown sweep (`background_stopped` in its result).
- A session allow-list naming `bash` brings the three task tools.
- Found by the existing ToolProgress test and fixed: the file tailer first sent the file position as each chunk's `offset` instead of where the chunk starts.

Tests:
- kernel `test_background_commands_103` (9: invariants 1–8 plus owner isolation);
- UI `test_background_tasks_daemon_103` (2);
- realmodel `test_realmodel_background_bash_103` on `kimi-k2.7-code:cloud`, 3 of 3. The model started `python3 -m http.server` in the background, read it, fetched `hello.txt` through it, stopped it, and the port was free. On `qwen2.5:7b-instruct` the tools all worked but the model skipped the stop step, so the test uses the app's default driver.

Tiers: kernel 1,221 passed, 3 skipped; UI 218; client specs 21/21; realmodel 42/42.

Committed: kernel `e7d32b33`; substrate-ui in the commit carrying this card.
