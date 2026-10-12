# Sprint 153 — The records page lists workspaces in the workspace bar's style

```yaml
---
id: 153
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 18; OPEN-ITEMS 26, 27)
asked: 2026-10-11 (Architect: the workspaces "in the style the panes view's workspace bar uses: the darker background, the rounded corners, centred. Only the style changes.")
context_files:
  - web/reveal.html
  - web/reveal_component.ts
  - server.py
design_canon: the panes view's picker box (reveal.html: border 1px rgba(255,255,255,.13), radius 6px, background #1a1c20, rows padded 0 14px)
---
```

## scope

The records page draws its workspaces as bare rows on the page background (`#212327`), in a 760px column pinned to the left by 40px of padding.

After: the WORKSPACES heading and its "+ add workspace" stay above; the workspace rows sit in one box with the picker box's border, radius and background, rows padded 14px at the sides as the picker's are; the 760px column is centred in the page. Each row's content, the expanded session lists and their order are unchanged.

The second half of step 18, the "sessions get work trees" copy, was checked first: it is false. `server.py` defines `_session_worktree` and nothing calls it; of the 86 session manifests under `~/.substrate`, 84 are `flat` and 2 `sandbox`, none `worktree`; `~/.substrate/sessions/wt` does not exist. The page's "worktree" comes from `_classify_workspace_shape`, which calls any folder holding `.git` a worktree. What the label should read is the Architect's call; this card changes style only.

## signal contract

No controller tags change.

## observation contract

Electron gate `records_workspace_box.ts`: open the records page with one workspace on record; the rows' container has background `rgb(26, 28, 32)`, a 6px radius and the picker's border colour; the 760px column's left and right gaps differ by at most 1px; the workspace row's text is unchanged. Screenshot at 1512 × 945 read.

## checks

- The gate red on the current code, green after; `tsc`.

## result

- **Built** (`reveal.html`): the 760px column (`data-records-column`) is centred with `margin: 0 auto`; the workspace rows sit in `data-records-workspaces`, a box with the picker's border, 6px radius and `#1a1c20`; rows padded 14px at the sides; an expanded session list keeps its own inset box, moved in to match (34px left, 14px right).
- **Gate** `records_workspace_box.ts` (in `gates:electron`): red on the old code ("the workspace rows are not in a box"), green after (`rgb(26, 28, 32)`, 6px, `rgba(255, 255, 255, 0.13)`; column gaps 376.0 / 376.0 at 1512 × 945; the row still reads "path 1 session"). The first green run read "0 sessions" because the count loads after the row; the gate now waits for the count.
- **Perceptual.** Screenshot at 1512 × 945 read: the box sits centred under WORKSPACES and "+ add workspace". The gate's long scratch path wraps to two lines and pushes "1 session" to two lines; the row's flex layout does so without the box too, and the row's content is out of this card's scope.
- **The worktree copy** stays as it is pending the Architect's call: the claim is false (see scope).
- **Rubber Duck Pass.** No controller tag moved; the gate reads computed style and geometry.
