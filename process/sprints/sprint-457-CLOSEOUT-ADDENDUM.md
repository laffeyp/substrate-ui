# Sprint 457 — closeout addendum: the card's template sections

*2026-11-11. A full read of sdd-kit-3 after the close found that the card for sprint 457 (right-click › Add to message) left out sections of `templates/SPRINT_CARD.md`: prerequisites, the split of the signal and artifact contracts, command exit codes, notes and the self-review checklist. The closed card stays as it was (`WORKING_AGREEMENT.md`, post-close addenda); the sections are here. Their content restates what the card and its close already state. The checklist below was not run before the sprint's work began.*

## prerequisites

- 443 (chips), 454 (selections), 456 (⌥A).

## context_files (added)

- `../sdd-kit-3/AGENTS.md`; `WORKING_AGREEMENT.md`; `web/vm/signals/versions/0.58.json`; `web/vm/signals/proposals.json`.

## signal contract

### Emits

Vocabulary v0.59 (P-0.59-CONTEXT-MENU):
- `CONTEXT_MENU_OPENED` (`source`: tree | tab | search | code, `items`), new: the menu drawn.
- `CONTEXT_MENU_CLOSED` (`outcome`: picked | escape | outside | blur), new.
- `EDITOR_CHIP_ADDED` (`kind`, `how`), `how` gains `menu`.
- `KEY_ROUTED` (`key`, `action`, `target`): Escape `close-menu`; ArrowDown and Enter `menu`.

### Consumes

- The sources' rows and the code's selection; `state/input_bar.ts` `addChip`; the key map's close cascade.

### Invariants

- No out-of-vocabulary tag; the vocabulary changes only through the proposal and the version bump.
- Every CONTEXT_MENU_OPENED is followed by one CONTEXT_MENU_CLOSED before the next opening; a picked menu closes before its EDITOR_CHIP_ADDED.
- With the menu open, Escape writes no TURN_INTERRUPTED.
- No label or path in any payload (E1).

## artifact contract

### Files created

- `web/app/state/context_menu.ts`, `web/app/ContextMenu.tsx`, `web/app/editor/chips.ts`
- `web/vm/signals/versions/0.59.json`, `0.59-rationale.md`
- `harness/shakeout/editor_context_menu.ts`, `harness/shakeout/editor_context_menu_escape.ts`

### Files modified

- `web/app/App.tsx`, `web/app/keymap.ts` and `web/app/__tests__/keymap.spec.ts`, `web/app/editor/FileTree.tsx`, `web/app/editor/Centre.tsx`, `web/app/editor/Search.tsx`
- `server.py` (`_span_note`) and `tests/test_turn_attachments_453.py`
- `web/vm/signals/proposals.json`, `web/vm/signals/versions/current.json` → `0.59.json`, the generated `signals.gen.ts` files and `signals_gen.py`; `WORKING_AGREEMENT.md`

### Content assertions

- `[data-context-menu]` and `[data-context-item]` are drawn by `ContextMenu.tsx`.
- `keymap.ts` returns `close-menu` for Escape and `menu` for ↑ ↓ ↵ when `menuOpen`, before every other Escape rule.
- `editor/chips.ts` exports `addFrom` and `addItem`; FileTree and Centre add chips only through `addFrom`.

### Command exit codes

- `npm run test:unit` returns 0 (the keymap spec: Escape `close-menu` even while a turn runs)
- `npm run build` returns 0; `python3 scripts/gen_signals.py --check` and `npm run signals` return 0
- `uv run --project ../substrate python -m pytest tests/test_turn_attachments_453.py` returns 0

## notes

Hard rule 6 is bypassed and logged in `WORKING_AGREEMENT.md`: one menu serves four sources, each opening it from its own rows; its Escape belongs to the key map's cascade, which App feeds.

## self-review checklist

Written after the close, on 2026-11-11, when a full read of the kit found this section missing; the card was not checked against the list before its work began.

- [x] Scope concrete: one verifiable property (right-click › Add to message adds the source's chip; Escape on the menu closes only the menu).
- [x] context_files cover the code, the vocabulary, the design canon (D94, D40, 24k) and the decisions.
- [x] Emits names only v0.59 tags, ratified in this sprint.
- [x] Artifact contract gradable.
- [x] Observation contract present.
- [ ] ≤2 files: no; logged as a bypass (hard rule 10).
