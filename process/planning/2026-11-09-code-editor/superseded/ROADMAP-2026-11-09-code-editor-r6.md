# Roadmap — the code editor, Phase 1 again from the design (round 6)

*2026-11-09. Supersedes `ROADMAP-2026-11-09-code-editor-r5.md` (left on disk). Round 5 kept the code of sprints 389–402 and added verification to it. The Architect's direction of 2026-11-09 is to redo the editor work completely, by SDD. This round plans Phase 1 only: the Phase 1 hard stop (BLACKBOARD `user` entry, 2026-11-09) stands, and nothing past Phase 1 is planned here. Round 4's Phases 2–5 wait for the design team's Claude Design SDD Process.*

---

## Why

substrate is a cockpit for directing a model (spec r6 §0, D90, D91). The editor view is where a person watches the session's file work land. Phase 1 builds the view's frame: the view itself, its four areas, the file tree with the files changed vs main, and the column configurations. Later phases put the editor, the inspector and the follow behaviour into that frame.

## What the first attempt got wrong, by source

Sprints 389–402 were built without the design frames in any card's `context_files` (hard rule 8). Their code, gates and one spec are set aside in `_deprecated/editor-phase-1-2026-11-09/`, with the tracked changes as `phase-1-tracked-changes.diff`; the cards are marked `reverted`. Measured against the design:

