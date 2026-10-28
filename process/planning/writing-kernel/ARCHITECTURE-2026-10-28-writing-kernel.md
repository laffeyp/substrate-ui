# Writing-kernel architecture

What this doc is: the technical architecture of the writing-kernel. It states what the kernel is, how its parts fit, and the build-theory that produces those parts. The build-theory is the foundation. Without it, the kernel's lexicons are static, the mode weights are first-draft forever, and the bands drift from the actual writing without anyone noticing.

Prior reading in order: `ANALYSIS-2026-10-27-stochastic-process-paragraph.md` (what the style is, measured on one paragraph), `RESEARCH-2026-10-28-style-automation.md` (what we automate and why), `RED-TEAM-2026-10-28-citation-check.md` (what survived verification). This architecture doc stands on those three.

## 1. The theory, compressed

**What we are building.** A measurement-driven loop that takes a draft, measures it on three layers of style features, and rewrites it toward a per-mode target profile. The same loop runs the writing side: a model drafts, the loop scores, candidates compete on their feature vectors, the lowest-penalty draft lands. Model calls are reserved for text generation. All judgment is in deterministic functions over labelled lexicons and structured features.

**How we build it.** Each layer of the kernel is a Python module with a measurement contract. The contract is enforced the way the rest of this repo enforces its signal vocabulary: a closed set, versioned, locked at a release. New lexicon entries, new mode weights, and new target bands enter through named functions that log every change, so the build-state of the kernel is reproducible from the dated artifacts on disk. The growth is not freeform; the growth is itself a measured loop.

**Why the build-theory is basal.** The kernel is not a product with a fixed shape. It is a scaffold the project's writing adds to. Every doc that lands is new data for the lexicons and the mode weights. If the growth loop is undefined, the kernel either drifts or ossifies. Writing the growth loop is the first act of building it.

## 2. The exemplar as the anchor

The paragraph in the analysis doc is the kernel's first calibration point. One paragraph is enough to start because the three measurement layers are population-independent: Flesch, Kincaid, Gunning, SMOG, Coleman-Liau, ARI, LIX all read a single text; so do the Kobak list, the hedge and booster lists, the pronoun density, the burstiness CV, the Latinate-suffix share.

The exemplar's role is twofold. It supplies the first set of band values in §3's table. It supplies the first positive worldview signatures in Layer C: five commitments, each with a match-list that the paragraph itself verifies.

New exemplars enter as new dated analyses alongside the first one. Each new analysis follows the 18-section shape in the current analysis file and ends with a one-paragraph classification. A diff between two analyses is a diff of their feature tables, section by section. The kernel's band values do not move on a single new exemplar; they move on a majority across a dated set, with each change logged in a `BANDS-CHANGELOG.md` entry that names the exemplars and the gap that justified the move.

## 3. The measurement spine

| Layer | Dependency | File (planned) | What it reports | Model touch |
|---|---|---|---|---|
| A | pure Python stdlib | `scripts/style_measure.py` | 12 counts: tokens, types, TTR, mean words/sentence, burstiness CV, mean syllables/word, lexical density, Latinate share, em-dashes per 100 tokens, 1P-plural density, Kobak hits per 150 tokens, Flesch Reading Ease, complex-word share | none |
| B | spaCy or Stanza | `scripts/style_tag.py` | 6 structural features: clause count per sentence, nominalisation count, passive share, discourse-connective inventory per sentence, mean dependency depth, pronoun antecedence-chain length | none |
| C | lexicons + regex + markdown parser | `scripts/style_check.py` | 6 deterministic function reports: source-domain consistency, discourse-structure markers (RST-tagged), analogical cascade, worldview lexicon match / anti-match, register-discipline patterns, fact-density floor | none |

The three generation calls (`draft`, `rephrase`, `propose`) live in `scripts/style_generate.py` and reach the model picker in the usual way. The model is called when the loop needs new text. The model is never asked to judge.

The thirteenth touch point is the `BANDS.yaml` file in `process/planning/writing-kernel/`. It holds the per-mode target bands for every Layer A and Layer B feature. The script reads it. Humans edit it through the `BANDS-CHANGELOG.md` discipline, not freely.

## 4. The rewriter

The flow, in order.

1. Read the input and the mode. Mode is passed on the command line; default is `prose`.
2. Run Layer A. Twelve numbers in milliseconds.
3. Run Layer B. Six features in seconds.
4. Run Layer C. Six function reports in seconds plus a `rephrase` call when a flagged span has no catalogue edit.
5. Compute the signed gap for each feature with mode weight above zero.
6. Rank gaps by weighted magnitude.
7. Apply the first edit from the catalogue in `scripts/style_edits.py` that targets the top gap. One edit per iteration, named by the feature it closes.
8. Re-measure.
9. Stop when every weight-1.0 feature is in-band or when the iteration cap is reached. The cap is a mode setting, default 20.
10. Emit the rewritten text, the final feature vector, the gap list, and the edit log.

Stopping is deterministic. The script never asks a model whether to stop. The model is called inside step 7 only for the `rephrase` subset of edits.

