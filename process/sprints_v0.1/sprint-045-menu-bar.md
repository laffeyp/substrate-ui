# Sprint 045 — real macOS menu bar

---
id: 045
epic: O — Menu bar & shortcuts
status: pending
phase: 3
pass_kind: architecture
spec_reference: D63 (real macOS menu bar); handoff_latest/docs/MENU-BAR -2026-09-01-.md; Layer 1 v0.1 does not ratify a MENU_ITEM_ACTIVATED tag — menu clicks route to the shell action whose own tag observes the effect
prerequisites: 044 closed
---

## scope

Electron Menu template ships the six top-level menus per MENU-BAR: Substrate, File, Session, Collection, View, Help. Every item routes to a shell reducer action; the observation is the routed action's tag (Session ▸ End Session → END_CONFIRM_OPENED; Session ▸ Rename → the rename form opens; Collection ▸ Save → COLLECTION_PERSISTED; etc.). No separate MENU_ITEM_ACTIVATED tag exists in v0.1.

## signal contract

### Emits

None new. The menu bar is a routing surface; each item's tag is whatever the routed reducer action emits.

### Consumes

macOS menu clicks.

## artifact contract

### Files

- `electron/main.js` — Menu.buildFromTemplate + Menu.setApplicationMenu
- `electron/menu-template.js` — the template
- `src/reducer/ShellReducer.ts` — routes item_id → action (no new emits, only wires the click to the existing action)
- `tests/harness/e2e_menu_bar.js`

### Content assertions

- Every menu item id maps to exactly one existing reducer action
- No new tag names appear in the JSONL when the menu fires (grep proof — the routed action's tag is what appears)

### Command exit codes

- `node tests/harness/e2e_menu_bar.js` returns 0

## observation contract

### Driving steps

1. Click Session ▸ End Session; assert END_CONFIRM_OPENED (Sprint 036's tag) fires
2. Click Session ▸ Rename; assert the rename form mounts and no MENU_ITEM_ACTIVATED tag fires
3. Click File ▸ Quit; assert the last WINDOW_CLOSED{reason:"user"} fires (Sprint 005's terminal signal)

### Three-channel agreement

- Structural: macOS menu bar visible; each menu populated
- Perceptual: no dedicated anchor (menu bar is native chrome outside the paint decode surface)
- Log ↔ signal: menu clicks land as the routed action's tag; zero invented tags in the trace

## done criteria

Full menu bar mounted; every item routes; the trace stays clean. Sprint 046 (keyboard bindings) dispatches next.
