# Sprint 516 — The editor's ground takes the inset's colour

```yaml
---
id: 516
status: active
phase: daily-driver fixes (roadmap 2026-11-17-daily-driver-fixes r1, E1)
pass_kind: functional
---
```

## scope

The editor view's ground under the `new` look becomes `#1a1c20`, the colour of the panes' tool-output inset, the app's darkest background (the Architect, 2026-11-17: "The editor background is too light. It needs to be the same background as the inset in the panes … that black background. That's the darkest background."). The `original` look keeps `#212327`. One verifiable property: under `new`, a pixel decode of the code area, the sill, the bottom panel and the group cells reads `#1a1c20`; under `original`, `#212327`.

Two surfaces move with it, because they are drawn one step above the ground and would vanish into it: the rendered Markdown view's code blocks and table separators (`MarkdownView.tsx` lines 42, 56, today `#1a1c20` on the centre's `#212327`, no border) take the look's raised step — under `new` that is `#212327`, the same step the side columns' cards already keep on their `#1a1c20` columns. Three other `#212327` holders in the editor view do not change: the tree's find box (`FileTree.tsx:197`), the inspector's cards (`Inspector.tsx:25`) and the search tab's cards (`Search.tsx:33`) are raised elements on the side columns, which already draw `#1a1c20` today; their relation to their column is untouched.

## prerequisites

- none

## context_files

- `web/app/derive/look.ts` (the `LOOK` table; sprint 478's rule: each appearance change adds its value here, the original beside it)
- `web/app/editor/Centre.tsx` (`GROUND`, the CodeMirror theme, the tab row, the centre container)
- `web/app/editor/EditorView.tsx` (`GROUND`, `SUNK`; the sill, the bottom panel, the view container, the group cells)
- `harness/shakeout/editor_ground.ts` (the new gate), `harness/shakeout/editor_highlight_seen.ts` (already drives both looks through the Settings chips), `harness/shakeout/editor_selection_matches.ts` (its ground is the decimal string `"33,35,39"` at line 119, which a hex grep misses). `harness/shakeout/editor_colours_seen.ts` is read and deliberately unchanged: its census masks pixels within 90 of the old ground, and the two grounds sit 12.1 apart, so the mask covers both.
- `process/BACKLOG.md` ("Daily-driver fixes (2026-11-17)")

## signal contract

### Emits

- No new tags. The gate's launches hold the editor's existing draw records (`EDITOR_DRAWN`, v0.29).

### Consumes

- Mirrors `context_files`.

### Invariants

- The `original` look's pixels are unchanged.
- The panes' ground (`#212327` in `web/app/PanesView.tsx` and `web/app/App.tsx`) is not touched; only the editor view's ground changes.
- No out-of-vocabulary tags; the change adds none.
- No new hues: D7 holds (no green, no yellow, red for failed only); the change is one ground value.

## artifact contract

### Files created

- `harness/shakeout/editor_ground.ts` — the gate: decodes the code area, the terminal head, the folded sill and the rendered Markdown's ground and code block under each look.

No dated pixel baseline: the pixel capture's 14 screens never open the editor, so the ground change alters no captured screen; a check capture diffed against the existing baseline proves it.

### Files modified

- `web/app/derive/look.ts` — `LookValues` gains `ground: string`; `LOOK.new.ground` is `"#1a1c20"`, `LOOK.original.ground` is `"#212327"`.
- `web/app/editor/Centre.tsx` — the CodeMirror theme (`&` and `.cm-gutters` backgrounds, `.cm-fat-cursor` text), the active tab and the centre container read the look's ground in place of the module constant `GROUND`.
- `web/app/editor/EditorView.tsx` — the sill, the bottom panel, the view container and the group cells read the look's ground.
- `web/app/editor/MarkdownView.tsx` — the rendered view's code blocks and table separators read the look's raised step (`#212327` under `new`, so they stay visible on the darker ground; under `original` the value is `#1a1c20`, unchanged).
- `harness/shakeout/editor_highlight_seen.ts`, `harness/shakeout/editor_selection_matches.ts` — their editor-ground constants follow the look under test (the second holds it as the decimal string `"33,35,39"` at line 119, now `"26,28,32"`). `harness/shakeout/editor_colours_seen.ts` is unchanged: its census masks pixels within 90 of the old ground, and the two grounds sit 12.1 apart, so the mask covers both.

### Content assertions

- `web/app/derive/look.ts` holds `ground` in `LookValues`, `"#1a1c20"` in `LOOK.new` and `"#212327"` in `LOOK.original`.
- `grep -n '#212327' web/app/editor/Centre.tsx web/app/editor/EditorView.tsx` finds no module constant; any remaining occurrence is the `original` look's value read through the table.
- `grep -n '#212327' web/app/PanesView.tsx web/app/App.tsx` is unchanged (the panes keep their ground).
- `harness/shakeout/tool_summary_lines.ts` is unchanged (its `#212327` is the pane's ground, which does not change).

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0
- `npx tsx harness/shakeout/editor_ground.ts` from source returns 0
- `npx tsx harness/shakeout/editor_highlight_seen.ts` and `npx tsx harness/shakeout/editor_selection_matches.ts` from source return 0
- `npx tsx harness/shakeout/editor_colours_seen.ts` from source returns 0 (a census; it prints, and its mask covers both grounds)
- `npm run pack:dev` returns 0; the four gates against the bundle return 0
- `npm run pixel:capture s516-check && npm run pixel:diff baseline-2026-11-05-b6 s516-check` returns 0 (no captured screen opens the editor, so the diff is clean)

## observation contract

### UI driving steps

- Open the editor on a file of a real fixture repository under the `new` look; pick `original` in Settings (`[data-setting-look="original"]`, the path `editor_highlight_seen.ts` already drives) and open it again.

### Expected log substrings

- None beyond the gates' own.

### Expected runtime signals

- `EDITOR_DRAWN` for each open in the packaged app's trace; no `INVARIANT_BROKEN` in the launch's `main.jsonl`.

### Expected screenshot / visual state

- Under `new`: the decoded ground of the code area, the active tab, the sill and the group cells is `#1a1c20`; the side columns, tab row and status line were already `#1a1c20` (`SUNK`), so the editor reads as one dark surface.
- Under `original`: the same regions decode `#212327`.
- A screenshot of each look, captured and read.

## done criteria

The editor under the `new` look draws on the inset's colour, proven by pixel decode in the packaged build; the `original` look is unchanged.

## notes

- `.cm-fat-cursor`'s text colour reads the same ground value, so vim's block cursor keeps its contrast on the darker ground.
- The change is one line in the look table plus the two components reading it; the gates' per-look pattern (sprint 485's ghost pass) is the model.
- Installed into Substrate at close, by runbook r10 chapter 5.

## self-review checklist

- [x] Scope is concrete and bounded (one ground value, one look, one verifiable decode).
- [x] `context_files` covers the look table, both editor components and the decode gates; the design canon's D7 is named in the invariants.
- [x] The signal contract names no tags outside the locked vocabulary.
- [x] The artifact contract is gradable: greps, decodes, named commands with exit codes.
- [x] Observation contract present (an appearance change is behaviour-touching).
- [x] One concept; two source files plus their gates and the baseline.
