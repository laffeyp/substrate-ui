# PLAN: organizing substrate-ui's documents (round 5)

*2026-10-29. Status: proposed; nothing has moved. Supersedes round 4 (`PLAN-2026-10-29-document-organization-r4.md`), which filed every planning document by status alone — open, completed, superseded — and so put a design, its plan, its status reports and its postmortem in different folders. This round files them by the piece of work they belong to. The reasons for each rule, with their sources, are at the end under "Why these rules".*

## What the plan changes

substrate-ui keeps 1,124 Markdown files. 86 of them are planning documents: designs, plans, roadmaps, research, status reports, postmortems, reviews, runbooks. Each one belongs to a piece of work: a design leads to a plan, the plan to sprint cards, the sprints to status reports and sometimes a postmortem. Today those documents lie in one flat folder, `process/planning/`, and three status folders, with nothing to say which belong together. A session that opens one cannot find the rest of its work, and cannot tell the current round from an old one.

The plan groups the 86 documents, and three old plans from the top of `process/`, into 19 pieces of work, one folder each, named by the date the work began and its subject, with earlier rounds in a `superseded/` folder inside. An index, `process/planning/README.md`, lists every piece of work with its status and its sprints. It also writes six lines of rules into the working agreement, removes the other project's copies, joins the two sprint folders, puts each sprint card on one status word, makes the knowledge diary grow at the bottom, and points the README and the runbook at the new places. Every move is a `git mv` that keeps the file's name. Nothing is deleted.

## The rules

This is the whole of what goes into `WORKING_AGREEMENT.md`, as a new section `## Documents`:

> - **Records** (`BLACKBOARD.md`, `KIT_DIARY.md`): append at the end, newest last; nothing above the last entry changes.
> - **Ground files** (this file, `README.md`, `CLAUDE.md`, the runbook at the repo root, the signal vocabulary): one copy, edited in place, dated on the first line; a prior version goes to `process/archive/`.
> - **Working documents** (designs, plans, roadmaps, research, status reports, postmortems, reviews): one folder per piece of work, `process/planning/YYYY-MM-DD-subject/`; one round per file, never edited; a new round names the file it supersedes, and the old round moves to the folder's `superseded/`. `process/planning/README.md` lists every piece of work, its status and its sprints.
> - **Sprint cards** (`process/sprints/`): `status:` is one of `pending`, `active`, `closed`, `closed-partial`, `reverted`, `withdrawn`, `superseded`.
> - **Read the current set:** `process/planning/README.md`, the folders it marks open, the ground files, `tail -n 60 BLACKBOARD.md`, and every decision with `grep -nE '^- \*\*[0-9-]{10} (user|agent-resolved)\*\*' BLACKBOARD.md`. Open anything else only when a current document points to it.
> - **Names:** `TYPE-YYYY-MM-DD-subject.md`, later rounds `-r2`, `-r3`; files already on disk keep their names. Nothing is deleted. Another project's files live in that project.

## The steps

Each step lists what it changes and the command whose output proves it done. The steps run in order; each is one commit.

### Step 1. Write the rules into the working agreement

Add the six lines under "The rules" to `WORKING_AGREEMENT.md` as `## Documents`, and set its date line to the day of the change.

Done when: `grep -c '^## Documents' WORKING_AGREEMENT.md` prints 1.

### Step 2. One folder per piece of work

Create the 19 folders named in the table under "The index" and `git mv` each document into its folder, or into the folder's `superseded/`. The list "Every move in step 2" at the end names each file. `open/`, `completed/` and `superseded/` empty out and are removed by `git mv` of their last file. `OPEN-ITEMS-2026-10-10.md` stays at the top of `process/planning/`: current work across every piece is drawn from it.

Four more documents move:
- `process/ROADMAP.md` (last changed 2026-06-23) to `process/planning/2026-08-16-roadmap/superseded/`: `ROADMAP-2026-08-16.md` opens "Supersedes the 2026-06-23 `ROADMAP.md`".
- `process/SDD-ARC-PLAN.md` and `process/SDD-HARNESS-PORT-PLAN.md` (last changed 2026-08-17) to a new folder, `process/planning/2026-08-14-sdd-instrumentation-arc/`: both were written 2026-08-14 for that arc, which the blackboard records closed on 2026-08-17.
- `process/HARNESS-CATALOG.md` (last changed 2026-08-29) to `process/archive/`: a ground file listing harnesses, most of which moved to `_deprecated/classic-tree/` on 2026-09-22.

