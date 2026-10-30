# PLAN: organizing substrate-ui's documents, under a stated theory of document organization

*2026-10-29. Supersedes `PLAN-2026-10-29-process-folder.md` (beside this file), which planned one folder and cited one source from memory. This round answers three questions in order: is there a theory of document organization in the field; what theory does this project work by today; and what plan follows for these documents. Every outside source in § 1 was fetched and read on 2026-10-29; § 6 lists each one with what was and was not verified. Nothing has been moved yet.*

---

## 1. Is there a theory of document organization?

Yes, but not one. Five fields each hold a worked-out body of practice for keeping documents, and they agree on more than they differ.

### 1.1 Archival science: provenance, original order, lifecycle, continuum

- **Provenance.** The Society of American Archivists defines the principle of provenance (*respect des fonds*) as keeping "records of different origins (provenance) ... separate to preserve their context."
- **Original order.** SAA defines it as "the organization and sequence of records established by the creator of the records"; Boles (1982), quoted there, holds that it "reveals the significance of records and makes them usable."
- **The records lifecycle.** Developed at the U.S. National Archives in the 1930s with Emmett Leahy central to it: creation, classification, maintenance, disposition, where disposition is "the destruction or transfer to an archive."
- **The records continuum.** Frank Upward, Monash University, 1996 ("Structuring the Records Continuum – Part One"), with Sue McKemmish and Livia Iacovino. Four dimensions — create, capture, organise, pluralise — that act at the same time, built "in opposition to the linearity of the life cycle model." A record is evidence from the moment it is made, not only once it is old.
- **ISO 15489-1:2016** sets out the concepts and principles for creating, capturing and managing records in any form. Only its scope was read; the standard itself is paywalled.

### 1.2 Classification: facets, not one hierarchy

S. R. Ranganathan's Colon Classification (Madras Library Association, 1933) was the first faceted classification. Each item takes a value on several independent facets — in his scheme personality, matter, energy, space, time (PMEST, 1952) — not one place in one tree. The consequence for files: a folder is one facet, and a file can be found along others (type, date, subject) only if its name carries them.

### 1.3 Technical documentation: types by purpose

- **Diátaxis** names four forms by the reader's need, on two axes — action or cognition, acquisition or application: tutorial (action, acquisition), how-to guide (action, application), reference (cognition, application), explanation (cognition, acquisition). It proposes that documentation "should itself be organised around the structures of those needs."
- **Software Engineering at Google**, ch. 10, "Documentation" (Tom Manshreck): "A document should have, in general, a singular purpose, and stick to it." "Documents without owners become stale." Google attaches "freshness dates" that "note the last time a document was reviewed." "When a document no longer serves any purpose, either remove it or identify it as obsolete." Documentation lives "alongside the source code" under source control.
- **Docs as Code** (Write the Docs): "writing documentation with the same tools as code" — issue tracking, Git, plain-text markup, peer review, automated tests.

### 1.4 Decision and specification series: never edited, superseded by number

- **Architecture Decision Records** (Michael Nygard, 2011-11-15): sections Title, Context, Decision, Status, Consequences; status proposed or accepted; "If a decision is reversed, we will keep the old one around, but mark it as superseded"; stored in the repository as `doc/arch/adr-NNN.md`; "numbered sequentially and monotonically. Numbers will not be reused."
- **Python PEP 1**: statuses Draft, Active, Accepted, Provisional, Deferred, Rejected, Withdrawn, Final, Superseded. "PEPs are no longer substantially modified after they have reached the Accepted, Final, Rejected or Superseded state." "The newer PEP must have a Replaces header containing the number of the PEP that it rendered obsolete"; the old one may carry Superseded-By.
- **IETF RFC 2026**: "Each distinct version ... is published as part of the" RFC series (§ 2.1); corrections mean republishing "with a new number" (§ 6.2); a superseded specification moves to Historic (§ 4.2.4), and "the relationship between the previous and the new versions must be explicitly stated" (§ 6.3).

### 1.5 Logs and notebooks: append, in time order, never erase

