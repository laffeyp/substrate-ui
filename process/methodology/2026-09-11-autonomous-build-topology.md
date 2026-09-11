# Autonomous build topology — the human-out-of-the-loop parallel builder

*Idea captured 2026-09-11 during the SDD-drift review of sprints 010-014. This
document sketches a topology, not a build plan. It is meant to sit next to
`2026-09-11-bootstrap-streamlining-lessons.md`; the streamlining lessons apply
inside each parallel build; this document is the frame that spawns and steers
them.*

---

## The shape of the topology

Substrate's `session_topology` today assumes a human at the other end of the
prompt. It parks after each turn and waits. That assumption is the load-bearing
constraint on human throughput — one operator can drive one session at a time
because each session pauses for the operator to read the model's reply and
decide whether it is on track.

The autonomous build topology drops that constraint. It spins up N session
runs from the same initial conditions (design lock, substrate source, bootstrap
kit, sprint queue) and lets each run to completion without a human sitting on
the prompt. The human role is replaced by a small deterministic responder that
watches signals, not text, and issues one of a fixed set of replies.

The topology has three components:

- **A spawner.** Reads a run manifest that names the initial conditions and
  the N. Materialises N session workspaces (git worktrees, three copies of the
  repo, whatever the substrate `WorkspaceShape` calls for). Starts N session
  runs against those workspaces, each with the same driver and the same
  sprint queue.
- **A watcher per session.** Subscribes to the session's JSONL emissions
  (`signals/0.1.json` tags), the sprint card queue, the harness pass/fail
  log, and the writing-style / SDD / coding-canon linters. Every model turn
  ends with a signal that says either "on track" or names the drift.
- **A dispatcher per session.** Given the watcher's verdict, sends the next
  prompt. The dispatcher's vocabulary is small: "continue", "keep going",
  "next sprint", or one of a handful of corrective prompts keyed to the
  drift kind the watcher named.

The whole loop runs without human keystrokes as long as no session enters a
state the watcher cannot classify.

---

## Why the human is removable from the loop

The reason an operator has to sit on a session today is not that the model's
text output is inscrutable. It is that no one wired the signals that would
otherwise report on-track / off-track directly. A human reading the model's
reply is doing signal detection on prose. That signal detection is
mechanisable when the signals exist.

Every drift kind a reviewer would catch has a mechanical detector:

- **SDD drift** — invented tag names, payload shape mismatches, sequence
  violations against Layer 5, missing `BLACKBOARD.md` / `KIT_DIARY.md`
  entries per sprint close. The Emitter (mouth-side, per streamlining
  document §2) refuses the first two at runtime. A card linter catches the
  third. The absent audit files are `ls` failures.
- **Coding-canon drift** — retyped literals where an enum lives elsewhere,
  raw strings in switch cases where a discriminated union exists, dead code
  paths, unhandled promise rejections, functions past a length threshold.
  Standard static-analysis lives here; no model judgement required.
- **Design drift** — Playwright screenshots against the design lock's PNG
  set, byte-diffed or region-diffed. When the shell renders something v7
  does not show, the diff catches it.
- **Writing-style drift** — the `dellm` skill's checks run against every
  committed markdown file. Machine register leaves a fingerprint (uniform
  sentence length, adverb frequency, the phrases the plain-register memo
  names). The linter output is a scalar per file.

Any watcher assembled from those four detectors reads the session's state at
higher fidelity than a human reading the model's reply, and does it in
milliseconds instead of minutes. When all four detectors return green, the
dispatcher sends "continue" and the session takes its next turn.

---

## Rotating review focus

A single watcher checking everything on every turn is wasteful and also
tends to accumulate noise (design drift matters at UI-touching sprints; SDD
drift matters on every sprint). The topology rotates its focus:

- **Every turn.** Vocabulary conformance (mouth-side Emitter output, always
  on). Harness pass/fail. `BLACKBOARD.md` entry present for the closed
  sprint.
- **Every second turn.** SDD hygiene — proposals filed for any drift, no
  invented tag names in cards, Layer 5 sequence assertions used instead of
  hand-coded ones, primitives library used instead of copy-pasted harness
  boilerplate.
- **Every fifth turn.** Coding-canon review — retyped literals, discriminated
  unions, function length, module boundaries. Same pass a human reviewer
  would run against the diff since last review.
- **On UI-touching sprints only.** Screenshot diff against the design lock
  for every state the sprint's card claims to render.

