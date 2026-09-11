# Sprint 006 — unbound-pane workspace picker

---
id: 006
epic: C — Substrate binding
status: closed
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json § prompt.WORKSPACE_PICKER_WALKED; D66f (unbound pane picker); FUNCTIONALITY
prerequisites: 005 closed
---

## scope

Unbound pane renders the D66f picker: prompt line reads `New session workspace: /path/…`, up/down walks recent workspaces (from `~/.substrate/recent-workspaces.json`), enter selects, esc dismisses. Selection primes the pane's create-request payload but does not fire it yet — Sprint 007 wires the bridge round-trip.

## signal contract

### Emits

- `WORKSPACE_PICKER_WALKED` (`{pane_id, index, workspace_path}`) — Layer 1 v0.1 has only this tag for the picker; open is inferred from the first WALKED per pane, commit falls into Sprint 007's SESSION_CREATE_REQUESTED, dismiss is inferred from the pane's stratum-close signal (no PANE_UNBOUND_BOUND without a commit)

### Consumes

None (Sprint 007 reads the committed workspace/shape state from the pane's local reducer state at SESSION_CREATE_REQUESTED time).

## artifact contract

### Files

- `src/render/UnboundPanePicker.tsx`
- `src/state/RecentWorkspaces.ts` — reads/writes `~/.substrate/recent-workspaces.json` via bridge op `read_recent_workspaces`
- `bridge/main.py` — new op `read_recent_workspaces` returning `[{path, shape, last_used}]`
- `tests/harness/e2e_workspace_picker.js`

### Content assertions

- Only one picker instance per pane (enforced by the pane's unbound state — a bound pane cannot open a picker)
- workspace_shape enum ∈ {flat, worktree, isolate}

### Command exit codes

- `node tests/harness/e2e_workspace_picker.js` returns 0

## observation contract

### Driving steps

1. Open a pane; assert unbound state; assert picker mounts
2. Type into picker; walk with ↑↓
3. Assert one WORKSPACE_PICKER_WALKED per ↑↓ keystroke (index updates); no other picker tags fire in v0.1
4. Press enter — the pane holds the selected workspace + shape in local state pending Sprint 007

### Three-channel agreement

- Structural: `[data-testid="unbound-picker"]` present; `<input>` autofocused
- Perceptual: `anchor-pane-<id>-status` byte === 0 while unbound (stays 0 through picker; flips at Sprint 007's SESSION_CREATED)
- Log ↔ signal: exactly N WALKED tags for N ↑↓ keystrokes; no OPENED/COMMITTED/CLOSED emits (Layer 1 v0.1 doesn't carry them)

## done criteria

Picker renders, walks, commits. No session created yet. Sprint 007 (bridge round-trip → session created) dispatches next.
