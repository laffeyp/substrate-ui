# Sprint 156 — The records page takes the workspace picker's keys

```yaml
---
id: 156
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: the records page "needs to have the same arrow command functionality for navigating inside of it, the exact same arrow command functionality" as the workspace picker)
context_files:
  - web/reveal_component.ts
  - web/reveal.html
---
```

## scope

The records page answers only the mouse and esc. The workspace picker's tree keys: ↑ ↓ move and wrap; → opens a folded row; ← folds an open row, and on a session lights its row and folds it (152); ⇧↵ or ⌥↵ opens or folds; ↵ picks.

After: those keys come out of `_wsKey` into one method, `_treeKey`, that the picker and the records page both call. On the records page a lit row is drawn as the picker draws one (`#2e3138`), scrolled into view; ↵ on a workspace does what a click does (opens or folds it); ↵ on a session opens it in the focused pane, as a click does. The keys work while no text field has focus and no dialog is open.

## signal contract

No controller tags change.

## observation contract

Electron gate `records_keys.ts`: five sessions in a repo-local folder; the records page; ↓ until the folder's row is lit; → opens it; ↓ lights its first session; ← lights the folder and folds it; ⇧↵ opens it again; ↓ then ↵ opens that session in pane 1 and leaves the records page. `left_folds_workspace` and `ws_column_opens_down` still pass on the shared method.

## checks

- The gate red on the current code, green after; `tsc`.

## result

- **Built.** `_treeKey(flat, cur, ev, move)` holds the tree keys; the picker's workspace column (`_wsKey`, which keeps ⇥) and `_recordsKey` call it. The records render builds `_recordsFlat` (rows and the sessions of open rows, each with its parent) and marks the lit row (`data-records-lit`, `#2e3138`); the keydown handler routes ↑ ↓ ← → ↵ there while the records page is up and no field or dialog has focus. ↵ on a workspace opens or folds it; ↵ on a session opens it in the focused pane.
- **Gate** `records_keys.ts` (in `gates:electron`): red on the old code (↓ lit nothing), green after (↓ lit the folder, → opened it, ↓ lit a session, ← folded back to the folder, ⇧↵ reopened, ↵ opened fixture-4 in pane 1). `left_folds_workspace`, `ws_column_opens_down` pass on the shared method.
- **Perceptual.** Screenshot at 1512 × 945: the lit session row is drawn as the picker's lit row. The same screenshot shows ages as raw seconds ("1.2002370357513428s ago"), a defect of `_relTime` this card did not touch.
- **Rubber Duck Pass.** No controller tag moved; the gate reads `data-records-lit`, `data-records-session` and pane 1's session.
