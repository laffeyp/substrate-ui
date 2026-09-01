# Sprint 057 — refresh two stale substrate-ui test expectations

```yaml
---
id: 057
status: open
phase: 7
pass_kind: hygiene
---
```

## Product-spec conformance

**Fulfills:** the discipline "every existing test still green" that
sprint 054's Phase B claimed for the substrate-ui side. Two tests
predated sprint 054 and are stale against post-sprint-045 server
behaviour; sprint 054's audit surfaced them but explicitly left them
alone. This card closes them.

**Consumes:** no new dependencies.

## Motivation

`substrate-ui/tests/test_server_session_driver_params.py::
test_resolver_returns_distinct_responders_per_params` asserts
`getattr(responder_default, "_think", True) is False`. Sprint 045
(2026-08-31, commit 45fe436) changed the responder default to
`think=True` for the daily-driver models (kimi, glm-5.2, nemotron-3-
super all improve measurably with thinking on). The test was written
against the pre-045 default and never updated.

`substrate-ui/tests/test_server_session_patch.py::
test_patch_deferred_field_returns_400_naming_the_field` asserts
`"not PATCH-able yet" in body["error"]` for a PATCH on the `bundle`
field. The current server returns `"unknown bundle 'some-bundle': no
bundle at ~/.substrate/bundles/some-bundle"`. Somewhere between the
test's writing and now, `bundle` moved from `_NOT_YET` to `_PATCHABLE`
with existence validation; the test's expected error message stayed
in the deferred-field vocabulary.

## Scope

One edit per test.

**Fix A — `_think` default:** flip the assertion. The current shipped
default is `think=True`; assert that. Add one line naming sprint 045
so a future reader sees the derivation.

**Fix B — bundle PATCH:** the test's real intent was "trying to PATCH
a not-yet-supported field returns 400 with a message that names the
field." Two options:
- (B1) Find a field that IS still on `_NOT_YET` (grep `server.py:
  _NOT_YET`) and use it in place of `bundle`. Simplest.
- (B2) Rewrite the test to assert the current bundle-PATCH shape
  (400 for unknown bundle name, 200 for a real one). More coverage,
  slightly larger diff.

Prefer B1 (keeps the test focused on its original invariant); if
`_NOT_YET` is now empty, take B2.

## Prerequisites

- Nothing.

## Context files

- `substrate-ui/tests/test_server_session_driver_params.py:194` — the
  `_think` assertion.
- `substrate-ui/tests/test_server_session_patch.py:170-180` — the
  bundle PATCH assertion block.
- `substrate-ui/server.py:_NOT_YET` — the deferred-field set; grep to
  find a still-deferred field for Fix B option 1.
- `substrate-ui/server.py:190` (approx) — the `think=True` default
  landed at sprint 045.

## Artifact contract → Files modified

- `substrate-ui/tests/test_server_session_driver_params.py` — one line
  flipped; one comment naming sprint 045.
- `substrate-ui/tests/test_server_session_patch.py` — either the field
  name changes (Fix B1) or the assertion block is rewritten (Fix B2).

## Signal contract → Emits

None.

## Observation contract

- Both tests pass.
- Full substrate-ui pytest goes from 205 pass / 2 pre-existing fail to
  207 pass / 0 fail.

## Halt conditions

- `spec_ambiguity` if `_NOT_YET` is empty (every field is PATCH-able)
  AND the intent of the original test is now unclear. That would mean
  the deferred-field concept has retired; halt and articulate whether
  the test should be deleted rather than rewritten.

## Definition of done

Two failing substrate-ui tests turn green. Full substrate-ui suite is
clean. Sprint 054's post-audit statement ("two pre-existing failures
unrelated to sprint 054") retires.
