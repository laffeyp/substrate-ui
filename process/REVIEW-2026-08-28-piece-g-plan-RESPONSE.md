# Response to REVIEW-2026-08-28-piece-g-plan.md

**Author:** Claude, session 2026-08-28.
**Verification:** every empirical claim in the review cross-checked against
`substrate-ui/server.py` (`_session_create` and `_session_patch` bodies)
and `substrate/src/substrate/bundles.py`.

## Verdict per finding

### G1 — server surface gaps: PARTIALLY FALSE

Verification against `substrate-ui/server.py`:

- `_session_create` (lines 941-1023) accepts `driver`, `name`,
  `workspace`, `workspace_shape`, `seed`, `bundle`, `isolate`, `tools`.
  All eight fields the 036 cards need at create-time are already live.
  Sprints 223a/b/c lifted the piece-B create-time deferrals; the review
  read from a stale reference.
- `_session_patch` accepts `driver`, `name`, `tools`, `per_turn`.
  Refuses `workspace`, `workspace_shape`, `bundle`, `seed` with an
  explicit 400.

Real scope of the gap, after verification:

- **036a (driver PATCH)** — live. No prerequisite needed.
- **036b (bundle at create + PATCH mid-session)** — create-time lives;
  mid-session PATCH is the one refused field the card actually needs.
  Sprint 036b requires a substrate-side follow-on: **`sprint-215e-bundle-patch-and-list-bundles`**
  lifts bundle from `_NOT_YET` to `_PATCHABLE` in `_session_patch`,
  adds transcript re-assembly on the change, and defines
  `TranscriptCompacted{reason:"bundle_changed"}` in the session
  topology's vocabulary if not already present.
- **036c (workspace at create)** — live. Create-only per the card;
  the refused PATCH is not needed.
- **036d (tools PATCH)** — live.
- **036e (isolate at create)** — live. Create-only.

Fix: prerequisite added to sprint 036b. Cards 036a, 036c, 036d, 036e
require no server change.

### G2 — invented `pass_kind: implementation`: TRUE, narrow

The kit enum is `architecture | functional | docs | bridge | observation`.
Cards 033, 033a, 035, 038 (four pre-rewrite cards) use `implementation`.
Every card written during today's rewrite pass uses a kit value.

Fix: relabel the four pre-rewrite cards. 033 → `functional`; 033a →
`functional`; 035 → `functional`; 038 → `observation` (the fold runs
the full e2e chain).

### G3 — unacknowledged rule-6 stretch: TRUE, cosmetic

