# Sprint 019 — reveal focus

---
id: 019
epic: E — Reveal & lenses
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § lens REVEAL_FOCUS_MOVED (transcript|stream); v7:167/184/252; sheet 19h/19k/19l — Find scope handle
prerequisites: 018 closed
---

## scope

Inside a revealed pane, focus alternates between transcript-side and stream-side. Tab (or ⌥→) flips focus. Find (Epic H) scopes by this focus. No visible cursor drift, just the observation handle.

## signal contract

### Emits

- `REVEAL_FOCUS_MOVED` (`{pane_id, focus: "transcript"|"stream", prior_focus}`)

### Consumes

None.

## artifact contract

### Files

- `src/render/RevealShell.tsx` — Tab key handler; focus ring highlights active side
- `src/state/RevealFocus.ts` — per-pane focus token
- `tests/harness/e2e_reveal_focus.js`

### Content assertions

- Focus is per-pane; multi-pane reveals hold independent focus

### Command exit codes

- `node tests/harness/e2e_reveal_focus.js` returns 0

## observation contract

### Driving steps

1. Reveal; Tab; assert REVEAL_FOCUS_MOVED{focus:"stream"}
2. Tab; assert focus back to transcript
3. Open two panes both revealed; verify focus isolation

### Three-channel agreement

- Structural: `.focus-ring` class on the active side element
- Perceptual: no dedicated anchor (Layer 7 does not name one — reveal focus is a walk aid, not a load-bearing state)
- Log ↔ signal: REVEAL_FOCUS_MOVED count matches Tab press count

## done criteria

Focus flips reliably; Find scope handle wired. Epic E closes. Sprint 020 (delegate render) dispatches next.