Done when: `ls -p process/planning | grep -v /` prints only `OPEN-ITEMS-2026-10-10.md` and `README.md`, and every folder in the index exists.

### Step 3. Write the index

Create `process/planning/README.md` with the table under "The index", a first line giving its date, and one line naming the rule for adding a row: a new piece of work gets a folder and a row the day its first document is written; its status changes when its roadmap or plan closes.

Done when: every folder under `process/planning/` has a row, and every row's folder exists.

### Step 4. Remove the other project's copies

`git mv process/planning/writing-kernel process/archive/writing-kernel-copies-2026-10-28`. Its four files are identical, byte for byte, to files in `~/Documents/Claude/Projects/writing-kernel/`, which has them in its own git history.

Done when: `ls process/planning/writing-kernel` fails.

### Step 5. Join the two sprint folders

`git mv sprints/* process/sprints/`. The root `sprints/` holds cards 008–055 (73 files, last changed 2026-09-21); `process/sprints/` holds 001–007 and 056 on (138 files). No file name and no card number appears in both.

Done when: `ls sprints` fails and `ls process/sprints | wc -l` prints 211.

### Step 6. One status word on every sprint card

Change the `status:` line on the 23 cards in the table "Every status change in step 6" at the end; two cards with no `status:` line get one. Any explanation moves to a `status_note:` line.

Done when: `grep -h '^status:' process/sprints/*.md | sort -u` prints only words from the list, and `grep -L '^status:' process/sprints/*.md` prints nothing.

### Step 7. The knowledge diary grows at the bottom

`KIT_DIARY.md` puts its newest entry first (44 entries). Reorder it the way `BLACKBOARD.md` was reordered on 2026-10-29: entries in date order, oldest first, every line kept; the hypothesis table stays above the entries. A script compares the old and new non-blank lines as sorted lists and prints any line missing or added.

Done when: the script reports nothing missing and nothing added, and the file ends with the newest entry.

### Step 8. Point the README and the runbook at the new places

- `README.md` names `RUNBOOK-2026-10-29-project-r4.md` at the repo root, where it now names `process/planning/RUNBOOK-2026-10-28-project-r3.md`.
- A new round of the runbook, `RUNBOOK-2026-10-29-project-r5.md` at the repo root, replaces round 4's reading list with the current set: the index, the open folders, the ground files and the read commands. Round 4 and the untracked hand copy of round 3 at the root move to `process/planning/2026-10-11-before-distribution/superseded/`.

Done when: `grep -c 'RUNBOOK-2026-10-29-project-r5' README.md` prints 1, and every path in round 5's reading list exists.

### Step 9. Record it

Append a `built` entry to `BLACKBOARD.md` naming the commits from steps 1–8.

Done when: `tail -n 5 BLACKBOARD.md` shows it.

## The index

The table that goes into `process/planning/README.md`. Status comes from the work's own closing document or from the folder sprint 190 filed its roadmap in.

