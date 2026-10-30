# Phase 4 — closed for unblocked items · 2026-09-14

Snapshot against `PLAN-2026-09-12-presentation-model-extract.md`
and `PLAN-2026-09-14-split-pane-multi-session.md`.
Branch `presentation-model-extract`; thirty-seven commits past the
first plan; the reveal shell serves at `/`, classic at `/classic`.

## What closed today

- **Down-graph theory ratified** (`LANE-THEORY -2026-09-14-.md`).
  Three lifelines: model / delegate / external. Every envelope maps
  to a message or moment via a total table. Color encodes participant
  relevance (bright = participant, gray = plumbing). The `app` filter
  reads the color rule. Commit `b0d602d`.
- **Tool-loop shape applied to every activity.** Every non-model
  producer draws its enter arrow (`TriggerFired`), activation span
  (`ProducerStarted → ProducerCompleted`), and return arrow
  (`ProducerCompleted → model`), matching `ToolCall → ToolResult`.
  Park is a wait-span, not a persistent producer bar. Commit `4d6b403`.
- **Bundle picker wired** (`/api/bundles` → 5 real bundles).
  Controller grew `loadBundleRoster` + `pickBundle`; Snapshot grew
  `bundleRoster`. Pane header chip lands next to driver/workspace.
  Commit `ed5d10c`.
- **Split-pane multi-session.** `PaneRegistry` holds one
  `SessionController` per pane. Focused-pane back-compat proxy keeps
  every existing `window.__vm.<action>` caller working. Each pane
  shows its own live transcript. Two-pane pixel green: pane 1 with
  its 40-envelope session, pane 2 with its 3-row session, no bleed.
  Commits `5b55f59`, `961aaa2`, `5997102`.

## Phase 4 status

| Item from prior plan | Status | Notes |
|---|---|---|
| 4a–4t · every named binding | ✅ | Landed by 2026-09-13. |
| Scene lens | ✅ | Detection + template were already wired at 4z; STATUS-09-13 was stale on this. |
| Slash router UI | ✅ | `CMDS` list + `routerRows` + template were already wired at 4z; STATUS-09-13 was stale on this. |
| Bundle picker | ✅ | Closed 2026-09-14 (commit `ed5d10c`). |
| Split-pane multi-session | ✅ | Closed 2026-09-14 (commit `5997102`). |
| Studio surface | ⏸ blocked | Needs server-side validate/build endpoint. |
| Studio "build & launch" | ⏸ blocked | Needs server-side topology endpoints. |

## Phase 5

`process/planning/PROPOSAL-2026-09-13-controller-vocabulary.md`
still names the 13-tag surface (now 15 with `BUNDLE_ROSTER_LOADED`
+ `BUNDLE_PICKED`). Every declared tag fires at one call site.
Parity harness green: two shells emit the same tag set on the same
scripted turn. `signals/versions/0.8.json` remains the Architect's
ratification step.

## Phase 2b

Classic shell rewire onto the controller — optional and unstarted.
The classic shell keeps its own state today and works fine; it now
also loads the bundle roster so parity holds.

## Test-plan status

- `npm run smoke:vm` — 11/11 pass.
- `npm run parity` — reveal and classic emit the same 14 tags on the
  same scripted turn; SESSION_OPEN pair, TURN pair, STREAM pair all
  ordered correctly per shell.
- `npm run see` — pixel captures for down-graph (`all` + `app`),
  bundle picker menu, and two-pane multi-session all green.

## Open items the artifacts still name

- Studio surface (server-blocked).
- Studio build + launch (server-blocked).
- Phase 5 signals lock (Architect step).
- Classic shell rewire onto controller (optional).

Nothing else is currently open in the project's plan or status docs.
