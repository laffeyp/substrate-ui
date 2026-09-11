# Sprint 016 — reveal toggle

---
id: 016
epic: E — Reveal & lenses
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § reveal REVEAL_TOGGLED; D4 (reveal-toggle terminal↔machinery); Layer 5 mutex (at most one open reveal per pane)
prerequisites: 015 closed
---

## scope

Every bound pane has a reveal toggle. Clicking flips the pane between `terminal` (transcript view) and `reveal` (machinery view — chooses last lens or defaults to stream+graph). Sprint 017 adds the four lenses; this sprint only handles the toggle + the mutex.

## signal contract

### Emits

- `REVEAL_TOGGLED` (`{pane_id, to: "terminal"|"reveal"}`)

### Consumes

None.

## artifact contract

### Files

- `src/render/PaneHeader.tsx` — adds the reveal toggle handle (rest of the header ships in Epic I)
- `src/render/RevealShell.tsx` — placeholder for the four-lens machinery view (Sprint 017 fills)
- `src/reducer/ShellReducer.ts` — REVEAL_TOGGLE action; Layer 5 mutex enforced
- `tests/harness/e2e_reveal_toggle.js`

### Content assertions

- Layer 5 mutex: at most one open reveal-instance per pane at any time (asserted)

### Command exit codes

- `node tests/harness/e2e_reveal_toggle.js` returns 0

## observation contract

### Driving steps

1. Bind pane; click reveal toggle; assert REVEAL_TOGGLED{to:"reveal"}
2. Click again; assert REVEAL_TOGGLED{to:"terminal"}
3. Rapid toggle 10× — verify mutex (single open instance per pane)

### Three-channel agreement

- Structural: pane's transcript / reveal DOM subtree swaps
- Perceptual: `anchor-pane-<id>-reveal` byte flips 0 (terminal) ↔ 128 (reveal)
- Log ↔ signal: toggle count matches JSONL count

## done criteria

Toggle flips reliably; mutex holds. Sprint 017 (four lenses) dispatches next.
