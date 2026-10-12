# Sprint 150 — The workspace list fills its column; ← and a click go back to it

```yaml
---
id: 150
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect, after card 148: "you've not taken up the full vertical area … you've assumed that the guidance, length, and tone stack applies on the left hand workspace side. It doesn't." and "the back button should take me back to the workspace … If I click back over on the workspace area again … it should be back in the workspace area.")
supersedes: card 148's layout (its max-height); card 148's gate is rewritten here
context_files:
  - web/reveal.html
  - web/reveal_component.ts
  - harness/shakeout/ws_column_opens_down.ts
design_canon: the model column (positioned inside the box's height, scrolls inside it)
---
```

## scope

Measured at 1512 points with three workspace rows: the workspace column is 197px; card 148 capped the list at its folded rows (92px) and a 93px blank block sits under it, standing in for GUIDANCE, LENGTH and TONE, which belong to the model column only (the block came in U132 at 31px, U143 grew it to 93px). The picker never opened downward: since `35a7e47` the box has sat at the pane's bottom under a flex spacer and the workspace column, in normal flow, has set its height.

After:

1. The workspace list takes the whole column: its height is the folded rows plus the 93px the model column's three lines need (side by side; stacked under a narrow pane the lines sit under both columns, so the list is the folded rows only). The blank block goes. The box keeps today's height. Opening a row drops its sessions into the room under the rows; past that, the list scrolls. The box's top never moves.
2. ← in the model column on a row that cannot fold (a folded group, a model with nothing open under it) goes back to the workspace column, as esc does (the workspace is disarmed and the model column greys).
3. A click on the workspace column's empty space, with a workspace armed, goes back to the workspace column the same way. A click on a workspace row still picks it.

Unchanged: ↑ in the model column; the workspace column's ↓ (card 149's rule is the model column's).

## signal contract

No controller tags change.

## observation contract

`ws_column_opens_down.ts`, rewritten:

1. Five sessions opened in a repo-local folder (`POST /api/session`, deterministic); the folder's recent row is in the picker.
2. Folded: the list's bottom is the column's content bottom (within 1px), and the list does not scroll.
3. Open the row: the box's top is unchanged (within 0.5px); the first session row lies inside the list's visible area without scrolling; the list scrolls (five rows exceed the room).
4. ↵ arms the first workspace (keys move to the model column); ← on the folded "cli agents" returns: no workspace armed, the lit row is in the workspace column. ↵ again; fold the folder's row; a click on the workspace list's empty space returns the same way.

## checks

- The gate red on the current code (the list ends 93px above the column's bottom), green after; `tsc`; the picker gates.

## result

- **Built.** `reveal.html`: the `data-ws-scroll` list takes `height: wsListH` and `onClick: onWsListClick`; the blank spacer under it is gone. `reveal_component.ts`: `wsListH` is the folded rows plus 93px side by side (the folded rows alone when stacked); `guidanceSpacer` and `wsListMaxH` are gone; `onWsListClick` disarms when the click is not on a row; in the model column, ← on a row with nothing open under it calls `_disarmWorkspace`, as esc does.
- **Gate** `ws_column_opens_down.ts`, rewritten: red on card 148's code ("folded, the list ends 93.0px above the column's bottom"), green after: folded, the list's bottom is the column's (815.5 / 815.5); opened, the box's top held at 598.95, the first of five sessions sat under the rows and the list scrolled; ← on a folded cli agents and a click on the list's empty space both went back to the workspace column.
- **Perceptual.** Screenshots at 1512 × 945, folded and opened with five sessions: the box's top is the same in both; the sessions fill the room under the rows and the fifth runs under the list's bottom edge, where the list scrolls.
- `no_default_model`, `model_down_drills`, `length_tone_rows`, `input_bar`, `split_returns_to_panes` pass; `tsc` clean. `model_half_starts_session.ts` (not in `gates:electron`) fails: it expects a model pick to show the input bar, which has not been so since the guidance line (U132); this card does not touch that path.
- **Rubber Duck Pass.** No controller tag moved; the gate reads geometry, `data-armed` on the model half, and the lit workspace row.
