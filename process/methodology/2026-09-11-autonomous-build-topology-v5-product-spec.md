# Autonomous build topology — product spec

*Round 5. 2026-09-11. Product spec, not an engineering doc. Rounds 1-4 stay on
disk. Rounds 3 and 4 tried to write this as a kernel design and drowned the idea
in schema tables. This one describes the feature.*

---

## What this is

A new kind of substrate topology that runs a build to completion without a person
sitting on the keyboard. The topology speaks to the model on the person's behalf
every time the model returns. It knows when to say "keep going" and when to stop
and wait for a person, and it decides which of those to do by watching signals,
not by reading the model's prose.

The session topology substrate ships today pauses after every model reply. That
pause is correct — a person is on the other end of it, reading, thinking, and
typing the next thing. The autonomous build topology is what runs when no person
is on the other end. It replaces the pause with a small, disciplined loop that
keeps a build moving through its sprint queue on its own.

---

## The problem

A build session today needs an operator. The operator's job is not the work —
the model does the work — but the operator's presence is what keeps the loop
moving. The model finishes a turn. The operator reads the reply. The operator
decides the reply is fine, or the operator decides it drifted, and either way
the operator types the next prompt. Without the operator, the loop stops.

The operator's decision on almost every turn is one of three things: keep going,
correct a small drift, or halt because something needs a person's judgment. The
first two are mechanical. The third is where a person is needed and nowhere else.

The current arrangement wastes the operator on the mechanical turns and makes the
loop unable to run without them. That is the problem the autonomous topology
addresses.

---

## The idea

Give the topology the operator's role, minus the judgment calls only a person can
make. The topology observes the model's output through mechanical detectors, not
through prose. It replies with a small vocabulary of short prompts — "continue",
"next sprint", "check SDD hygiene", "revert and try again" — chosen from a
library mined out of what operators have said in real sessions. On the small
number of turns where the mechanical detectors cannot tell whether the work is
on track, the topology halts and waits for a person to look at it.

The model works. The topology watches. The person is on call, not on shift.

---

## What the topology does

The topology runs a build against a sprint queue. Every model turn is one
directive in and one work output out. Between the model's output and the next
directive, the topology does three things:

- **Watch.** Run a rotating set of detectors against the work that just landed.
  The detectors check the things a good operator checks: does the vocabulary
  still match the ratified signals; is the coding-canon still holding; do the
  UI states still match the design lock; is the writing register still plain;
  is the sprint's done-criteria met yet.
- **Classify.** From the detector output, decide whether the turn is on track,
  drifting, or broken.
- **Direct.** Send the next prompt from a small library of prompts. On track:
  a short "continue". Drifting: a corrective prompt keyed to the drift kind.
  Broken: halt and wait for a person.

The loop then feeds the directive back to the model and waits for the next
turn. The build runs until the sprint queue is exhausted, the model announces
it is done, or the topology halts for a person.

---

## What it feels like to run

A person starts the topology and walks away. Every few seconds a new turn
completes and a new detector verdict lands in the log. Most turns are green
and get a "continue". Some turns are yellow and get a short corrective prompt.
The build moves through the sprint queue on its own; sprint cards close one
after another; the audit files fill in as the topology goes.

Occasionally the topology halts. When it does, the person sees a clear note:
this is what the model produced, this is what the detector flagged, this is
what the topology decided it could not resolve, here is the sprint card the
build is holding on. The person reads it, ratifies the decision or corrects
the state, and starts the build up again.

The person is not typing "keep going" fifty times an hour. The person is
handling three or four ratification points a day.

---

## What decides "on track"

Five detectors, run on a rotating schedule so the check load stays bounded and
each detector fires when it has something meaningful to say.

- **Vocabulary conformance.** The mouth-side check on ratified signals — every
  tag the shell fired belongs to `signals/0.1.json`; every payload matches its
  Layer 2 schema. Runs every turn. A miss here is a hole in the mouth-side
  Emitter and is always red.
- **SDD hygiene.** Are `BLACKBOARD.md` and `KIT_DIARY.md` up to date with the
  last closed sprint? Is every drift the detectors have flagged answered with
  a proposal? Runs every second turn.
- **Coding canon.** The linter suite: retyped literals against enums that
  exist, discriminated-union coverage, function-length caps, dead-code detection.
  Runs every fifth turn.
- **Design lock.** For sprints that render UI states, screenshot the state and
  region-diff it against the design lock. Runs whenever the sprint card claims
  a UI state.
- **Prose register.** Runs the `dellm` skill's checks over every markdown file
  the turn touched. Flags machine register, cliché tokens, uniform sentence
  rhythm. Runs whenever the turn edits markdown.

Each detector returns green, yellow, or red. The turn's verdict is the worst
of the detectors that ran. The verdict, and which detectors produced it,
lands in the trace so the topology's decisions are reconstructable.

---

## What the topology says back to the model

The prompt library is not designed a priori. It is mined out of prior sessions
where a person was driving well. The mining pass reads the transcripts under
`~/.claude/projects/`, enumerates every operator turn, and for each one records
the shape of the signal that triggered the reply, the reply text itself, and a
label naming what kind of intervention it was. Silent-continue evidence is
included — every turn the operator let stand is data too, and in a well-run
session those are the majority. The corpus clusters into a small number of
intervention kinds; each cluster becomes one entry in the topology's prompt
library, keyed by the verdict shape that should trigger it.

Three properties matter for the library:

- **Short.** A good directive is one line. The model has the full context; the
  directive is just the operator's steer.