Cards 033, 035, 037b touch three code files each (view+app+grader,
terminal+app+grader, two captures+package.json). The stretch is
justified per-card ("the grader map is the observation contract's own
surface and cannot be split without a follow-on trivial sprint") but
not stated on the card body.

Fix: one-line acknowledgement on each of 033, 035, 037b under
`## scope`.

### G4 — 037a's ambiguous terminator: TRUE, correctness bug

The asserted order ends `DRIVER_SESSION_ENDED → SESSION_ENDED`. Two
terminators back-to-back. `SESSION_ENDED` is the browser tab-unload tag
per the 2026-08-25 BLACKBOARD; `/exit` ends the driver session, not
the tab. The card's flow never closes the tab.

Fix: 037a's asserted order stops at `DRIVER_SESSION_ENDED`. If the
substrate wire-side `SessionEnded` record kind is what the reviewer
had in mind, the grader kind reads it from the session record via
`GET /api/session/<id>`, not from the browser signal stream.

### G5 — 036e accessibility hazard: TRUE

`disabled` attribute (keyboard focus skips, Space/Enter inert) vs
`aria-disabled=true` + CSS gray-out (still focusable, still activatable
by keyboard) are structurally different. The card does not say which.

Fix: 036e picks `disabled` attribute + `aria-label` for the disabled
reason. Observation contract adds a keyboard-driving step.

### G6 — 037c grep scope: TRUE, one-line

The command as printed is unbounded; the intent is bounded to
`web/` and `harness/`.

Fix: `grep -r <pattern> substrate-ui/web substrate-ui/harness` plus a
separate check under `substrate-ui/tests` to catch any test that still
asserts on the dock DOM.

### G7 — 036c picker mechanism: TRUE

Browsers cannot return arbitrary host paths through a native picker.
The card says "picker + file-picker" without naming the mechanism.

Fix: 036c uses a text input with client-side path validation, matching
the CLI `--workspace` flag shape. No native picker.

### G8 — 033a cross-repo silent-drift shape: TRUE

"Not a contract change" leans on the same rule that produced the drift
033a fixes.

Fix: 033a's card body acknowledges the cross-repo change. The
substrate-side one-line convention landing gets its own sprint card
(name: `substrate/process/sprints/sprint-XXX-signals-current-symlink.md`,
number assigned by the substrate side).

### G9 — 038 wall-clock cost: NOT A DEFECT

Named; card body adds an "expected wall-clock: 5-10 minutes" note.

### G10 — `list_bundles` verification: TRUE

`grep -n 'def list_bundles' substrate/src/substrate/bundles.py` returns
no hits. Present functions: `_bundles_root`, `_shipped_bundle_dir`,
`load_bundle`, `resolve_extends`, `assemble_seed`, `assemble_seed_from_chain`,
`_validate_slot_kind`, `bind_slots`.

Fix: substrate-side sprint 215e (bundled with the 036b prerequisite
above) adds `list_bundles() -> list[Bundle]` to `bundles.py`. 034a's
context_files updated to name the function.

### G11-G14 — positives: NOTED

No action required.

## Substrate-side prerequisite

One new substrate-side sprint is required before piece G can close
clean:

- **`substrate/process/sprints/sprint-215e-bundle-patch-and-list-bundles.md`**
  — lifts bundle from `_NOT_YET` to `_PATCHABLE` in `_session_patch`;
  adds `_SESSION_REGISTRY.set_bundle(session_id, bundle)` that
  re-assembles the seed and emits `TranscriptCompacted{reason:"bundle_changed"}`
  on the record; adds `list_bundles() -> list[Bundle]` helper to
  `bundles.py`. Prerequisite for 036b and 034a.

This card lands in the substrate repo, not substrate-ui. Dispatch it
before 036b (piece G) executes.

## Card edits applied this pass

- 033 — `pass_kind: functional`; rule-6 stretch acknowledged.
- 033a — `pass_kind: functional`; cross-repo shape acknowledged.
- 034a — context_files names `list_bundles` (substrate-side prereq).
- 035 — `pass_kind: functional`; rule-6 stretch acknowledged.
- 036b — prerequisite added: substrate-side `sprint-215e`.
- 036c — picker mechanism specified: text input + client-side
  validation.
- 036e — `disabled` attribute + `aria-label`; observation contract
  gains keyboard-driving step.
- 037a — terminator disambiguated; asserted order ends at
  `DRIVER_SESSION_ENDED`.
- 037b — rule-6 stretch acknowledged.
- 037c — grep scope bounded; tests grep added.
- 038 — `pass_kind: observation`; wall-clock note.

## Dispatch order (unchanged from card set + one prerequisite)

1. Substrate-side: `sprint-215e-bundle-patch-and-list-bundles` (piece B follow-on).
2. Substrate-side: `sprint-XXX-signals-current-symlink` (per G8).
3. 032a (v0.7 vocab lock).
4. 033 + 034a in parallel.
5. 033a alongside.
6. 034b (needs 034a + 032a).
7. 035.
8. 036a → 036c → 036e in order; 036b (after 215e) + 036d in parallel.
9. 036f.
10. 037a → 037b + 037c in parallel.
11. 038.

Sixteen substrate-ui sprints + two substrate-side prerequisites.
