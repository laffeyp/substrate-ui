# The style of the paragraph as the project's writing standard: automating it

**Problem.** The paragraph analysed in `ANALYSIS-2026-10-27-stochastic-process-paragraph.md` is the project's writing standard. Every doc, spec, README, commit message, kit entry and reply should land in that style. Doing this by asking an LLM each time — "write in the style of the paragraph" — fails three ways. The LLM lands close on surface markers and misses the worldview. It flattens into a single-mode output when the real work has many modes. And it costs a prompt-plus-review cycle for every piece of writing. The project needs a process that measures, rewrites, and generates — not a prompt that waves at an exemplar.

The paragraph is a human draft lightly edited by an LLM. The analysis has 18 sections of measurable features (surface counts, syntax, readability, register markers, rhetoric, argument structure, metaphor, discourse, cohesion, pragmatics, phonology, reference comparisons). The question is how to turn that measurement into automation.

Two complications the writer named. First: the features matter differently in different modes — a commit message does not carry an analogical cascade, a README does. Second: the paragraph carries a worldview. Three conceptual metaphors, five commitments, an inclusive-we voice recruiting the reader onto the writer's side. A style-rewriter that fixes surface markers while ignoring the worldview is cosmetic.

## 1. What the analysis gives us

The paragraph has 156 tokens and 93 types across 9 sentences. The analysis extracted a feature vector that falls into three layers.

### Layer A — surface features, computable from the text alone

Twelve numbers per paragraph; all computable without a model.

| Feature | Target (this paragraph) | Standard English range | LLM-default range |
|---|---:|:---:|:---:|
| Mean words/sentence | 17.3 | 15-22 | 19-22 |
| Burstiness (CV of sentence length) | 0.35 | 0.3-0.6 | 0.15-0.25 |
| Mean syllables/word | 1.46 | 1.4-1.6 | 1.6-1.7 |
| Lexical density (content/total) | 44 % | 40-55 % | 50-55 % |
| Latinate-suffix share | 7 % | 6-30 % | 18-22 % |
| TTR on 150-token window | 0.60 | 0.55-0.65 | 0.55-0.65 |
| Em-dash per 100 tokens | 0.00 | 0.1-0.3 | 0.4-0.9 |
| Hedge-to-booster ratio | 1 : 2 | 1 : 1 to 2 : 1 | 1 : 1 (both inflated) |
| First-person-plural density | 5 per 156 tokens | 0-3 | 0-3 |
| Kobak excess-vocab hits per 150 tokens | 0 | 0-2 | 3-6 |
| Flesch Reading Ease | 66 | 50-70 | 40-55 |
| Complex-word share (≥ 3 syllables) | 13 % | 10-20 % | 20-30 % |

These twelve are the measurement spine. Each is cheap, deterministic, and compares cleanly to a published range.

### Layer B — structural features, countable with a tagger

Six features that need part-of-speech tagging or dependency parsing (spaCy, Stanza) but no language model.

- Clause count per sentence (independent vs. dependent) — in the paragraph: 13 : 13.
- Nominalisation count (`-tion, -ment, -ness, -ity, -ance, -ence` on common verbs) — in the paragraph: 5 (insight, condition, creation, understanding, correctness).
- Passive-voice share — in the paragraph: 0 of 13 independent clauses.
- Discourse connective count (temporal, contrastive, causal, additive) — in the paragraph: 9.
- Average dependency tree depth per sentence.
- Pronoun antecedence-chain length — in the paragraph: `the stochastic process` carries through 6 sentences.

### Layer C — deterministic functions over labelled features

The project's own paragraph names the right handling for an LLM: a stochastic process orchestrated as what it is. That orchestration applies here. The checks the field treats as "LLM-as-judge" problems — metaphor consistency, discourse structure, worldview — are mostly not. They are deterministic functions over labelled lexicons and structured features, the same methodology as Layer A operating on different features. **The model is reserved for the places where stochastic text generation is what the loop needs** — a draft, a candidate rewrite of a flagged span, a candidate word for a growing lexicon. The model is not asked to judge, not asked to decide, not asked whether anything is good. The judging is in the functions. The text is in the model.

