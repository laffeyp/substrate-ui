# Sprint 036c — workspace picker

```yaml
---
id: 036c
status: pending
phase: 5
pass_kind: functional
---
```

## scope

One control: workspace picker + file-picker + `workspace_shape` badge.
Create-time only (workspace is immutable per session). Badge shows
`flat | worktree | isolate` from the manifest.

Two files. One concept.

## prerequisites

- 032a (v0.7 lock — `WORKSPACE_SELECTED`).
- 033 (two-view scaffold).

## context_files

- `substrate-ui/web/app.ts` — new-session dialog.
- `substrate-ui/server.py::_session_create` — POST accepts `workspace`
  + `workspace_shape`.
- Tech-spec §10 line 14.

## artifact contract → Files created/modified

- `substrate-ui/web/index.html` — `#workspace-picker` in new-session
  dialog; `#workspace-shape-badge` in session-header.
- `substrate-ui/web/app.ts` — mount + wire; badge reads
  `session.workspace_shape` from `GET /api/session/<id>`.

## signal contract → Emits

- `WORKSPACE_SELECTED{session_id, workspace, workspace_shape}` — once
  per create.

## observation contract

- **UI driving steps**. Open new-session dialog; pick a workspace
  path; submit; assert badge shows the correct shape; assert manifest
  carries `workspace` + `workspace_shape`.
- **Expected stderr log substrings**. `POST /api/session` once.
- **Expected grader signals**. `WORKSPACE_SELECTED` once.
- **Expected screenshot frames**. `screenshots/36c-workspace-picker.png`.
- Parity: CLI `--workspace` flag produces the same manifest state.

## halt conditions

- `vocabulary_change_required` if `WORKSPACE_SELECTED` missing.
- `dual_contract_fail` on parity divergence.

## definition of done

Picker + badge wired; POST lands; manifest carries both fields;
parity green.
