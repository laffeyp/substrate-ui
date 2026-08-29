# Sprint 036 — desktop-view five controls (driver / bundle / workspace / tools / isolate)

```yaml
---
id: 036
status: pending
phase: 5
pass_kind: implementation
---
```

## scope

TECH-SPEC §10 table lines 12-18. The desktop view (from sprint 033)
gains five controls in the session header, each wired to the
session-API endpoint the CLI already uses:

| Control | UI location | Wire | Notes |
|---|---|---|---|
| Driver picker | Session-header dropdown | `PATCH /api/session/<id> {driver}` | Persists across parks. Same as CLI `/model`. |
| Bundle picker | New-session dialog + session-header "attach bundle" | `POST /api/session {bundle}` on create; `PATCH {bundle}` mid-session (re-assembles seed; emits `TranscriptCompacted{bundle_changed}`). |
| Workspace picker | Session-header "workspace" segment + file-picker | `POST /api/session {workspace}` on create only. `workspace_shape` badge: flat / worktree / isolate. |
| Tools restriction | Session-settings drawer, checkboxes | `PATCH /api/session/<id> {tools: [...]}`. Same as CLI `/tools`. |
| Isolate toggle | Session-settings drawer, single checkbox | `POST /api/session {isolate: true}` on create only. Grayed when `workspace_shape == "worktree"`. |

Every write path is a piece-B endpoint that already exists. This sprint
adds the DOM + `sessionRegistry.patch()` wiring.

## context_files

- Tech spec §10 table (verbatim above).
- `substrate-ui/server.py::_session_patch` (piece B) — PATCH endpoint.
- `substrate-ui/server.py::_session_create` (piece B + sprints 223a-e)
  — POST accepts driver, bundle, workspace, workspace_shape, tools,
  isolate, role.
- `substrate/src/substrate/topologies/applications/registry.py` — the
  `daily` manifest defines the shape of a session app.

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — five control mounts inside
  `#view-desktop`'s session-header + settings drawer.
- `substrate-ui/web/index.html` — DOM containers for the five
  controls (`#driver-picker`, `#bundle-picker`, `#workspace-picker`,
  `#tools-drawer`, `#isolate-toggle`).
- `substrate-ui/tests/test_ui_control_parity.py` — new. For each of
  the five controls: (a) drive it via Playwright, (b) capture the
  resulting session manifest state via `GET /api/session/<id>`, (c)
  drive the CLI counterpart against a fresh session, (d) capture the
  same manifest state, (e) assert equality. Tech spec line 20 names
  this test.
- `substrate-ui/sprints/sprint-036-desktop-five-controls.md` — this
  file.

## signal contract → Emits

Five new UI-side emit call sites, each on a matching wire event.
Names to propose in vocab v0.7 if not already in v0.6 (grep first):

- `DRIVER_PATCHED{session_id, driver, prior_driver}`.
- `BUNDLE_ATTACHED{session_id, bundle, prior_bundle}`.
- `WORKSPACE_SELECTED{session_id, workspace, workspace_shape}` (create-time only).
- `TOOLS_RESTRICTED{session_id, tools}` (list serialized in payload).
- `ISOLATE_TOGGLED{session_id, isolate}` (create-time only).

If any are absent from v0.6, land a
`vocabulary_change_required` halt with a `NEW_TAG_PROPOSED` per tag.
Existing `MODEL_SELECTED` already covers the picker's local state
change; the new tags are the WIRE emit for the PATCH round-trip.

## observation contract

- **UI driving steps**. Create a session via the `+ session` button.
  Drive each of the five controls in sequence. Assert the session's
  manifest.json on disk carries each written value.
- **Expected stderr log substrings**. `PATCH /api/session/<id>` × 3
  (driver, tools, bundle mid-session); `POST /api/session` × 1
  (initial create with workspace + isolate).
- **Expected runtime signals on the record**. `SessionStarted` at seq
  0; `TranscriptCompacted{reason:"bundle_changed"}` on mid-session
  bundle swap.
- **Expected grader signals**. The five new tags fire in order; each
  paired with its wire round-trip.
- **Expected screenshot frames**. One:
  `screenshots/36-session-header-five-controls.png`.
- **Python test**. `test_ui_control_parity.py` green: every UI
  control produces the same manifest state as its CLI counterpart.

## halt conditions

- `vocabulary_change_required` if the five new tag names are absent
  from the locked vocab.
- `dual_contract_fail` if any UI control produces a different manifest
  state than its CLI counterpart.

## definition of done

Five controls on disk + wired. `test_ui_control_parity.py` green.
Grader accepts the five new tags (or the v0.7 bump ratified).
Screenshot viewed and clean.
