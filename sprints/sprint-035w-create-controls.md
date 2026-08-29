# Sprint 035w — terminal-view create-time controls

```yaml
---
id: 035w
status: closed
phase: 5
pass_kind: functional
---
```

## Product-spec conformance

**Fulfills:** PRODUCT-SPEC-2026-08-17-round12.md §9c workspace modes
(flat/worktree/isolate, workspace immutable per session) + §7b bundle
attach at create + §7 tool restriction + §13 View A parity with the
agent terminal's create-time control set (bundle picker, tools list,
workspace path, isolate toggle, name). Silence in the spec is not
exclusion — the agent terminal's create-time surface must translate
mechanically into the daily-driver terminal.

**Consumes:** substrate-ui sprint 034a (`GET /api/bundles` for the
bundle catalog); daemon `POST /api/session` create-time fields
(driver, name, workspace, workspace_shape, bundle, tools, isolate);
v0.7 tags BUNDLE_ATTACHED, WORKSPACE_SELECTED, TOOLS_RESTRICTED,
ISOLATE_TOGGLED (all present in v0.7.2 lock).

**Enables:** sprint 037c legacy-dock retirement precondition — the
five create-time knobs the dock exposes now have a terminal-view
home.

## Scope

Five slashes on the terminal, all create-time only per §9c
"workspace immutable per session":

- `/bundle <name>` — queues bundle when no session; mid-session
  attaches (PATCH `bundle`) and emits `BUNDLE_ATTACHED`.
- `/tools <a,b,c>` — queues tool list; mid-session PATCHes and
  emits `TOOLS_RESTRICTED`.
- `/workspace <path>` — queue-only. Mid-session prints
  `"workspace is create-only"`.
- `/isolate on|off` — queue-only. Sets `workspace_shape=isolate` on
  create. Mid-session prints `"isolate is create-only"`.
- `/name <name>` — queue-only. Sets manifest.name on create.

Queued fields ride the next `POST /api/session` body. On ACK, four
v0.7 tags fire per queued field: BUNDLE_ATTACHED{bundle,prior_bundle:null},
WORKSPACE_SELECTED{workspace,workspace_shape}, TOOLS_RESTRICTED{tools},
ISOLATE_TOGGLED{isolate:true}. Server-side, `_session_create`
response body grew `workspace` + `bundle` so the terminal can adopt
the daemon's echo rather than the local pending copy.

New endpoint `GET /api/session/<id>` returns the manifest slice
(session_id, name, driver, workspace, workspace_shape, bundle,
record, created_at, status, role, driver_params). Used by the
harness to verify manifest.name registration; used by future
header-reads.

Rule 6: one file, one concept ("create-time control queue +
session-open plumbing"). `terminal.ts` grows ~110 lines.

## Artifact contract → Files created/modified

- `web/terminal.ts` — TerminalHandle extended with `pendingCreate:
  {bundle?, tools?, workspace?, workspace_shape?, isolate?, name?}`;
  `_openSession` threads pending fields into POST body + fires four
  emit branches on ACK; `_slashRoute` gains `/workspace`, `/isolate`,
  `/name` cases + queue-before-session behavior extended to `/bundle`
  and `/tools`; `_HELP_TEXT` lists the four new slashes.
- `server.py` — `_session_create` response body gains `workspace` +
  `bundle`; new `_session_get` handler + `do_GET` dispatch for
  `GET /api/session/<id>`.
- `harness/capture_terminal_create_controls.js` — new; 15
  assertions.
- `package.json` — `capture:terminal-create-controls` wired into
  `npm run signals`.

## Signal contract → Emits

- `BUNDLE_ATTACHED{session_id, bundle, prior_bundle:null}` (v0.7.2)
  on create-time ACK when `/bundle` was queued.
- `WORKSPACE_SELECTED{session_id, workspace, workspace_shape}` on
  ACK when workspace was queued (via `/workspace` or `/isolate`).
- `TOOLS_RESTRICTED{session_id, tools:[...]}` on ACK when `/tools`
  was queued.
- `ISOLATE_TOGGLED{session_id, isolate:true}` on ACK when
  `/isolate on` was queued.

Queued slashes before session-open fire nothing; the emit is on the
daemon acknowledgment, not on the user's slash.

## Observation contract

- 15/15 assertions PASS.
- Five queue-slashes all print `"<key> → <value> (queued for next
  session)"`.
- Zero v0.7 session-control emits pre-open (fired only on ACK).
- Session opens with all five queued fields threaded.
- Four tags fire on ACK with correct payloads.
- `GET /api/session/<sid>` returns `name` matching the queued
  `/name`.
- `/workspace` mid-session prints `"workspace is create-only"`.
- `/exit` closes cleanly.
- Full signals chain (nine fixtures) PASS.

## Halt conditions

- `dual_contract_fail` if a queued field silently drops on
  session-open, or a tag fires without the corresponding field being
  queued.
- `vocabulary_change_required` if any of the four tags absent from
  the lock (all present in v0.7.2).

## Definition of done

Five create-time slashes live. Four v0.7 tags fire on ACK.
`GET /api/session/<id>` live. 15/15 assertions PASS. Full signals
chain PASS across nine fixtures. Cleared: sprint 037c dock-retirement
precondition (create-time knobs have terminal-view home).
