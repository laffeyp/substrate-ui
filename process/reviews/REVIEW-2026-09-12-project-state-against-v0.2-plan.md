# Review — project state against `EPIC-PLAN-v0.2-2026-09-12-prototype-port.md`

2026-09-12.

**Against the v0.2 plan.** The plan lists 17 Q-sprints, 7 halt items, and preserves every artifact the port keeps. Its inventory of `src/render/` matches what is on disk. No Q-sprint card exists. No Q0 commit is in git. Every `.tsx` file the plan marks for replacement is still under `src/render/`.

**Against the design lock.** The prototype's palette, type ladder, header, bottom bar, pane grid, delegate-child row, fan-out list, slash router, workspace picker, revealed view with mode chips and swim-lane graph and inspect drawer, records surface, assay 4×5 grid, studio form, dialogs, and first-run picker are all present in `handoff_latest/prototypes/Substrate Prototype v7.dc.html` and absent from the shipped shell. The `.tsx` files under `src/render/` render a placeholder tree carrying enough `data-testid` anchors for the harness to grade signals. A pixel diff between any harness screenshot and the corresponding prototype state fails.

**Against the SDD kit.** `signals/0.1.json` carries 108 tags. Mouth-side validation refuses invented tags and short payloads; the addition landed at `e33f36b` and the `drift-extension` at `bd8177c` closed the four remaining raw-string call sites plus consolidated bridge ops. `Tag`, `PaneSlot`, and `BridgeOp` const files are codegen from the JSON, per `0b8623e`. The harness library at `tests/harness/lib/` supplies shared primitives to 36 e2e harnesses. `BLACKBOARD.md` and `KIT_DIARY.md` carry a line per closed sprint. Signal Reports at `process/signal_reports/` account for the sprint runs. Vocabulary evolution flows through `signals/proposals.json`. Twelve hard rules hold at Sprint 033.

**Against v0.1's sprint cards.** Sprints 022–033 closed clean per git log; each commit names its sprint and epic. Sprints 015–021 are outside this session's read pass; a spot check would confirm their contracts.

**One drift.** Sprints 030 through 033 landed on 2026-09-11 and later. They edited `src/render/SlashRouter.tsx`, `PaneHeader.tsx`, `WorkspaceChip.tsx`, `DriverChip.tsx` — files the v0.2 plan marks for replacement. That work carries over as signal contract; the visual code gets ported.

**One thing to check.** The plan cites line ranges into the prototype (lines 8–30, 33–52, 78–121, 124–137, 156–329, 288–323, 331–355, 358–374, 377–443, 446, 449–490, 493–511). It also names a second copy at `app/prototype-v7.html`. A diff between `handoff_latest/prototypes/Substrate Prototype v7.dc.html` and `app/prototype-v7.html` confirms whether the line ranges resolve against the vendored copy or need to source from `handoff_latest/`.
