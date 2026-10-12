# Sprint 160 — The server's errors name the value

```yaml
---
id: 160
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: "take a look through all our errors like that … it should name the stuff that's wrong")
research: substrate/process/planning/RESEARCH-2026-10-12-error-messages.md
context_files:
  - server.py
---
```

## scope

Kernel sprint 297 gave `substrate.errors.describe_error` (`TypeName: str(exc)`, then the explicit cause). `server.py` writes `TypeName: str(exc)` by hand in 12 error responses and the daemon-config warning, which keeps the path and drops the cause, and `str(exc)` alone in the worktree-diff response after a bare `except Exception`. Its other `str(exc)` responses catch `ValueError` and the kernel's typed record errors, whose messages Substrate writes with the value in them; they stay.

After: those 14 sites call `api.describe_error` (the UI reaches the kernel only through `substrate.api`; K297 exports it there).

The transcript's error row (`summariseModelError`, `web/vm/session_controller.ts`) caps unmatched errors at 200 characters, which cut the path out of the new message. After: an error ending in a quoted path keeps the path whole and shortens the text before it.

## observation contract

Electron gate `missing_workspace_named.ts`, live roster: a claude session opened in a repo-local folder, the folder deleted, one message sent; the transcript's error row names the folder in full and says it is the session's workspace (no model is called: the driver refuses before it spawns). The UI Python suite; `test_old_tilde_workspace_159`.

## result

- **Built.** 14 server sites call `api.describe_error`; `summariseModelError` keeps a trailing quoted path whole.
- **Gate** `missing_workspace_named.ts` (in `gates:electron`): before K297 the row read `FileNotFoundError(2, 'No such file or directory')`; with K297 and before this card's display change it read the new message cut at "…/harness/shake…"; after, it reads `FileNotFoundError: [Errno 2] CliResponder(claude): working folder does not exist (the session's workspace): '<the folder>'` in full.
- UI Python 246 passed, 5 skipped (the boundary test `test_ui_imports_only_sanctioned_substrate_surfaces` caught a direct `substrate.errors` import; the server now uses `api`); unit specs 37/37; `tsc` clean.
- **Rubber Duck Pass.** No controller tag moved; the gate reads the transcript's error row.
