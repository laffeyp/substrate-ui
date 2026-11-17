# Sprint 514 — File API responses must not be cached

```yaml
---
id: 514
status: closed
phase: editor features (roadmap 2026-11-14 r5, follow-up to sprint 507)
pass_kind: functional
---
```

## scope

The editor's file tree lists folders through `GET /api/session/<id>/files?dir=<rel>`. After a workspace reorganization, folders remain visible but their files can disappear because the browser serves a stale cached JSON listing. `server.py`'s `_send` sets `Cache-Control` only for HTML and JavaScript; `application/json` responses carry no cache directive. This sprint adds `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` to every JSON response, and adds a test that verifies the file API routes send it.

## prerequisites

- Sprint 507 (the editor features' close) is active; this gap was found while checking the editor.

## context_files

- `sdd-kit-3/AGENTS.md`
- `substrate-ui/WORKING_AGREEMENT.md`
- `substrate-ui/BLACKBOARD.md` (decision entries and tail)
- `substrate-ui/server.py`
- `substrate-ui/tests/test_workspace_files_348.py`
- `substrate-ui/tests/_serving.py`
- `substrate-ui/web/app/editor/FileTree.tsx`
- `substrate-ui/process/sprints/sprint-507-editor-features-close.md`

## signal contract

### Emits

- No new tags.

### Consumes

- `Signal.FILES_LISTED` and `Signal.FILE_READ` already fire from `_session_files`; they continue to fire.

### Invariants

- No out-of-vocabulary tags are emitted.
- The static-file cache header for HTML/JS is preserved.

## artifact contract

### Files created

- None.

### Files modified

- `substrate-ui/server.py`
- `substrate-ui/tests/test_workspace_files_348.py`

### Content assertions

- `_send` in `server.py` sends `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` for every response, not only HTML and JavaScript.
- `test_workspace_files_348.py` has a test that opens a session, calls `GET /api/session/<id>/files?dir=`, and asserts the response headers contain `no-store`.

### Command exit codes

- `npm run test:py` returns 0.
- `uv run --project ../substrate ruff check substrate-ui/server.py substrate-ui/tests/test_workspace_files_348.py` returns 0.

## observation contract

- Not required: the fix is a server response header, verified by a Python test.

## done criteria

Every JSON response from `server.py` tells the browser not to cache it, and a test proves the file API does so.

## notes

The symptom surfaced while using the editor on a project whose files and folders were reorganized: Finder showed the new structure, but the editor showed folders with no files. The tree re-reads on watch events, but a cached `files?dir=` response would return the old (possibly empty) listing.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] `context_files` covers the files to modify and the kit.
- [x] Signal contract's `Emits` list references only existing tags.
- [x] Artifact contract is gradable.
- [x] Observation contract not required for a header fix.
- [x] Sprint sweet spot honored: one server function changed, one test added, one concept.
