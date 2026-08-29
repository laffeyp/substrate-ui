# Sprint 036e — isolate toggle

```yaml
---
id: 036e
status: pending
phase: 5
pass_kind: functional
---
```

## scope

One control: isolate toggle in the session-settings drawer.
Create-time only. Grayed and non-interactive when
`workspace_shape == "worktree"` (worktrees already provide isolation).

Two files. One concept.

## prerequisites

- 032a (v0.7 lock — `ISOLATE_TOGGLED`).
- 033 (two-view scaffold).
- 036c (workspace picker — the grayed-when-worktree state depends on
  the badge value the picker sets).

## context_files

- `substrate-ui/web/app.ts` — session-settings drawer.
- `substrate-ui/server.py::_session_create` — POST accepts `isolate`.
- Tech-spec §10 line 18.

## artifact contract → Files created/modified

- `substrate-ui/web/index.html` — `#isolate-toggle` inside the
  session-settings panel.
- `substrate-ui/web/app.ts` — mount + wire + emit + gray-out logic.

## signal contract → Emits

- `ISOLATE_TOGGLED{session_id, isolate}` — once per create when the
  toggle is user-set (skipped when default-off and untouched).

## observation contract

- **UI driving steps**. New-session dialog: pick a flat workspace;
  toggle isolate on; submit; assert manifest carries `isolate: true`.
  Second run: pick a worktree workspace; assert toggle is grayed and
  clicks are no-ops.
- **Expected stderr log substrings**. `POST /api/session` once per
  submitted create.
- **Expected grader signals**. `ISOLATE_TOGGLED` once (the worktree
  run submits without firing).
- **Expected screenshot frames**. `screenshots/36e-isolate-toggle.png`
  (both states in one frame or two).
- Parity: CLI `--isolate` flag produces the same manifest state.

## halt conditions

- `vocabulary_change_required` if `ISOLATE_TOGGLED` missing.
- `dual_contract_fail` on parity divergence or if the gray-out state
  allows a click through.

## definition of done

Toggle wired; POST lands with correct payload; gray-out honored;
parity green.
