# Red team: citation and fact check of the writing-kernel docs

Scope: every citation and quantitative claim in `ANALYSIS-2026-10-27-stochastic-process-paragraph.md` and `RESEARCH-2026-10-28-style-automation.md`. Verified via web search against primary sources where found; against secondary summaries where primary pages were not open. Items that did not surface a primary record are listed as unverified rather than confirmed.

Method: ten paired web searches on the risky citations and specific quantitative claims. The classic sources (Flesch 1948, Toulmin 1958, Lakoff & Johnson 1980, Halliday & Hasan 1976, Searle 1969, Grice 1975, Biber 1988, Fries 1952) are canon and not re-verified line by line; the modern and specific ones are.

## 1. Verdict

| Citation / claim | Status | Action |
|---|---|---|
| Flesch 1948, Flesch-Kincaid 1975, Gunning 1952, SMOG (McLaughlin 1969), ARI (Smith & Senter 1967), Coleman-Liau 1975, LIX (Björnsson 1968) | **confirmed canon** | keep |
| Toulmin 1958 *The Uses of Argument* | **confirmed canon** | keep |
| Halliday & Hasan 1976 *Cohesion in English* | **confirmed canon** | keep |
| Mann & Thompson 1988, *Text* 8(3): 243-281 | **confirmed exactly** | keep |
| Biber 1988 *Variation across Speech and Writing*, 67 features, 6 dimensions | **confirmed exactly** | keep |
| Lakoff & Johnson 1980 *Metaphors We Live By* | **confirmed canon** | keep |
| Searle 1969 *Speech Acts*; Grice 1975 *Logic and Conversation* | **confirmed canon** | keep |
| Hyland 2005, *Discourse Studies* 7(2) 173-192, "Stance and engagement" | **confirmed exactly** | keep |
| Fahnestock 1999 *Rhetorical Figures in Science*, OUP | **confirmed** (1 July 1999) | keep |
| Lanham *A Handlist of Rhetorical Terms* | **1991 was 1st edition; 2012 is the current 2nd** | update to Lanham 2012 or note the edition |
| Pragglejaz Group 2007, "MIP", *Metaphor and Symbol* 22(1):1-39 | **confirmed exactly** | keep |
| Ure 1971, "Lexical density and register differentiation" | **confirmed** (in Perren & Trim eds., CUP) | keep |
| Kobak et al. 2025, *Science Advances* | **confirmed exactly** — but with a scope caveat (see §3) | keep with caveat |
| Liang et al. 2024, ICML | **confirmed exactly** — "Monitoring AI-Modified Content at Scale" | keep |
| Hearst 1997 attributed to mean-sentence-length norms | **wrong attribution** — Hearst 1997 is TextTiling (paragraph segmentation), not sentence length | **remove or re-attribute** |
| Shutova et al. 2017, metaphor identification | **no 2017 Shutova paper found** — the relevant papers are 2010, 2013 (two of them), and 2021 | **correct to Shutova 2013 or Shutova 2010** |
| Pérez-Rosas & Mihalcea 2015, burstiness/sentence-length variance | **unverified** — their 2015 paper is on deception detection; burstiness link to them not confirmed | **remove the citation; soften the claim** |
| "Toulmin's own corpus shows explicit warrants in ~30 % of expert prose" | **fabricated** — no such empirical corpus study exists; Toulmin 1958 is theoretical, not corpus-based | **remove the statistic and the parenthetical** |
| "Kobak measured em-dash rates near 0.4-0.9 per 100 tokens in Opus / GPT-4 family" | **wrong source** — Kobak's measure is excess *vocabulary*, not em-dashes. The 15.2 em-dashes per 1000 words figure for Opus 5 comes from Arena (BleepingComputer 2026), not Kobak | **re-attribute em-dash figure to Arena / BleepingComputer; rename the Kobak attribution** |
| arXiv 2603.27006 (if present anywhere) | **fabricated** — no such paper found | **remove any such reference** |
| Flesch "NYT lead 50-55," "HBR 45-50," "Hemingway 85-95" | **unverified** — only grade-level NYT ~8 and Supreme Court Flesch ~31 confirmed in the search | **mark these as rough / soften** |
| Lexical density "fiction ~40 %, academic ~60 %, conversation ~35 %" | **partially supported** — Ure 1971 confirms the ~40 % spoken/written threshold; the three-register breakdown is attributed to Halliday 1985 and secondary; the specific numbers are approximate | **cite Halliday 1985 for the three-register split; keep the figures as rough** |
| "LLM-default burstiness CV 0.15-0.25" | **unsourced** — a published CV range for LLM output is not in the searched sources; definitions of burstiness vary (sentence-length CV vs. perplexity variance vs. word-frequency variance) | **state the range as our rough estimate, not a published figure, and name the definition we use (sentence-length CV)** |

Six confirmed-exactly, nine confirmed canon, five require edit, three to remove, several to soften.

## 2. What to change in the analysis doc

Specific edits to `ANALYSIS-2026-10-27-stochastic-process-paragraph.md`:

