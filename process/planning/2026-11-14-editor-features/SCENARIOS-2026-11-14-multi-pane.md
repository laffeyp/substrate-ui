# Scenarios — the editor across panes (card 500)

*2026-11-14. Each row is one scenario, the gate that runs it on the bundle, and the mutant that must fail that gate. Fixtures: copies of `harness/fixtures/code/` (14 files, 12 languages) spread over folders three to five deep, plus long files (thousands of lines); never a few lines or one function. Each gate prints, per pane and per step, what the DOM, the pixel anchor and the trace say, and saves a screenshot that is read.*

| # | Scenario | Gate | Mutant |
|---|---|---|---|
| S1 | Two panes, two sessions: each editor shows only its own tabs and shown file | `editor_two_panes` (sprint 499) | one store for every pane |
| S2 | Two panes, one session: each pane keeps its own tabs and shown file | `editor_one_session_two_panes` | one store for every pane |
| S3 | Switching focus back and forth ten times: neither editor loses a tab, a fold or its shown file (the Architect's "less and less", Substrate Next before sprint 499) | `editor_focus_switches` | shared folds and tabs |
| S4 | Unsaved edits in each pane: each tab's dot and buffer are its own; a pane's unsaved count names its own files | `editor_unsaved_per_pane` | unsaved list shared |
| S5 | Save-before-send from pane 1 saves only pane 1's session's buffers | `editor_unsaved_per_pane` | save every session's buffers |
| S6 | Find and workspace search: each pane's query and results its own | `editor_find_per_pane` | shared find state |
| S7 | Closing a pane with unsaved edits: the other pane's editor is untouched; the closed pane's state is dropped | `editor_close_pane` | no drop on close |
| S8 | A session's live edits marked only in the pane that shows its file | `editor_follow_per_pane` | follow marks shared |
| S9 | A pane rebound to another session: its editor shows the new session's files, none of the old | `editor_one_session_two_panes` | tabs kept across rebind |

The editor gates join `npm run gates:electron` when every row passes.

## Progress

- S1 `editor_two_panes`: passes from source and on bundle 1794704… (sprint 500 run, `runs/packaged/sprint-500-*`); mutant fails.
- S3 `editor_focus_switches`: passes from source and on the bundle. Two sessions on large fixtures (14 files over folders three to five deep, two 16,724-line files); pane 1 four tabs, pane 2 three tabs with its files column folded; ten switches, each read from the DOM, the pixel anchor and its EDITOR_DRAWN record, all agreeing. Screenshot of switch 10 read: pane 2 shows its three tabs, `long_two.txt` shown, files column folded. Mutant (one store for every pane): fails, pane 2's tree never draws its folders. Shared drivers: `harness/shakeout/lib/multipane.ts`.
- S2 and S9 `editor_one_session_two_panes`: pass from source. S9 found a bug: pane 2 rebound to a new session kept the old session's two tabs (`EDITOR_DRAWN` tab_count 2 before any open). Fixed: `showEditorFor(paneId, sessionId)` gives a pane a fresh editor when its session changes. Mutant (no reset): fails at S9's first open.
- S4–S8: not yet written.
