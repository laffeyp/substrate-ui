# PLAN: the process folder — what is current, where documents go

*2026-10-29. Scope: `substrate-ui/process/`. The kernel repo `../substrate/` is out of scope. Nothing here has been moved yet; § 4 is the list of moves.*

## 1. What is current

A document is current when the work it describes is open. The test used here is mechanical: a current document names it. The current documents are the three open roadmaps and their ledger in `planning/open/`, `planning/OPEN-ITEMS-2026-10-10.md`, `process/BACKLOG.md`, `WORKING_AGREEMENT.md` and `README.md`. Run on 2026-10-29 over the 72 files at the top of `process/planning/`, the test finds four that are named:

| File | Named by |
|---|---|
| `OPEN-ITEMS-2026-10-10.md` | `open/ROADMAP-2026-10-11-before-distribution.md`, `WORKING_AGREEMENT.md` line 135 |
| `DESIGN-2026-10-13-language-in-the-app-r2.md` | the runbook (§ 1.3); its round 1 is the file without `-r2` |
| `FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md` | `process/BACKLOG.md` |
| `RUNBOOK-2026-10-28-project-r3.md` | `README.md` (now superseded by `RUNBOOK-2026-10-29-project-r4.md` at the repo root) |

The other 68 are history: no open work names them. One file in `planning/open/` is not open: `ROADMAP-2026-10-28-spdx-headers.md` closed with sprint 191 (`d4322e1`; all 206 tracked source files carry the header).

Outside `planning/`:

- current: `process/BACKLOG.md`, `process/methodology/2026-09-24-autonomous-build-topology.md`, `process/sprints/` (the cards, 138 files, last change 2026-10-27).
- history: `process/ROADMAP.md` (2026-06-23), `SDD-ARC-PLAN.md` and `SDD-HARNESS-PORT-PLAN.md` (2026-08-17), `HARNESS-CATALOG.md` (2026-08-29, before the classic tree was retired on 2026-09-22), `sprints_v0.1/` and `signal_reports/` (last change 2026-09-11), `refactor-reviews/` (2026-08-29). No current document names any of them.
- not this project's: `planning/writing-kernel/` holds four files identical, byte for byte, to files in `~/Documents/Claude/Projects/writing-kernel/` (`analyses/`, `architecture/`, `research/`).

## 2. The theory of document organization

Neither repo has one written down. The pieces that exist are scattered: kit hard rule 12 and TECHNIQUES #36 (no deletions; a new round is a new file), the user's memory rules (a new dated version, never an in-place edit; a variant on other assumptions is a section, not a version), the runbook's § 13, and sprint 190's `open/`, `completed/` and `superseded/` folders, which it applied to roadmaps only. The theory below joins them.

**Three kinds of document, three rules for change.**

1. **Records** — `BLACKBOARD.md`, `KIT_DIARY.md`. Append-only logs. The newest entry is at the bottom, so the end of the file is the recent record. `BLACKBOARD.md` takes this form from 2026-10-29. `KIT_DIARY.md` still puts its newest entry first.
2. **Ground files** — `WORKING_AGREEMENT.md`, `README.md`, `CLAUDE.md`. Edited in place, because a session must read one current copy. Before a large change the prior version is moved to `process/archive/` under a dated name, as `WORKING_AGREEMENT-2026-06-17-to-2026-10-11.md` already is.
3. **Working documents** — plans, roadmaps, research, designs, reviews, postmortems, runbooks. One round per file, never edited. A correction is a new round.

**Status is the folder.** Every working document lives in one of three folders under `process/planning/`:

- `open/` — the work it describes is not finished, or a current document names it.
- `completed/` — the work finished, or the document was a one-time record (status report, postmortem, spike).
- `superseded/` — a later round, or a later document on the same subject, replaced it.

When a new round lands, the earlier one moves to `superseded/`. When the work closes, the document moves to `completed/`. The top of `process/planning/` holds only the three folders. Data that supports a document (stream captures, design sheets) sits in a folder beside it and moves with it. Another project's files are not kept here. Status by folder follows the status field of an Architecture Decision Record (Nygard, "Documenting Architecture Decisions", 2011: proposed, accepted, deprecated, superseded), with the folder doing the job of the field so that `ls open/` lists what is current.

