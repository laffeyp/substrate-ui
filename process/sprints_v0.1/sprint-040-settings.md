# Sprint 040 — settings dialog

---
id: 040
epic: M — Dialogs & settings
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § dialog SETTINGS_OPENED/CLOSED + SETTING_CHANGED (oneOf-per-key)
prerequisites: 039 closed
---

## scope

⌘, opens the Settings dialog. Four keys: theme (enum), type_size (9..19), nested_descent (boolean), bindings (nested keymap object). Each key emits SETTING_CHANGED with `key` and `from`/`to` typed via Layer 7 oneOf.

## signal contract

### Emits

- `SETTINGS_OPENED` (`{}`)
- `SETTING_CHANGED` (`{key, from, to}`) — Layer 7 oneOf-per-key enforced
- `SETTINGS_CLOSED` (`{}`)

### Consumes

⌘, keybinding.

## artifact contract

### Files

- `src/render/SettingsDialog.tsx`
- `src/state/Settings.ts` — persisted to `~/.substrate/settings.json`
- `tests/harness/e2e_settings.js`

### Content assertions

- Layer 7 oneOf: theme→enum; type_size→9..19; nested_descent→bool; bindings→object

### Command exit codes

- `node tests/harness/e2e_settings.js` returns 0

## observation contract

### Driving steps

1. ⌘,; toggle theme dark→light; assert SETTING_CHANGED{key:"theme", from:"dark", to:"light"}
2. Type-size slider 13→17; assert SETTING_CHANGED
3. Close; settings persist across launch

### Three-channel agreement

- Structural: `[data-testid="dialog-settings"]` present
- Perceptual: dialog anchor byte 64 (settings kind)
- Log ↔ signal: every change fires exactly one SETTING_CHANGED

## done criteria

Settings persist across launch. Sprint 041 (export) dispatches next.