The edit catalogue is a growing table. Entries are added when a hand-rewrite over the kernel's own output names a repeatable transformation that would have closed the same gap. Each new entry is a function with a signature of `(span, feature_vector) -> (new_span, closed_feature)`.

## 5. The writer

Three shapes. Each is the rewriter with a different front-end.

**Draft-then-rewrite.** A model drafts freely to a prompt. The rewriter runs. The best-of-N variant generates K candidates and keeps the one with the lowest penalty. The default K is 1 for routine writing and 8 for a milestone document.

**Guided generation.** The writer updates a rolling feature vector as sentences land, and the model's system prompt is amended at each sentence boundary with the current gap. "Burstiness is 0.18; the next sentence should be short or long, not medium." Guided generation stays in `scripts/` for v0 and moves into the Substrate topology for v1.

**Topology.** A copy of `session/` edited so the producers in the graph are: `draft` (model), `measure_a` (Python), `measure_b` (tagger), `check_c` (functions), `rephrase` (model, only on flagged spans), `correct` (loop). The topology inherits every control the Substrate app already offers. It is one of the project's standing session topologies, not a new framework.

## 6. The build-theory

The kernel grows through five named loops. Each loop has a trigger, a measurement, an action, and a logged entry.

### 6.1 Lexicon growth

**Trigger.** A `propose` call returns candidate words for a commitment lexicon. Or a hand-rewrite replaces a word that the kernel did not catch.

**Measurement.** For each candidate, the `vocab_test` function runs the kernel's own current pass on a held-out sentence set, with and without the candidate in the lexicon. The feature-vector delta is the measure.

**Action.** A candidate enters the lexicon when adding it changes the Layer C score on the held-out set in the expected direction by at least a threshold.

**Log.** One entry in `LEXICON-CHANGELOG.md`: date, candidate, commitment, held-out delta, decision.

### 6.2 Mode-weight calibration

**Trigger.** A new piece of writing lands in a mode and the writer disagrees with the kernel's score. Or a periodic calibration pass runs over a dated set of pieces per mode.

**Measurement.** For each piece, the writer ranks it against the kernel's score on each feature. Disagreements are tabulated.

**Action.** When a feature's disagreement rate exceeds a threshold across the mode's dated set, the mode weight moves by one quarter of a point (0.25 → 0.5, 0.5 → 0.75, 1.0 → 0.75). Movement is bounded by the ends of the scale and by the frequency of calibration passes.

**Log.** One entry in `WEIGHTS-CHANGELOG.md`: date, mode, feature, disagreement rate, old weight, new weight.

### 6.3 Band tightening

**Trigger.** A red-team pass runs over a dated set of pieces. Or a feature's distribution across the set has shifted since the last pass.

**Measurement.** For each Layer A feature, compute the median and the median absolute deviation across the set. The band is median ± 2 MAD by default.

**Action.** Bands update in `BANDS.yaml`. The old bands are preserved in the file as commented-out lines above the new values.

**Log.** One entry in `BANDS-CHANGELOG.md`: date, feature, old band, new band, set size.

### 6.4 Edit-catalogue growth

**Trigger.** A hand-rewrite that closes a gap the catalogue did not know how to close.

**Measurement.** The gap before, the gap after, the span modified.

**Action.** A new entry in `scripts/style_edits.py`: a function named for the feature it targets, with a docstring that records the hand-rewrite that motivated it. The entry is added to the ranking table in `EDITS.md`.

**Log.** The commit message of the Python change references the piece that motivated it.

### 6.5 Red-team feedback

**Trigger.** A red-team report lands in `writing-kernel/`.

**Measurement.** The report's rows: `confirmed | wrong attribution | fabricated | unverified | needs scope caveat`.

**Action.** Every row with `wrong attribution`, `fabricated`, or `unverified` triggers an edit in the source doc. Every row with `needs scope caveat` triggers a sentence addition. A `confirmed` row triggers nothing.

**Log.** The red-team report itself is the log. A follow-up commit on the source doc with a message pointing at the red-team file closes the loop.

The five loops are the kernel's growth mechanism. They are not optional. Without them the measurement spine is a snapshot, not a kernel.

## 7. Scale ladder

Four scales, four windows, four cadences.

| Scale | Window | Cadence | Who runs it |
|---|---|---|---|
| Sentence | one clause chain | on each edit | the rewriter during a run |
| Paragraph | 9-sentence block (or whole paragraph) | on save of a paragraph in a long doc | the rewriter |
| Document | whole file | on commit, pre-commit hook | the hook |
| Project | every file under `process/planning/`, `README.md`, every `.md` in the repo | weekly, scheduled | a scheduled Substrate run |

The project-scale pass answers one question: has the project's writing drifted off the standard? The output is a ranked list of files by distance from the standard, with the top five flagged for a hand pass.

## 8. Discipline inherited from sdd-kit-4

The project already runs on signal-driven development. The kernel inherits the discipline without changes.