- **Faithful.** The words come from what operators actually said. The library
  captures the operator's voice, not an idealised version of it.
- **Includes silence.** The library has a "continue" cluster with variants —
  "continue", "next", "go on" — and the topology uses them when the verdict is
  green. Without them, the topology overcorrects.

The topology also inserts periodic reminders on its own. If SDD hygiene has
not been checked in the last five turns, the next directive opens with a
reminder to run it. If the design lock is stale on a UI sprint, the next
directive says so. These are the mechanised version of the "remember SDD" and
"look at the designs again" prompts a person issues by hand every so often.

---

## What the topology halts on

Three halts. Each names its reason and its resume condition, so a person
picking the build up knows what to do.

- **Ratification required.** The mouth-side Emitter refused a tag or payload;
  the model tried to invent vocabulary and the check caught it. A person needs
  to ratify a proposal into `signals/0.2.json` or correct the code that emitted
  the invented tag.
- **Director uncertain.** The verdict is yellow but no cluster in the prompt
  library matches its drift kind. A person needs to read the trace, decide
  what should have happened, and either extend the library or fix the state.
- **Turn cap.** The sprint pointer has not advanced in K turns. The model is
  looping; a person needs to look.

Everything else — every red-but-known-drift, every yellow-with-matching-cluster
— the topology handles on its own.

---

## Watching the writing itself

The prose-register detector deserves its own note because it is the piece that
looks least like signal work and most like taste work. The `dellm` skill's
checks are not taste. They are pattern-matching against the fingerprint of
machine register — uniform sentence length, adverb frequency, high-frequency
LLM-tell tokens ("admits", "load-bearing", "surfacing rather than building",
"seamlessly leverages"). A score above threshold is a signal. The detector
reads the score, not the text.

This is the same principle as every other detector. The topology never reads
what the model said. It reads what the model did — which files changed, which
tags fired, which scores moved. When the scores are inside their bands, the
topology says "continue" and moves on. When they are not, it says something
about what specifically drifted.

Drift is detectable from signals other than the model's own words because the
model's stochastic text output has structure. That structure has measurable
properties. Those properties are what the detectors read.

---

## Running many of these at once

A single autonomous build runs in one workspace against one sprint queue with
one Responder. A person who wants to run three builds opens three shells and
starts three of them. That is not a feature of the topology; it is what a
person does with a topology that no longer needs a person watching it.

Three concurrent unattended builds is where the throughput story lives. Each
build files its own halts against its own trace. A person clears halts across
the three whenever they land.

The topology can also be invoked from an outer session. An operator running a
manual `session_topology` can type "spin up three autonomous builds of the
current state against different bootstrap variants," and the session's shell
launches three autonomous topologies against three workspaces. The operator
continues driving their own session; the three autonomous ones run underneath.

---

## Comparing variants

The natural next step from unattended builds is unattended experiments. Two
builds running against the same design lock with the same substrate but
different bootstrap kits are a comparison. Three builds running against the
same everything but different Responders (different Ollama models, or Ollama
versus a CLI driver) are another. The output — how far each build got, which
sprints closed, which halts fired, what the vocabularies look like at the end
— is the finding.

This is not part of the topology's design. It is what the topology enables
because the topology reduced per-build human cost to near zero. The
comparisons run in whatever configuration the person specifies at start.

---

## What the topology is for and who it is for

For: any build that already has a ratified vocabulary, a sprint queue, and a
mouth-side Emitter that refuses invented tags. Without the first, there is no
Layer 2 shape to check. Without the second, there is nothing to progress
through. Without the third, the vocabulary-conformance detector is toothless.

Who: an operator who has already run a build manually and knows what a good
turn looks like. Their expertise flows into the topology through the mined
prompt corpus and through the detector thresholds. The operator's judgment
still runs the build; it runs it once, in mining and threshold-setting, rather
than continuously, in turn-by-turn prompting.

---

## What the topology is not

Not a way to bootstrap a build without vocabulary. Vocabulary comes first;
this topology consumes it.

Not a research instrument by design. It becomes one when someone chooses to
run comparative builds against it, but its own purpose is to run one build.

Not a replacement for the session topology. Manual sessions keep working; the
autonomous topology is a sibling. A person can flip between them or run both.

Not a way to remove the operator from the project. The operator's role
compresses onto ratification, correction, and design; it does not disappear.

---

## What this lets a person stop doing

Typing "continue" one hundred times a day. Reading model output for signs of
drift the linter would have caught in a second. Sitting on a shell while a
long deterministic sprint runs. Watching three builds in three panes and
context-switching between them. Manually inserting reminders about SDD.

What remains for the person: designing the vocabulary, ratifying its
evolution, correcting the halts the mechanical detectors cannot resolve,
adding new detectors when new drift kinds appear, and mining new prompt
corpus entries as the operator's own patterns evolve.

---

## Success looks like

An operator starts three autonomous builds against three variant bootstrap
kits at nine in the morning and goes to do other work. By noon the topologies
have each closed six sprints, halted once for a ratification, and are waiting
for the operator's ratification decisions. The operator clears the three halts
in five minutes. By evening the builds have closed twenty sprints and finished
their queues. The operator reads the finished audit files, picks which
variant produced the strongest result, and starts the next day's work from
there.

## Failure looks like

The topology halts every third turn because the detectors are too tight or
the prompt corpus is too thin. The operator is called back to the loop
constantly and the arrangement is worse than running the builds by hand. The
fix is not in the topology; it is in the detectors and the corpus. Both are
data, both are iterable.