- **The log** (Jay Kreps, LinkedIn Engineering, 2013-12-16): a log of every change to a data set from the beginning is a valid representation of that data set, and each table is a projection of that history. The original page returned 404 on 2026-10-29; this is from secondary summaries that quote it.
- **Laboratory notebooks** (university research-integrity guides; the NIH original was not retrieved): bound, numbered pages; entries dated and in order; an error is struck through with one line and stays legible, initialled and dated; no erasing.

### 1.6 What studies of practice found

- **Lethbridge, Singer and Forward**, "How Software Engineers Use Documentation: The State of the Practice", *IEEE Software* 20(6), 2003, from interviews at 13 sites, a 14-week shadowing and surveys: "Documentation of all types is frequently out of date." "A considerable fraction of documentation is untrustworthy." "Test cases also stay up-to-date because each one has a simple structure and obvious operational value." "Out-of-date documentation has value, particularly if the high-level abstractions remain valid." Engineers find it "worthwhile to update only certain types of documentation."
- **Parnas and Clements**, "A Rational Design Process: How and Why to Fake It", *IEEE TSE* 12(2), 1986: the process is described as a sequence of documents, and "if we take the care to keep all of the documents up-to-date, we can create the appearance of a fully rational design process"; the documents serve design review, reference during coding, and maintenance.
- **Aghajani et al.**, "Software Documentation Issues Unveiled", ICSE 2019: a taxonomy of documentation issues from 878 artifacts across mailing lists, Stack Overflow, issues and pull requests. Its categories were not retrieved.

### 1.7 Where the fields agree, and where they do not

They agree on eight points:

1. **Separate by purpose.** One document, one purpose (Google; Diátaxis); one kind of record, one handling (archival series).
2. **Keep provenance.** One creator's records stay together and apart from another's (SAA).
3. **Respect original order.** The creator's arrangement and names carry meaning; do not rearrange or rename for tidiness (SAA).
4. **Make status explicit.** Accepted, superseded, obsolete are stated, not inferred (ADR, PEP, RFC, Google).
5. **Never edit a resolved record; supersede it.** A change is a new document, and the link between old and new is stated (ADR, PEP, RFC; lab notebooks).
6. **Logs grow at the end, in time order** (Kreps; lab notebooks).
7. **Living reference documents need an owner and a freshness date,** and stay small and structured, because those are the only kind engineers keep current (Google; Lethbridge 2003).
8. **Documents live with the code, under version control** (Google; Docs as Code; ADR).

They disagree on two:

- **Lifecycle or continuum.** The lifecycle moves a record through stages to disposal; the continuum treats it as evidence at every stage at once. This project's rule that nothing is deleted is the continuum's side.
- **Delete or keep.** Google says "remove it or identify it as obsolete"; archives keep. This project chose keep: kit hard rule 12, and the user's no-deletion rule.

---

## 2. What theory does this project work by today?

A theory exists in pieces. It is written in four places and practised in more, and the pieces do not form one statement.

### 2.1 Written

- `sdd-kit-3/AGENTS.md` hard rule 12 and "What you should never do": no deletions; new thinking goes into new files and round-N versions. `TECHNIQUES.md` #36–#37 say the same.
- The user's standing rules: a document is never edited in place; a correction is a new dated version; a variant on other assumptions is a section in one document, not a new version.
- `sdd-kit-3/AGENTS.md` § The BLACKBOARD protocol (changed 2026-10-29): the BLACKBOARD is one append-only stream, newest at the bottom.
- Decision 2026-10-01 (agent-resolved, on the BLACKBOARD): `BLACKBOARD.md`, `KIT_DIARY.md` and `WORKING_AGREEMENT.md` live at the repo root, one copy each.
- `WORKING_AGREEMENT.md` line 135: each ask is written into the roadmap and `process/planning/OPEN-ITEMS-2026-10-10.md` before work starts.
- The runbook, § 13: no in-place edits to planning files; new round, new file.

### 2.2 Practised (measured 2026-10-29)

