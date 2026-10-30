# PLAN: organizing substrate-ui's documents (round 4)

*2026-10-29. Status: proposed; nothing has moved. Supersedes round 3 (`PLAN-2026-10-29-document-organization-r3.md`), which put two hundred words of rules and their reasons into the working agreement. Here the working agreement gets six lines of rules; the reasons stay in this plan. The reasons for each rule, with their sources, are in the appendix "Why these rules" at the end.*

## What the plan changes

substrate-ui keeps 1,124 Markdown files: 1,117 under `process/` and `sprints/` (714 of them signal reports) and 7 at the repo root. They are read mostly by model sessions, and the aim is that a session reads the right one: the current version, and nothing a later document overturned. Today a session cannot tell which document is current. 72 planning documents lie loose in `process/planning/` with no status. Rounds are marked four different ways (`-r2` at the end, `-r2` in the middle, `-v2`, `v0.1`). Sprint cards sit in two folders and use 12 different status values. A runbook lists a design whose roadmap closed. Four files belong to another project.

The plan does eight things: it writes the rules into the working agreement; files every planning document by status; removes the other project's copies; joins the two sprint folders; puts each sprint card on one status word; makes the knowledge diary grow at the bottom as the blackboard now does; and points the README and the runbook at the new places. Every move is a `git mv` that keeps the file's name. Nothing is deleted.

## The rules

This is the whole of what goes into `WORKING_AGREEMENT.md`, as a new section `## Documents`:

> - **Records** (`BLACKBOARD.md`, `KIT_DIARY.md`): append at the end, newest last; nothing above the last entry changes.
> - **Ground files** (this file, `README.md`, `CLAUDE.md`, the runbook at the repo root, the signal vocabulary): one copy, edited in place, dated on the first line; a prior version goes to `process/archive/`.
> - **Working documents** (plans, roadmaps, research, designs, reviews, postmortems): one round per file, never edited; a new round names the file it supersedes. Status is the folder: `process/planning/open/`, `completed/` or `superseded/`.
> - **Sprint cards** (`process/sprints/`): `status:` is one of `pending`, `active`, `closed`, `closed-partial`, `reverted`, `withdrawn`, `superseded`.
> - **Read the current set:** `process/planning/open/`, the ground files, `tail -n 60 BLACKBOARD.md`, and every decision with `grep -nE '^- \*\*[0-9-]{10} (user|agent-resolved)\*\*' BLACKBOARD.md`. Open anything else only when a current document points to it.
> - **Names:** `TYPE-YYYY-MM-DD-subject.md`, later rounds `-r2`, `-r3`; files already on disk keep their names. Nothing is deleted. Another project's files live in that project.

## The steps

Each step lists what it changes and the command whose output proves it done. The steps run in order; each is one commit.

### Step 1. Write the rules into the working agreement

Add the six lines under "The rules" to `WORKING_AGREEMENT.md` as `## Documents`, and set its date line to the day of the change.

Done when: `grep -c '^## Documents' WORKING_AGREEMENT.md` prints 1.

### Step 2. File the 72 loose planning documents by status

`git mv` each file at the top of `process/planning/` into `open/` (2 files), `superseded/` (25) or `completed/` (45). The table "Every move in step 2" at the end lists each file with its reason. Three folders move with their documents: `design-sheets/` with `DESIGN-2026-10-13-language-in-the-app-r2.md` into `completed/`, and `evidence-2026-10-10-harness-streams/` with `RESEARCH-2026-10-10-harness-tool-calls-on-the-record.md` into `completed/`. Five more moves:

- `open/ROADMAP-2026-10-28-spdx-headers.md` to `completed/`: sprint 191 (commit `d4322e1`) put the license header on all 206 tracked source files.
- `PLAN-2026-10-29-process-folder.md`, `PLAN-2026-10-29-document-organization.md`, `-r2.md` and `-r3.md` (with their `.html` copies) from `open/` to `superseded/`: this plan replaces them.
- `process/ROADMAP.md` (last changed 2026-06-23) to `superseded/`: the dated roadmaps from `ROADMAP-2026-08-16.md` on replaced it.
- `process/SDD-ARC-PLAN.md` and `process/SDD-HARNESS-PORT-PLAN.md` (last changed 2026-08-17) to `completed/`: the blackboard records the SDD instrumentation arc closed on 2026-08-17.
- `process/HARNESS-CATALOG.md` (last changed 2026-08-29) to `process/archive/`: it was a ground file listing harnesses, most of which moved to `_deprecated/classic-tree/` on 2026-09-22.

Done when: `ls -p process/planning | grep -v /` prints nothing, and `ls process/planning/open` prints the three open roadmaps, the lens-audit ledger, `OPEN-ITEMS-2026-10-10.md`, `FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md` and this plan.

