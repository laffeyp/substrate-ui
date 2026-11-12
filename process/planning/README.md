# process/planning — the pieces of work

*Current as of 2026-10-29 (status wording no longer names the retired `open/`, `completed/` and `superseded/` folders).*

One folder per piece of work, named by the date the work began and its subject. Each folder holds that work's designs, plans, roadmaps, research, status reports, postmortems and reviews; earlier rounds sit in its `superseded/`. `OPEN-ITEMS-2026-10-10.md` beside this file is the list current work is drawn from.

A new piece of work gets a folder and a row here on the day its first document is written. Its status changes here when its roadmap or plan closes.

| Folder | Piece of work | Status | Sprints |
|---|---|---|---|
| `2026-08-14-sdd-instrumentation-arc/` | SDD instrumentation arc (`SDD-ARC-PLAN.md`, `SDD-HARNESS-PORT-PLAN.md`) | closed 2026-08-17 (blackboard) | 018–032 |
| `2026-08-16-roadmap/` | Roadmap as of 2026-08-16 (SDD-instrumentation arc, UI-NEXT queue) | ended: superseded by the dated roadmaps after it | 030, 031 |
| `2026-08-28-piece-g/` | Piece G: the daily-driver terminal | ended: postmortem 2026-08-29 | 035s; 033–040c |
| `2026-09-10-prototype-port/` | Prototype port | no closing document; the presentation-model plan of 2026-09-12 followed it | `process/sprints_v0.1/` |
| `2026-09-12-presentation-model/` | Presentation model, phases 1–6, with the vocabulary lock and delegation | closed: vocabulary v0.1 ratified 2026-09-22; classic tree retired 2026-09-22 | 052, 055 |
| `2026-09-14-flat-design-parity/` | Flat-design parity (the 2026-09-14 "Phase 7") | closed: `STATUS-2026-09-14-phase-7-closed.md` | — |
| `2026-09-14-session-transparency/` | Session transparency and interrupt (the 2026-09-14 "Phase 8") | closed: `STATUS-2026-09-15-phase-8-closed.md` | — |
| `2026-09-23-reveal-shell-hardening/` | Reveal-shell hardening (the 2026-09-23 "Phase 7") and the transcript migration (the 2026-09-23 "Phase 8") | closed: Phase 8 closed 2026-09-24 (named in the Electron plan) | 057, 063a, 070–076 |
| `2026-09-24-electron/` | Phase 9: Electron, and CLI driver login | closed: the blackboard records "Phase 9 CLI-auth arc closes — Sprint 085c" (2026-09-25) | 077–085c |
| `2026-09-27-post-ship-directions/` | Post-ship directions: Studio, moves, the mastering layer, mobile | not started; `process/BACKLOG.md` names it | — |
| `2026-09-28-packaging/` | Packaging (the 2026-09-25 "Phase 10") and the engineering-practice classes it led to | closed: configuration roadmap closed 2026-09-29; background-commands roadmap closed (sprints 103–105) | 088–107 |
| `2026-10-08-lens-audit/` | Lens-audit remediation | open: its roadmap has not closed | 108–113 |
| `2026-10-10-harness-drivers/` | Harness drivers: tool calls on the record, workspace permission | closed: U129–U131 and kernel K282–K286 (named in `OPEN-ITEMS-2026-10-10.md`) | 129–131 |
| `2026-10-10-model-picker/` | The model picker in the workspace bar | open: its roadmap has not closed | 124–128 |
| `2026-10-11-before-distribution/` | Before distribution, with the build runbooks | open: its roadmap has not closed | 133–154, 190 |
| `2026-10-12-slash-entry/` | Entering a slash command | closed: its roadmap closed | 163–166 |
| `2026-10-13-language/` | Language measurements in the app | closed: its roadmap closed | 168–175 |
| `2026-10-28-spdx-headers/` | SPDX headers on every source file | closed: sprint 191, commit `d4322e1` | 191 |
| `2026-10-29-document-organization/` | Organizing substrate-ui's documents | closed 2026-10-29: carried out in commits 047effa–1149ec5 | — |
| `2026-11-04-editor-level/` | The editor view (sheet turn 24 of checkpoint 7; turns 16–17 through round 8): research before build | closed: superseded by the design spec; all rounds moved to `superseded/` | — |
| `2026-11-04-shell-to-react/` | Move the shell from dc-runtime to typed React; precondition for the editor view | closed 2026-11-05: G1 sprint 345, 60 of 60 gates | 345 |
| `2026-11-05-editor-shared-work/` | The editor view's shared work, items 0(a)–0(h) of `2026-11-04-editor-level/RESEARCH-2026-11-05-editor-view-r11.md` | open: plan round 2 (the trace rule applied to every item); 0(a), 0(b), 0(c) (sprint 387: the write and the file tags), 0(d) (kernel K340) done; next 0(e), attachments on UserMessage (kernel) | 346–349, 387; kernel K340 |
| `2026-11-05-sdd-signals/` | Make substrate-ui an SDD app: every process emits its locked vocabulary to disk, readable at all times; the only work until it closes | closed 2026-11-08: plan round 4 (items 1–8 on 2026-11-08; items 9–14, the gaps a review found, sprints 382–386; the packaged build installed and open) | — |
| `2026-11-09-code-editor/` | The code editor: ⌘⇧E view, file explorer, inspector spine, column configs, add-to-message for files | open: roadmap r13, the rest of the editor from the design (built through E10.5 and E12, sprints 444–461; E14 and E13 to build) (sprints 389–402 reverted, set aside in `_deprecated/editor-phase-1-2026-11-09/`); the hard stop comes when the editor is done | 389–402 (reverted); 403– |
| `2026-11-09-feature-breakdown/` | Breaking the design spec's features into separate projects — one plan per feature, no front-loaded shared work | open | — |
| `2026-11-11-second-build/` | A second build beside the one in use, so Substrate is built from inside Substrate (`PAPER-2026-11-11-second-build-r2.md`, `ROADMAP-2026-11-11-second-build-r2.md`) | closed 2026-11-11: Substrate Next installed; 491–493 dropped (`process/sprints/dropped/`) | 487–490 |
| `2026-11-12-continue-a-session/` | Continuing an agent's session (Claude Code first) in Substrate (`RESEARCH-2026-11-12-continue-a-session-r2.md`, `ROADMAP-2026-11-12-continue-a-session-r2.md`) | open: roadmap r2, E7 (sprints 349, 497) | 494–495; kernel 345–348 |
