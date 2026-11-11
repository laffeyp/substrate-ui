# The footer and the header as 24a draws them: each field and its source

*2026-11-11. Roadmap r13 E11 asks for each field traced to its source before any code. Frame 24a is rendered by `npx tsx harness/design/render_frames.ts 24a` (`runs/design/sheet-v11/24a.png`); the app as it stands is the sprint 457 screenshot (`runs/packaged/sprint-457-20261111-193627-source/code-menu.png`). Where a frame and a decision's text disagree, the decision governs (roadmap r13).*

## The header

| Field | 24a | The app today | Source |
|---|---|---|---|
| Name | `fix-cart-rounding` | `pane-1` for an unnamed session | The pane's name (`topBar.crumb`); double-click renames. Same source; 24a draws a named session. |
| Model chip | `kimi-k2 ▾` | `deterministic`, no ▾ | The pane's driver (`topBar.driverName`). The ▾ is missing; the chip opens the model card on a click (`toggleModelCard`). |
| Workspace chip | `⌥ crumb/fix-cart-rounding` | `⌥ substrate/<pane name>` for a worktree; the whole folder path, `~` for home, for a folder; `⌥ sandbox` | `App.tsx` `wsLabel`. 24a draws the repository's name and the branch without its `substrate/` prefix. The folder path is what overflows the bar today. |
| Pages | records · studio · planning | records · studio | planning is another editor mode, which waits for the Claude Design SDD process (BLACKBOARD 2026-11-09, the hard stop). Not part of E11. |
| View chip | `⌘⇧E pane` on the accent | the same | Sprint 409. Done. |

## The footer

| Field | 24a | The app today | Source |
|---|---|---|---|
| Status | `● live` | `● live`; `● finalised`; `○ <connection>` | `derive/footer.ts`, the pane's connection and end. Done. |
| After the status | `· clean`, or `· turn running` in frames 21b, 21d, 21f | nothing | **No source.** The sheet draws `clean` 48 times and `turn running` 3 times in this slot, and the design spec and decisions never define it. Nothing in the app, the server or the kernel's API computes a health verdict (the scope's "health verdict" names one; `grep -i health` finds only `adapters/rate_limit.py` in the kernel). `turn running` has a source: the controller's running state, which Escape's interrupt already reads. |
| Record | `record 01M1684 · 244 events` | `session pane-1` | The record's short name and its event count: the editor's meta header already draws `snap.sessionName` or the session id's first seven characters, and `rawEnvelopes.length` events (`EditorView.tsx`, `data-record-name`, `data-record-head`, 24b). 24a draws the id, not the name, since the header already shows the name. |
| Hint | `esc or ⌘⇧E back to the pane · ⌃⇧\` inspector ⇄ record` | `⌘⇧E back to the pane · ⌘M meta` | Decisions govern: Escape interrupts the model in the editor (the Architect, 2026-11-10, sprint 447), and ⌘M opens the meta pane in the editor (2026-11-09, sprint 430). The app's hint is right. |

## What is open

What `clean` means. Three readings fit the frames, and each has a different source:

1. **The turn's state**: `clean` at rest, `turn running` during a turn. Source: the controller's running state. The word `clean` would then say only "nothing running".
2. **The record's health**: `clean` when the session's record holds no failure (`substrate.ProducerFailed`, a quarantined predicate, a model error), else the count of them. Source: the record, which the controller already streams.
3. **The workspace**: `clean` when the worktree has no uncommitted changes. Source: `git status` through the server; the status line already shows the changes against the base.

Until it is settled, the footer draws `· turn running` while a turn runs and nothing after the status otherwise (D6: nothing drawn is invented).