| Folder | Piece of work | Status | Sprints |
|---|---|---|---|
| `2026-08-14-sdd-instrumentation-arc/` | SDD instrumentation arc (`SDD-ARC-PLAN.md`, `SDD-HARNESS-PORT-PLAN.md`) | closed 2026-08-17 (blackboard) | 018–032 |
| `2026-08-16-roadmap/` | Roadmap as of 2026-08-16 (SDD-instrumentation arc, UI-NEXT queue) | ended: in `superseded/` since sprint 190 | 030, 031 |
| `2026-08-28-piece-g/` | Piece G: the daily-driver terminal | ended: postmortem 2026-08-29 | 035s; 033–040c |
| `2026-09-10-prototype-port/` | Prototype port | no closing document; the presentation-model plan of 2026-09-12 followed it | `process/sprints_v0.1/` |
| `2026-09-12-presentation-model/` | Presentation model, phases 1–6, with the vocabulary lock and delegation | closed: vocabulary v0.1 ratified 2026-09-22; classic tree retired 2026-09-22 | 052, 055 |
| `2026-09-14-flat-design-parity/` | Flat-design parity (the 2026-09-14 "Phase 7") | closed: `STATUS-2026-09-14-phase-7-closed.md` | — |
| `2026-09-14-session-transparency/` | Session transparency and interrupt (the 2026-09-14 "Phase 8") | closed: `STATUS-2026-09-15-phase-8-closed.md` | — |
| `2026-09-23-reveal-shell-hardening/` | Reveal-shell hardening (the 2026-09-23 "Phase 7") and the transcript migration (the 2026-09-23 "Phase 8") | closed: Phase 8 closed 2026-09-24 (named in the Electron plan) | 057, 063a, 070–076 |
| `2026-09-24-electron/` | Phase 9: Electron, and CLI driver login | closed: the blackboard records "Phase 9 CLI-auth arc closes — Sprint 085c" (2026-09-25) | 077–085c |
| `2026-09-27-post-ship-directions/` | Post-ship directions: Studio, moves, the mastering layer, mobile | not started; `process/BACKLOG.md` names it | — |
| `2026-09-28-packaging/` | Packaging (the 2026-09-25 "Phase 10") and the engineering-practice classes it led to | closed: configuration roadmap closed 2026-09-29; background-commands roadmap in `completed/` | 088–107 |
| `2026-10-08-lens-audit/` | Lens-audit remediation | open: roadmap in `open/` | 108–113 |
| `2026-10-10-harness-drivers/` | Harness drivers: tool calls on the record, workspace permission | closed: U129–U131 and kernel K282–K286 (named in `OPEN-ITEMS-2026-10-10.md`) | 129–131 |
| `2026-10-10-model-picker/` | The model picker in the workspace bar | open: roadmap in `open/` | 124–128 |
| `2026-10-11-before-distribution/` | Before distribution, with the build runbooks | open: roadmap in `open/` | 133–154, 190 |
| `2026-10-12-slash-entry/` | Entering a slash command | closed: roadmap in `completed/` | 163–166 |
| `2026-10-13-language/` | Language measurements in the app | closed: roadmap in `completed/` | 168–175 |
| `2026-10-28-spdx-headers/` | SPDX headers on every source file | closed: sprint 191, commit `d4322e1` | 191 |
| `2026-10-29-document-organization/` | Organizing substrate-ui's documents (this plan) | open: proposed | — |

## What the plan leaves alone

`process/reviews/` (32 reviews), `process/signal_reports/` (714 reports), `process/sprints_v0.1/` (49 cards), `process/refactor-reviews/` (1) and `process/methodology/` (the autonomous-build note and its earlier drafts) stay where they are. The reviews and signal reports are cited by the sprints and documents that asked for them; the index's sprint numbers lead to them. The kernel repo `../substrate/` is not touched.

## Every move in step 2

Folder by folder. Every path is under `process/planning/`. "Current" files go into the folder; "into `superseded/`" files go into the folder's `superseded/`. A file's name never changes.

### `2026-08-16-roadmap/` — Roadmap as of 2026-08-16 (SDD-instrumentation arc, UI-NEXT queue)

Current: `ROADMAP-2026-08-16.md`.
### `2026-08-28-piece-g/` — Piece G: the daily-driver terminal

Current: `FEATURE-MAP-2026-08-28-agent-terminal-to-daily-driver.md`, `PLAN-2026-08-28-piece-g-mechanical-translation.md`, `FOLD-2026-08-28-piece-g-mechanical-translation.md`, `POSTMORTEM-2026-08-29-piece-g-architectural-miss.md`.
### `2026-09-10-prototype-port/` — Prototype port

Current: `EPIC-PLAN-v0.2-2026-09-12-prototype-port.md`, `SUBSTRATE-WIRING-2026-09-12.md`, `WIRING-STATUS-2026-09-12.md`, `DIRECTION-2026-09-12.md`.

Into `superseded/` inside it: `EPIC-PLAN-v0.1-2026-09-10.md`.
### `2026-09-12-presentation-model/` — Presentation model, phases 1–6, with the vocabulary lock and delegation

Current: `PLAN-2026-09-12-presentation-model-extract.md`, `PROPOSAL-2026-09-13-controller-vocabulary.md`, `STATUS-2026-09-13-phase-4-progress.md`, `STATUS-2026-09-13-phase-5-6-landed.md`, `PLAN-2026-09-14-split-pane-multi-session.md`, `STATUS-2026-09-14-phase-4-closed.md`, `PLAN-2026-09-21-r4-vocabulary-shakeout.md`, `delegation-research-r5.md`.

Into `superseded/` inside it: `PLAN-2026-09-21-vocabulary-shakeout.md`, `PLAN-2026-09-21-r2-vocabulary-shakeout.md`, `PLAN-2026-09-21-r3-vocabulary-shakeout.md`, `delegation-research.md`, `delegation-research-r2.md`, `delegation-research-r3.md`, `delegation-research-r4.md`.
### `2026-09-14-flat-design-parity/` — Flat-design parity (the 2026-09-14 "Phase 7")

