# Card-rewrite pass — 2026-08-28

## What happened

Sprints 034, 036, and 037 as first drafted exceeded AGENTS.md hard
rule 6 (sprint sweet spot ≤2 files / one concept). A card-rewrite pass
folded the audit into split cards. The originals stay on disk (rule
12, no deletions — the audit trail is the work); the split cards are
the executable version.

## The splits

- **034** → `034a` (server records+bundles endpoints, 1 file) +
  `034b` (rail.ts module + four-bucket rewrite, 2 files).
- **036** → `036a` driver picker + `036b` bundle picker + `036c`
  workspace picker + `036d` tools restriction + `036e` isolate
  toggle + `036f` consolidated parity test.
- **037** → `037a` driver harness + fourth grader kind +
  `037b` perceptual + signal-trace captures + `037c` legacy dock
  deletion.

## Prerequisite card added

`032a` — vocab v0.7 lock. Carries five session-control tags
(`DRIVER_PATCHED`, `BUNDLE_ATTACHED`, `WORKSPACE_SELECTED`,
`TOOLS_RESTRICTED`, `ISOLATE_TOGGLED`) plus `RECORDS_LOADED.bucket`.
Without this lock, 034b and 036a-e halt on
`vocabulary_change_required` at first emit.

## Execution order

1. 033 — two-view scaffold (unchanged).
2. 033a — vocab-sync bump (unchanged).
3. 032a — v0.7 lock (new prerequisite).
4. 034a → 034b — rail rewrite.
5. 035 — terminal.ts + session-turn (unchanged).
6. 036a → 036b → 036c → 036d → 036e → 036f — five controls + parity
   test. 036c is a prerequisite for 036e (isolate toggle depends on
   workspace_shape from the picker).
7. 037a → 037b → 037c — driver + captures + legacy-dock deletion.
8. 038 — piece-G review fold (unchanged).

## What stays on disk

The original cards `sprint-034-rail-rewrite-four-buckets.md`,
`sprint-036-desktop-five-controls.md`, and
`sprint-037-e2e-session-harness.md` remain untouched as the
first-draft record. They are superseded by the split cards above and
must not dispatch.
