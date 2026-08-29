# Sprint 037a CLOSEOUT ADDENDUM — e2e_session harness

Rule 12 addendum to `sprint-037a-e2e-session-harness-and-grader-kind.md`.

## What the E2E composes

`harness/e2e_session.js` runs one narrative that no per-feature harness
covered end-to-end: page load → view flip → turn 1 → mid-session driver
PATCH via the desktop picker → driver reverted → turn 2 on the reverted
driver → `/exit` → substrate-side manifest + record verification.

Twenty assertions cover the composition:
- `SESSION_INIT` fires on page load.
- `VIEW_SWITCHED{to_view:"terminal"}` on the first flip.
- `DRIVER_SESSION_STARTED` lifted from the SessionStarted SSE branch
  (substrate 240 wired the instrument); the tag carries the daemon-side
  fields (driver_context_tokens, bundle_slug, parent_session_id).
- Turn 1 `USER_MESSAGE_INJECTED` + `PARK_LANDED` share `session_id`.
- Mid-session flip to desktop; the driver picker rebinds via
  `substrate:session-changed{detail.session_id}` — the picker names the
  sid, not any older parked session on disk.
- `DRIVER_PATCHED` fires; manifest `driver` field updates on disk.
- Driver reverted (skeptic: avoids Ollama dependency in turn 2).
- Turn 2 preserves the sid; `USER_MESSAGE_INJECTED.turn_index === 1`.
- `/exit` fires `DRIVER_SESSION_ENDED{reason:"user_end"}`. Substrate
  wire-side `SessionEnded{reason:"user_end", total_turns:2}` is on the
  record.
- Negative: `SESSION_ENDED` (browser tab-unload) does NOT fire — `/exit`
  is not a beforeunload trigger. REVIEW-2026-08-28 G4's disambiguation
  held.
- Bookend invariant: exactly one DRIVER_SESSION_STARTED and one
  DRIVER_SESSION_ENDED for this session_id.

## Deviations from the pending card

- **Card said `PANE_SWITCHED × 2+`; live tag is `VIEW_SWITCHED`.**
  The `TAG_SPLIT` at v0.7.1 retired `PANE_SWITCHED` for view flips
  and introduced `VIEW_SWITCHED`. Card language was stale from before
  the split. Harness asserts on `VIEW_SWITCHED`.

- **Card said record carries `SessionEnded{reason:"user_exit"}`;
  substrate emits `reason:"user_end"`.** The harness's first pass
  landed the mismatch. Root cause: `terminal.ts::_slashRoute` was
  passing `source:"user_exit"` in the POST body, and `DRIVER_SESSION_ENDED.reason`
  echoed that string, while the substrate wire canonicalizes to
  `"user_end"`. Two reason strings for one event — SUB-1-shape
  two-vocabulary redundancy discovered by the E2E's cross-vocabulary
  assertion. **Fix landed in the same sprint:** `terminal.ts` now
  passes `"user_end"` (the substrate canonical from
  `_daemon.end_session`'s default). `DRIVER_SESSION_ENDED.reason` now
  reads `"user_end"` end-to-end. Record's SessionEnded reads
  `"user_end"`. No redundancy.

- **037a's fixture write scope.** The pending card's observation contract
  said "the fixture is written by 037b." 037a's e2e run does NOT write
  a jsonl fixture — the browser trace's assertions cover the invariant
  set inline. 037b will spawn the fixture writer and cross-check via
  `checkDriverSessionBookends` grader (which already exists from sprint
  035; card acknowledged this).

- **Grader kind ALREADY EXISTS.** `tools/capture-grade.ts::EXPECTED_ORDER_SESSION`
  + `checkDriverSessionBookends` + `if (kind === "session")` dispatch
  all landed in sprint 035. This card had no grader-side edits to make.
  The grader kind wiring is verified by the pre-existing
  `grade:terminal-session` npm script; 037a adds `e2e:session` alongside.

## SDD discipline realized in one commit

The E2E harness IS the vocabulary consistency test. Its skeptic checks
(SessionEnded reason cross-check; bookend invariant on the live trace;
negative assertion that `/exit` does not fire tab-unload) surfaced a
real vocabulary drift the per-feature tests missed. That drift landed
under the same commit as the harness. `dellm` skill's "the E2E's
strongest signal is the check that fails" — held.

## Observation contract — what passed

- `npm run e2e:session` exit 0 (20/20 assertions).
- Full `npm run signals` chain PASS across SIXTEEN JS fixtures + 10
  pytest parity cases.
- No jsonl fixture written this sprint (deferred to 037b).

## Definition of done — satisfied

- Harness on disk at `harness/e2e_session.js`.
- Grader kind already wired (035; no edit here).
- `npm run e2e:session` exit 0.
- SUB-1-shape vocabulary redundancy retired in the same commit.
