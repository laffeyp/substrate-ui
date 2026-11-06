# Plan — the editor view's shared work (round 1)

*2026-11-05. Source: `process/planning/2026-11-04-editor-level/RESEARCH-2026-11-05-editor-view-r11.md`, "Order of work", items 0(a)–0(h), which come before the editor view's code mode. The move off dc-runtime, which round 11 put first, is done (`process/planning/2026-11-04-shell-to-react/`, sprints 199–345).*

## Rules

- A refactor changes nothing a user sees or does: not the UI, its text, its logic or its behaviour. Items that only restructure (0(a), 0(b)) are refactors and are checked against the pixel baseline and the gates with no difference allowed.
- Items that add what the design asks for (0(c)–0(h)) add only that; nothing existing is removed, reworded or redesigned. Each is built from the design's own words (`design/received/handoff 5/`) and its decision numbers; a detail the design leaves open goes to the BLACKBOARD as an open question, not into the build.
- Kernel items (0(d), 0(e)) are changes to `substrate`, made in that repository.

## Items, in order

| # | What | Kind | Repository |
|---|---|---|---|
| 0(a) | One field for the open view, with the view a page returns to; the keys go to the open view first | refactor | substrate-ui |
| 0(b) | A widget registry for views that hold their own DOM (CodeMirror); a test that an editor keeps its undo history and cursor through a re-attach | new, no visible change | substrate-ui |
| 0(c) | The workspace file API: list, read, write, watch, each held to its workspace | new, server | substrate-ui `server.py` |
| 0(d) | A kernel call that appends an edit event to a session's record during or between turns; the edit event kinds | new, kernel | substrate |
| 0(e) | Attachments on `UserMessage`, one shape for every view's chips (D94); images sent to the model | new, kernel | substrate |
| 0(f) | Two pane kinds, `SessionPane` and `ShellPane` | refactor first, then new | substrate-ui |
| 0(g) | The input bar in every surface (D90) | new, visible | substrate-ui |
| 0(h) | Chips in the input bar; meta's stream rows and the panes' transcript offer "add to message" | new, visible | substrate-ui |

## 0(a) in detail

Today the window holds `revealed` (meta or panes) and `surface` (records, assays, studio or none). A page opens over whichever of panes and meta is showing and returns to it on close. One field names the open view, `panes`, `meta` or a page; a second names the view a page returns to, `panes` or `meta`. The transitions are today's, one for one: ⌘M and the view button toggle panes and meta and close any page; a page's key or button opens it, or closes it when it is open; Escape closes a page; a split, a session opened from the records page, and `/language` go to panes, panes, and meta. The pure module `web/app/derive/open_view.ts` holds them, with a spec; `App.tsx` uses it. Check: every gate 0, pixels equal to the current captures.