The rotation keeps per-turn cost bounded. Full review coverage lands over a
window of five turns, not per turn.

---

## The dispatcher's vocabulary

Kept small on purpose. Five prompts cover almost every case:

- `CONTINUE` — no drift, take the next action on the sprint card.
- `NEXT_SPRINT` — sprint's done criteria are met; move to the next card.
- `HALT_AND_ARTICULATE` — the watcher saw a signal the model would have
  missed (a Layer 2 refusal, a screenshot diff over threshold, an
  unexplained test regression). The session halts, files a Signal Report,
  and waits for either a human or the reviewer topology to unblock.
- `PROPOSE_AND_HALT` — the model attempted to invent vocabulary; the
  Emitter refused. The session files a `NEW_TAG_PROPOSED` (or the right
  taxon per PRINCIPLES §10) and halts pending ratification.
- `REVERT_AND_TRY_AGAIN` — a coding-canon violation the linter flags on
  commit. The session reverts the last diff and retries the sprint.

Nothing in this vocabulary requires reading the model's prose. Every
element is a function of the signals.

---

## Variant runs

The topology accepts a bootstrap-kit-variant field per session. Three
parallel builds can each carry a different instruction bundle: build A runs
with the current bootstrap; build B runs with mouth-side payload validation
moved to a different point in the emit path; build C runs with Layer 5
enforced as a hard gate instead of a warning. Same design lock, same
substrate, same sprint queue, different bootstrap instructions. The
convergence data across the three is the finding.

This is where the topology stops being a productivity tool and becomes a
research instrument on SDD itself.

---

## Substrate primitives the topology needs

Roughly:

- Session run with a driver, a workspace, and a bundle — exists today.
- A responder interface that can be either human, model, or deterministic
  (rule-based). The last one is what the dispatcher becomes.
- A JSONL subscriber that reads a running session's emissions without
  pausing it — the shell has `harness/last.jsonl`; substrate has
  `record_root/events-*.jsonl`. A watcher reads from either.
- A way to spawn N sessions with a shared parent-topology id so their
  emissions carry a run-group tag. Layer 3 (Session) probably needs one new
  field on the `SessionManifest`: `run_group_id`.
- A ratification queue for proposals filed by the halted sessions. Human
  clears it once per day.

None of these are exotic. The substrate registry already handles the
per-session lifecycle; the topology is a thin coordinator on top.

---

## What this replaces

An operator sitting on three terminal windows, typing "keep going" and
"looks fine" and reading model output for signs of drift. That mode does
not scale past one operator watching a small number of sessions, and it
never produces the drift-detection log that a mechanised watcher produces
as a side effect. The autonomous topology scales linearly with cluster
size and its watcher output is the audit trail the SDD kit already asks
for.

---

## What it does not replace

Ratification. The Architect still decides which `NEW_TAG_PROPOSED` becomes
`signals/0.2.json`. The dispatcher will halt the session and file the
proposal; a human reads the proposal and either ratifies or rejects. The
work compresses onto the human's decision points, not the human's per-turn
prompting.

Design-lock authorship. v7 exists because a designer worked it out. The
topology drives the build from a design lock; it does not draw one.

Sprint-card authorship. The 48 cards were written by a human against the
epic plan. The topology consumes them and executes them; it does not
generate them.

---

## The name

The topology is a `parallel_build_topology` under substrate's topology
tree. It calls into `session_topology` N times with the deterministic
dispatcher instead of the human responder. Vocabulary the topology adds:

- `RUN_GROUP_SPAWNED{run_group_id, n, bootstrap_variant}` — the spawner
  fired.
- `WATCHER_VERDICT{run_group_id, session_id, verdict, drift_kind?}` —
  per-turn watcher output.
- `DISPATCHER_REPLIED{run_group_id, session_id, reply_kind}` — one of the
  five dispatcher prompts fired.
- `RUN_GROUP_CONVERGED{run_group_id, converged_at_layer}` — all N sessions
  agree on `signals/0.1.json` through layer K.
- `RUN_GROUP_DIVERGED{run_group_id, diverged_at_tag}` — the sessions'
  vocabularies stopped matching at this tag.

The convergence and divergence tags are the point of the whole exercise
when the topology is used as a research instrument.

---

*Draft. Sits alongside `2026-09-11-bootstrap-streamlining-lessons.md`. The
streamlining doc says what should be in each session's bootstrap kit; this
doc says what wraps N of those sessions in parallel.*
