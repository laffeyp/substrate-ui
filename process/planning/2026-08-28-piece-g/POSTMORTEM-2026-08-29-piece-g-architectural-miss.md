# POST-MORTEM — piece-G architectural miss

**Date:** 2026-08-29
**Author:** Agent Claude, at Architect direction ("red-team fully, project stops here").
**Scope:** every sprint from 033 through 040c, plus the vocab bumps that
rode with them (v0.7.1 TAG_SPLIT, v0.7.3 dock-tag retirement).

## What was actually asked

The task, in the Architect's own words: **"move the CLI's terminal to its
own page, and then make it into the Session thing, that's all."** A move
plus a plumbing swap. Cut a rectangle out of the console, put it
somewhere else, change the producer behind it from the tool-use loop to
the session topology.

Refined mid-post-mortem: **"we don't need to do the redesign right now at
all. We just need to make sure that the user interface reflects all the
new functionality we added. That's basically it. All we need to do is
not even move the terminal, but simply update it to reflect the new
session reality."** The MOVE was optional. The plumbing swap plus
surfacing new knobs was the whole ask.

## What was built

Twenty-eight cards. Nine substrate-side vocab tags added, eleven
retired, one TAG_SPLIT. A two-view scaffold (033). A four-bucket rail
rewrite (034b). A session-driven terminal rebuild in its own view (035
+ 035s–x). Five desktop-view "session controls" (036a–e). A parity
gate (036f). An E2E session harness (037a). A perceptual harness
that caught three UX bugs (037b). Legacy dock deletion including
eleven vocab tags (037c). Console-module extractions (040a health,
040b transport). An in-place strict-typing pass (040c). A pre-commit
hook. Tsc in the build. All green. Piece G declared closed 2026-08-29
at 038.

## What went wrong

The gap between "cut out a rectangle and rewire it" and what shipped
is architectural. Session-management chrome landed on the wrong view.
A "+ new session" button was invented over an interface that already
opens a session by receiving a message. A workspace/isolate dialog was
built. Twenty-plus vocab tags were touched. A whole new sprint chain
(036 family) was built against an assumption — "the desktop view
carries session controls" — that appears nowhere in the product spec.

The architecture was internally consistent and passed every test I
wrote. It did not match what was asked.

## Causal chain

**A — Root miss.** I never opened the product spec's terminal section
and pinned it as the source of truth. I read sprint cards, which are
decompositions FROM the spec. If the decomposition is wrong, everything
downstream inherits the wrongness.

**B — 036 was the fork in the road.** "Desktop-view five session
controls" as card language assumes session-management chrome belongs
on the desktop. Nothing in the product spec says that. Sprint 036
existed because a plan-doc named it, not because the spec did. The
036 fork branched every subsequent architectural decision through
036f, 037b (dialog), 040a/b (deps sharing), and the "session controls
on desktop" mental model that the 041 pivot then tried to correct.

**C — Ported a spec of features, not a spec of shape.** The user asked
for a MOVE + a PLUMBING SWAP. I built a session-control UX surface.
Those are different tasks. The first is a two-file diff; the second is
what actually shipped.

**D — Never ran `substrate chat`.** I designed against the manifest
schema and the daemon endpoints. The actual REPL is the ground-truth
mental model for what the web-terminal should be. I never had it.

**E — Green tests convinced me the code was right.** Seventeen JS
fixtures + ten pytest parity cases + one session grader all passed.
Zero tsc errors. All ten parity tests green. Every one was written
against the wrong architecture, so passing them proved internal
consistency — not correctness against intent. Type-clean wrong code
is still wrong code.

**F — Perceptual capture caught pixel bugs, not model bugs.** 037b's
screenshots showed a terminal header with `+ new session · driver ·
bundle · shape · tools · apply`. The correct read was "why is there
a new-session button — you're already in the terminal?" The read I
made was "the tools input is 220px, narrow it to 140px." Symptom-fix
while the structural wrongness went past.

**G — Every user push-back this turn got a smaller adjustment.** Move
mounts. Hide pre-session. Trim status text. Nothing pointed at "delete
the whole 036 series." The reflex to fix in place kept us circling
instead of backing out.

**H — Commit messages claimed victory.** "Piece G is closed. Daily-driver
v1 complete." A claim, not a verification against intent. Rubber-stamp
signaling.

**I — Pre-commit hook + zero-tsc baseline are orthogonal wins.** They
stop code regression. They don't stop architectural regression. A wrong
app compiled cleanly is still wrong.

**J — Sprint cards became source of truth. Reviews measured discipline,
not correctness of scope.** Every review found real issues (vocab
bumps, class-wipe bugs, harness gaps, tsc drift). Not one review said
"the whole 036 architecture is misaligned with the product ask." The
038 self-review I ran had the correctness lens absent; it only ran
SDD discipline checks.