Current: `PLAN-2026-09-14-r2-flat-design-parity.md`, `STATUS-2026-09-14-phase-7-closed.md`.

Into `superseded/` inside it: `PLAN-2026-09-14-phase-7-flat-design-parity.md`, `STATUS-2026-09-14-phase-7-progress.md`.
### `2026-09-14-session-transparency/` — Session transparency and interrupt (the 2026-09-14 "Phase 8")

Current: `GAP-2026-09-14-interrupt-during-tool-call.md`, `DESIGN-2026-09-14-r5-session-transparency.md`, `PLAN-2026-09-14-phase-8.md`, `STATUS-2026-09-14-phase-8-checkpoint.md`, `DESIGN-2026-09-15-interrupt-injection-path.md`, `STATUS-2026-09-15-phase-8-item-7-closed.md`, `STATUS-2026-09-15-phase-8-closed.md`, `SPIKE-2026-09-15-r2-read-file-byte-cap.md`.

Into `superseded/` inside it: `DESIGN-2026-09-14-session-transparency.md`, `DESIGN-2026-09-14-r2-session-transparency.md`, `DESIGN-2026-09-14-r3-session-transparency.md`, `DESIGN-2026-09-14-r4-session-transparency.md`, `SPIKE-2026-09-15-read-file-byte-cap.md`.
### `2026-09-23-reveal-shell-hardening/` — Reveal-shell hardening (the 2026-09-23 "Phase 7") and the transcript migration (the 2026-09-23 "Phase 8")

Current: `PLAN-2026-09-23-reveal-shell-hardening.md`, `AUDIT-2026-09-23-dc-runtime-local-optimum.md`, `POSTMORTEM-2026-09-23-caret-in-place-toggle.md`, `POSTMORTEM-2026-09-23-sprint-057-tool-panel-reverted.md`, `PLAN-2026-09-23-phase-8-transcript-atom-migration.md`.
### `2026-09-24-electron/` — Phase 9: Electron, and CLI driver login

Current: `RESEARCH-2026-09-24-electron-integration-v2.md`, `PLAN-2026-09-24-phase-9-electron-wrapping-v2.md`, `RESEARCH-2026-09-25-cli-adapter-login-flow-in-substrate-v2.md`.

Into `superseded/` inside it: `RESEARCH-2026-09-24-electron-integration.md`, `PLAN-2026-09-24-phase-9-electron-wrapping.md`, `RESEARCH-2026-09-25-cli-adapter-auth-lifecycle.md`.
### `2026-09-27-post-ship-directions/` — Post-ship directions: Studio, moves, the mastering layer, mobile

Current: `FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md`, `RESEARCH-2026-09-27-mastering-layer-and-the-metacognitive-baseline.md`, `RESEARCH-2026-09-27-moves-a-typed-vocabulary-of-conversational-redirect.md`, `RESEARCH-2026-09-28-substrate-mobile-talking-first-companion.md`.
### `2026-09-28-packaging/` — Packaging (the 2026-09-25 "Phase 10") and the engineering-practice classes it led to

Current: `RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md`, `POSTMORTEM-2026-09-28-sdd-failure-modes-sprint-089-packaging.md`, `ROADMAP-2026-09-29-configuration-externalization-CLOSED.md`, `ROADMAP-2026-10-01-engineering-practice-classes.md`, `CLASS-2026-10-02-agent-work-modelled-as-a-short-request-v2.md`, `POSTMORTEM-2026-10-02-transcript-follow-bottom-regression.md`, `RESEARCH-2026-10-02-background-commands.md`, `ROADMAP-2026-10-02-background-commands.md`.

Into `superseded/` inside it: `RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources.md`, `ROADMAP-2026-09-29-configuration-externalization.md`, `CLASS-2026-10-02-agent-work-modelled-as-a-short-request.md`.
### `2026-10-08-lens-audit/` — Lens-audit remediation

Current: `ROADMAP-2026-10-08-lens-audit-remediation.md`, `ROADMAP-2026-10-08-lens-audit-remediation-LEDGER.md`.
### `2026-10-10-harness-drivers/` — Harness drivers: tool calls on the record, workspace permission

