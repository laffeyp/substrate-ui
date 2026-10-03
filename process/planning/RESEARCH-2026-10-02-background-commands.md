# Research — background commands for the bash tool

2026-10-02. For Sprint 103 onward. Sources are quoted where the design leans on them.

## The gap

Sprint 101 gave `bash` a per-call deadline (120 s default, 600 s maximum) and a process-group kill. What it cannot do:

- run work longer than 10 minutes;
- keep a server running under supervision;
- read a running process's output later;
- stop a process by name;
- clean up what a session started.

Turn 28's server on :3001 outlived its turn until it was killed by hand.

## Prior work: Claude Code (primary source)

Anthropic, Claude Code tools reference, "Bash tool behavior" (code.claude.com/docs/en/tools-reference), and "Interactive mode", "Background Bash commands" (code.claude.com/docs/en/interactive-mode), read 2026-10-02.

| Behaviour | What the docs say |
|---|---|
| Starting | "Claude can set `run_in_background: true` to start the command as a background task and continue working while it runs." The command "immediately returns a background task ID". |
| Output | "Claude Code streams a command's output to a working file as the command runs; a command whose output passes 5 GB is killed." Output is read from the task's output file. `TaskOutput` is "deprecated in favor of `Read` on the task's output file path". |
| Stopping and listing | `TaskStop` "stops a running background task by ID"; `/tasks` lists running shells. |
| Time limit, local | "A local session you work in from a terminal, the desktop app, or the VS Code extension has no time limit on background commands." Only unattended runs (`-p`, SDK, CI, cloud) get one: 30 minutes default, 2 hours maximum. |
| Foreground timeout | "When a foreground command reaches its timeout without finishing, Claude Code moves it to the background instead of stopping it, unless the command starts with `sleep`." |
| Lifetime | "A command that a foreground subagent started stops when that subagent's run ends, whether it finished, failed, or was interrupted. A command that the main conversation … started keeps running after a final response, until it exits, is stopped, or reaches its time limit." |
| Cleanup | "Background tasks are automatically cleaned up when Claude Code exits. On macOS and Linux, when you stop a background task … processes that detached from the task's shell, such as ones started under `setsid` or `timeout`, stop too." |

Claude Code's issue reports show how this goes wrong. Reports #12302, #13091 and #14049, read through the third-party mirror claudeissues.com, describe background tasks that kept showing "running" after they had finished or been killed: a state with no exit, class H. The status of a task has to come from the process, checked when asked, not from a flag set at start.

## Practice

- **Process groups (POSIX `setsid`, `killpg`).** One signal reaches the shell and every child it started, including `&` children. A process that calls `setsid` itself leaves the group; a supervisor that must stop it walks the process tree by parent pid. systemd's `KillMode=control-group` is the Linux form of the same rule: stop every process the unit started. macOS has no cgroups, so group plus tree walk is the available tool.
- **Twelve-Factor XI, logs as event streams.** A process writes to its output stream and the environment routes it. Here that means a file per task the model reads by offset, never a pipe that a dead reader can stall. Sprint 101's hang was a pipe held by a background child.
- **Bounded logs (Nygard, *Release It!*, "steady state").** A process that writes without limit fills the disk. Claude Code's 5 GB kill is the same rule.

## Design consequences for Substrate

1. Every bash command writes stdout and stderr to files, not pipes. A foreground call tails the files and returns when the shell exits. No reader can be blocked by a child holding a pipe.
2. `bash(cmd, timeout_s?, run_in_background?)`. With `run_in_background`, it returns `{task_id, output_file}` at once. A foreground command at its deadline moves to the background unless it starts with `sleep`, and returns `moved_to_background: true` with the output so far.
3. A per-process table of tasks keyed by owner: the session id, or a delegated child's workspace. Each entry holds the command, pid, process group, output file, start time and status. Status comes from polling the process, never from a stored flag.
4. Tools `bash_output(task_id, offset?)`, `bash_stop(task_id)` and `bash_tasks()`.
5. Stop rules:
   - a delegated child's tasks stop when the child's run ends;
   - a session's tasks stop when the session is ended or deleted;
   - every task stops when the daemon shuts down;
   - stopping kills the process group, then any descendant found by walking the tree.
6. No time limit on a background task in the app; it is a local, attended session. Output over 5 GB is killed with a note.
7. A foreground command that exits but leaves live children in its process group registers them as a task, so they are visible and cleaned up like any other. That closes turn 28's orphan.
