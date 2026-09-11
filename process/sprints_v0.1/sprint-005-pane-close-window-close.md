# Sprint 005 — pane close + walked focus + window close

---
id: 005
epic: B — Pane grid
status: closed
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json § pane + window; PANE-MECHANICS §Focus walk; D35
prerequisites: 004 closed
---

## scope

Close a pane (⌘W or menu). Sibling absorbs the closed pane's slot. Focus walks to the sibling per D35. Close the last pane → close the window. Close the last window → close the app.

## signal contract

### Emits

- `PANE_CLOSED` (`{pane_id}`)
- `PANE_FOCUSED` (`{pane_id, prior_pane_id}`) — walked focus
- `WINDOW_CLOSED` (`{window_id, reason: "user"|"last_pane_closed"}`)

Layer 1 v0.1 does not ratify a distinct APP_QUITTING tag — the last window's WINDOW_CLOSED IS the app's terminal signal; the trace ends after it. Electron's `app.quit()` fires immediately after that emit lands.

### Consumes

None.

## artifact contract

### Files

- `src/state/SplitTree.ts` — `close(paneId)`; sibling absorption; walked-focus policy
- `src/reducer/ShellReducer.ts` — CLOSE_PANE + CLOSE_WINDOW actions
- `src/render/App.tsx` — listens for the last WINDOW_CLOSED and calls `window.close()` so Electron's `window-all-closed` handler fires; no separate app-quit tag
- `tests/harness/e2e_pane_close.js`

### Content assertions

- Layer 5 terminal rule: PANE_CLOSED terminates all pane-scoped tags for that pane_id (asserted in reducer)
- WINDOW_CLOSED reason enum ∈ {user, last_pane_closed}

### Command exit codes

- `npx tsc --noEmit` returns 0
- `node tests/harness/e2e_pane_close.js` returns 0

## observation contract

### Driving steps

1. Open three panes; focus middle; close middle
2. Assert walked focus lands on sibling (per D35 policy)
3. Close remaining panes; assert the last one emits WINDOW_CLOSED{reason:"last_pane_closed"} and the trace ends there

### Three-channel agreement

- Structural: pane count matches post-close state; sibling absorbs the slot
- Perceptual: sibling's focus anchor byte flips 128 → 255 same-step as PANE_FOCUSED
- Log ↔ signal: PANE_CLOSED → PANE_FOCUSED (walked) within one reducer tick; last close emits WINDOW_CLOSED

## done criteria

Close + walked focus + window close + app quit all fire the right tags with the right terminal semantics. Epic B closes. Sprint 006 (unbound-pane picker) dispatches next.