**The analogy is a tool for a sense the model does not have.** A model does not hear audio; a sound-analysis function hears the audio and injects the labelled result — fundamental frequency, spectral centroid, onset positions — back in a form the model can read. The model does not strain over raw bytes; the model reads a labelled report and acts. Function-call ≠ tool-use. A function has a specific purpose. The purpose here is to let the stochastic generator take a defined action in the real world: land a piece of writing on the project's standard.

Six checks previously placed in Layer C, each as a deterministic function.

- **Conceptual-metaphor source-domain consistency.** A source-domain lexicon (SIGHT, CRAFT, FLUID-FLOW, CONTAINER, PATH, WAR, MACHINE, …) maps each content word to zero or more source domains. A sentence with content words from two source domains that argue to each other is a mixed metaphor. The function returns the span, the two source domains, and the clashing words. The MetaNet repository and the Master Metaphor List (Lakoff 1994) are the base lexicon; the project's own cluster (SIGHT, CRAFT, FLOW) is extended as writing accumulates.

- **Discourse-structure markers.** The Toulmin shape in the paragraph shows at the surface through discourse connectives: `because` and `for correctness sake` mark warrant; `provably` marks backing; `but` marks rebuttal; `instead of` marks contrast. A function tags every connective by its Rhetorical Structure Theory relation (Mann & Thompson 1988) and returns a per-sentence inventory: `S2 [temporal + consequence], S3 [contrast], S4 [cause], S5 [purpose], S6 [adversative + concession], S7 [additive]`. The writer reads the inventory and sees whether the structure the mode calls for is present. The function never says "the warrant is wrong"; it reports "no cause connective was found in a paragraph the mode marks as needing one."

- **Analogical cascade detection.** A cascade is lexical-field diversity across sentences. The function partitions content words by source domain (same lexicon as the metaphor check) and reports the cross-sentence pattern. "Three source domains, two in the first half, one in the second, bound at S8-S9 by anaphora" is a cascade. "One source domain across every sentence" is not. The function reports; the writer decides.

- **Worldview lexicon checks.** The five commitments in §3 each map to a measurable surface, each a lexicon pair.
  - *Stochastic-process ontology.* Match list: `stochastic, statistical, probabilistic, sample, sampling, distribution, variance, process, generate, output, token`. Anti-match list: `thinks, wants, knows, decides, understands, feels, agrees` with the model as subject. Fail: anti-match ≥ 1 and match = 0.
  - *Comprehension-by-inspection epistemology.* Match list: `visible, legible, interpretable, inspect, read, trace, log, record, see, show`. Anti-match list: `impressive, surprising, powerful, remarkable, amazing, cutting-edge, revolutionary`. Fail: anti-match ≥ 2.
  - *Craft frame aesthetics.* Match list: `tool, saw, build, orchestrate, control, drive, operate, run, assemble, author`. Anti-match list: `just works, magic, intelligent, smart, assistant, helper`. Fail: anti-match ≥ 1.
  - *Inclusive-we social.* Already Layer A pronoun density.
  - *Explicit-argument rhetoric.* Already the discourse-connective count above.

- **Register-discipline pattern checks.** Regex and markdown parse, both deterministic.
  - Closers: `(^|\n)\s*(In conclusion|Overall|In summary|To conclude|Finally,)` → fail.
  - Bolded-lead bullets: a markdown list where the first inline element of each item is `**…**` across ≥ 3 items → fail.
  - Decorative tri-items: three parallel noun phrases joined by `and` in a sentence otherwise unargued → the function flags; the writer judges whether the tricolon earns a terminal cadence.
  - Vacuous caveats: a published pattern list — `results may vary, that said, it depends, your mileage may vary, it is worth noting that, importantly, notably, obviously` → fail on each hit.

- **Fact-density floor.** Every sentence should carry a fact. The function flags sentences whose content-word density falls below 35 %. Heuristic, not a model call, reported as such.

Six checks, zero model calls. The lexicons and pattern lists are the project's working surface alongside the edit catalogue of §4.

### What the model is for

Three generation calls. Each produces text; a deterministic function scores what comes back.

