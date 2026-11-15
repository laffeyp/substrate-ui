# Scenarios — the editor across panes (card 500)

*2026-11-14. Each row is one scenario, the gate that runs it on the bundle, and the mutant that must fail that gate. Fixtures: copies of `harness/fixtures/code/` (14 files, 12 languages) spread over folders three to five deep, plus long files (thousands of lines); never a few lines or one function. Each gate prints, per pane and per step, what the DOM, the pixel anchor and the trace say, and saves a screenshot that is read.*

| # | Scenario | Gate | Mutant |
|---|---|---|---|
| S1 | Two panes, two sessions: each editor shows only its own tabs and shown file | `editor_two_panes` (sprint 499) | one store for every pane |
| S2 | Two panes, one session: each pane keeps its own tabs and shown file | `editor_one_session_two_panes` | one store for every pane |
| S3 | Switching focus back and forth ten times: neither editor loses a tab, a fold or its shown file (the Architect's "less and less", Substrate Next before sprint 499) | `editor_focus_switches` | shared folds and tabs |
| S4 | Unsaved edits in each pane: each tab's dot and buffer are its own; a pane's unsaved count names its own files | `editor_unsaved_per_pane` | unsaved list shared |
| S5 | Save-before-send from pane 1 saves only pane 1's session's buffers | `editor_unsaved_per_pane` | save every session's buffers |
| S6 | Find and workspace search: each pane's query and results its own | `editor_find_and_close` | one store for every pane |
| S7 | Closing a pane with unsaved edits: the other pane's editor is untouched; a pane opened after starts empty | `editor_find_and_close` | one store for every pane |
| S8 | A session's live edits marked only in the pane that shows its file | `editor_follow_per_pane` | a pane's follow reading another pane's envelopes |
| S9 | A pane rebound to another session: its editor shows the new session's files, none of the old | `editor_one_session_two_panes` | tabs kept across rebind |

The editor gates join `npm run gates:electron` when every row passes.

## Progress

- S1 `editor_two_panes`: passes from source and on bundle 1794704… (sprint 500 run, `runs/packaged/sprint-500-*`); mutant fails.
- S3 `editor_focus_switches`: passes from source and on the bundle. Two sessions on large fixtures (14 files over folders three to five deep, two 16,724-line files); pane 1 four tabs, pane 2 three tabs with its files column folded; ten switches, each read from the DOM, the pixel anchor and its EDITOR_DRAWN record, all agreeing. Screenshot of switch 10 read: pane 2 shows its three tabs, `long_two.txt` shown, files column folded. Mutant (one store for every pane): fails, pane 2's tree never draws its folders. Shared drivers: `harness/shakeout/lib/multipane.ts`.
- S2 and S9 `editor_one_session_two_panes`: pass from source. S9 found a bug: pane 2 rebound to a new session kept the old session's two tabs (`EDITOR_DRAWN` tab_count 2 before any open). Fixed: `showEditorFor(paneId, sessionId)` gives a pane a fresh editor when its session changes. Mutant (no reset): fails at S9's first open.
- S4 and S5 `editor_unsaved_per_pane`: pass from source. Found two bugs, both fixed. (1) A turn sent from pane 1 saved pane 1's file but left its tab marked unsaved: `saveForSend` cleared the mark only when the shown editor held the sending session; it now clears it in the sending pane's editor. Mutant (the old check): fails. (2) `EDITOR_SAVED_FOR_SEND` from a pane whose editor was closed broke S11; the tag's note says it comes from any sending pane, so S11 excepts it (vocabulary 0.70, P-0.70-S11-SEND).
- S6 and S7 `editor_find_and_close`: pass from source. Pane 1 find "self" (1 of 163) and search "import" (9 files), pane 2 find "const" and search "function"; each kept its own across switches; pane 2 closed with an unsaved edit, pane 1 unchanged, the next pane (3) opened empty. Pane ids are not reused, so `dropEditor` on close frees memory and no gate can see it. Mutant (one store): fails.
- S8 `editor_follow_per_pane`: passes from source. Two scripted deterministic sessions (driver params `script`), turns posted over the API while pane 2's editor is shown: session A's `edit_file` wrote its file and marked nothing in pane 2; session B's marked pane 2 once, at its own call's seq (52), and was CONFIRMED. The first mutant run passed, because both sessions' records put their calls at the same seqs; session A now reads its file first, so its calls sit at 33 and 74, and the mutant (pane 2's follow reading pane 1's envelopes) fails: "pane 2's mark names seq 74; session B's last edit_file is seq 52".