- **Names follow `TYPE-YYYY-MM-DD-slug.md`** for most planning documents, with 21 type prefixes in use across `process/planning/` (not counting this plan, its first round, or the writing-kernel copies): PLAN 14, ROADMAP 12, RESEARCH 12, STATUS 8, DESIGN 8, POSTMORTEM 5, RUNBOOK 3, SPIKE 2, EPIC-PLAN 2, CLASS 2, and one each of AUDIT, DIRECTION, FEATURE-MAP, FOLD, FUTURE-DIRECTIONS, GAP, OPEN-ITEMS, PROPOSAL, REVIEW, SUBSTRATE-WIRING, WIRING-STATUS.
- **Rounds are marked four ways**: `-rN` at the end (7 files), `-rN` in the middle (9, e.g. `DESIGN-2026-09-14-r3-session-transparency.md`), `-vN` (9), and `v0.1` before the date (2). Six files carry no date at all (`delegation-research.md` to `-r5.md`, and `design-sheets/2026-10-13-language/DECISIONS D74-D80.md`).
- **Status is shown five ways**: by folder (`planning/open`, `completed`, `superseded`, roadmaps only, since sprint 190); by filename suffix (`-superseded.md` in `process/archive/`; `ROADMAP-2026-09-29-configuration-externalization-CLOSED.md` beside an unsuffixed twin); by a README (`process/methodology/_archived-autonomous-build-topology-drafts/`); by frontmatter in sprint cards; and not at all for the 72 loose files in `process/planning/`.
- **Sprint-card status uses 12 different values** in the 136 of 138 cards that have a `status:` line: `closed` 106, `open` 11, `pending` 6, `done` 3, `withdrawn` 2, `superseded by 095 (closed 2026-10-01)` 2, `reverted` 1, and five one-off sentences. The kit's template names four: pending, active, closed, closed-partial. Card 190 reads `status: pending`, though it ran end to end on 2026-10-27.
- **History lives in five places**: `_deprecated/` (retired code and the old `process/` records), `process/archive/`, `process/planning/superseded/`, `process/planning/completed/`, and `process/methodology/_archived-…/`.
- **Sprint cards live in two folders**: `sprints/` at the root (73 files, cards 008–055, last changed 2026-09-21) and `process/sprints/` (138 files, 001–007 and 056 on). No number appears in both.
- **Records**: `BLACKBOARD.md` grows at the bottom (since 2026-10-29); `KIT_DIARY.md` puts its newest entry first (44 entries).
- **Another project's files**: `process/planning/writing-kernel/` holds four files identical, byte for byte, to files in `~/Documents/Claude/Projects/writing-kernel/`.
- **Current work is not marked as current**: of the 72 loose planning files, 4 are named by a current document; `planning/open/` holds a roadmap closed by sprint 191.

### 2.3 How the project's theory stands against the field

It already holds four of the field's eight points: no edits to resolved documents (5), logs grow at the end (6, BLACKBOARD only), documents in the repo under git (8), and dated rounds as a weaker form of numbered supersession (5). It lacks the other four: one purpose per kind with its own handling (1), provenance (2, the writing-kernel copies), explicit status (4) and freshness on living documents (7). It breaks original order (3) whenever a rename is proposed. Because no single statement exists, each session invents its own scheme: four round markers, five ways of showing status, 12 status values on sprint cards, five history homes, two sprint folders.

---

## 3. The theory for this project

One statement, each rule tied to § 1. It goes into `WORKING_AGREEMENT.md` as `## Documents`, because every session reads that file.

**Five kinds of document, each with one rule for change** (§ 1.7 point 1; Diátaxis for the purpose of each):

