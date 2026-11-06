---
id: 348
status: closed
phase: editor shared work 0(c), read side
pass_kind: functional
---

# Sprint 348 — the workspace file API: list and read

## scope

Plan `process/planning/2026-11-05-editor-shared-work/PLAN-2026-11-05-editor-shared-work.md`, item 0(c), its read side. `server.py`: `GET /api/session/<id>/files?dir=<rel>` lists a directory of the session's workspace (directories first, then files, each by name; kind `dir`, `file` or `link`, size, modified; a symlink is not followed); `GET /api/session/<id>/file?path=<rel>` reads one file's facts (size, modified, encoding `utf-8` or `binary`, line endings `lf`, `crlf` or `mixed`) and, for UTF-8 text up to 2 MiB, its text. Every path is held to the workspace: an absolute path, a NUL, and any path that resolves outside it, symlinks followed, get 400; a missing file 404; an unknown session 404. Writes wait for the kernel's edit event (0(d)), since every edit goes on the record; watching is the next sprint. Nothing in the window calls these yet.

## artifact contract

- Modified: `server.py`. Created: `tests/test_workspace_files_348.py`. `ruff check` and `ruff format --check` 0; `npm run test:py` 0.

## observation contract

The tests: the listing's order and a link not followed; text, CRLF, binary and over-the-cap reads; four escapes refused (`/etc/passwd`, `../secret.txt`, `src/../../secret.txt`, a symlink out); both routes on a served session, with 400, 404 and an unknown session. With the containment check removed, four fail.

## result

Closed 2026-11-05. 7 passed; the Python suite 264 passed, 5 skipped. Planted (no containment check): 4 failed, among them the symlink escape and the route test.

## Rubber Duck pass

No signals: server routes.
