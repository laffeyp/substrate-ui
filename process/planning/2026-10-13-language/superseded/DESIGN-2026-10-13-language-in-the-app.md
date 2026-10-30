# DESIGN: language measurements in the app

*2026-10-13. The Architect: "it should be another panel in the meta… display these measurements over time… over their windows too… just like we're doing with the down graph… put it after structure… And the other way is… some overlay… right down at the bottom, we have it say medium, full, blunt… without distracting the user… maybe a heads up display type thing you could hide… everything needs like a little hover or a couple sentence explanation." What exists: every app session records `LanguageProfile` (each user message, each reply, each turn's relation) and `LanguageDrift` (a change in a watched measure) before the turn returns (kernel vocabulary v0.11 § W). Today both are hidden: the transcript ignores them, the graph's app view treats them as plumbing.*

Two surfaces, one source of explanations.

## 1. A meta page: the language view

### Where

A fifth meta tab, after structure: `stream+graph · i/o · structure · language · scene`.

### What it draws, and why this form

The same time axis as the graph: sequence runs down the page, one row per turn, newest at the bottom, so a turn sits at the same height in both views (the design spec makes the sequence number the universal referent, §2). Across the page, one narrow column per measure: **small multiples**, the standard way to compare many series that share an axis (Tufte, *Envisioning Information*; *The Visual Display of Quantitative Information*). Each column is a vertical **sparkline**, a word-sized graphic set beside its number (Tufte, *Beautiful Evidence*, pp. 46–63):

```
            words      sent.len   hedges/1k   boosters/1k  em-dash/1k   …
turn 0  ·   49 ●       14.2 ●      6.1 ●        0.0 ●       4.1 ●
turn 1  ·  119  ●      17.0  ●     8.4  ●       2.5  ●      0.0●
───── length: terse → full ─────────────────────────────────────────────   ← a setting change, across every column
turn 2  ·  412      ●  18.3  ●     7.0  ●       1.1 ●       2.4 ●
turn 3  ·  398      ●▲ 19.1   ●    6.6 ●        0.8●        2.0●
                    ▲ drift ↑ (words), seq 397
```

- **Dot:** the measure on that one text (the `LanguageProfile` value).
- **Line:** the same measure over the trailing window (the latest texts of that stream, back to the measure's minimum), so a single odd reply does not read as a trend. These are the values `substrate language` writes as `values.window`.
- **Rule across all columns:** a `SessionChanged` (length, tone, guidance, driver): the cause a reader looks for when a column moves.
- **▲ / ▼:** a `LanguageDrift`, at the reply that raised it, in the direction it moved. This is the control-chart convention: the series, its centre, and a mark where the test signalled (Montgomery, *Introduction to Statistical Quality Control*; the detector is Page–Hinkley, research round 5).
- **A stream switch:** the model's replies (default), the user's messages, or the relation per turn (length ratio, echo, phrase copy, style matching).

Plain lines rather than compact horizon bands: Heer, Kong & Agrawala (CHI 2009) found that layered bands cost estimation time and accuracy, and that plain or one-band charts hold up until the chart is very small. Columns of 90–120 px are not small.

### Which measures

By default, the 13 the drift detector watches (`substrate.language.drift.WATCHED`), grouped by the setting meant to move them:

| Group | Measures |
|---|---|
| Length | words, mean sentence length, restating the question (opening), offers of more (closing) |
| Tone | hedges, boosters, contractions, positive emotion, exclamation marks |
| Guidance | Kobak style words, em-dashes, bold, list items |

The other 61 of the 74 measures per text (the 22 LIWC categories among them) are one step away: a `/language all` command, or the same page scrolled right. That gives the reader "just enough" by default and "easy transition to more in-depth information" when wanted (Mankoff et al., heuristics 4 and 6, below).

### Data

Per-text values and drifts come from the record's events, as the graph reads its events now. The trailing-window line comes from the server: a `GET /api/session/<id>/language` that runs `app.language_lines` on the record (median 0.01 s per recorded session, the longest 0.59 s; 3.5 s for all 77) and returns the lines. This is build step 3 of the language roadmap ("the app's process"), here as an on-demand read rather than a file written beside the workspace; the file can come later if the view needs it faster.

## 2. In the session: a heads-up that stays quiet

### The rule

An ambient display stays out of the way until something needs attention. Mankoff et al.'s heuristics for ambient displays (CHI 2003, Table 1) name it "'Peripherality' of display: … unobtrusive and remain so unless it requires the user's attention", with "Sufficient information design: … 'just enough' information" and "Easy transition to more in-depth information". Alarm management says the same in stronger terms: an alarm is a condition "requiring a response" (ISA-18.2), and "there should be no alarm without a predefined operator response" (EEMUA 191, as summarised by Emerson); a display that signals every deviation floods its reader.

So the session shows **no numbers by default**. It shows one thing, and only when the detector has signalled.

### What it shows

The bar line already ends with the settings (`… · high · normal · neutral`). After a `LanguageDrift`, one item joins it, in the bar's quiet colour, until the next setting change or `/language clear`:

```
turn 7 · 18ms · no tools · returned (replied) · high · full · blunt · words ↑
```

- The item names the measure and the direction, nothing else.
- Hover (or keyboard focus) gives two sentences: what moved, by how much against the session's earlier replies, and the setting changes in the window. Opening `/language` goes to the meta page at that turn.
- Several drifts at once collapse to a count (`· 3 shifts`), so a burst cannot flood the line.
- `/language off` hides the item for the session; `/language on` brings it back. No clickable control, in keeping with the bar's other commands (⌘E, `/fold`).

The response it asks for is the one the settings exist for: if replies grew longer after `full`, nothing to do; if they grew longer under `terse`, the setting is not holding, and the reader can see that without opening anything.

## 3. Explanations: one source, everywhere

Every measure carries a name and a two-sentence explanation, written once, beside the measure's definition in the language library, and generated into the UI the way `envelope_kinds.gen.ts` is generated from the kernel (DRY: one authoritative copy). Each explanation says what the number counts and what moves it, in plain words, and names the source:

> **Hedges per 1,000 words.** How often the text softens a claim: "may", "perhaps", "likely", "in my view". From Hyland's list (2005); blunt tone should lower it.

The hover follows the NN/g tooltip guidelines (Kendrick, 2019): brief, never the only place essential information lives, shown on mouse hover and on keyboard focus. The column headers, the bar-line item, and each drift mark use the same text.

## Decisions for the Architect

1. **The default measures.** The 13 watched measures in three groups (length, tone, guidance), or a different set.
2. **The bar-line item.** Shown only after a drift and named by measure and direction, as above; or a standing set of numbers (for example words per reply and hedges per 1,000) always on the line.
3. **Window line.** Served on demand from the record (`GET /api/session/<id>/language`), as above; or written to a file beside the workspace as each turn ends.

## Sources

- Tufte, E. R., *The Visual Display of Quantitative Information* (1983) and *Envisioning Information* (1990): small multiples; *Beautiful Evidence* (2006), pp. 46–63: sparklines ([Tufte, "Sparkline theory and practice"](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/)).
- Heer, J., Kong, N. & Agrawala, M. (2009), "Sizing the Horizon: The Effects of Chart Size and Layering on the Graphical Perception of Time Series Visualizations", CHI 2009 ([paper page](https://idl.uw.edu/papers/horizon)); read: abstract and a secondary summary of the layering result.
- Mankoff, J., Dey, A. K., Hsieh, G., Kientz, J., Lederer, S. & Ames, M. (2003), "Heuristic Evaluation of Ambient Displays", CHI 2003, 169–176, Table 1 (final heuristics) ([PDF copy](https://cs4760.csl.mtu.edu/resources/HE2.pdf)).
- ANSI/ISA-18.2, alarm definition, as quoted by [Control Engineering](https://www.controleng.com/articles/implementing-alarm-management-per-the-ansi-isa-18-2-standard/); EEMUA 191, "no alarm without a predefined operator response", as summarised by [Emerson](https://www.emerson.com/documents/automation/alarm-management-en-57058.pdf). Neither standard was read in full.
- Kendrick, A. (2019), "Tooltip Guidelines", Nielsen Norman Group ([article](https://www.nngroup.com/articles/tooltip-guidelines/)).
- Montgomery, D. C., *Introduction to Statistical Quality Control*: control charts and their signal marks.
- Substrate design spec draft 1, §2 (sequence numbers as the referent) and §8.1 (the trace view's hover detail).
