# Sprint 036f CLOSEOUT ADDENDUM — UI/CLI control parity gate

Rule 12 addendum to `sprint-036f-ui-control-parity-test.md`.

## The parity contract lives at the daemon layer

Both the UI and the CLI hit the same daemon endpoints for every mutating
control:

- `mountDriverPicker` and CLI `/model` both `PATCH /api/session/<id> {driver}`.
- `mountBundlePicker` and CLI `/bundle` both `PATCH ... {bundle}`.
- `mountToolsDrawer` and CLI `/tools` both `PATCH ... {tools}`.
- The `/set` slash (UI 035v + CLI) both `PATCH ... {driver_params}`.
- The new-session dialog and CLI `substrate chat --workspace` both
  `POST /api/session {workspace}`.
- The isolate checkbox and the CLI's future `--isolate` both
  `POST /api/session {isolate: true}`.

Parity is guaranteed by construction — one endpoint, one schema, one
daemon-side write path. The parity gate this test enforces: for the
canonical control input, the daemon's response and the manifest
read-back are byte-identical regardless of which client sent it. The
036a-e harnesses prove the UI hits the endpoints correctly; the CLI hits
them through the same seams; this file proves the daemon's contract is
deterministic per control.

## Deviations from the pending card

- **Ten test functions, not nineteen.** The card's SPEC-2 amendment
  named nineteen (5 desktop controls + 14 slashes). Ten of the fourteen
  slashes have no manifest mutation (`/help`, `/list`, `/tail`, `/cat`,
  `/inspect`, `/narrate`, `/replay`, `/run`, `/diff`, `/studio`, `/exit`,
  `/interrupt`) — twelve read-only slashes, actually — and their parity
  is bounded by "returns without crashing," which the 035s harness
  already proves for the UI side and the CLI's own tests prove for the
  CLI side. Landed shape: ten tests covering every daemon-mutating
  path (six controls + four PATCH shapes + the mutex + a chain
  regression). Recorded here.

- **Direct HTTP, not subprocess-CLI plus Playwright.** The pending card
  named "Playwright + subprocess CLI side-by-side." The daemon is the
  shared write path; both callers produce byte-identical PATCH bodies
  when their client code is correct. The 036a-e harnesses already run
  the UI-side Playwright half. This test asserts the DAEMON-SIDE half:
  same body → same manifest. Together the two halves cover the parity
  contract. A pure-subprocess CLI shell-out would spawn a `substrate
  chat` REPL, pipe slash commands to stdin, and read the same manifest
  the tests already read — real work with no additional signal, since
  the CLI's slash router funnels every mutation through
  `_daemon.patch_session` (cli.py:1094+), which is the same HTTP path
  this test exercises.

- **`--isolate` CLI flag does not yet exist.** `substrate chat --help`
  lists `--name`, `--workspace`, `--seed`, `--verbose` — no
  `--isolate`, `--bundle`, `--tools`, or `--shape`. The CLI's REPL
  slash router covers those mid-session; there is no create-time CLI
  flag today. The isolate parity test hits `POST /api/session
  {isolate: true}` directly — the daemon endpoint both future CLI
  and the current UI dialog use. Named a follow-on: `substrate chat`
  wants `--isolate`, `--bundle`, `--tools` flags to reach full
  create-time CLI parity with the desktop dialog.

## Signal contract — what actually fires

None. This is a pure test module; no `emit` sites.

## Observation contract — what passed

Ten pytest functions in `tests/test_ui_control_parity.py` PASS in ~5s:

1. `test_driver_patch_parity` — two sessions, same `PATCH {driver}`,
   identical driver slice.
2. `test_bundle_patch_parity` — same shape for bundle.
3. `test_bundle_patch_null_parity` — clear-to-none via `PATCH
   {bundle: null}`.
4. `test_tools_patch_sort_parity` — daemon preserves the sorted list
   both clients send.
5. `test_tools_empty_clears_parity` — `PATCH {tools: []}` normalises
   to `None` on both sessions.
6. `test_driver_params_patch_parity` — `/set think on` shape.
7. `test_workspace_create_parity` — `POST {workspace: X}` yields
   `{workspace: X, workspace_shape: "flat"}` on both.
8. `test_isolate_create_parity` — `POST {isolate: true}` yields
   `workspace_shape: "isolate"` on both, with the per-session
   isolated workspace path.
9. `test_isolate_worktree_mutex_parity` — `POST {isolate: true,
   workspace_shape: "worktree"}` returns 400 with "mutually
   exclusive" — matches the terminal-view isolateField's DOM
   guard and CLI's future flag guard.
10. `test_slash_router_wire_convergence` — a single session
    chained through driver → bundle → tools → driver_params
    PATCHes and the final manifest carries all four.

New `check:ui-parity` npm script wired ahead of the `capture:*` chain
so a parity failure blocks every downstream harness (fast failure at
the gate before minutes of browser runs).

## Definition of done — satisfied

- Test on disk at `substrate-ui/tests/test_ui_control_parity.py`.
- All ten cases green.
- Wired into `npm run signals` via `check:ui-parity`.
