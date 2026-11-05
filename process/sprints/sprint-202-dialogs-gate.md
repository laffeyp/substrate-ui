---
id: 202
status: closed
phase: shell-to-react A8
pass_kind: observation
---

# Sprint 202 — a gate for the settings and end-session dialogs

## scope

No gate drives either dialog today (plan round 4, "Tests already in place"). `harness/shakeout/dialogs.ts` drives both against the app launched from source, and `gates:electron` runs it. Settings: ⌘, opens it; `+` raises the type size by 1px; Escape closes it; after a window reload ⌘, shows the raised size. End session: after one turn, `/exit` opens the dialog; `cancel esc` closes it with no `SESSION_END_REQUESTED`; `/exit` again and `end session` closes it, and `SESSION_END_REQUESTED` then `SESSION_ENDED_LOCAL` fire. The gate runs before A5b moves the settings fields, so that move has a behaviour check.

## prerequisites

- 201 closed

## context_files

- `web/reveal.html:492–534` (the dialogs), `web/reveal_component.ts:888–908` (settings load and save), `:995` (Escape), `:1229` (`/exit`), `:2507–2525`
- `web/vm/signals/versions/current.json` (`SESSION_END_REQUESTED`, `SESSION_ENDED_LOCAL`)
- `harness/shakeout/lib/electron.ts`, `harness/shakeout/one_top_bar.ts` (a gate's form)
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r4.md` (A8)

## signal contract

### Emits

- `SESSION_END_REQUESTED` (`session_id`, `reason`), then `SESSION_ENDED_LOCAL`, after `end session`; neither after `cancel esc`. Read from `window.__vmSignals`.

## artifact contract

- Created: `harness/shakeout/dialogs.ts`. Modified: `package.json` (`gates:electron` runs it).
- `npx tsc -p harness` 0; `npx tsx harness/shakeout/dialogs.ts` 0, its last line `dialogs: ok — …`.

## observation contract

### Driving steps and expected results

As in scope; each step's result is in the gate's ok line. A planted fault fails it: with `_persistSettings` made a no-op, the gate fails at the size read after reload.

## done criteria

Both dialogs' open, close and act paths are gated, including the size kept across a reload.

## result

Closed 2026-11-04. `harness/shakeout/dialogs.ts` written; `gates:electron` runs it last (46 scripts). `npx tsc -p harness` 0.

On today's tree the gate failed at the type size after `+`: the click raised the size to 14px and saved it, and closed the dialog. Cause: `swallow` is missing from `renderVals()` since `5a4d97a` (2026-10-14), so every click in a dialog's panel reaches the backdrop's close handler. Fixed in sprint 203. With it, `npx tsx harness/shakeout/dialogs.ts` exit 0: "end cancel closes, no request; end confirm: SESSION_END_REQUESTED, SESSION_ENDED_LOCAL; settings 13px → 14px, Escape closes; after reload 14px".

Planted fault: `_persistSettings` made to return before writing; the gate exits 1, "after a reload the type size reads 13px; expected 14px". Restored and rebuilt.

Two selector fixes in the gate while writing it: the window has other `+` controls, so the click is scoped to the "type size" row; dc-runtime wraps `{{ fontLabel }}` in its own `span.sc-interp`, so the label has no sibling spans.

## Rubber Duck pass

*Sequence.* `SESSION_END_REQUESTED` (session_id, reason) → the user asked to end the session. `SESSION_ENDED_LOCAL` → a SessionEnded envelope reached the controller and the snapshot shows it ended. In that order, after `end session`; neither after `cancel esc`.

*Observations.* Missing pair: none. Order: as the vocabulary states. One finding outside the six categories, a defect in the window (the click-through), resolved in 203. Tone trace: the end dialog's text names a fixture session, "End session fix-race-in-metering?", and says the session "cannot be resumed", which resume contradicts (F328; placed in B1).

*Dispositions.* Click-through: `resolved-here` (sprint 203). Fixture text: `recorded`, B1.
