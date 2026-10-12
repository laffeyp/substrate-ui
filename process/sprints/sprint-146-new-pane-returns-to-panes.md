# Sprint 146 — A new pane from the meta view returns to the panes view

```yaml
---
id: 146
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 16; OPEN-ITEMS 23)
asked: 2026-10-11 (Architect)
---
```

## scope

- ⌘D (split right) and ⌘⇧D (split down) in the meta view make the pane and leave the user in meta, where panes are not drawn: the new pane cannot be seen. The same holds on the records, assay and studio pages.
- After: making a pane switches to the panes view, with the new pane focused. A split that is refused (eight panes already) changes nothing, the view included.

## checks

- An Electron gate: bind a pane, switch to meta (⌘M), press ⌘D: the panes view shows two panes and the new one is focused; from the records page, ⌘⇧D does the same.
- `tsc` clean; the Electron gates.

## result

- **Built** (`reveal_component.ts` `_split`): both split directions set `revealed: false, surface: null` with the new pane focused; a refused split returns `{}` and changes nothing.
- **Gate** `split_returns_to_panes.ts` (in `gates:electron`): ⌘D from meta gives two panes in the panes view, pane 2 focused; ⌘⇧D from the records page gives three, pane 3 focused.