| Call | Input | Output | What the function does with the output |
|---|---|---|---|
| `draft(mode, prompt, constraints)` | mode name, the prompt, the mode's feature targets | one or more draft candidates | measures each candidate on Layers A and B, keeps the one with the lowest penalty |
| `rephrase(span, reason)` | a flagged span and the function reason that flagged it | one or more candidate replacements | drops back any candidate that still trips the flagging function; picks the first that passes |
| `propose(commitment, direction)` | one of the five commitments, direction `match` or `anti` | a list of candidate words | tests each word in a held-out sentence set; adds the word to the lexicon only when it changes the score as expected |

The model is called when the loop needs new text. The model is never asked whether a passage is good, whether a claim is defensible, whether a word belongs — those are the functions' questions and the functions answer them. The three signatures above are the full inventory of model calls in the kernel; every other check runs without a model.

**All three layers run on the same text in sequence.** Layer A is a counter. Layer B is a tagger. Layer C is a function suite — six deterministic checks plus three generation calls whose output the functions score. The model never judges; the functions score; the loop closes. A rewriter that hits all three layers is honest; one that stops at Layer A is cosmetic.

## 2. Modes and their weights

The style is one; the instantiation is many. A commit message does not carry an analogical cascade; a vision doc does. The twelve surface features and the six structural ones have different weights per mode. Weights below are the first-draft calibration — numeric, not qualitative, so the function suite can enforce them.

| Feature | README / vision | Spec / design | Research doc | Commit msg | Code comment | Chat reply | Kit entry |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Burstiness ≥ 0.30 | **1.0** | 1.0 | 1.0 | 0.5 | 0.3 | 1.0 | 1.0 |
| Em-dash rate = 0 | **1.0** | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| Kobak hits = 0 | **1.0** | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| Latinate share ≤ 12 % | 1.0 | 0.8 | 0.8 | 0.5 | 0.5 | 1.0 | 1.0 |
| Complex-word share ≤ 20 % | 1.0 | 0.8 | 0.8 | 0.7 | 0.7 | 1.0 | 1.0 |
| Inclusive-we voice | 0.8 | 0.4 | 0.4 | 0 | 0 | 0.4 | 0.4 |
| Analogical cascade present | 0.8 | 0.3 | 0.5 | 0 | 0 | 0.3 | 0.3 |
| Toulmin shape explicit | 0.6 | **1.0** | 1.0 | 0.3 | 0 | 0.4 | 0.6 |
| No bow-tying closer | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| No vocatives aimed at the reader | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| Lexical density 40-50 % | 1.0 | 1.0 | 1.0 | 0.6 | 0.5 | 1.0 | 1.0 |
| First-person pronoun density | 0.8 | 0.4 | 0.4 | **0** (forbidden — rewrite history rule) | 0 | 0.6 | 0.4 |

Weight 1.0 means the feature is a hard check; the function suite blocks on it. Weight 0 means the feature is not scored. Fractions mean the feature contributes to a composite score and failure is a soft nudge, not a block. The weights settle inside the automation; they are not raised to the writer each time.

## 3. The worldview the paragraph invokes

Surface markers can be matched by regex. Worldview cannot. Five commitments were extracted from the paragraph in §10 and §8 of the analysis.

1. **Ontology.** LLMs are a stochastic process. Not an interlocutor. Not an oracle. The paragraph refuses the chatbot framing in S3 and names what the thing *is*.
2. **Epistemology.** Comprehension by inspection is the goal. The paragraph's three target adjectives in S9 — *visible, legible, interpretable* — map directly to the layer-by-layer analysability the project builds toward.
3. **Aesthetics.** Craft is the right frame for tool use. The car / saw / F1 analogical cascade in S6-S7 grades users by craft intensity, and the paragraph aligns the project with the F1 end of the gradient.
4. **Social stance.** Inclusive-we. The paragraph does not teach down; it enrols the reader onto the writer's side. Five `we` tokens in 156, zero direct address, one impersonal `one`.
5. **Rhetoric.** Argument is explicit. Toulmin claim, warrant, backing, qualifier are all named-on-page. The paragraph does not hide its structure.

Any piece of writing in the project should pass a worldview check: do its commitments align with these five? A piece that is surface-perfect but betrays the worldview — "LLMs are smart assistants that help you work faster!" — fails the Layer C review regardless of its Layer A score.