- **Roadmap and sprint cards.** Every build step named in §10 lands under a sprint card. The roadmap for the kernel lives at `writing-kernel/ROADMAP-2026-10-28-writing-kernel.md` (to be written).
- **Observation contract.** Every script in §3 has a behaviour test. The test runs the real script against a real text and reads the real output. No mocks. The test lives next to the script.
- **Vocabulary-as-contract.** If the kernel introduces signal tags for its topology, those tags enter the signal vocabulary at the next version bump and the parity gate blocks any emit of an undeclared tag.
- **Append-only logs.** `BLACKBOARD.md` records every sprint close; `KIT_DIARY.md` records every finding and hypothesis.
- **Dated docs, no in-place edits.** Every analysis, every research pass, every red-team report lands as a new dated file. The current analysis supersedes none; the next one does, and the first stays on disk as the audit trail.
- **No forks, no subagents.** The main agent does the work. External research runs through `WebSearch` directly, not through delegated readers.
- **Halt-and-articulate.** When a check does not resolve, the work halts and writes a halt note. No workaround slides past unexamined.

## 9. Boundaries

What the kernel does. Measure a piece of writing on three layers. Rank its distance from the mode's target. Apply catalogue edits to close the gaps. Generate candidate drafts and rephrases when the writer asks. Report its findings.

What the kernel does not do. Judge whether a piece of writing is good. Replace the writer. Auto-rewrite without the writer seeing the diff. Enforce commits silently. Decide what a piece of writing is for.

What is out of scope for the first version. Full dependency parse (comes with Layer B's tagger). Full Biber 67-feature multidimensional analysis (future, after enough exemplars accumulate). Perplexity scoring under a reference LM (future, after a local model is pinned). NRC-VAD sentiment per sentence (future). MIP word-by-word metaphor identification (future; the Layer C source-domain lexicon stands in).

## 10. Build order

Each step lands under its own sprint card. Each sprint carries an observation contract and names the artifact that closes it.

| Step | Artifact | Depends on | Done when |
|---|---|---|---|
| 1 | `scripts/style_measure.py` (Layer A) | nothing | the script measures the exemplar paragraph and reports its 12 numbers matching the analysis doc |
| 2 | `BANDS.yaml` with per-mode bands for Layer A | step 1 | every band in the research doc §2 table has a value in the file |
| 3 | `BANDS-CHANGELOG.md`, `WEIGHTS-CHANGELOG.md`, `LEXICON-CHANGELOG.md` scaffolds | step 2 | three empty log files on disk, format documented at the top of each |
| 4 | `scripts/style_tag.py` (Layer B) with spaCy | step 1 | the script reports Layer B's six features on the exemplar paragraph |
| 5 | `scripts/style_check.py` (Layer C deterministic functions) | step 4 | the script runs the six Layer C functions on the exemplar paragraph and reports lexicon hits, discourse markers, cascade pattern, register patterns, fact-density per sentence |
| 6 | `scripts/style_edits.py` (edit catalogue) with the first 10 entries from the research doc §4 | step 5 | each entry has a test that applies it and shows the targeted feature move |
| 7 | `scripts/style_rewrite.py` (the rewriter loop) | steps 1-6 | the script takes a Markdown file and a mode, writes a rewritten file, writes a feature-vector report, writes an edit log; the behaviour test rewrites a known-bad draft and lands all weight-1.0 features in-band |
| 8 | `scripts/style_generate.py` with `draft`, `rephrase`, `propose` wired to the model picker | step 7 | a model call behind each; the behaviour test runs each against a prompt and shows the typed output |
| 9 | Pre-commit hook that runs the rewriter in report-only mode on changed `.md` files in `process/planning/` and reports the gaps | step 7 | the hook fires on a staged doc and prints the gap report |
| 10 | A Substrate session topology that composes draft, measure, tag, check, rephrase, correct producers | steps 7-8 | the topology runs end-to-end in the Substrate app against the exemplar prompt and lands a draft that passes every weight-1.0 check |
| 11 | Scheduled project-scale drift pass | step 7 | a weekly run reports a ranked list of docs by distance |

Steps 1-6 are deterministic Python work. Step 7 is composition. Steps 8-10 are the model-and-topology integration. Step 11 is scheduling. Each step is one sprint. The sprint numbering starts at the next available number in `process/sprints/`.

## 11. What stays open

The build-theory names five growth loops. Each loop needs its first calibration pass before the kernel is self-maintaining:

- **Lexicon.** First pass runs after step 5 lands and five documents' worth of writing has accumulated.
- **Mode weights.** First calibration pass runs after step 6 and three hand-rewrites per mode.
- **Bands.** First tightening pass runs after step 7 and five dated analyses are on disk.
- **Edit catalogue.** First growth round runs on the writing produced by steps 1-10 themselves.
- **Red-team.** First pass is the one dated 2026-10-28 already on disk; the loop expects a repeat every quarter or on request.

The architecture is complete when every loop has run its first cycle and the kernel's state is reproducible from the dated artifacts in `writing-kernel/` alone.