- **§0 reference frameworks line.** Replace `Shutova et al. (Patterns 2023)` and any `Shutova et al. 2017` with `Shutova 2013` (either "Metaphor Identification as Interpretation," *SEM 2013, or "Unsupervised Metaphor Identification," NAACL-HLT 2013 with Lin Sun). Both papers exist; neither sits in 2017.
- **§2.1 burstiness line.** "LLM-default prose has CV ≈ 0.15-0.25 … (Pérez-Rosas & Mihalcea 2015; Kobak et al. 2025)." Drop both citations; neither supports the specific CV figure. Keep the number as a rough estimate: "our observed range for LLM-default prose at this scale is CV ≈ 0.15-0.25; a published CV range using the same definition is not available."
- **§2.1 mean sentence length line.** "Mean sentence length in English: ~15-20 words (Hearst 1997)." Hearst 1997 is TextTiling; the claim should be re-anchored. Replace with Biber 1988 or drop the specific citation and keep the range as commonly reported.
- **§3 Flesch benchmarks** ("NYT lede 60-65; NYT lead paragraph 50-55; HBR 45-50; Supreme Court 30-40; Hemingway 85-95"). Only the Supreme Court figure (~31, confirmed from legal-writing research) is survivable in the current form. Soften the rest: "newspaper prose typically runs Flesch 50-70; academic management writing lower; Supreme Court opinions ~31 (confirmed from utexas.edu legal writing)."
- **§6.3 em-dash rates** attributed to Kobak. Replace with the Arena / BleepingComputer 2026 figures: Opus 5 at 15.2 per 1000 words (= 1.52 per 100 tokens), Opus 5.5 at 0.8 per 1000 words. The *field* on em-dashes is not Kobak's domain.
- **§6.1 Kobak list** — the content of the Kobak list is faithfully reproduced from the arXiv v4 version; the attribution to Kobak et al. 2025 Science Advances is correct. **One scope caveat:** the Kobak paper is a study of **biomedical/PubMed abstracts**, not general writing. Using the excess-vocabulary list as a general stylistic marker is a reach from the paper's scope. Keep the list; note the caveat in a sentence.
- **§7 Toulmin corpus parenthetical** ("Toulmin's own corpus shows explicit warrants in ~30 % of expert prose"). Delete; the statistic is unsourced and probably invented.
- **§15 reference register table.** The LLM-default column numbers are our estimates, not published figures. Mark the column accordingly or replace with cited numbers where any exist.
- **References frameworks line in §0.** Keep Hyland 2005; Fahnestock 1999; Pragglejaz 2007; the full set of canon.

## 3. What to change in the research doc

`RESEARCH-2026-10-28-style-automation.md`:

- **§1 Layer A targets table.** The eleven ranges inherit the analysis doc's figures. Where the analysis doc softens, the research doc's target band inherits the softening — e.g., the Flesch Reading Ease band 50-75 is retained because the Supreme Court / plain English scale is survivable; the LLM-default comparison column, if any, is marked as estimate.
- **§1 Layer C — Shutova reference.** The analysis doc mentions Shutova 2017 in its §10. Fix there; the research doc does not re-cite Shutova.
- **§1 Layer C — MetaNet / Master Metaphor List attribution.** "The MetaNet repository and the Master Metaphor List (Lakoff 1994)" — the Master Metaphor List is a 1991 UC Berkeley manuscript by Lakoff with Espenson and Schwartz, not a 1994 publication. Correct to Lakoff et al. 1991 (the MML's standard citation). MetaNet is a Berkeley repository; the citation is correct in spirit (an institutional lexicon) but has no formal year.
- **§1 Layer C — Mann & Thompson 1988** confirmed exactly.
- **§8 open questions.** The Germanic-Latinate pair list is listed as needing assembly from "the Oxford Historical Thesaurus plus the General Service List"; this is a plan, not a citation. No red-team action.

## 4. Scope caveats worth naming in the docs

- **Kobak's corpus is biomedical.** The excess-vocabulary list is derived from PubMed abstracts (2010-2024). Its usefulness as a general style marker is empirical, not stipulated; the project should treat it as a reasonable prior and re-measure within our own corpus if we care about precision.
- **Burstiness definitions diverge.** Three published definitions exist: coefficient of variation on sentence length (what we measure), variance of sentence-level perplexities (Gehrmann et al. and the GPTZero line), and word-frequency burstiness (Church & Gale 1995). Our docs use the first; the docs should name the definition explicitly where the number is quoted.
- **Lexical-density thresholds depend on the counting scheme.** Ure 1971 counts lexical items / total words; Halliday 1985 counts lexical items / clauses. Different definitions produce different cut-offs. The project uses Ure's scheme and should say so.

## 5. Confidence in the overall classification

The §17 classification of the paragraph in the analysis doc — short expository essay-opening in the Orwell / White tradition applied to a technical thesis, with Toulmin shape, mixed-metaphor-free, bursty rhythm, zero LLM-register markers — is unaffected by the citation errors above. The classification rests on the paragraph's own measured numbers (Layer A), each of which is reproducible from the text. The errors are in attributions and in a handful of comparison numbers against external corpora, not in the measurements of the paragraph itself.

The Kobak-list zero-hits result is robust: the paragraph genuinely contains none of the Kobak excess-vocabulary words. The scope caveat (Kobak's corpus is biomedical) does not change that; it changes the strength of inference from "zero Kobak hits" to "likely not LLM-generated in the pattern Kobak measured on PubMed."

## 6. What remains unverified

- Pérez-Rosas & Mihalcea 2015 content (needed a direct read of the paper; not found in search).
- The specific NYT lede Flesch figure (grade-level 8 confirmed; a Reading Ease number not surfaced).
- HBR Flesch figure (nothing surfaced).
- Hemingway Flesch figure (common 90-ish folklore; no primary measurement surfaced).
- The LLM-default burstiness CV figure (0.15-0.25 — our estimate; no cited source).
- Toulmin corpus percentage of explicit warrants (fabricated; now flagged for removal).

The right next action is to apply the corrections in §§2-3 as an edit on both docs. The paragraph itself and the measurement spine do not change; the external comparison numbers and three attributions do.