## 4. The transformation loop — a rewriter

The rewriter is a measure-and-edit loop. Given a draft and a target mode, it produces a draft that lands on the mode's feature targets.

### Shape

1. **Measure.** Compute Layer A on the input. Twelve numbers in milliseconds. Compute Layer B with a tagger. Six numbers in seconds.
2. **Compare.** For each feature with weight > 0 in the target mode, compute the signed gap to its target range.
3. **Rank gaps.** The feature with the largest weighted gap is the one to fix first.
4. **Edit.** Apply the edit that closes that gap. Edits are typed and small, each named by the feature it targets:
   - Burstiness low → split one long sentence or merge one short one.
   - Latinate share high → substitute from a published Germanic-Latinate pair list (e.g., `utilise → use`, `facilitate → help`, `comprehensive → full`).
   - Em-dash present → replace with comma or period.
   - Kobak hit present → delete or replace with the measured specific the word was covering for.
   - Bow-tying closer present → delete the summary sentence.
   - Mixed metaphor → consolidate to one source domain.
   - First-person imbalance → add or remove `we` tokens.
5. **Re-measure.** Loop until every feature is in-range or until `max_edits` is reached.
6. **Layer C check.** Run the six deterministic functions over the rewritten text. If a flagged span needs a replacement the edit catalogue cannot supply, `rephrase` generates candidates and the flagging function picks the one that passes. No general "is this good?" prompt is sent to a model, ever.

### Why this is not blind

Each edit is bound to a feature that is bound to a measurement that is bound to a published range. No edit is applied without a measurement that justified it. No edit is applied globally; each targets the specific sentence or token the measurement flagged. A `comprehensive → full` substitution does not run across every token; it runs on the one Kobak hit the measurement found. The user calls this "not a blind transition" — the measurement-to-edit binding is what makes it non-blind.

### Edit catalogue by feature

A rewriter needs a catalogue of edits. The catalogue is small enough to list.

| Feature out of range | Direction | Edit |
|---|---|---|
| Burstiness < 0.30 | too uniform | split the longest sentence; merge two shortest |
| Mean sentence length > 25 | too long | split; move subordinates to separate sentences |
| Em-dash > 0 | present | replace with comma, period, or parenthesis |
| Kobak hit present | present | replace with the specific the word covered for; delete if no specific |
| Latinate share > mode cap | too high | map through the Germanic-Latinate pair list |
| Complex-word share > mode cap | too high | shorter synonym when meaning preserved; keep technical terms |
| Flesch Reading Ease < mode floor | too hard | shorten sentences and words together |
| Hedge-booster ratio drifts | imbalanced | add or remove modal; add or remove intensifier |
| Bow-tying closer present | present | delete the summary sentence |
| Decorative tri-item list | present | prose it; keep tricolon only when it earns a terminal cadence |
| Bolded-lead bullets | present | reformat as prose; preserve bold only on emphasis-against-neighbours |
| Vacuous caveat | present | delete |
| Second-person vocative in agent-written prose | present | rewrite to third-person or impersonal |
| First-person-plural absent (mode calls for it) | missing | add inclusive-we where the sentence recruits the reader |

The edit catalogue is the automation's working surface. It expands as the project meets more failure modes, and each addition is tied to a measurement and a mode.

### Costed

Layer A: pure Python, zero model calls. Layer B: one tagger call per paragraph, cached. Layer C: one LLM call per rewritten draft, model-dependent. For a 500-word doc the full loop is < 10 Layer A passes, 1 Layer B call, and 1 Layer C call. The loop is budgeted in cents, not dollars.

## 5. The generation loop — a writer

Generating in this style is strictly harder than rewriting into it. The rewriter has an input to constrain against. The writer has to produce one.

Three tractable shapes, from cheapest to deepest.

### 5.1 Draft-then-rewrite (default)

The simplest shape and almost always sufficient. A model drafts freely to a prompt. The rewriter from §4 runs on the draft. The output is the rewritten draft plus the Layer C review. This is the mode most writing lives in. The best-of-N pattern already backlogged for Substrate (`project-swebench-solver-plan`, `next-app-coding-flow-on-substrate`) is the same shape: generate K drafts, score each with the full three-layer measure, keep the lowest-penalty one. The scorer is the rewriter's measurement half.