Current: `RESEARCH-2026-10-10-harness-tool-calls-on-the-record.md`, `evidence-2026-10-10-harness-streams/`, `RESEARCH-2026-10-10-driver-workspace-permission.md`.
### `2026-10-10-model-picker/` — The model picker in the workspace bar

Current: `ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md`.
### `2026-10-11-before-distribution/` — Before distribution, with the build runbooks

Current: `ROADMAP-2026-10-11-before-distribution.md`.

Into `superseded/` inside it: `RUNBOOK-2026-10-28-build-and-release.md`, `RUNBOOK-2026-10-28-project-r2.md`, `RUNBOOK-2026-10-28-project-r3.md`.
### `2026-10-12-slash-entry/` — Entering a slash command

Current: `ROADMAP-2026-10-12-slash-entry.md`.
### `2026-10-13-language/` — Language measurements in the app

Current: `DESIGN-2026-10-13-language-in-the-app-r2.md`, `REVIEW-2026-10-13-language-designs.md`, `design-sheets/`, `ROADMAP-2026-10-13-language-in-the-app.md`.

Into `superseded/` inside it: `DESIGN-2026-10-13-language-in-the-app.md`.
### `2026-10-28-spdx-headers/` — SPDX headers on every source file

Current: `ROADMAP-2026-10-28-spdx-headers.md`.
### `2026-10-29-document-organization/` — Organizing substrate-ui's documents (this plan)

Current: `PLAN-2026-10-29-document-organization-r5.md`.

Into `superseded/` inside it: `PLAN-2026-10-29-process-folder.md`, `PLAN-2026-10-29-document-organization.md`, `PLAN-2026-10-29-document-organization-r2.md`, `PLAN-2026-10-29-document-organization-r3.md`, `PLAN-2026-10-29-document-organization-r4.md`.

## Every status change in step 6

| Card | Status now | New `status:` | `status_note:` |
|---|---|---|---|
| `sprint-056-refresh-two-stale-test-expectations.md` | open | pending | |
| `sprint-090-route-ui-paths-through-substrate-home.md` | done | closed | |
| `sprint-091-parity-gate.md` | done | closed | |
| `sprint-092a-blob-memory-payload.md` | superseded by 095 (closed 2026-10-01) | superseded | superseded by sprint 095, closed 2026-10-01 |
| `sprint-092b-sse-blob-deref.md` | superseded by 095 (closed 2026-10-01) | superseded | superseded by sprint 095, closed 2026-10-01 |
| `sprint-092c-reveal-lifecycle-kinds-and-polish.md` | placeholder (retroactive) — … | pending | placeholder (retroactive) — work exists, uncommitted, not observed in a valid build |
| `sprint-094-disposability.md` | closed (source mode); packaged parity waits on sprint 098 | closed-partial | closed in source mode; packaged parity waits on sprint 098 |
| `sprint-095-claim-check-resolver.md` | closed (095a–c); 095d … | closed-partial | 095a–c closed; 095d (kernel release) waits on the Architect |
| `sprint-098-release-pipeline.md` | built; first full run waits … | closed-partial | built; first full run waits on a commit and the kernel 1.1.2 release |
| `sprint-098a-open-items-closed.md` | closed (retroactive card …) | closed | retroactive card, written 2026-10-01 after the work |
| `sprint-112-retire-dc-runtime.md` | open | pending | |
| `sprint-113-packaging-and-vocabulary.md` | open | pending | |
| `sprint-124-model-half-of-the-workspace-bar.md` | open | pending | |
| `sprint-125-header-model-indicator.md` | open | pending | |
| `sprint-126-picker-gates.md` | open | pending | |
| `sprint-127-amend-specs-picker.md` | open | pending | |
| `sprint-128-picker-keys.md` | open | pending | |
| `sprint-179-topologies-setting.md` | open | pending | |
| `sprint-180-run-window.md` | open | pending | |
| `sprint-181-topologies-real-observation-r2.md` | open | pending | |
| `sprint-190-build-release-runbook.md` | pending | closed | ran end to end 2026-10-27; two failures found (format check, `/help`) |
| `sprint-191-spdx-headers.md` | pending | closed | commit `d4322e1`; 206 of 206 tracked source files carry the header |
| `sprint-249-bench-results-resolver.md` | done | closed | |
| `sprint-057-tool-panel-formatting.md` | (no status line) | reverted | `POSTMORTEM-2026-09-23-sprint-057-tool-panel-reverted.md` |
| `sprint-063a-caret-in-place-toggle.md` | (no status line) | reverted | `POSTMORTEM-2026-09-23-caret-in-place-toggle.md`: "everything reverted" |

