# Sprint 458 — closeout addendum: the card's template sections

*2026-11-11. A full read of sdd-kit-3 after the close found that the card for sprint 458 (drag into the message, and the hint) left out sections of `templates/SPRINT_CARD.md`: prerequisites, the split of the signal and artifact contracts, command exit codes, notes and the self-review checklist. The closed card stays as it was (`WORKING_AGREEMENT.md`, post-close addenda); the sections are here. Their content restates what the card and its close already state. The checklist below was not run before the sprint's work began.*

## prerequisites

- 457 (the chip maker, `editor/chips.ts`).

## context_files (added)

- `../sdd-kit-3/AGENTS.md`; `WORKING_AGREEMENT.md`; `web/vm/signals/versions/0.59.json`; `web/vm/signals/proposals.json`.

## signal contract

### Emits

Vocabulary v0.60 (P-0.60-CHIP-DRAG):
- `EDITOR_CHIP_ADDED` (`kind`, `how`), `how` gains `drag`.

### Consumes

- The sources' rows; the chip maker `editor/chips.ts`; the input bar's store.

### Invariants

- No out-of-vocabulary tag; the vocabulary changes only through the proposal and the version bump.
- A chip's drop on the bar adds the chip and leaves the draft's text unchanged; a chip's drop on the code changes no text.
- No label or path in any payload (E1).

## artifact contract

### Files created

- `web/vm/signals/versions/0.60.json`, `0.60-rationale.md`
- `harness/shakeout/editor_drag_chips.ts`

### Files modified

- `web/app/editor/chips.ts` (`CHIP_TYPE`, `dragChip`, `carriesChip`, `dropChip`), `web/app/InputBar.tsx`, `web/app/editor/FileTree.tsx`, `web/app/editor/Centre.tsx`, `web/app/editor/Search.tsx`, `web/app/editor/EditorView.tsx`, `web/app/derive/control_notes.ts`
- `web/vm/signals/proposals.json`, `web/vm/signals/versions/current.json` → `0.60.json`, the generated `signals.gen.ts` files and `signals_gen.py`; `WORKING_AGREEMENT.md`; `process/planning/README.md`

### Content assertions

- `[data-drop-over="1"]` on the bar while a chip drag is over it.
- The header's `title` is `ADD_HINT`, defined once in `derive/control_notes.ts`.
- `dragChip` sets `application/x-substrate-chip` before `text/plain`.

### Command exit codes

- `npm run test:unit` returns 0
- `npm run build` returns 0; `python3 scripts/gen_signals.py --check` and `npm run signals` return 0

## notes

Hard rule 6 is bypassed and logged in `WORKING_AGREEMENT.md`: a drag starts at each of three sources and ends at the bar, which every view shares; the code must refuse the same drag.

## self-review checklist

Written after the close, on 2026-11-11, when a full read of the kit found this section missing; the card was not checked against the list before its work began.

- [x] Scope concrete: one verifiable property (a dragged row becomes the bar's chip; the code refuses it).
- [x] context_files cover the code, the vocabulary, the design canon (D94, D40, 24k) and the decisions.
- [x] Emits names only v0.60 tags, ratified in this sprint.
- [x] Artifact contract gradable.
- [x] Observation contract present.
- [ ] ≤2 files: no; logged as a bypass (hard rule 10).
