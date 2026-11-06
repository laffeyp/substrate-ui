---
id: 349
status: closed
phase: editor shared work 0(c), watch
pass_kind: functional
---

# Sprint 349 — watching a session's workspace

## scope

Plan item 0(c), its watch. `server.py`: `GET /api/session/<id>/files/watch` streams Server-Sent Events: `event: ready` with the file count and whether the walk was cut at `WATCH_MAX_FILES` (20,000, a setting), then, every `WATCH_POLL_S` (0.5 s, a setting) that found any, one event `{"changes": [{path, change}]}`, change `created`, `modified` (time or size) or `deleted`; a comment every 15 s keeps the stream open. The snapshot follows no link (a link counts as a file) and leaves `.git` folders out. The workspace lookup is one helper, `_session_workspace_root`, shared with the list and read routes. Nothing in the window calls it yet.

## artifact contract

- Modified: `server.py`. Created: `tests/test_workspace_watch_349.py`. `ruff check` and `ruff format --check` 0; `npm run test:py` 0.

## observation contract

The tests: a snapshot's files, links and `.git` left out, its cap; the changes between two snapshots; the route's `ready` event and a created file's event on a served session; an unknown session's 404. With modified files dropped from the changes, the first fails.

## result

Closed 2026-11-05. 2 new tests pass; Python 266 passed, 5 skipped. The first run found two facts the code then took in: `os.walk` lists a link to a folder among the folders, so the snapshot missed links; and a session's workspace is a git repository (26 files under `.git` at its first turn), so the watch leaves `.git` out (BLACKBOARD, agent-resolved). Planted (no `modified`): 1 failed.

## Rubber Duck pass

No signals: a server route.
