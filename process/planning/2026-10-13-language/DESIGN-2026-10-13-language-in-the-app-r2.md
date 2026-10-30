# DESIGN: language measurements in the app (round 2)

*2026-10-13. Round 1 (`DESIGN-2026-10-13-language-in-the-app.md`) stays on disk. The Architect, on round 1: "this is not a research paper. This is tiny… not enough information… to design any of this." Round 2 sets out what is displayed, who reads it and for what, the parameters the design is sized to (from published figures, not from Substrate's own development records), how established tools and research display this kind of information, every design choice with its alternatives, mock-ups, the explanation text, the data path, and the decisions left open.*

*The ask, verbatim: "it should be another panel in the meta… display these measurements over time… over their windows too… just like we're doing with the down graph… put it after structure… And the other way is… some overlay… right down at the bottom, we have it say medium, full, blunt… without distracting the user… maybe a heads up display type thing you could hide… where do these numbers show up? And how do we tell the user what they mean… everything needs like a little hover or a couple sentence explanation."*

---

## 1. What is displayed

Every app session records, before each turn returns (kernel session vocabulary v0.11 § W):

| Event | One per | Holds |
|---|---|---|
| `LanguageProfile`, stream `user` | user message | the message's 74 one-text measures |
| `LanguageProfile`, stream `model` | model reply (each step of the turn) | the reply's 74 measures |
| `LanguageProfile`, stream `relation`, pairing `final` / `turn` | turn, twice | length ratio, lexical echo, shared phrases, compression distance, style matching |
| `LanguageDrift` | change found | stream, measure, direction, test value, the text that raised it |
| `SessionChanged` (already recorded) | setting change | field (length, tone, bundle, driver, …), old, new |

`substrate language <record>` adds, for every text, the same measures over a **trailing window**: the latest texts of that stream joined, back far enough for each measure's minimum (research round 5, "Windows").

### The measures, by kind of number

The kind of number decides how it can be drawn.

| Kind | Examples | Range | Drawing consequence |
|---|---|---|---|
| Counts | words, sentences, tokens | 0 to thousands | wide range: a column needs its own scale |
| Means and spreads | mean sentence length, its SD and CV | a few to tens | stable on one text; ordinary line |
| Rates per 1,000 words | hedges, boosters, contractions, Kobak words, em-dashes, exclamations, list items, padding | 0 to a few hundred | **mostly zero on short texts** (a 40-word reply with one exclamation scores 25): a dot at zero is the common case, and a single word moves a short reply's rate far |
| Ratios in [0, 1] | TTR, MATTR, compression ratio, lexical echo, NCD, style matching | 0–1 | a fixed 0–1 scale reads directly |
| Fitted exponents | Zipf α, Heaps β, DFA α | about 0.5–2 | only on long windows; meaningless per text |
| Readability | Flesch ease, Flesch–Kincaid grade | about 0–100; grade 0–20 | familiar units; ordinary line |

Three consequences carry through the design: each measure needs its own scale and unit (no shared axis across columns); rates need the trailing window to be read at all, since a single short reply swings them; and the window measures (exponents, entropy, style matching) exist only once enough text has accumulated, so the display must say "not yet" rather than show nothing.

### The default set

Thirteen measures are watched by the drift detector (`substrate.language.drift.WATCHED`). Each is there because a Substrate setting is meant to move it:

| Group | Measure | Setting meant to move it |
|---|---|---|
| Length | words | length (terse, normal, full) |
| | mean sentence length | length, guidance |
| | restating the question, opening | length (terse: "leave out restatement") |
| | offers of more, closing | length (terse: "leave out offers of more") |
| Tone | hedges per 1,000 | tone (blunt: "hedge only where the evidence is uncertain") |
| | boosters per 1,000 | tone |
| | contractions per 1,000 | tone (formal) |
| | positive emotion per 1,000 | tone (dry: "without enthusiasm") |
| | exclamation marks per 1,000 | tone (dry: "without… exclamation") |
| Guidance | Kobak style words per 1,000 | guidance level |
| | em-dashes per 1,000 | guidance level |
| | bold spans per 1,000 | guidance level |
| | list items per 1,000 | guidance level |

Grouping by the setting meant to move each measure turns the display into an answer to the question its reader brings (§ 2): did the setting do what it says?

---

## 2. Who reads it, and what they ask

The reader is the person running the session (the Architect, and later any Substrate user). Their questions, and the surface that should answer each:

| Question | When | Answered by |
|---|---|---|
| Is the setting I chose holding? (terse replies stay short; blunt replies stop hedging) | during a session | the session's quiet indicator (§ 5); the page on demand |
| Did the change I just made take effect, and when? | right after `/length`, `/tone`, `/guidance` | the page: the change line and the columns after it |
| Is the model drifting over a long session? | long sessions | the indicator, from the drift detector |
| How does this model write compared with another? | choosing a model | the page, two sessions side by side (later) |
| Am I picking up the model's vocabulary? | over weeks | the page, user stream, Kobak column (later, cross-session) |
| What does this number mean? | whenever a number is shown | the hover explanation (§ 6) |

The first three are monitoring questions; the last three are analysis questions. Monitoring needs a glance; analysis needs the full page. That split is the reason for two surfaces.

---

## 3. The parameters the design is sized to

Published figures, not Substrate's development records (those are gate runs and quick checks; their median session is 2 turns and proves nothing about use).

### Session length

- **Chat assistants.** WildChat (1M real ChatGPT conversations): 2.54 turns per conversation on average, most under 10, 3.7 % over 10 (Zhao et al. 2024, Table 1). LMSYS-Chat-1M: 2.02 (Zheng et al. 2023). ShareGPT: 3.51.
- **Coding agents.** TraceLab (University of Washington; 665,453 agent steps from Claude Code and Codex, 4,258 sessions): user turns per session mean 9.8, median 1, 90th percentile 16, 99th percentile 150; requests per session mean 10.1, p90 16, p99 161; tool calls per session mean 92.3, median 23, p90 148, p99 1,262. Session wall time: median 4.3 minutes, p90 4.6 hours (mostly human idle time).

**Design consequence.** The page must be useful at one or two turns (the median session), and must stay readable at 150–160 turns (the 99th percentile) without changing form. A long tail of sessions runs to hundreds of turns. One row per turn, fixed height, scrolled: 160 turns at 18 px is 2,880 px, about three screens.

### Text length

- **Replies.** WildChat: 441 ± 411 tokens per chatbot response; ShareGPT 348; LMSYS-Chat-1M 216 (Llama-2 tokenizer). At roughly 0.75 words per token, a typical reply is 160–330 words.
- **User messages.** WildChat 296 tokens, LMSYS 70, ShareGPT 94: a user message is often a fraction of a reply.

**Design consequence.** The window minimums (research round 5) translate into replies: Heaps' minimum of 800 words takes about 3–5 replies; style matching's 1,600 words per side about 5–10 replies, and many more user messages; entropy and Zipf's 3,200 words about 10–20 replies. In a median session (1–3 turns), only the one-text measures exist; the window measures appear after several turns, and on the user side much later. The page shows that progression, rather than empty columns.

### Alert rate

The drift detector's defaults give about 4 % false alarms per watched measure over 50 values (research round 5, "Change detection"). Thirteen measures on two streams is 26 series; over a 50-turn session, about one false alarm is expected. Alarm-management practice treats more than about one alarm per 10 minutes per operator as overload (ISA-18.2, EEMUA 191, as summarised in vendor guides; the standards were not read in full). At about one model turn a minute, one false alarm in 50 turns stays well under that. The session indicator still collapses simultaneous drifts into one item (§ 5.3).

---

## 4. How established tools and research display this

### 4.1 Many series over a shared time axis

- **Small multiples** (Tufte, *Envisioning Information*, 1990; *The Visual Display of Quantitative Information*, 1983): the same small chart repeated for each variable, aligned on a shared axis, so the eye compares by position.
- **Sparklines** (Tufte, *Beautiful Evidence*, 2006, pp. 46–63): "small intense, simple, word-sized" graphics set beside their numbers. Few (*Information Dashboard Design*, 2nd ed., 2013) adds the caution that a sparkline's scale is hard to read and comparisons across sparklines are weak: they show the shape of a trend, and the number beside them carries the value.
- **Position on a common scale** is the most accurate visual encoding of a quantity, ahead of length, angle, area and colour (Cleveland & McGill, *JASA* 79(387), 1984; replicated by Heer & Bostock, 2010). Values should be dots or lines placed on an axis, not shades or sizes.
- **Horizon charts** fold a series into coloured bands to save height. Heer, Kong & Agrawala (CHI 2009) found layering costs estimation time and accuracy, and pays only when the chart must be very small. Substrate's columns are not.
- **Linked views** (brushing and linking: Becker & Cleveland, *Technometrics* 29(2), 1987; coordinated multiple views): selecting an item in one view highlights it in every linked view. In Substrate, selecting a turn in the language page should select it in stream and graph, and the reverse.
- **Overview first, zoom and filter, then details on demand** (Shneiderman, "The Eyes Have It", 1996): the page opens on the default thirteen; filters reach the rest; hover gives one value's detail.

### 4.2 Marking changes and signals

- **Annotations** (Grafana): an event marked on time-series charts as "vertical lines and icons on all graph panels", with its description on hover; a region marks a span. A setting change is exactly this.
- **Control charts** (Shewhart; Montgomery, *Introduction to Statistical Quality Control*): the series, a centre line, limits, and a mark at each point where a rule signals (the Western Electric rules: one point beyond 3σ, two of three beyond 2σ, four of five beyond 1σ, eight in a row on one side). The drift detector is the Page–Hinkley test, a CUSUM; its signals are marked the same way.
- **LLM monitoring tools.** Evidently computes text "descriptors" per text (length, sentiment, toxicity, special symbols) and plots them over time on a dashboard, with drift detection that names the words that contributed most. Langfuse plots evaluation scores over time, with a "Pulse" strip that highlights unusual scores and jumps to the rows behind them. LangSmith's monitoring charts plot feedback scores over time, grouped by tag or metadata to compare versions. Arize's managed product alerts on quality drift. All four use the same form: one chart per metric over time, a highlight on the unusual, and a click through to the item.

### 4.3 Writing-feedback tools

- **Hemingway Editor**: a sidebar with a readability grade and counts (hard sentences, passive voice, adverbs), coloured highlights in the text, and a "Write" mode that removes the sidebar and every highlight.
- **Grammarly's tone detector**: one small emoji in the corner of the text box showing how the text "may sound to readers"; clicking it opens the detail. More than 40 tones; it appears only once the text is long enough (90–150 characters, by platform).

Both put one quiet summary in the corner, and both put the detail one click away.

### 4.4 Displays at the edge of attention

- **Mankoff et al.**, "Heuristic Evaluation of Ambient Displays" (CHI 2003), final heuristics (Table 1): *Useful and relevant information*; *"Peripherality" of display* ("unobtrusive and remain so unless it requires the user's attention"); *Match between design of ambient display and environments* ("notice an ambient display because of a change in the data… and not because its design clashes"); *Sufficient information design* ("just enough"); *Consistent and intuitive mapping*; *Easy transition to more in-depth information*; *Visibility of state*; *Aesthetic and pleasing design*.
- **Matthews et al.**, "A toolkit for managing user attention in peripheral displays" (UIST 2004): the three issues are abstraction of data, selection of notification levels and transitions between them. The levels, as later papers cite them: ignore, change blind, make aware, interrupt, demand action, each asking more attention than the last.
- **Alerting tiers** (14 CFR 25.1322, flight-deck alerts): *warning*, immediate awareness and immediate response; *caution*, immediate awareness and later response; *advisory*, awareness, possibly a later response. A drift in a reply's style is an advisory.
- **Alarm management** (ANSI/ISA-18.2): an alarm indicates "an abnormal condition requiring a response"; EEMUA 191, as summarised by Emerson: "no alarm without a predefined operator response"; alarms raised for every deviation flood the operator and hide the one that matters.

### 4.5 Status bars

VS Code's status-bar guidelines: short text labels; icons only for clear metaphors; do not add custom colours; do not add more than one item unless necessary; a warning or error background "only… as a last resort". Substrate's bar line already follows this shape: plain text, the settings at its end (`… · high · normal · neutral`).

### 4.6 Explanations

- **Nielsen Norman Group, "Tooltip Guidelines"** (Kendrick, 2019): brief, helpful content; nothing "vital to task completion" (it disappears); shown on mouse hover and on keyboard focus.
- **Substrate's own pattern**, the structure page: section headers carry a `title` with a definition from `STRUCTURE_DEFS`, drawn with a dotted underline and a help cursor. The language page should look and behave the same.

---

## 5. The design

### 5.1 Where it lives

| Surface | Place | Reads |
|---|---|---|
| The language page | meta, a fifth tab after structure: `stream+graph · i/o · structure · language · scene` | every event and the window lines |
| The session indicator | the end of the bar line, after the settings | `LanguageDrift` events |
| Explanations | every header, indicator and mark, on hover and focus | one generated table (§ 6) |

### 5.2 The language page

#### Orientation

Rows are turns, time runs **down**, newest at the bottom, as in the graph and the stream. A turn sits at the same height in all three, and the session's natural reading direction is kept. The usual dashboard form (time left to right) was considered; it would break the alignment with the graph, which is the one view the Architect asked this to resemble ("just like we're doing with the down graph").

#### One column per measure

Each column is a narrow small multiple: a header, then one cell per turn.

```
 LENGTH ···································  TONE ··························  GUIDANCE ·······
 words        sent.len   restate  offer      hedges  boost  contr  pos.em  excl    kobak  em-dash  bold  list
 ⌗ 0–600      ⌗ 0–40     /1k      /1k        /1k     /1k    /1k    /1k     /1k     /1k    /1k      /1k   /1k
 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
 t0   49  ●│   14.2 ●│     0 ●     0 ●       6.1 ●   0 ●    20 ●   10 ●     0 ●     0 ●    4.1 ●    0 ●   0 ●
 t1  119   ●│  17.0 ●│     0 ●    8.4 ●      8.4 ●   2.5●   17 ●    8 ●     0 ●     0 ●    0  ●     8 ●  25 ●
 ━━ length terse → full ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 t2  412       ●│ 18.3  ●│    0 ●     0 ●       7.0 ●   1.1●   12 ●    7 ●     0 ●    2.4 ●   2.4 ●   12 ●  31 ●
 t3  398 ▲     ●│ 19.1  ●│    0 ●     0 ●       6.6 ●   0.8●   10 ●    6 ●     0 ●    2.5 ●   2.0 ●   10 ●  28 ●
```

- **The number** is the reply's own value, set in the column's unit. Few's caution about sparklines is met by keeping the number beside the mark.
- **The dot** places the same value on the column's scale (position on a common scale, Cleveland & McGill).
- **The window line** (│ in the sketch, a thin line in the build) traces the trailing-window value down the column: the trend, separate from one reply's noise. Where the window is shorter than the measure's minimum, the line is absent and the cell's hover says so ("needs 1,600 words; the window holds 640").
- **The scale** is the column's own, shown under the header (`0–600`), from 0 to a round number above the largest value in the session. Rates per 1,000 words keep 0 at the left edge, so the common zero reads as a dot on the edge.
- **The reference band**: once the detector's warm-up is complete (20 values of variation), a faint band marks the warm-up mean ± 1 SD: the control chart's centre and limits, drawn in the app's grey.

#### Changes and signals

- **A setting change** (`SessionChanged`) is a full-width rule between the turn before and the turn after it, labelled with the change (`length terse → full`), Grafana's annotation in the app's grey. Hover: when and how it was made.
- **A drift** (`LanguageDrift`) is ▲ or ▼ in the cell of the reply that raised it, in the column's colour. Hover: the measure, the direction, the test value in warm-up SDs, the number of values in the series, and the setting changes inside the window.

#### Streams

A row of three labels above the columns, styled as the page's other mode labels: **replies** (default), **messages**, **turns** (the relation measures: length ratio, lexical echo, shared phrases, compression distance, style matching). Delegate-written messages are marked in the messages stream and left out of the user's window.

#### The other measures

The default thirteen fill a typical window. The other 61 are reached by `/language all` or by scrolling right past the guidance group; they keep the same form, grouped as research round 5 groups them (size and rhythm, diversity, frequency, information, repetition, burstiness, long-range, format, readability, lexicons, LIWC). Overview first, then filter (Shneiderman).

#### Size and scroll

- Rows 18 px, the stream's line height; a session of 160 turns is three screens.
- The header row is fixed while the turns scroll.
- Column width about 92 px (number, dot field, window line); thirteen columns and the turn column fit in 1,300 px; narrower windows scroll right, as the structure page's tables do.

#### Linked with stream and graph

Selecting a turn on the language page selects it in stream and graph, and the reverse: brushing and linking. The selection is the sequence number, the design spec's universal referent (design spec § 2).

#### Keyboard

The page follows the app's arrow-key rules: ↑/↓ move between turns, ←/→ between columns, ↵ opens the turn in the stream. Hover detail is also shown on keyboard focus (NN/g).

### 5.3 The session indicator

#### What it shows

Nothing, until the drift detector signals. Then one item at the end of the bar line, in the bar's quiet colour:

```
turn 7 · 18ms · no tools · returned (replied) · high · full · blunt · words ↑
```

- The measure's short name and the direction; nothing else on the line.
- Several drifts at once: a count (`· 3 shifts`), one item, so the line never floods.
- It stays until the next setting change, or `/language clear`.
- `/language off` hides it for the session, `/language on` restores it. No clickable control, as with ⌘E and `/fold`.
- Hover or focus: two sentences: what moved and by how much against the window, and the setting in force. `/language` opens the page at that turn.

#### Why this form

- It is an **advisory**: awareness, and a response only if the reader chooses (14 CFR 25.1322). Matthews's "make aware", not "interrupt".
- It has a **predefined response**: check whether the setting is holding, open the page, or change the setting (EEMUA 191: no alarm without one).
- It meets Mankoff's **peripherality** (unobtrusive until something changes), **match to environment** (plain text in the bar's colour, the VS Code rule against custom colours), **sufficient information** (one measure, one direction), and **easy transition to depth** (hover, then the page).
- It follows the two writing tools: one quiet signal in the corner (Grammarly's emoji), the detail one step away (Hemingway's sidebar), and a way to turn it off (Hemingway's Write mode).

#### Alternatives considered

| Option | For | Against |
|---|---|---|
| Nothing in the session | no distraction | the monitoring questions (§ 2) go unanswered unless the page is open |
| **Drift-only item** (recommended) | silent while nothing changes; an advisory with a defined response | shows no numbers until a change |
| Standing numbers on the bar (e.g. `342 w · 6 hedge/1k`) | always visible; Grammarly-like | a number with no reference reads as noise; Mankoff's "just enough"; VS Code's "one item" |
| A hideable heads-up strip over the transcript (13 sparklines) | the full picture in place | covers the conversation; competes with the text for attention; duplicates the page |

### 5.4 Short sessions

The median session is one or two turns (§ 3). At that length the page shows the reply's own numbers, without window lines or reference bands, each empty place carrying its hover ("the window needs 1,600 words; this session has 412"). When cross-session windows exist (the app's process, the language roadmap's third step), the window can reach back into earlier sessions of the same workspace and stream, so a new session starts with a reference. Until then each session starts empty.

---

## 6. Explanations

### Where the text lives

Each measure carries a short name, a unit, and a two-sentence explanation, written once in the language library beside its definition and generated into the UI, as `envelope_kinds.gen.ts` is generated from the kernel today. One copy serves the page's headers, the indicator's hover, the drift marks and `/help`. The explanation says what the number counts, in plain words with examples, and which setting is meant to move it; it names the source list.

### The thirteen

| Measure | Short name | Explanation |
|---|---|---|
| words | words | How long the text is, in words; code, links and email addresses are not counted. The length setting is meant to move it: terse lower, full higher. |
| sentence_length_mean | sent. length | The average number of words in a sentence. Long sentences pack more into each one; the length and guidance settings can move it. |
| rate_padding_restatement_opening | restate | Phrases in the first two sentences that restate the question instead of answering it ("great question", "you asked"), per 1,000 words. Terse length asks the model to leave them out. |
| rate_padding_offer_of_more_closing | offer more | Offers of more help in the last two sentences ("let me know if", "happy to help"), per 1,000 words. Terse length asks the model to leave them out. |
| rate_hedges_hyland | hedges | Words that soften a claim ("may", "perhaps", "likely", "in my view"), per 1,000 words, from Hyland's list (2005). Blunt tone asks the model to hedge only where the evidence is uncertain. |
| rate_boosters_hyland | boosters | Words that assert certainty ("clearly", "in fact", "definitely"), per 1,000 words, from Hyland's list (2005). Tone moves how often a claim is pressed this way. |
| rate_contractions | contractions | Contractions such as "it's" and "don't", per 1,000 words. Formal tone asks the model to write them out. |
| rate_liwc_positive_emotion | positive | Words of positive feeling ("great", "love", "happy"), per 1,000 words, from the LIWC2007 dictionary. Dry tone asks for no enthusiasm. |
| format_exclamations | exclaim | Exclamation marks per 1,000 words. Dry tone asks for none. |
| rate_kobak_style | LLM words | Words whose use in published writing jumped after language models arrived ("delve", "underscore", "pivotal"), per 1,000 words, from Kobak et al. (2025). The guidance texts ask the model to avoid them. |
| format_em_dashes | em-dashes | Em-dashes (—) per 1,000 words. The guidance texts ask for them sparingly. |
| format_bold_spans | bold | Bold phrases per 1,000 words. The guidance texts ask for bold only where it marks something. |
| format_list_items | lists | List items per 1,000 words. The guidance texts prefer prose to lists. |

### How it is shown

As the structure page shows its definitions: the header with a dotted underline and a help cursor, the text in a native tooltip on hover and on keyboard focus, two sentences at most (NN/g). Nothing a reader needs to act on lives only in a tooltip: the column's unit and scale are printed under its name.

---

## 7. Data path

| Value | Source | Cost |
|---|---|---|
| Per-text values, drifts, setting changes | the session's record events, as the graph reads them now | none beyond today's event stream |
| Window values | a new server route, `GET /api/session/<id>/language`, running `app.language_lines` on the record | a recorded session measures in 0.01 s at the median and 0.59 s at the longest (code timing, on this machine); cache the result by the record's last seq |
| Explanations | a generated `language_measures.gen.ts` from the language library | build time |

The route is the language roadmap's third step ("the app's process") in its simplest form: computed when the page opens, cached until the record grows. A per-workspace file written as each turn ends comes later, when cross-session windows need it.

---

## 8. Decisions for the Architect

1. **Default measures.** The thirteen in three groups (length, tone, guidance), as § 1.
2. **The session indicator.** Drift-only, named by measure and direction, with `/language off` (§ 5.3, recommended); or standing numbers; or a hideable strip.
3. **Orientation.** Time down the page, aligned with the graph (recommended); or left to right, the dashboard convention.
4. **The reference band.** Shown after the warm-up, as the control chart's centre and limits (recommended); or left out to keep columns plain.
5. **Window values.** Computed on demand from the record and cached (recommended); or written to a workspace file as each turn ends.
6. **Short sessions.** Each session starts empty until cross-session windows exist (recommended for now); or build cross-session windows first.

## 9. What gets built, in order

1. The explanation table in the language library, and its generator into the UI.
2. The server route for window values.
3. The language page: columns, window lines, change rules, drift marks, streams, keyboard, linking.
4. The session indicator and `/language`.

## Sources

**Parameters**
- Zhao, W. et al. (2024), "WildChat: 1M ChatGPT Interaction Logs in the Wild", ICLR 2024, Table 1 ([arXiv 2405.01470](https://arxiv.org/html/2405.01470v1)).
- Zheng, L. et al. (2023), "LMSYS-Chat-1M: A Large-Scale Real-World LLM Conversation Dataset" ([arXiv 2309.11998](https://arxiv.org/pdf/2309.11998v1)).
- TraceLab, University of Washington: [session internal counts](https://tracelab.cs.washington.edu/exp/session/session_internal_counts/) and [session timing](https://tracelab.cs.washington.edu/exp/session/session_timing_distribution/) (Claude Code and Codex, 665,453 agent steps).

**Charting**
- Tufte, E. R. (1983), *The Visual Display of Quantitative Information*; (1990), *Envisioning Information*; (2006), *Beautiful Evidence*, pp. 46–63 ([sparkline notes](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/)).
- Few, S. (2013), *Information Dashboard Design*, 2nd ed., Analytics Press (sparkline caution as summarised by [Dundas](https://dundas.com/support/blog/the-darlings-of-dashboards)).
- Cleveland, W. S. & McGill, R. (1984), "Graphical Perception", *JASA* 79(387), 531–554.
- Heer, J., Kong, N. & Agrawala, M. (2009), "Sizing the Horizon", CHI 2009 ([paper](https://idl.uw.edu/papers/horizon)).
- Becker, R. A. & Cleveland, W. S. (1987), "Brushing Scatterplots", *Technometrics* 29(2), 127–142.
- Shneiderman, B. (1996), "The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations", IEEE Symposium on Visual Languages ([PDF](https://webspace.science.uu.nl/~telea001/uploads/VACourse/Shneiderman96.pdf)).

**Change marks and monitoring**
- Grafana, [Annotate visualizations](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/annotate-visualizations/).
- Montgomery, D. C., *Introduction to Statistical Quality Control*; Western Electric rules ([summary](https://en.wikipedia.org/wiki/Western_Electric_rules)).
- Evidently ([README](https://cdn.jsdelivr.net/gh/evidentlyai/evidently@main/README.md), [NLP and LLM monitoring](https://Evidentlyai.com/product/nlp-llm-monitoring)); Langfuse, [turn scores into charts](https://langfuse.com/changelog/2026-08-19-turn-scores-into-charts); LangSmith, [grouped monitoring charts](https://blog.langchain.com/grouped-monitoring-charts).

**Writing tools**
- Hemingway Editor, [Readability and document stats](https://hemingwayapp.com/help/docs/readability).
- Grammarly tone detector, [support article](https://support.grammarly.com/hc/en-us/articles/360034328531).

**Attention and alerting**
- Mankoff, J. et al. (2003), "Heuristic Evaluation of Ambient Displays", CHI 2003, 169–176, Table 1 ([PDF](https://cs4760.csl.mtu.edu/resources/HE2.pdf)).
- Matthews, T., Dey, A. K., Mankoff, J., Carter, S. & Rattenbury, T. (2004), "A toolkit for managing user attention in peripheral displays", UIST 2004, 247–256 ([report](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2003/5782.html)); the five levels as cited by later papers, the original list not read.
- 14 CFR 25.1322 ([text](https://www.law.cornell.edu/cfr/text/14/25.1322)); FAA AC 25.1322-1.
- ANSI/ISA-18.2, as quoted by [Control Engineering](https://www.controleng.com/articles/implementing-alarm-management-per-the-ansi-isa-18-2-standard/); EEMUA 191, as summarised by [Emerson](https://www.emerson.com/documents/automation/alarm-management-en-57058.pdf).

**Status bars and explanations**
- Visual Studio Code, [Status Bar UX guidelines](https://code.visualstudio.com/api/ux-guidelines/status-bar).
- Kendrick, A. (2019), "Tooltip Guidelines", Nielsen Norman Group ([article](https://www.nngroup.com/articles/tooltip-guidelines/)).

**Substrate**
- Kernel session vocabulary v0.11 § W; research round 5 (`RESEARCH-2026-10-13-language-metrics-r5.md`); design spec draft 1 § 2 and § 8.1; the structure page's `STRUCTURE_DEFS`.
