# REVIEW — piece-G close-out fold

**Reviewer:** self-review, Agent 2026-08-29.
**Scope:** sprints 033 through 040c (30 cards, 27 closed).
**Method:** the five anticipated audit categories the sprint-038 card
named, plus a status sweep. Ground truth run at review open.

## Ground truth

- `npx tsc --noEmit`: **0 errors** (down from 472 at the 040a open;
  baseline ratified 2026-08-29).
- `npm run signals` chain: PASS across 17 JS fixtures + 10 pytest
  parity cases + 1 session grader.
- `check:vocab-parity`: OK — 69 tags (58 live + 11 retired).
- Pre-commit hook (`.githooks/pre-commit`) proven to block: induced
  a TS2322, `git commit` refused with "BLOCKED — tsc reported
  errors."
- `npm run build` now prefixed with `tsc --noEmit`; a tsc error
  fails the build before vite touches `dist/`.

## Audit results

### A — Sprint-id collisions substrate vs substrate-ui
**Positive.** substrate side owns ids 000-238; substrate-ui side owns
000-050. No overlap in the piece-G window. Zero cards under
`substrate/process/sprints/` at ids 033/034/035/036/037/038/040.

### B — Retired-tag emit sites
**Positive.** Zero live emit sites in `web/` / `harness/` / `tools/`
for any of the eleven v0.7.3-retired tags (TERMINAL_OPENED,
TERMINAL_CLOSED, CHAT_ENTERED, CHAT_EXITED, MODEL_SELECTED,
PARAMS_CHANGED, TURN_SUBMITTED, AGENT_LAUNCH_REQUESTED, AGENT_LAUNCHED,
AGENT_TURN_STREAMED, FINAL_ANSWER_RENDERED). The retired-tag drift
class the parity gate grew at v0.7.3 stays vacuous.

### C — Legacy dock DOM survivors
**Positive.** Grep for `#termdock` / `termOpen` / `runTerm` in
`web/` / `harness/` / `tests/` / `tools/` (excluding `dist/` and
`_deprecated/`) returns zero non-comment hits. The retirement at 037c
held.

### D — Frame-monotonic across new pane_ids
**Vacuous positive.** The card anticipated `pane_id ∈ {"terminal",
"desktop"}` on `*_RENDERED` tags. Landed shape: the terminal view
does not emit pane-render tags (its updates are line-appends, not
paints); the desktop view is composed of the seven pre-existing
panes (graph_run, topology, scene, stream, io, health, diff). No new
pane_ids emitted. `_paintFrame` in app.ts increments across every
`_paneCtx(...)` call, including `deps.paneCtx("health", ...)` in
`web/console/health.ts` (extracted 040a). Frame-monotonic invariant
survives the split unchanged.

### E — HARNESS-CATALOG.md drift
**REAL FINDING.** Catalog lists 18 harnesses; disk has 29. Missing:
- `capture_desktop_bundle_picker.js` (036b)
- `capture_desktop_driver_picker.js` (036a)
- `capture_desktop_isolate_toggle.js` (036e)
- `capture_desktop_tools_drawer.js` (036d)
- `capture_desktop_workspace_picker.js` (036c)
- `capture_rail_four_buckets.js` (034b)
- `capture_terminal_create_controls.js` (035w)
- `capture_terminal_driver_picker.js` (035t)
- `capture_terminal_interrupt.js` (035u)
- `capture_terminal_params_drawer.js` (035v)
- `capture_terminal_slash_router.js` (035s)

Plus the tail section titled "What DOES NOT exist yet (piece-G
territory)" lists four artifacts every one of which now DOES exist:
`e2e_session.js` (037a), `capture_session.js` + `capture_session_signals.js`
(037b), `test_ui_control_parity.py` (036f).

Also stale: the "Grader invariants" table names three checks that
037c retired (`checkTurnInsideChatWindow`, `checkAgentLaunchTerminate`,
`checkChatTurnCount`). The "How to write a piece-G harness" section
still references `PANE_SWITCHED` (v0.7.1 TAG_SPLIT retired that for
view flips; the live tag is `VIEW_SWITCHED`).

**Fold action:** rewrite the catalog to reflect current disk +
current grader + current vocab. Below.

### F — Card status audit
**Positive.** Every 033/034/035/036/037/040 card has an explicit
status (`closed`, `closed-<date>`, `split-into-...`, or `reverted-<date>`).
Only sprint 038 sits at `status: pending` — that's this sprint,
correct.

### G — PLAN-2026-08-28-web-app-ts-split.md status
**REAL FINDING.** The plan queues eight extraction sprints (rail,
graph, stream, inspector, transport, health, launch, diff). Landed:
rail (034b), health (040a), transport (040b). Remaining five
(graph, stream, inspector, launch, diff) were superseded by 040c's
in-place strict typing: the zero-tsc-errors motivation vanished, so
the splits stay queued as pure hygiene rather than as necessary work.
The plan doc's "Landing decision" section still says "dispatch after
sprint 038" — untrue for the three that already dispatched, and the
motivation description is out of date.

**Fold action:** add a "Status 2026-08-29" section to the plan doc
naming what landed, what got obsoleted, and where the residual splits
sit.

## Fold summary

Two real findings (E, F above). Two-line fixes: HARNESS-CATALOG.md
rewrite + PLAN doc addendum. Both land in this same close-out sprint.

Five positive results (A, B, C, D, F). One vacuous positive (D).

## Piece-G scope-closure statement

Product spec §13 View A: satisfied. Every control the feature map named
lives in the terminal view AND, where create-time appropriate, in the
new-session dialog on the desktop view. §13 View B: satisfied via the
five 036 controls + shape badge + tools drawer. §9c workspace
immutability: enforced at the terminal (create-only slashes) and at
the desktop (dialog fields + shape select + isolate mutex). §2a slash
inventory: seventeen slashes shipped, extracted per-file at 035x.

Tech spec §10: satisfied for both halves. Piece-G's mechanical
translation of the agent terminal into the daily-driver terminal is
functionally complete. The parity gate (036f) proves the daemon's
contract is deterministic per control across UI + CLI callers.

The three real bugs the perceptual capture surfaced at 037b (terminal
bleed, desktop chrome bleed, className wipes) are all fixed and now
regression-tested by the four screenshots + the four grader invariants.

## Definition-of-done

Piece G closed. Daily-driver v1 complete. Zero tsc errors baseline
locked at the pre-commit + build layers. Sprint 038 folds this
review's E + G findings and closes.