| Kind | Purpose (Diátaxis) | Files | Rule for change |
|---|---|---|---|
| Records | the history (archival record; Kreps' log) | `BLACKBOARD.md`, `KIT_DIARY.md` | Append at the end, in time order. Nothing above the last entry changes. A correction is a new entry. |
| Ground files | reference | `WORKING_AGREEMENT.md`, `README.md`, `CLAUDE.md`, `signals/` vocabulary | Edited in place, so there is one current copy. Each carries a "current as of" date (Google's freshness date). Before a large change the prior version goes to `process/archive/` under a dated name. The vocabulary changes only by version bump (kit hard rule 2). |
| Working documents | explanation (research, design, plans, reviews, postmortems) and how-to (runbooks) | `process/planning/**` | One round per file, never edited. A new round names what it supersedes in its first lines (PEP's Replaces). |
| Sprint cards | the unit of work | `process/sprints/` | The card's `status:` field changes as the work moves; nothing else in a closed card changes. |
| Evidence | data a document rests on | a folder beside the document | Moves with its document. |

**Status is explicit and has one home per kind** (point 4). Working documents: the folder — `planning/open/` (the work is open, or a current document names it), `planning/completed/` (the work closed, or the document was a one-time record: status report, spike, postmortem, review), `planning/superseded/` (a later round or document replaced it). Sprint cards: `status:` from a closed list — `pending`, `active`, `closed`, `closed-partial`, `reverted`, `withdrawn`, `superseded` — with any note on the line after, not in the value.

**Supersession is stated by the newer document** (point 5). Its header names the file it supersedes. The older file is not edited (the project's no-edit rule outranks PEP's Superseded-By header); moving it to `superseded/` is its mark.

**Provenance** (point 2). A repo holds its own project's documents. Another project's documents, and copies of them, live in that project.

**Original order** (point 3). Files already on disk keep their names. A move keeps the name, so `find process -name <file>` finds it; `git log --follow` traces it. New documents take one name form: `TYPE-YYYY-MM-DD-slug.md` for round 1 and `TYPE-YYYY-MM-DD-slug-rN.md` for later rounds, where the date is that of round 1 and `TYPE` is one of `PLAN`, `ROADMAP`, `RESEARCH`, `DESIGN`, `REVIEW`, `AUDIT`, `POSTMORTEM`, `SPIKE`, `STATUS`, `RUNBOOK`, `PROPOSAL`, `OPEN-ITEMS`. A type outside the list is added to it first. (Faceted naming, § 1.2: folder = status; name = type, date, subject, round.)

**History has one home per kind** (point 1). Retired code: `_deprecated/`. Prior versions of ground files and closed records: `process/archive/`. Working documents: `planning/completed/` and `planning/superseded/`. Nothing is deleted (§ 1.7, the project's side of the disagreement).

**Freshness** (point 7). Each ground file's first lines state "current as of {date}". A runbook names the date its commands were last run.

---

## 4. The plan for these documents

Each step is a `git mv` or an edit to one ground file. Steps 1–3 come first because later steps cite the rule they state.

1. **State the theory.** Add § 3 to `WORKING_AGREEMENT.md` as `## Documents`, with its "current as of" date updated.
2. **File the loose planning documents.** The moves from `PLAN-2026-10-29-process-folder.md` § 4 stand: 4 items to `open/` (`OPEN-ITEMS-2026-10-10.md`, `DESIGN-2026-10-13-language-in-the-app-r2.md` with `design-sheets/`, `FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md`); 21 earlier rounds to `superseded/`; 48 dated files with `evidence-2026-10-10-harness-streams/` to `completed/`; `open/ROADMAP-2026-10-28-spdx-headers.md` to `completed/`; `process/ROADMAP.md`, `SDD-ARC-PLAN.md`, `SDD-HARNESS-PORT-PLAN.md`, `HARNESS-CATALOG.md` to `completed/`. Two pairs are read before filing, since their names do not show whether one replaces the other: `PLAN-2026-09-14-phase-7-flat-design-parity.md` / `PLAN-2026-09-14-r2-flat-design-parity.md`, and `RESEARCH-2026-09-25-cli-adapter-auth-lifecycle.md` / `RESEARCH-2026-09-25-cli-adapter-login-flow-in-substrate-v2.md`. This plan's first round, `PLAN-2026-10-29-process-folder.md`, goes to `superseded/`.
3. **Provenance.** `process/planning/writing-kernel/` moves to `process/archive/writing-kernel-copies-2026-10-28/`; the originals are in `~/Documents/Claude/Projects/writing-kernel/`.
4. **One sprint folder.** The 73 files in root `sprints/` move into `process/sprints/`; no file name and no card number collides.
5. **One history home per kind.** `process/methodology/_archived-autonomous-build-topology-drafts/` moves to `process/planning/superseded/`, README with it. `process/archive/` keeps ground-file versions and records; `_deprecated/` keeps code.
6. **Sprint-card status.** Each card's `status:` takes a value from the closed list; the sentence-valued statuses keep their text on a `status_note:` line. Card 190 becomes `closed`, with the two failures it found noted.
7. **KIT_DIARY grows at the bottom.** The same form-only change the BLACKBOARD had: entries in date order, oldest first, every line kept, checked line by line.
8. **The runbook and README follow.** `README.md` names the runbook at the repo root. A new round of the runbook gives the new paths for § 1.3; the hand copy of round 3 at the root goes to `process/planning/superseded/` beside the tracked round 3.

**Done when:** `ls process/planning` shows only `open/`, `completed/`, `superseded/`; every file in `open/` is named by `OPEN-ITEMS-2026-10-10.md`, an open roadmap or `BACKLOG.md`; `sprints/` no longer exists at the root; `grep -h '^status:' process/sprints/*.md | sort -u` prints only values from the closed list; `KIT_DIARY.md` ends with its newest entry; `WORKING_AGREEMENT.md` has `## Documents`.

---

## 5. What this plan does not settle

The kernel repo `../substrate/` has its own `process/` and is out of scope here. The theory in § 3 is written so it can apply there unchanged.

---

## 6. Sources, as read on 2026-10-29

| Source | Read | Verified |
|---|---|---|
| Society of American Archivists, Dictionary of Archives Terminology, "provenance" — https://dictionary.archivists.org/entry/provenance.html | fetched | quotes in § 1.1 |
| SAA, "original order" — https://dictionary.archivists.org/entry/original-order.html | fetched | quotes in § 1.1 |
| "Records life-cycle", Wikipedia — https://en.wikipedia.org/wiki/Records_life-cycle | fetched | stages and Leahy; secondary source |
| "Records continuum model", Wikipedia and secondary articles — https://en.wikipedia.org/wiki/Records_continuum_model | search results | Upward 1996, four dimensions; Upward's paper itself not read |
| ISO 15489-1:2016 — https://scc-ccn.ca/standardsdb/standards/8159513 | search results | scope only; standard paywalled |
| Colon classification, ISKO and Wikipedia — https://isko.org/cyclo/colon_classification | search results | dates and PMEST; Ranganathan's texts not read |
| Diátaxis — https://diataxis.fr/ and https://diataxis.fr/compass/ | fetched | four forms and two axes; the pages read name no author |
| T. Manshreck, "Documentation", *Software Engineering at Google*, ch. 10 — https://abseil.io/resources/swe-book/html/ch10.html | fetched | quotes in § 1.3 |
| Write the Docs, "Docs as Code" — https://www.writethedocs.org/guide/docs-as-code/ | fetched | definition and five practices |
| M. Nygard, "Documenting Architecture Decisions", 2011-11-15 — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions | fetched | quotes in § 1.4 |
| PEP 1 — https://peps.python.org/pep-0001/ | fetched | statuses, no-modification rule, Replaces/Superseded-By |
| RFC 2026 — https://www.rfc-editor.org/rfc/rfc2026.html | fetched | §§ 2.1, 4.2.4, 6.2, 6.3 |
| J. Kreps, "The Log", LinkedIn Engineering, 2013-12-16 — https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying | 404 on fetch | secondary summaries only |
| Laboratory notebook guides (e.g. UAH, UCD, South Alabama) — https://www.uah.edu/otc/for-uah-innovators/laboratory-notebooks-best-practices | search results | practices in § 1.5; NIH original not read |
| T. Lethbridge, J. Singer, A. Forward, *IEEE Software* 20(6), 2003 — https://courses.cs.duke.edu//cps196.1/fall11/classwork/Lethbridge-Singer-Forward-2003.pdf | full text extracted | quotes in § 1.6 |
| D. Parnas, P. Clements, *IEEE TSE* 12(2), 1986 — https://userweb.cs.txstate.edu/~rp31/papers/Fake_it.pdf | search results quoting the abstract | quotes in § 1.6; full text not read |
| E. Aghajani et al., ICSE 2019, DOI 10.1109/ICSE.2019.00122 — https://2019.icse-conferences.org/details/icse-2019-Technical-Papers/49/Software-Documentation-Issues-Unveiled | search results | method and size; taxonomy categories not read |