### Step 3. Remove the other project's copies

`git mv process/planning/writing-kernel process/archive/writing-kernel-copies-2026-10-28`. Its four files are identical, byte for byte, to files in `~/Documents/Claude/Projects/writing-kernel/` (`analyses/`, `architecture/`, `research/`), which is now a separate project.

Done when: `ls process/planning/writing-kernel` fails.

### Step 4. Join the two sprint folders

`git mv sprints/* process/sprints/`. The root `sprints/` holds cards 008–055 (73 files, last changed 2026-09-21); `process/sprints/` holds 001–007 and 056 on (138 files). No file name and no card number appears in both.

Done when: `ls sprints` fails and `ls process/sprints | wc -l` prints 211.

### Step 5. One status word on every sprint card

Change the `status:` line on the 23 cards listed in the table "Every status change in step 5" at the end. Each takes one word from the list; any explanation moves to a `status_note:` line. Two cards with no `status:` line get one.

Done when: `grep -h '^status:' process/sprints/*.md | sort -u` prints only words from the list, and `grep -L '^status:' process/sprints/*.md` prints nothing.

### Step 6. The knowledge diary grows at the bottom

`KIT_DIARY.md` puts its newest entry first (44 entries). Reorder it the way `BLACKBOARD.md` was reordered on 2026-10-29: the entries in date order, oldest first, every line kept; the hypothesis table stays above the entries. A script compares the old and new non-blank lines as sorted lists and prints any line missing or added.

Done when: the script reports no line missing and no line added, and the last entry in the file is the newest.

### Step 7. Point the README and the runbook at the new places

- `README.md` names the runbook at the repo root, `RUNBOOK-2026-10-29-project-r4.md`, where it now names `process/planning/RUNBOOK-2026-10-28-project-r3.md`.
- A new round of the runbook, `RUNBOOK-2026-10-29-project-r5.md` at the repo root, replaces round 4's reading list with the current set: the rules' read commands, `process/planning/open/`, and the ground files. It drops `DESIGN-2026-10-13-language-in-the-app-r2.md`, whose roadmap closed. Round 4 and the untracked hand copy of round 3 at the root move to `process/planning/superseded/`.

Done when: `grep -c 'RUNBOOK-2026-10-29-project-r5' README.md` prints 1, and every path in the round-5 reading list exists.

### Step 8. Record it

Append a `built` entry to `BLACKBOARD.md` naming the commits from steps 1–7.

Done when: `tail -n 5 BLACKBOARD.md` shows it.

## What the plan leaves alone

`process/reviews/` (32 reviews), `process/signal_reports/` (714 reports), `process/sprints_v0.1/` (49 cards), `process/refactor-reviews/` (1) and `process/methodology/` (one current design and a folder of earlier drafts with its own README) stay where they are. Each already holds one kind of document. The rule that a session opens them only when a current document points to them is enough. The kernel repo `../substrate/` is not touched.

## Every move in step 2

### To `process/planning/open/` (2 files)

| File | Why it is current |
|---|---|
| `FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md` | `process/BACKLOG.md` names it |
| `OPEN-ITEMS-2026-10-10.md` | `WORKING_AGREEMENT.md` line 135 and `open/ROADMAP-2026-10-11-before-distribution.md` name it as the list work comes from |

### To `process/planning/superseded/` (25 files)

