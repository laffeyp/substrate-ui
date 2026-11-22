# Design note — the terminal window's typography, made tunable (round 1)

*2026-11-21. The Architect: the substrate terminal window's text should be "fully configurable on a couple different parameters" — size, alignment, spacing between words, the font, tightness; the printmaker's controls. This note names those parameters against the typography field's own terms, maps each to the CSS it drives and the range it spans, says where the controls live, and runs the vocabulary check the Architect asked for. It is a design note, not a build.*

---

## Intent

The transcript — the substrate terminal window — draws its appearance today from a fixed set of values (`web/app/derive/look.ts`, the `LOOK` table; `transcriptVars` sets CSS variables the rows read). This note proposes a panel of typographic controls that write those variables from the viewer's own settings, so the terminal's type can be set tight or loose, small or large, left or centred, in a chosen face, without touching the rendering code.

It follows the standing appearance rule (BLACKBOARD, 2026-11-17): an appearance change lands as an option beside the default, never an overwrite — "this will always be like default substrate and then we just be making like different versions." The default values stay; the panel moves off them and back.

## The parameters

Eight controls. Each row: the field term, what it sets, the CSS property it drives, a usable range, and the default (the value the terminal draws today where one exists).

| Parameter | What it sets | CSS property | Range | Default |
|---|---|---|---|---|
| **Typeface** | The font family of the terminal text | `font-family` | a short list of monospace faces (SF Mono, Menlo, JetBrains Mono, …) + the system default | the current `ui-monospace, 'SF Mono', Menlo, monospace` |
| **Type size** | The size of the type | `font-size` | ~10–18 px | the look's base transcript size |
| **Leading** | The space between lines (baseline to baseline) | `line-height` | ~1.1–2.2 (unitless ratio) | the look's `paneLineHeight` / `terminalLineHeight` |
| **Tracking** | Uniform spacing across the whole run of text | `letter-spacing` | ~−0.04–0.12 em (negative tightens) | 0 |
| **Word spacing** | The gap between words | `word-spacing` | ~−0.1–0.6 em | 0 (the font's own space) |
| **Measure** | The line length before the text wraps | `max-width` on the text column, in `ch` | ~48–120 ch, or "full" (no cap) | full (the pane width) |
| **Alignment** | How lines sit in the measure | `text-align` | left (flush left / ragged right), right, center, justify | left |
| **Weight** | The thickness of the strokes | `font-weight` | 300–700 | the look's weight (400) |
| **Brightness** | The lightness (value) of the body text | `color` (its L\*) | ~L\* 62–86 | the look's `#b9bec5` (≈L\* 76) |
| **Paragraph spacing** | The space between blocks, not between lines | `margin` on blocks | ~4–20 px | the current block margins (10–16 px) |
| **Emphasis** | How far bold and headings sit above the body in brightness and weight | heading/bold `color` + `font-weight` | brightness Δ ~0–14 L\*, weight 500–700 | pulled to #cdd1d7 on 2026-11-21 (was #e2e5e9, too bright) |

"Tight" and "dense," the Architect's words, are not a primitive — they are a setting: tight leading (a low `line-height`) plus negative tracking (a small negative `letter-spacing`), and a dense preset can set both at once. "Brightness," likewise, is the body text's **value** (its L\* in CIELAB), and **emphasis** is the typographic hierarchy — how far a heading or bold sits above the body, set by weight, size and value together, not by value alone. The too-bright bold the Architect caught on 2026-11-21 (markdown headings and `**bold**` drew at `#e2e5e9`, ~L\* 90, against the body's ~L\* 76) is an emphasis-too-high case: the fix pulled the heading/bold value down to `#cdd1d7` (~L\* 83), so bold reads by its weight and a small value step, not by glare. In the tunable system this is the **emphasis** control, not a one-off colour.

## Where it lives

- **The variables.** `transcriptVars` (`web/app/derive/look.ts`) already returns a map of CSS variables set on each transcript container; the rows read them (the transcript does not import the app). Add one variable per parameter — `--term-size`, `--term-leading`, `--term-tracking`, `--term-word-spacing`, `--term-measure`, `--term-align`, `--term-weight`, `--term-font`. The rows' styles read `var(--term-…, <default>)`, so an unset variable falls back to today's value.
- **The settings.** `web/app/state/settings.ts` holds the persisted picks (theme, look, scheme, tool-view); it gains a `terminalType` object with the eight values, persisted and mirrored into the transcript's variables on load and on a change, the same path the look and scheme picks take.
- **The panel.** The Settings dialog (⌘,) gains a "Terminal type" section: a slider for size, leading, tracking, word spacing, measure, and weight; a segmented control for alignment; a picker for the typeface; and a "reset to default" and a "dense" preset.
- **Scope.** The parameters apply to the substrate terminal window — the transcript's text, including the tool output and the `raw`/`compact`/`text` tool presentations. Whether they also retune the editor is out of scope for round 1 (the editor has its own `codeLineHeight`); a later round can share the controls.

## SDD vocabulary check

The Architect asked for the terminology to be checked against the field, not asserted from memory. Each term below is the typography field's own, with a source; the rule is the one in memory — a concept that already has an established name takes that name, and a mis-naming is flagged.

- **Leading** — the vertical distance from one baseline to the next; pronounced "LED-ing," from the lead strips of letterpress. Synonym in common use: *line spacing*. Maps to CSS `line-height`. Correct as used. ([MyFonts Fontology](https://www.myfonts.com/pages/fontscom-learning-fontology-glossary-l), [Adobe typographic terms](https://www.adobe.com/studio/print/pdf/typographic_terms.pdf))
- **Tracking** — uniform adjustment of spacing across a selected run of text; it evens out line lengths. Distinct from **kerning**, which adjusts the space of one specific letter pair and is a property of the font, not a global control — so kerning is *not* one of these parameters, and calling tracking "kerning" would be the mis-naming to avoid. Maps to CSS `letter-spacing`. ([TypeType](https://typetype.org/blog/kerning-tracking-leading-and-spacing-in-typography/), [Tuts+](https://design.tutsplus.com/articles/typography-in-60-seconds-what-is-kerning-tracking-and-leading--cms-29857))
- **Measure** — the length of a line of type; the Architect's "line length" is exactly this. A common readability rule of thumb is 52–78 characters (2–3 lowercase alphabets) per line; a monospace terminal can run wider. Maps to a `max-width` in `ch`. ([City Tech type measurements](https://openlab.citytech.cuny.edu/clarkeadv1227/type-elements/type-measurements/))
- **Word spacing** — the gap between words, set apart from tracking (which is between letters). The field treats it as its own control; CSS has a dedicated `word-spacing`. ([NN/g typography terms](https://www.nngroup.com/articles/typography-terms-ux))
- **Type size** — the size of the type, measured in points in print (1 pt = 1/72 inch, 12 pt = 1 pica); on screen it is `font-size` in px. ([Typography Handbook](https://pressbooks.openeducationalberta.ca/typographyhandbook/?p=165))
- **Weight** — the thickness of a face's strokes (light, regular, bold). Maps to `font-weight`. Standard.
- **Alignment / justification** — left (flush left, ragged right), right (flush right), centered, justified (flush both edges). Maps to `text-align`. Standard.
- **Typeface vs font** — *typeface* is the design, *font* historically a single size/style of it; the picker chooses a typeface (a `font-family`). Using "typeface" for the design is the field-correct choice. ([Creative Bloq](https://www.creativebloq.com/typography/terms-designer-needs-know-111112))
- **Brightness / value** — the lightness of the text as a colour; the colour field's term is **value** (Munsell) or **lightness** (CIELAB L\*). "Brightness" is the Architect's plain word for it and is fine as the control's label; the measured axis behind it is L\*. Maps to the text `color`'s lightness. ([NN/g typography terms](https://www.nngroup.com/articles/typography-terms-ux))
- **Paragraph spacing** — the space between paragraphs (blocks), set apart from **leading**, which is the space between lines within a paragraph; the typesetting terms are *space before* and *space after*. Mis-naming to avoid: calling paragraph spacing "leading." Maps to block `margin`. ([Adobe typographic terms](https://www.adobe.com/studio/print/pdf/typographic_terms.pdf))
- **Emphasis / hierarchy** — the field term for how headings and bold stand out from body text is **typographic hierarchy**; emphasis is created by weight, size and value together. A heading that is only *brighter* than the body, with no weight or size change, is a weak hierarchy and reads as glare — which is the bold-too-bright case. Not a single CSS property; a composite of `font-weight`, `font-size` and the value of `color`. ([Creative Bloq, key terms](https://www.creativebloq.com/graphic-design/key-terms-to-know-6133210/2))

No signal vocabulary change. Like the look, scheme, and tool-view picks, a typography pick emits no signal (`web/vm/tool_view.ts`, `tool_output_mode.ts`: the pick emits nothing); it writes a setting and a CSS variable. So `signals/versions/current.json` is untouched; this is not an SDD vocabulary (`signals/`) change, only a prose-terminology audit, and the prose above holds.

## Open questions for round 2

- Measure as a `ch` cap vs a centred column: when measure is set narrower than the pane, is the text column left in place (flush left) or centred in the pane? A design call.
- Justify on monospace: `text-align: justify` on a monospace face stretches the single space between words and can read oddly; keep it as an option but default off, and note it.
- Presets: besides "default" and "dense," is a "comfortable" (loose leading, left, full measure) preset worth shipping?
- The typeface list: which faces are bundled vs system — a bundled face is a new asset and a licence check.

---

*Round 1 design note. Eight tunable parameters — typeface, size, leading, tracking, word spacing, measure, alignment, weight — each a CSS variable the transcript reads, written from a Settings panel and persisted, landing as an option beside the default per the standing appearance rule. Terminology checked against the typography field. No signal vocabulary change.*