`open` becomes `pending` because the kit's sprint-card template uses `pending` for a card not yet closed. The blackboard records sprints 124 and 128 as built on 2026-10-10 (commit `35a7e47`); whether their cards should read `closed` is checked against that entry during the step, not assumed.

## Why these rules

The rules join what five fields agree on with what a model reader needs. Each rule's source is named here; the sources were fetched and read on 2026-10-29.

- **One kind, one rule for change.** Software Engineering at Google, chapter 10, "Documentation" (Tom Manshreck): "A document should have, in general, a singular purpose, and stick to it." Diátaxis sorts documents by the reader's need: tutorial, how-to guide, reference, explanation. Archives keep each series of records under its own handling.
- **Group documents by the work that produced them.** The Society of American Archivists' principle of provenance keeps records "of different origins (provenance) ... separate to preserve their context", and its principle of original order keeps "the organization and sequence of records established by the creator". A piece of work is the creator here; its design, plan, status reports and postmortem are one series, and their dates give their order. The type of each document is already in its name, in the sense of ISO/IEC/IEEE 15289:2019's generic types (description, plan, procedure, report, request, specification), so a folder by type would add nothing.
- **An index lists the pieces of work.** Software Engineering at Google, chapter 10, describes landing pages that "clearly identif[y]" their purpose and hold links; the index is that page for the planning folder.
- **Status explicit, never inferred.** Python's PEP 1 gives each proposal a status (Draft, Accepted, Final, Superseded and others). Michael Nygard's architecture decision records (2011) carry a status line and keep a reversed decision "but mark it as superseded". For a model reader this matters more than for a person: a model cannot tell which of two documents is current unless the text or the path says so.
- **Never edit a finished document; replace it.** PEP 1: "PEPs are no longer substantially modified after they have reached the Accepted, Final, Rejected or Superseded state," and the newer one "must have a Replaces header". IETF RFC 2026: each version is a separate publication; corrections are republished "with a new number"; a superseded standard moves to Historic. Nygard: "Numbers will not be reused." The project's own rule (sdd-kit-3 hard rule 12, no deletions) already holds this.
- **Records grow at the end, in time order.** Laboratory-notebook practice in university research-integrity guides: dated entries in order, errors struck through with one line and left legible, nothing erased. Jay Kreps, "The Log" (LinkedIn Engineering, 2013): a log of every change is a full representation of the data, and tables are views of it. (The original page returned 404; this comes from summaries that quote it.)
- **A session reads the current set, and reads the records by command.** Liu et al., "Lost in the Middle: How Language Models Use Long Contexts" (TACL; arXiv 2307.03172): performance "is often highest when relevant information occurs at the beginning or end of the input context" and "significantly degrades when models must access relevant information in the middle of long contexts." A small current set and a `tail` keep the needed text short and at the edges.
- **One project per repo.** The Society of American Archivists' principle of provenance: records "of different origins (provenance) [are] kept separate to preserve their context."
- **Files keep their names.** SAA's principle of original order: "the organization and sequence of records established by the creator of the records"; Boles (1982), quoted there, says it "reveals the significance of records and makes them usable." Here, other documents cite files by name, so a rename breaks the citation and a move does not.
- **The folder carries the work; the name carries the rest.** S. R. Ranganathan's faceted classification (Colon Classification, 1933): an item is found along several independent facets, not one place in one tree. Here the folder is the piece of work; the name carries type, date, subject and round; the index carries status.
- **Keep, do not delete.** Archives keep records; Google's chapter says to "remove it or identify it as obsolete". The project chose keep (sdd-kit-3 hard rule 12).

Sources read: SAA Dictionary of Archives Terminology, "provenance" and "original order" (dictionary.archivists.org); Software Engineering at Google, chapter 10 (abseil.io/resources/swe-book/html/ch10.html); Diátaxis and its compass (diataxis.fr); Write the Docs, "Docs as Code"; Nygard, "Documenting Architecture Decisions" (cognitect.com, 2011-11-15); PEP 1 (peps.python.org); RFC 2026 (rfc-editor.org); Liu et al. (arxiv.org/abs/2307.03172). From search results only, not full text: Kreps, "The Log"; Ranganathan's Colon Classification (ISKO encyclopedia); the records continuum model (Upward, 1996) and ISO 15489-1:2016; university laboratory-notebook guides.
