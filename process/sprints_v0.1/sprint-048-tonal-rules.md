# Sprint 048 — tonal-rule audit

---
id: 048
epic: P — Harness maturity
status: pending
phase: 4
pass_kind: widening
spec_reference: signals/0.1.json § layer_7_evidence.evidence_constraints[tonal]; D45 (no cost display), D46 (no emoji), D32 (labels never wrap); reshape per REVIEW-2026-09-10-epic-plan §Tonal rules
prerequisites: 047 closed
---

## scope

Reshape per the epic-plan review's finding: a batch-at-end tonal check accumulates drift over 47 prior sprints; the reviewer at Sprint 048 then has to unpick which sprint introduced which violation. The cleaner shape is a **standing shared-harness assertion** that runs on every sprint's observation contract from Sprint 001 onward, so a violation fails the sprint that introduced it. Sprint 048's job under the reshape is the **audit**: prove the standing assertion was present in every sprint's harness and never silently disabled.

## Standing assertion (installed retroactively at Sprint 048 dispatch)

`tests/harness/tonal-checks.js` exports three functions all sprints' `e2e_*.js` harnesses call at every observation step:

- `assertNoCurrency(text)` — grep `/[\$¢€£]|\bcost\b|\bprice\b|\btokens\/\$\b/i` over rendered text; fail loud
- `assertNoWrap(root)` — every element carrying the `.label` class has computed `white-space === "nowrap"`
- `assertNoEmoji(text)` — Unicode `/\p{Extended_Pictographic}/u` returns zero matches on shell-generated strings (record content excluded)

The Sprint 001 harness (`tests/harness/e2e_boot.js`) gets a same-turn retrofit: import and call the three helpers before its PASS line. Sprints 002 through 047 each install the same three calls when their harness is authored.

## signal contract

None.

## artifact contract

### Files

- `tests/harness/tonal-checks.js` — the three helpers
- `tests/harness/e2e_boot.js` and every subsequent `tests/harness/e2e_*.js` — same-turn call site
- `tests/harness/e2e_tonal_audit.js` — the audit: greps every `tests/harness/e2e_*.js` for `assertNoCurrency`, `assertNoWrap`, `assertNoEmoji`; fails if any harness lacks all three or if any is stubbed to a no-op

### Content assertions

- 48 harness files each call all three helpers (audit count)
- Zero silent bypasses: no `// tonal-check-disabled` comment; no wrapping function that swallows a failure

### Command exit codes

- `node tests/harness/e2e_tonal_audit.js` returns 0

## observation contract

### Driving steps

1. Grep every `tests/harness/e2e_*.js` for the three assertion names
2. Verify every file has all three
3. Run the whole harness chain end-to-end; assert every sprint's harness still passes with the assertions active
4. Deliberately inject a `$` glyph into a rendered surface; assert the standing check fails the sprint whose harness first sees it

### Three-channel agreement

- Structural: 48 harness files each contain the three helper calls
- Perceptual: no rendered surface across the tour holds a currency glyph, an emoji, or a wrapping label
- Log ↔ signal: the audit sprint reads every prior sprint's harness file and grades presence + no-op absence

## done criteria

The three tonal rules run as standing assertions in every sprint's harness; the audit sprint proves the wiring never lapsed. Epic P closes. v0.1 shell is feature-complete; v0.2 planning begins.
