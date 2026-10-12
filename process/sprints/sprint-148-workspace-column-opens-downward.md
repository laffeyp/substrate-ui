# Sprint 148 — The workspace column opens downward and scrolls

```yaml
---
id: 148
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
asked: 2026-10-11 (Architect: "the top should never go up … drops things down and then makes it scrollable", as the model column does)
context_files:
  - web/reveal.html
  - web/reveal_component.ts
design_canon: the model column's own rule (reveal_component.ts, "The model half never grows the bar")
---
```

## scope

The picker box sits at the bottom of an unbound pane, above nothing, with a flex spacer over it. The workspace column is in normal flow, so it sets the box's height; opening a row (▸ to ▾) adds up to five session rows, the box grows, and because the box is anchored at the bottom its top edge moves up. The model column already obeys the other rule: it is positioned inside the workspace column's height and scrolls.

After: the workspace header and rows sit in a scroll container whose height is the collapsed rows' height (header 9.5px × 2.1, each row 11.5px × 2.1, the same line-height arithmetic the rows render with). Opening a row adds its sessions below it inside that container, which scrolls; the box's top edge stays where it was. The ↑↓ keys already scroll the lit row into view (`scrollIntoView({ block: 'nearest' })`), so keyboard walking reaches the sessions. Typing a path still adds or drops the typed row, which changes the collapsed count; that is the box resizing for different contents, not a row opening.

## signal contract

No controller tags change.

## artifact contract

- `web/reveal.html`: a `data-ws-scroll` container around the WORKSPACE header and rows.
- `web/reveal_component.ts`: `wsListMaxH` from the top-level row count.

## observation contract

Electron gate `ws_column_opens_down.ts` (in `gates:electron`): bind pane 1 to a typed repo-local folder and send a message (one session there); refresh the workspace list; ⌘D for an unbound pane 2; read pane 2's picker box top and the scroll container; open that folder's recent row: the box's top is unchanged (within 0.5px), the session row is in the scroll container, and the container's scroll height exceeds its client height. Before opening, the container does not scroll.

## checks

- The gate red on the old code (the box's top moves up), green after.
- `tsc`; the Electron gates that bind through the picker.

## result

- **Built.** `reveal.html` wraps the WORKSPACE header and rows in `data-ws-scroll` with `max-height: wsListMaxH`; `reveal_component.ts` computes it from the folded row count and builds the rows once per pane (the map body now holds `wsRows`).
- **Gate** `ws_column_opens_down.ts`: red on the old code ("the box's top moved from 574.8125 to 548.765625", 26px up for one session row), green after (top 574.8125 before and after; the session row inside the scrolling list; the folded list does not scroll). The gate binds a typed folder under `harness/shakeout/.scratch/` (gitignored, removed at exit): the picker leaves out `$TMPDIR` paths, and a gate's `SUBSTRATE_HOME` sandbox lives under `$TMPDIR`, so the shared-sandbox row lists no sessions in a gate. `bindPaneAsUser` takes `{ folder }` for this.
- `no_default_model`, `length_tone_rows`, `input_bar`, `split_returns_to_panes` pass; `tsc` clean.
- **Rubber Duck Pass.** No controller tag moved; the gate reads geometry (the box's top, the list's scroll and client heights) and the session row the server listed for the folder.
