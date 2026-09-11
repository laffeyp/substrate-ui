# Sprint 042 — rename dialog

---
id: 042
epic: M — Dialogs & settings
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § dialog SESSION_RENAME_*; NameCollision typed exception at session_registry.py
prerequisites: 041 closed
---

## scope

Menu Session ▸ Rename opens a dialog. Enter new name; commit calls bridge op `session_rename` wrapping `SessionRegistry.set_name`. NameCollision → SESSION_RENAME_FAILED{reason:"name_collision"}. Successful rename updates by-name.json.

## signal contract

### Emits

- `SESSION_RENAME_REQUESTED` (`{request_id, session_id, new_name}`)
- `SESSION_RENAMED` (`{request_id, session_id, new_name, prior_name}`) — Layer 1 v0.1 name for the success reply
- `SESSION_RENAME_FAILED` (`{request_id, reason: "name_collision"|"invalid_name"|"timeout"}`)
- `PANE_RENAMED` (`{pane_id, session_id, new_name, prior_name}`) — the shell's rename echo per pane (Layer 1 v0.1 also carries this)

The rename form is inline in the WorkspacePopover kind slot; no dialog trio exists in v0.1 (SESSION_RENAME_OPENED / _COMMITTED / _CLOSED were invented — the rename fires directly on Enter without a separate dialog stratum).

### Consumes

Menu Session ▸ Rename; F2 keybinding.

## artifact contract

### Files

- `bridge/main.py` — op `session_rename` wraps SessionRegistry.set_name; catches NameCollision
- `src/render/RenameDialog.tsx`
- `tests/harness/e2e_rename_dialog.js`

### Content assertions

- Collision path exercised (two sessions renamed to same name → second returns typed failure)

### Command exit codes

- `node tests/harness/e2e_rename_dialog.js` returns 0

## observation contract

### Driving steps

1. Rename "foo" → "bar"; assert SESSION_RENAME_REQUESTED → SESSION_RENAMED{new_name:"bar", prior_name:"foo"} → PANE_RENAMED
2. Rename another session to "bar"; assert SESSION_RENAME_FAILED{reason:"name_collision"}

### Three-channel agreement

- Structural: header session name updates on ACK
- Perceptual: dialog anchor byte 160 (rename kind)
- Log ↔ signal: bridge.log `[bridge] session_rename session_id=<id> new=<n>`

## done criteria

Rename works; collision typed. Epic M closes. Sprint 043 (collection persist) dispatches next.