**Names.** `TYPE-YYYY-MM-DD-slug.md` for round 1, `TYPE-YYYY-MM-DD-slug-rN.md` for later rounds; the date is the date of round 1. Files already on disk keep their names. Old citations quote the names, and a rename would break them where a move does not: `git log --follow` traces a moved file.

**Moves are `git mv`.** Nothing is deleted.

**Where the theory binds.** `WORKING_AGREEMENT.md` gains a `## Documents` section stating § 2, so every session reads it. The kit allows this: the working agreement augments `AGENTS.md`, and nothing here conflicts with a hard rule.

## 3. Facts that bear on the moves

- Earlier documents cite planning files by their old paths (`process/planning/X.md`). After a move those citations point at a path that no longer holds the file. The file's name does not change, so `find process -name X.md` finds it.
- Sprint 190 already moved roadmaps on 2026-10-27; this plan applies the same rule to every other working document.

## 4. The moves

| From `process/planning/` | To |
|---|---|
| `OPEN-ITEMS-2026-10-10.md`, `DESIGN-2026-10-13-language-in-the-app-r2.md`, `design-sheets/`, `FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md` | `open/` |
| `open/ROADMAP-2026-10-28-spdx-headers.md` | `completed/` |
| Earlier rounds: `CLASS-2026-10-02-agent-work-modelled-as-a-short-request.md`; `delegation-research.md`, `-r2`, `-r3`, `-r4`; `DESIGN-2026-09-14-session-transparency.md`, `-r2`, `-r3`, `-r4`; `DESIGN-2026-10-13-language-in-the-app.md`; `EPIC-PLAN-v0.1-2026-09-10.md`; `PLAN-2026-09-21-vocabulary-shakeout.md`, `-r2`, `-r3`; `PLAN-2026-09-24-phase-9-electron-wrapping.md`; `RESEARCH-2026-09-24-electron-integration.md`; `RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources.md`; `SPIKE-2026-09-15-read-file-byte-cap.md`; `RUNBOOK-2026-10-28-build-and-release.md`, `RUNBOOK-2026-10-28-project-r2.md`, `RUNBOOK-2026-10-28-project-r3.md` | `superseded/` |
| The other 48 dated files at the top of `planning/` (AUDIT, the remaining CLASS, DESIGN, DIRECTION, EPIC-PLAN, FEATURE-MAP, FOLD, GAP, PLAN, POSTMORTEM, PROPOSAL, RESEARCH, REVIEW, SPIKE, STATUS and WIRING files), and `evidence-2026-10-10-harness-streams/` beside `RESEARCH-2026-10-10-harness-tool-calls-on-the-record.md` | `completed/` |
| `writing-kernel/` | `process/archive/writing-kernel-copies-2026-10-28/` |
| `process/ROADMAP.md`, `process/SDD-ARC-PLAN.md`, `process/SDD-HARNESS-PORT-PLAN.md`, `process/HARNESS-CATALOG.md` | `process/planning/completed/` |

Two pairs need a reading before they are filed, because their names do not show whether one replaces the other: `PLAN-2026-09-14-phase-7-flat-design-parity.md` and `PLAN-2026-09-14-r2-flat-design-parity.md`; `RESEARCH-2026-09-25-cli-adapter-auth-lifecycle.md` and `RESEARCH-2026-09-25-cli-adapter-login-flow-in-substrate-v2.md`. Until read, all four go to `completed/`.

`sprints_v0.1/`, `signal_reports/` (714 files) and `refactor-reviews/` stay where they are; they are history in folders of their own, and moving 714 files buys nothing.

Done when: `ls process/planning` shows only `open/`, `completed/`, `superseded/`; `ls process/planning/open` lists only current work; `WORKING_AGREEMENT.md` has `## Documents`; `README.md` names the round-4 runbook; the runbook's § 1.3 paths match the new places (a round 5 of the runbook, since a round is never edited).
