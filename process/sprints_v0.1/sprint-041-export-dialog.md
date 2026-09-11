# Sprint 041 — export dialog

---
id: 041
epic: M — Dialogs & settings
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § dialog EXPORT_DIALOG_*; export a session record
prerequisites: 040 closed
---

## scope

Menu Session ▸ Export opens a dialog. Choose target path; commit writes a tarball of the session's record_root to that path via bridge op `export_session`.

## signal contract

### Emits

- `EXPORT_DIALOG_OPENED` (`{pane_id, session_id}`)
- `EXPORT_COMMITTED` (`{pane_id, session_id, target_path}`) — Layer 1 v0.1 name (no `_DIALOG_` suffix)
- `EXPORT_DIALOG_CLOSED` (`{pane_id, committed: boolean}`)

The bridge export op is synchronous from the shell's perspective — the file lands or an error banner appears in the dialog; no separate _REQUESTED/_ACKED/_FAILED chain exists in v0.1.

### Consumes

Menu Session ▸ Export.

## artifact contract

### Files

- `bridge/main.py` — op `export_session` (tar.gz record_root into target)
- `src/render/ExportDialog.tsx`
- `tests/harness/e2e_export_dialog.js`

### Content assertions

- Target path validated (absolute; writable) before commit

### Command exit codes

- `node tests/harness/e2e_export_dialog.js` returns 0

## observation contract

### Driving steps

1. Session with 3 turns; Export; commit to tmp path; assert tarball on disk

### Three-channel agreement

- Structural: `[data-testid="dialog-export"]` present when open
- Perceptual: dialog anchor byte 96 (export kind)
- Log ↔ signal: bridge.log `[bridge] export_session session_id=<id> target=<p>`

## done criteria

Export writes tarball. Sprint 042 (rename) dispatches next.
