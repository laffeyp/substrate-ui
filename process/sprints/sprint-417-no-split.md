# Sprint 417 — the editor refuses a split

```yaml
---
id: 417
status: closed
phase: code editor, the rest (roadmap r8), E1
pass_kind: functional
---
```

## scope

In the editor view ⌘D and ⌘⇧D are refused and written as EDITOR_KEY_REFUSED (key, reason `no_split`); outside it they split as before. Vocabulary v0.30 adds the reason (P-0.30-KEY-REFUSED-NO-SPLIT). ⌘M, ⌘3 and ⌘, keep their meaning in the editor. Files: `web/vm/signals/versions/0.30.json`, `0.30-rationale.md`, `proposals.json`, `current.json`, the generated files; `web/app/keymap.ts` and its spec; `web/app/App.tsx` (one line). Gate `harness/shakeout/editor_keys.ts`.

## context_files

- D49 (c), D86; spec r6 §4 ("no splitting in this view"); roadmap r8 E1 and its key table

## observation contract

Real key presses; the editor stays after ⌘D and ⌘⇧D with one pane; settings and the assay page open over it and close back to it; ⌘M goes to meta; the anchor decodes after the refusals and names an EDITOR_DRAWN; after close, EDITOR_KEY_REFUSED Meta+d and Meta+Shift+D with no_split, no second PANE_OPENED, DIALOG_OPENED and DIALOG_CLOSED, VIEW_CHANGED in order. From source and on the bundle.
