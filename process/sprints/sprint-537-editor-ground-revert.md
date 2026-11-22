# Sprint 537 — Revert the editor's black ground

```yaml
---
id: 537
status: pending
phase: daily-driver-fixes (roadmap 2026-11-17-daily-driver-fixes)
pass_kind: functional
depends_on: []
plan: process/planning/2026-11-17-daily-driver-fixes/ROADMAP-2026-11-17-daily-driver-fixes-r1.md
---
```

## scope

Sprint 516 ("the editor's ground takes the inset's colour", commit `a10393b`) set the `new` look's editor ground to `#1a1c20`, the panes' dark inset. The result is a black editor pane that reads as a new skin rather than the gray the transcript panes use; the Architect (2026-11-21) judged it wrong and asked to revert it: "it was supposed to take it to the background that the left and right panes had and leave the substrate terminal the same gray that it was … it basically turned the entire editor pane black … we just need to revert that change."

Revert sprint 516's colour change only (not the line-height or syntax work of sprints 477/479/481, which 516 did not touch): in `web/app/derive/look.ts`, the `new` look's `ground` returns to `#212327` (the gray the editor had before 516, the same value `original.ground` carries) and its `raised` returns to `#1a1c20`. The editor's centre, tabs, status bar and code area read `LOOK[look].ground`, so the one change restores the gray across the editor; the transcript panes and the meta view are untouched. One verifiable property: `editor_ground` decodes the editor pane's ground as `#212327` in the `new` look, and the transcript pane's ground is unchanged.

## prerequisites

- none (a straight revert of sprint 516's two colour values)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/app/derive/look.ts` — the `LOOK` table; `new.ground` and `new.raised` are the two values to revert
- `web/app/editor/Centre.tsx`, `web/app/editor/EditorView.tsx` — read `LOOK[look].ground`
- `web/app/editor/MarkdownView.tsx` — reads `LOOK[look].raised`
- `harness/shakeout/editor_ground.ts` — the gate sprint 516 added; its expected `new` ground changes to `#212327`

## signal contract

### Emits

No new tags. (No signal change; this is appearance only.)

### Invariants

- The vocabulary file is not modified.
- Only `LOOK.new.ground` and `LOOK.new.raised` change in `look.ts`; the line heights, syntax palettes and colours are not touched.
- The transcript panes' and meta view's grounds are unchanged (they do not read the editor ground).

## artifact contract

### Files modified

- `web/app/derive/look.ts` — `LOOK.new.ground: "#1a1c20" → "#212327"`; `LOOK.new.raised: "#212327" → "#1a1c20"`.
- `harness/shakeout/editor_ground.ts` — the `new` look's expected ground becomes `#212327` (and `raised` `#1a1c20`).

### Content assertions

- `look.ts`'s `new` entry has `ground: "#212327"`.
- No other field of `LOOK.new` or `LOOK.original` changes.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run build` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — `editor_ground` passes with the reverted ground; every existing gate passes.

## observation contract

### UI driving steps

- Open the editor in a pane (the `new` look is the default).

### Expected screenshot / visual state

- The editor's centre (code area), tabs and status bar decode to ground `#212327` (CIEDE2000 under the gate's bound), not `#1a1c20`.
- The transcript pane beside or behind it decodes to its own unchanged ground.

## done criteria

The editor pane is the gray it was before sprint 516; the transcript is unchanged; `editor_ground` and the other gates pass. The Architect confirms the look by eye.

## notes

- This is a surgical revert of sprint 516's two colour values, not a `git revert a10393b` (that commit also added the `editor_ground` gate and roadmap/backlog text, which stay). If the Architect wants the whole `new` skin reconsidered (line heights, syntax spacing), that is a separate, larger decision, not this card.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property).
- [ ] `context_files` covers what the worker reads.
- [ ] Artifact contract is gradable; command exit codes runnable.
- [ ] Observation contract present (a visual change).
- [ ] Sprint sweet spot honored: 2 files, one concept.
