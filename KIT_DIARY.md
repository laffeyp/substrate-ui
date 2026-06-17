# KIT_DIARY.md — substrate-ui

*What the kit does well, what gets in the way, what the next kit version should change. Per-increment or per-phase. The diary is this project's accumulating memory about how sdd-kit-2 serves the work. Started fresh 2026-06-17 from the Studio increment forward (review #39: rounds #30–#38 are not retrofitted into the diary — their record is the review envelopes).*

---

## Hypothesis tracking

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | A reader/projector UI built with tests + live E2E + independent review, but WITHOUT the kit's git+artifact ledger, will accumulate a real defect the ledger would have caught. | **confirmed** | Review #39: the Studio seam shipped live with zero tests because no sprint card forced its artifact contract. The substance was otherwise sound; the missing discipline cost exactly one untested live seam. |
| H2 | A UI that only READS a locked vocabulary needs no vocabulary of its own; the tone canon is the binding contract instead. | tentative-confirmed | Review #39 ruled a second `signals/*.json` would be ceremony; the eight-word grep was already clean across #30–#38. One project, one data point. |

---

## Entries

### 2026-06-17 — Review #39 (whole-arc sanity check) + the artifact-discipline retrofit

**What happened.** The Architect called for a start-to-finish recenter: is this real, is it working, have we lost anything, are we chasing ghosts. The independent duplex-pipe reviewer ran both gates, cross-checked disk-vs-API, and built a real authored topology through the Studio seam. Verdict: the substance is REAL and green — but substrate-ui was under no version control and had none of the kit artifacts, and that breach had already produced a live Studio seam with zero tests. Retrofit: own git repo + baseline commit + the three core artifacts (this diary, BLACKBOARD, WORKING_AGREEMENT).

**What worked.**
- **Independent review verified by RUNNING caught the gap the builder's "green" hid.** The builder's session reported 18 server tests passing; true — but the newest seam (`/api/build`, `/api/validate`) had no coverage at all, so "18 green" was technically honest and substantively misleading. Only a reviewer that re-read the tree and grepped for `test_build`/`test_validate` (zero) surfaced it. This is the runbook's meta-finding (§9) reproduced exactly: the reviewer earns its keep where it runs/inspects the thing the builder only described.
- **The dual-contract SPIRIT, held informally, kept the substance sound.** Even without sprint cards, every #30–#38 increment had an artifact contract (`test_server.py`) + an observation contract (`e2e_console.js`) + an independent grader (the pipe). So the retrofit is LIGHT — a home and a ledger, not a rebuild. The discipline's substance and its ceremony came apart cleanly here.

**What got in the way.**
- **The kit has no explicit rule "a new sub-project gets its own git home + artifacts on day one."** Hard rule 12 covers vocabulary materialization at Sprint 0; there is no equivalent for "version control + the three core artifacts exist before the second increment." substrate-ui ran nine review rounds of real code with no git history — one `rm` from losing all of it. The kit assumes a project adopts the templates at the start (README step 1–4); it is silent on a UI/companion sub-project that grows OUT of a disciplined parent and silently inherits none of the parent's discipline.
- **Category leak into the parent's blackboard.** With no board of its own, the UI's build history landed in substrate's `## Built` — polluting a published repo's audit trail with a different codebase's increments. The single-writer-per-section discipline says nothing about single-PROJECT-per-board.

**What this says about the next kit version.**
1. Add a hard rule (or a README step): **a companion/sub-project that grows out of a disciplined project gets its own git home + the three core artifacts (BLACKBOARD, WORKING_AGREEMENT, KIT_DIARY) before its SECOND increment** — not retroactively. The trigger is "this code now has more than one increment and lives in its own directory."
2. The dual contract's three legs (signal/artifact/observation) transmit fine informally for a reader/projector UI; what does NOT transmit informally is the GIT LEDGER. The kit treats version control as ambient; for a sub-project it should be an explicit founding act, like the vocabulary lock.
3. A reader-only project legitimately has no `signals/` of its own. The kit's templates assume every project locks a vocabulary; it should name the reader/projector case explicitly (bind the tone canon instead).

---

### 2026-06-17 — Observation-contract skip (Architect-caught) + repo-scoped test tooling

**What happened.** After landing sprint 001 I declared the live Chrome E2E "not run — Playwright absent in this env, backend-only change" and proposed continuing to the next sprint. The Architect halted hard: a behavior-touching UI cannot be claimed working without its observation contract actually executing; skipping it is the finished≠worked failure the kit exists to stop. The fix had two parts: (1) the tooling was in ephemeral `/tmp/pw-substrate` (a prior session's install that vanished) — re-scoped it INTO the repo as a lockfile-pinned devDependency; (2) RAN the E2E — 22 checks pass in real Chrome.

**What got in the way (the real finding).** The kit names the observation contract as REQUIRED for behavior-touching sprints (hard rule 9), but it is silent on where the contract's TOOLING lives. When the tooling is ad-hoc and out-of-repo (a `/tmp` install, a globally-installed binary), "I can't run it right now" becomes an available rationalization — and a rationalization for skipping a REQUIRED contract is the most dangerous kind, because it ships a lie that looks like a pass. The `/tmp` location and the discipline skip were the same failure: un-scoped tooling makes the contract skippable.

**What this says about the next kit version.**
4. The observation contract's TOOLING is part of the contract. The kit should require that a behavior-touching project's observation harness be reproducible FROM THE REPO (a pinned devDependency + lockfile, a documented one-command setup) — not an ambient/global/temp install. If the harness can vanish, the contract can be skipped, and a REQUIRED contract that can be skipped is not required.
5. "Environment doesn't have the tool" is never a license to skip a required contract — it is an instruction to make the environment have the tool (scoped to the repo) and then run it. Add this explicitly to hard rule 9's failure modes.

| H3 | Un-scoped (out-of-repo) observation tooling makes a REQUIRED observation contract skippable, and it will be skipped under time pressure. | confirmed | This session: the `/tmp` harness "couldn't be run" twice became a proposed skip; only an Architect halt corrected it. Repo-scoping removed the excuse. |

---

*KIT_DIARY.md for substrate-ui. Three entries. Three hypotheses, two confirmed (the missing ledger cost a real untested seam; un-scoped observation tooling makes the contract skippable). The diary starts where formal discipline starts — the review-#39 retrofit — not at the project's true beginning, by ruling.*