| File | Superseded by |
|---|---|
| `CLASS-2026-10-02-agent-work-modelled-as-a-short-request.md` | `CLASS-2026-10-02-agent-work-modelled-as-a-short-request-v2.md` |
| `DESIGN-2026-09-14-r2-session-transparency.md` | `DESIGN-2026-09-14-r3-session-transparency.md` (its first lines say so) |
| `DESIGN-2026-09-14-r3-session-transparency.md` | `DESIGN-2026-09-14-r4-session-transparency.md` |
| `DESIGN-2026-09-14-r4-session-transparency.md` | `DESIGN-2026-09-14-r5-session-transparency.md` (its first lines say so) |
| `DESIGN-2026-09-14-session-transparency.md` | `DESIGN-2026-09-14-r2-session-transparency.md` (its first lines say so) |
| `DESIGN-2026-10-13-language-in-the-app.md` | `DESIGN-2026-10-13-language-in-the-app-r2.md` |
| `EPIC-PLAN-v0.1-2026-09-10.md` | `EPIC-PLAN-v0.2-2026-09-12-prototype-port.md` (its first lines say so) |
| `EPIC-PLAN-v0.2-2026-09-12-prototype-port.md` | `SUBSTRATE-WIRING-2026-09-12.md` ("Supersedes `EPIC-PLAN-v0.2` for the actual work") |
| `PLAN-2026-09-14-phase-7-flat-design-parity.md` | `PLAN-2026-09-14-r2-flat-design-parity.md` (its first line says so) |
| `PLAN-2026-09-21-r2-vocabulary-shakeout.md` | `PLAN-2026-09-21-r3-vocabulary-shakeout.md` (its first lines say so) |
| `PLAN-2026-09-21-r3-vocabulary-shakeout.md` | `PLAN-2026-09-21-r4-vocabulary-shakeout.md` (its first lines say so) |
| `PLAN-2026-09-21-vocabulary-shakeout.md` | `PLAN-2026-09-21-r2-vocabulary-shakeout.md` (its first lines say so) |
| `PLAN-2026-09-24-phase-9-electron-wrapping.md` | `PLAN-2026-09-24-phase-9-electron-wrapping-v2.md` |
| `RESEARCH-2026-09-24-electron-integration.md` | `RESEARCH-2026-09-24-electron-integration-v2.md` (its first lines say so) |
| `RESEARCH-2026-09-25-cli-adapter-auth-lifecycle.md` | `RESEARCH-2026-09-25-cli-adapter-login-flow-in-substrate-v2.md` (its first lines say so: "That scope was wrong") |
| `RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources.md` | `RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md` (its first lines say so) |
| `RUNBOOK-2026-10-28-build-and-release.md` | `RUNBOOK-2026-10-28-project-r2.md` (its first lines say so) |
| `RUNBOOK-2026-10-28-project-r2.md` | `RUNBOOK-2026-10-28-project-r3.md` (its first lines say so) |
| `RUNBOOK-2026-10-28-project-r3.md` | `RUNBOOK-2026-10-29-project-r4.md` at the repo root |
| `SPIKE-2026-09-15-read-file-byte-cap.md` | `SPIKE-2026-09-15-r2-read-file-byte-cap.md` (its first lines say so) |
| `STATUS-2026-09-14-phase-7-progress.md` | `STATUS-2026-09-14-phase-7-closed.md` (its first lines say so) |
| `delegation-research-r2.md` | `delegation-research-r3.md` (its first line says so) |
| `delegation-research-r3.md` | `delegation-research-r4.md` (its first line says so) |
| `delegation-research-r4.md` | `delegation-research-r5.md` (its first line says so) |
| `delegation-research.md` | `delegation-research-r2.md` (its first line says so) |

### To `process/planning/completed/` (45 files)

No current document names these; each is a finished plan, design, study, status report, postmortem, review or audit.

| File | Note |
|---|---|
| `AUDIT-2026-09-23-dc-runtime-local-optimum.md` |  |
| `CLASS-2026-10-02-agent-work-modelled-as-a-short-request-v2.md` |  |
| `DESIGN-2026-09-14-r5-session-transparency.md` |  |
| `DESIGN-2026-09-15-interrupt-injection-path.md` |  |
| `DESIGN-2026-10-13-language-in-the-app-r2.md` | its roadmap, `ROADMAP-2026-10-13-language-in-the-app.md`, is already in `completed/` |
| `DIRECTION-2026-09-12.md` |  |
| `FEATURE-MAP-2026-08-28-agent-terminal-to-daily-driver.md` |  |
| `FOLD-2026-08-28-piece-g-mechanical-translation.md` |  |
| `GAP-2026-09-14-interrupt-during-tool-call.md` |  |
| `PLAN-2026-08-28-piece-g-mechanical-translation.md` |  |
| `PLAN-2026-09-12-presentation-model-extract.md` |  |
| `PLAN-2026-09-14-phase-8.md` |  |
| `PLAN-2026-09-14-r2-flat-design-parity.md` |  |
| `PLAN-2026-09-14-split-pane-multi-session.md` |  |
| `PLAN-2026-09-21-r4-vocabulary-shakeout.md` |  |
| `PLAN-2026-09-23-phase-8-transcript-atom-migration.md` |  |
| `PLAN-2026-09-23-reveal-shell-hardening.md` |  |
| `PLAN-2026-09-24-phase-9-electron-wrapping-v2.md` |  |
| `POSTMORTEM-2026-08-29-piece-g-architectural-miss.md` |  |
| `POSTMORTEM-2026-09-23-caret-in-place-toggle.md` |  |
| `POSTMORTEM-2026-09-23-sprint-057-tool-panel-reverted.md` |  |
| `POSTMORTEM-2026-09-28-sdd-failure-modes-sprint-089-packaging.md` |  |
| `POSTMORTEM-2026-10-02-transcript-follow-bottom-regression.md` |  |
| `PROPOSAL-2026-09-13-controller-vocabulary.md` |  |
| `RESEARCH-2026-09-24-electron-integration-v2.md` |  |
| `RESEARCH-2026-09-25-cli-adapter-login-flow-in-substrate-v2.md` |  |
| `RESEARCH-2026-09-27-mastering-layer-and-the-metacognitive-baseline.md` |  |
| `RESEARCH-2026-09-27-moves-a-typed-vocabulary-of-conversational-redirect.md` |  |
| `RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md` |  |
| `RESEARCH-2026-09-28-substrate-mobile-talking-first-companion.md` |  |
| `RESEARCH-2026-10-02-background-commands.md` |  |
| `RESEARCH-2026-10-10-driver-workspace-permission.md` |  |
| `RESEARCH-2026-10-10-harness-tool-calls-on-the-record.md` | one-time research; the folder `evidence-2026-10-10-harness-streams/` moves with it |
| `REVIEW-2026-10-13-language-designs.md` |  |
| `SPIKE-2026-09-15-r2-read-file-byte-cap.md` |  |
| `STATUS-2026-09-13-phase-4-progress.md` |  |
| `STATUS-2026-09-13-phase-5-6-landed.md` |  |
| `STATUS-2026-09-14-phase-4-closed.md` |  |
| `STATUS-2026-09-14-phase-7-closed.md` |  |
| `STATUS-2026-09-14-phase-8-checkpoint.md` |  |
| `STATUS-2026-09-15-phase-8-closed.md` |  |
| `STATUS-2026-09-15-phase-8-item-7-closed.md` |  |
| `SUBSTRATE-WIRING-2026-09-12.md` |  |
| `WIRING-STATUS-2026-09-12.md` |  |
| `delegation-research-r5.md` |  |

