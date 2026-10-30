# Roadmap — background commands

2026-10-02. Research: `RESEARCH-2026-10-02-background-commands.md`. Reference behaviour: Claude Code's Bash tool.

| Sprint | Delivers | Done when |
|---|---|---|
| **103 — supervised background commands (kernel + daemon)** | Bash output to files instead of pipes. `run_in_background`, and a foreground timeout that moves the command to the background. Leftover children registered as tasks. The task table, with `bash_output`, `bash_stop` and `bash_tasks`. Stop rules: a delegated child ends; a session ends or is deleted; the daemon shuts down. The 5 GB output kill. | A model can start a server, read its log across turns, and stop it. A 15-minute command runs. Nothing a session started outlives the session. Each is proven by a test that fails on today's code. |
| **104 — the model hears when a task ends** | When a background task exits during a turn, the next model step sees a note ("task bg3 exited 0"). When it exits while the session is parked, the note is waiting at the start of the next turn. Claude Code wakes the agent on exit; this is the Substrate shape of that. | The note reaches the model in both cases; a realmodel test reads it. |
| **105 — tasks in the app** | The status strip shows running tasks for the pane. A list shows each task's command, runtime and status, and lets you stop it (Claude Code's `/tasks`). | The Electron gate starts a background task, sees it listed, stops it from the UI, and sees it gone. |

Order: 103 is the foundation; 104 and 105 both read its task table and can follow in either order.