### 5.2 Guided generation (medium cost)

At each sentence boundary the writer is given the running Layer A statistics and a nudge toward the features currently below target. "The paragraph so far has burstiness 0.18; this next sentence should be short or long, not medium" is a usable constraint. Implemented through system-prompt rolling updates or through a sampler that reweights candidate next sentences by their marginal effect on the running profile.

### 5.3 Topology-mediated writing (deepest, longest lead time)

The project's own primitive is topologies. A writing topology would run a draft producer (the one place the model generates), a counter producer (Layer A), a tagger producer (Layer B), a function-suite producer (Layer C's six deterministic checks), a rephrase producer (the second place the model generates, called only for flagged spans), and a correction producer that loops. The topology is a literal source copy of `session/`, edited — not a new framework. The user has memory `feedback-session-topology-is-the-template` committing to this shape.

This is the eventual home for all three loops. The intermediate shapes (§5.1, §5.2) exist outside Substrate as scripts; the terminal shape is a topology.

## 6. The scale question

The user flagged different patterns across different time periods and scales. Four scales are real; each has its own profile.

| Scale | Unit | Profile asks |
|---|---|---|
| Sentence | one clause chain | word length, Latinate share, Kobak hits, modal shape |
| Paragraph | nine-sentence block | burstiness, sentence-length architecture, metaphor consistency, Toulmin shape |
| Document | README, spec, roadmap | section rhythm (long/short), discourse structure, worldview coherence |
| Project | all docs across months | consistency of voice, drift detection, retired-vs-active doc discipline |

Each scale calls for a different measurement window. Sentence-level checks fire on every edit. Paragraph-level checks fire on save. Document-level checks fire on commit. Project-level drift checks fire on a schedule — a weekly pass that reads every doc under `process/planning/` and flags one that drifted off the profile. The weekly pass is a separate loop and lives in Substrate as its own topology.

Patterns across time: this paragraph is the current standard; the standard will refine as more text accumulates. The analysis is dated and lives in the repo so future standards can be diffed against this one.

## 7. What is measurable now, what needs tooling, what is open

### Measurable with Python today

All of Layer A. The analyser `scratchpad/analyze.py` computed every Layer A number for the paragraph in milliseconds. Porting that into the repo as `scripts/style_measure.py` is a half-day task.

### Needs a tagger

Layer B. spaCy or Stanza. One Python dependency. One-day task to wire into the measurement script. The pre-commit hook can run both on changed `.md` files inside `process/planning/`.

### Reserved for text-generation calls

Three generation calls listed in §1's Layer C block: `draft`, `rephrase`, `propose`. Each takes a typed input and returns candidate text; a deterministic function scores the candidates. Any of the drivers already in the project's own picker will serve. Wiring is one day per call. Everything else in Layer C runs as a Python function over a lexicon.

### Open research questions

- The Germanic-Latinate pair list is partially published (Orwell, Hemingway studies) but incomplete. Needs assembly, probably from the Oxford Historical Thesaurus plus the General Service List.
- The weights in §2's table are first-draft. They need calibration against a few hand-rewritten pieces per mode: write one commit message, one README section, one chat reply in the style, measure each, read back the gaps, adjust weights, repeat until the measurements agree with the writer's eye.
- The worldview lexicons in §1's Layer C block are first-draft. Each match/anti-match list grows as the project's writing accumulates — the `vocab_align` function feeds the maintenance loop by proposing additions, which the writer accepts or rejects.
- Scale 4 — project-wide drift — needs a pass that reads every active doc, computes its profile, and clusters. The clustering problem is open: how much variance within one project is healthy versus how much is drift?

## 8. What this makes possible

A pre-commit hook that measures a changed `.md` file and reports its distance from the mode's target profile. A `substrate-rewrite` command that takes a file and a mode and returns a rewritten version plus a review. A weekly report that reads every doc in `process/planning/` and ranks them by distance from the standard. A writing topology that generates fresh prose in-style and lands it in the right file, scored before it is accepted.

Every one of these is a loop around the same three-layer measurement. The measurement is the kernel. The analysis of the paragraph is the first calibration of that kernel.