| First attempt | Design | Source |
|---|---|---|
| The editor is a state of one pane (`AppPane.editorOpen`, `PANE_DRAWN.state=editor`); in a split it draws inside a small pane | A window view, like reveal, on the focused pane's session; the header chip reads "⌘⇧E pane" | spec §4; D86; frames 24a, 24h; `web/app/derive/open_view.ts` header ("so the editor view can be one more value") |
| ⌘⇧E registered as a menu accelerator | The renderer's keydown owns view keys; View items carry no accelerator | `electron/menu.ts` lines 15–19 |
| Modified dots green, yellow, red, and on folders | One accent dot (#82a5c8) after the file name; folders carry none | D7 (no green, no yellow); frame 24a |
| Focus folds the columns whenever the input bar has focus | Focus is a configuration: everything collapsed but the prompt | spec §5.1 (4); frame 16c |
| The tree reads the workspace through a new Electron IPC channel | The server's workspace file API is the backend (`GET /api/session/<id>/files`, sprint 348, `FILES_LISTED`) | canonical home registry (`server.py` is the sole backend) |
| The diff runs in Electron main | A per-session read on the server, beside the file API | round 4's own technical decision |
| A yellow "Read-only" bar | Nothing in Phase 1 edits, so nothing is read-only yet | D6 |
| Column toggles from the View menu never reached the window (`preload.ts` had no listener) | Every menu item reaches the window | postmortem finding 3 |

## The design inputs every card reads (hard rule 8)

- `../design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md`: §0, §2, §4, §5.0, §5.1, §8.
- `../design/received/handoff 5/docs/DESIGN-DECISIONS -through 2026-11-04-.md`: D6, D7, D8, D9, D32, D40, D49 (c, d), D51, D53, D63, D81, D82, D85, D86, D90, D93.
- `../design/received/handoff 5/docs/EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md`: sections 2 and 3.
- Frames from `../design/received/handoff 5/sheets/Substrate Shell Directions v11.dc.html`, rendered to PNG by `harness/design/render_frames.ts` into `runs/design/sheet-v11/`: **24a** (the layout of record), **24h** (the views), **16c** (rails and the sill).

## Phase 1, traced

Each item names its source. Each item is done when its tags fire in the packaged app's trace under the real input path, a screenshot at 1512 and 504 points wide has been read beside the frame it answers to, and the adversarial question in its card has a test.

| # | Item | Source |
|---|---|---|
| R1 | ⌘⇧E opens the editor view on the focused pane's session; ⌘⇧E or esc returns to the pane. At a picker with no session the key is refused and says so in the trace. View ▸ Editor does the same. | spec §4, §8; D86; 24h; 24a footer |
| R2 | The header in the editor view shows the "⌘⇧E pane" chip in the accent; the footer names the way back. | spec §4 ("the header chip names the way back"); 24a header and footer |
| R3 | Four areas: left column, centre, right column (inspector), bottom panel holding the pane's substrate terminal (transcript, activity line, input bar). Dividers by surface value; system mono; the palette of D7. | spec §4, §5.1; D7, D8, D9, D81; 24a |
| R4 | The left column's tab row reads `files`; its body is the workspace tree from the server's file API, folders first, ▾/▸ to open and fold, each folder read when opened. Its foot names the workspace path and shape. | spec §5.1 ("files — today's explorer"); 24a left column |
| R5 | Files changed vs main carry the accent dot. The server reads the diff per session against main's merge-base, new files included. A workspace with no git repository shows no dots. | D48; spec §5, §5.1; 24a; round 4 "The diff is vs main" |
| R6 | Each side column folds to a labelled rail with ◂/▸ and a vertical label; the bottom panel collapses to a sill that keeps its input, and typing reopens the history. One key each: ⌥⌘L, ⌥⌘R, ⌘J. | spec §5.1 (1); D49 (d); D51; 16c; BLACKBOARD 2026-11-09 column-key decision |
| R7 | The terminal docks bottom (default) or right. | spec §5.1 (2) |
| R8 | The sides swap. | spec §5.1 (3) |
| R9 | Focus collapses everything but the prompt, and the same command restores the layout before it. | spec §5.1 (4); 16c |
| R10 | Widths are remembered per mode; until collection restore exists they live in `localStorage` under the mode's key. | spec §5.1 (5); round 4 |
| R11 | The window's other keys keep their meaning in the editor view: ⌘M meta, ⌘3 assays, ⌘D/⌘⇧D split, ⌘, settings, ⌘F find. | D86; `web/app/keymap.ts` |

Phase 1 draws only what Phase 1 makes work (D6). The left tab row shows `files` alone; `search`, `open` and `activity` arrive with their phases. The inspector column shows its header and no sections, since no file is open in Phase 1. The centre shows no editor and no status line.

## Vocabulary

v0.28 is locked and stays the base; its editor tags were written for a per-pane editor. The session for Phase 1 reads v0.28 against the frames and produces v0.29 through typed proposals before any implementation card:

- `VIEW_CHANGED` from and to gain the value `editor`; the editor is an open view.
- `PANE_DRAWN.state=editor` is retired: panes are not drawn while the editor view shows.
- `EDITOR_KEY_REFUSED.reason` gains `no_session` (R1's refusal).
- `EDITOR_COLUMN_FOLDED` gains `cause` (key, menu, rail, focus).
- New tags for R7–R10, one per observable change: the dock set, the sides swapped, focus set, a column resized.
- `EDITOR_DRAWN` gains the fields R4–R9 draw: the dock, the swap, focus, the tree's visible rows and the dot count.
- A server tag for the diff read, naming its base (`main`, the default branch, the first commit, or none) and the file count.

## Verification, per card

The postmortem names what the first attempt skipped; each card's observation contract carries all of it:

1. **The real input path.** The gate binds a pane through the picker (`bindPaneAsUser`, keyboard and clicks), presses ⌘⇧E with Playwright's keyboard on the window, and clicks View items through `Menu.getApplicationMenu()` in the main process.
2. **The trace rule.** The gate runs from source, then with `SHAKEOUT_APP` set to the bundle built for the card. Tags, payloads and order are asserted on the trace files after the app closes (`windowRecords`); any `INVARIANT_BROKEN` fails the gate.
3. **Track 2.** The gate writes window screenshots at 1512×945 and 504×945 points to `runs/packaged/sprint-NNN-<stamp>/`, the folder `captures/README.md` names for gate captures. The agent reads each beside the frame it answers to and writes what differs into the Signal Report.
4. **The adversarial lens.** Each card states how its gate could pass with a broken app, and tests that case.
5. **The Rubber Duck Pass** narrates `scripts/read_trace.py --home <state> --category editor` from the packaged launch.

## Order of work

1. Render the design frames into the repository (`harness/design/render_frames.ts`).
2. The vocabulary session: v0.29.
3. R1 and R2: the open view, the key, the refusal, the menu item, the chip and footer.
4. R3: the four areas, with the pane's terminal in the bottom panel.
5. R4: the tree. R5: the diff read on the server, then the dots.
6. R6, then R7, R8, R9, R10, each its own card.
7. R11 and the Phase 1 integration card: every gate on a fresh bundle, installed, open on screen.

Each card is written when its turn comes, ≤2 files and one concept, with the design inputs in `context_files`.
