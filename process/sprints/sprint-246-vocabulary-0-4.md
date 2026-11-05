---
id: 246
status: closed
phase: shell-to-react B7
pass_kind: functional
---

# Sprint 246 — vocabulary 0.4

## scope

Plan round 5, row B7, with the two tags plan row B5 needs (BLACKBOARD, 2026-11-05, the order of B5–B7). `web/vm/signals/versions/0.4.json`: the five `SPEC_*` tags marked `retired: true` (`TAG_DEPRECATION_PROPOSED`; Studio and its controller methods went in sprints 242–244); the notes of `SESSION_END_REQUESTED`, `SESSIONS_LOADED` and `CHILD_RECORD_ATTACH_REQUESTED` corrected to the code; `ASSAYS_LOADED` and `ASSAY_REPORT_LOADED` added in a new `assays` category (`NEW_TAG_PROPOSED`). `0.4-rationale.md` gives the reasons. `current.json`, a symlink, points to `0.4.json`. `0.3.json` stays as committed.

## context_files

`web/vm/signals/versions/0.3.json`, `0.3-rationale.md`, `0.2-rationale.md`; `web/vm/tools/check-vocabulary-parity.ts`; `../sdd-kit-3/grammar/PRINCIPLES.md` (proposal taxonomy).

## artifact contract

- Created: `web/vm/signals/versions/0.4.json` (38 tags, 5 retired, `tag_count` 38, `supersedes` 0.3), `0.4-rationale.md`. Modified: `current.json` (symlink to `0.4.json`). Unchanged: `0.3.json` (`git diff --quiet` 0).
- `npm run signals` 0.

## result

Closed 2026-11-05. Signals 0: "vocabulary 0.4 (38 tags: 33 live + 5 retired, locked=true); code emits 31 distinct live tag(s)". A field-by-field diff of 0.3 and 0.4: the header fields, three notes, five retirements (note and `retired`), two added tags; nothing else.

One slip, caught and undone in the sprint: `current.json` is a symlink to `0.3.json`, so the first write of 0.4 through `current.json` overwrote `0.3.json`. `git diff --stat` showed it; `0.3.json` was restored from git and the link repointed.

## Rubber Duck pass

No signals fire from a vocabulary file. Observation: the two new tags are declared before their emit sites (sprint 247); parity allows a declared tag that nothing emits yet, and sprint 247 closes it.