## Every status change in step 5

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
- **Status explicit, never inferred.** Python's PEP 1 gives each proposal a status (Draft, Accepted, Final, Superseded and others). Michael Nygard's architecture decision records (2011) carry a status line and keep a reversed decision "but mark it as superseded". For a model reader this matters more than for a person: a model cannot tell which of two documents is current unless the text or the path says so.
- **Never edit a finished document; replace it.** PEP 1: "PEPs are no longer substantially modified after they have reached the Accepted, Final, Rejected or Superseded state," and the newer one "must have a Replaces header". IETF RFC 2026: each version is a separate publication; corrections are republished "with a new number"; a superseded standard moves to Historic. Nygard: "Numbers will not be reused." The project's own rule (sdd-kit-3 hard rule 12, no deletions) already holds this.
- **Records grow at the end, in time order.** Laboratory-notebook practice in university research-integrity guides: dated entries in order, errors struck through with one line and left legible, nothing erased. Jay Kreps, "The Log" (LinkedIn Engineering, 2013): a log of every change is a full representation of the data, and tables are views of it. (The original page returned 404; this comes from summaries that quote it.)
- **A session reads the current set, and reads the records by command.** Liu et al., "Lost in the Middle: How Language Models Use Long Contexts" (TACL; arXiv 2307.03172): performance "is often highest when relevant information occurs at the beginning or end of the input context" and "significantly degrades when models must access relevant information in the middle of long contexts." A small current set and a `tail` keep the needed text short and at the edges.
- **One project per repo.** The Society of American Archivists' principle of provenance: records "of different origins (provenance) [are] kept separate to preserve their context."
- **Files keep their names.** SAA's principle of original order: "the organization and sequence of records established by the creator of the records"; Boles (1982), quoted there, says it "reveals the significance of records and makes them usable." Here, other documents cite files by name, so a rename breaks the citation and a move does not.
- **Status by folder, subject in the name.** S. R. Ranganathan's faceted classification (Colon Classification, 1933): an item is found along several independent facets, not one place in one tree. The folder carries status; the name carries type, date, subject and round.
- **Keep, do not delete.** Archives keep records; Google's chapter says to "remove it or identify it as obsolete". The project chose keep (sdd-kit-3 hard rule 12).

Sources read: SAA Dictionary of Archives Terminology, "provenance" and "original order" (dictionary.archivists.org); Software Engineering at Google, chapter 10 (abseil.io/resources/swe-book/html/ch10.html); Diátaxis and its compass (diataxis.fr); Write the Docs, "Docs as Code"; Nygard, "Documenting Architecture Decisions" (cognitect.com, 2011-11-15); PEP 1 (peps.python.org); RFC 2026 (rfc-editor.org); Liu et al. (arxiv.org/abs/2307.03172). From search results only, not full text: Kreps, "The Log"; Ranganathan's Colon Classification (ISKO encyclopedia); the records continuum model (Upward, 1996) and ISO 15489-1:2016; university laboratory-notebook guides.