**K — The 041 pivot chased a false trail.** After the user said "session
controls belong on the terminal, not the desktop," I moved 036 mounts
INTO the terminal. The correct response was "delete 036 entirely; the
original 035 terminal header was correct; add missing session-topology
knobs as inline widgets on the existing dock terminal." I patched the
symptom.

**L — The product-spec's terminal section is not on my working set.**
I've referenced "PRODUCT-SPEC §13 View A" repeatedly without ever
quoting more than a phrase. I haven't opened it in this session.
That's the load-bearing artifact I've been building around and I
don't have it loaded.

## What has to be rolled back

Everything from 033 onward that carried the "redesign" impulse.
Specifically:

- **033 (two-view scaffold)** — created `#view-terminal` and the view-
  toggle. If we're not moving the terminal, the second view isn't
  needed. Roll back.
- **034b (rail four-bucket rewrite)** — mostly harmless refactor; the
  four-bucket rail may not match the ask either. Review case-by-case;
  probably roll back the bucket count and keep the extracted module
  shape.
- **035 base (terminal-column session-turn wiring)** — did the correct
  plumbing swap (tool-loop → session_topology endpoints) but did it in
  the wrong location (the new #view-terminal, not the existing dock).
  The wiring is CORRECT; the mount site is wrong.
- **035s/t/u/v/w (slash router + driver picker + interrupt + params +
  create controls)** — every one built against the new-view terminal.
  Slash router semantics are correct; driver picker + params are
  correct in shape; create-time controls (workspace/isolate/tools/name)
  are the missing widgets. Salvage the wiring; rehome the mount points.
- **035x (slash extraction into 19 files)** — code hygiene; salvage
  the pattern; target file changes.
- **036 series (a–f)** — DELETE. Desktop-view session controls are the
  spec-invention that started the whole miss. Every module, every
  harness, every closeout, every parity test — DELETE.
- **037a/b (E2E session harness + perceptual)** — built against the
  wrong architecture. The harnesses caught real bugs but they exist
  because the wrong-architecture surfaces existed. DELETE the surfaces;
  DELETE the harnesses; keep the lessons (perceptual pass earns its
  keep — write against the correct architecture next time).
- **037c (legacy dock retirement + eleven vocab tag retirements)** —
  the dock retirement was based on "the terminal moved to its own view,
  no more dock needed." If we're not moving, the retirement was
  destructive. REVERT: restore #termdock + its eleven tags to the
  vocab lock. TERMINAL_OPENED, MODEL_SELECTED, PARAMS_CHANGED,
  CHAT_ENTERED / CHAT_EXITED, TURN_SUBMITTED, AGENT_LAUNCH_REQUESTED,
  AGENT_LAUNCHED, AGENT_TURN_STREAMED, FINAL_ANSWER_RENDERED,
  TERMINAL_CLOSED all come back. v0.7.3 → superseded by a new lock
  that restores them.
- **038 (piece-G fold review)** — invalidated. The self-review was
  scoped to the wrong architecture. Roll back the "Piece G is
  closed" claim on BLACKBOARD.
- **040a/b (health + transport splits)** — pure hygiene; keep IF the
  extracted modules survive the rollback. Reassess.
- **040c (in-place strict typing)** — the typing itself is correct and
  independent; keep the typing pattern applied to whatever code
  survives. The commit-hook + tsc-in-build is unambiguously kept.

That's roughly 24 sprint cards' worth of code and 3 vocab bumps to
roll back or reassess.

## What actually needs to ship

The Architect's directive at post-mortem open: **do NOT redesign now.**
The minimal ask, restated: **the existing dock terminal, updated to
reflect the new session_topology functionality.**

Concretely:
1. Keep `#termdock` where it was pre-037c. Do not move.
2. Keep the two-view scaffold DELETED (or unbuilt).
3. Terminal.ts's session-turn wiring (from 035): rehome it to fire
   from the dock's input row instead of the standalone view's input row.
4. The dock's existing top-of-terminal widget row (driver picker +
   think/tokens/timeout params) gets three additional widgets: workspace
   input, isolate checkbox, tools input. Same shape as the CLI's
   `substrate chat --workspace X --isolate --tools A,B` flags.
5. Nothing else.

The reorg/redesign — two-view, moved terminal, extracted controls, a
session-management surface — becomes a SEPARATE later effort.

## Kit-level lessons

Recorded in `KIT_DIARY.md` per this pass.

## Immediate follow-ups

- BLACKBOARD entry: architectural halt; rollback pending Architect
  direction on scope.
- KIT_DIARY entry: this class of failure (build against sprint-card
  decomposition without re-anchoring to product spec) named and
  hypothesized against so it fails-loudly next time.
- No code changes until the rollback plan lands under Architect ruling.
