# Legibility and spacing in the pane, against the editor

*2026-11-11. The Architect: "the same thing, general legibility and spacing, but apply to the pane window too, not just the editor window. Do the same things apply? … How are they different?"*

## What is shared

The pane and the editor's substrate terminal draw the transcript with the same rows (`web/reveal/transcript/Row.tsx`, `ModelReply.tsx`), measured at a 2.0 line height in the pane and 1.70 in the editor (`harness/shakeout/type_metrics.ts`). Roadmap r14 E18 (line height 1.54) and E21 (the reply brightest) change both places.

## What is different

The editor shows code; the pane shows conversation, mostly prose in paragraphs with code blocks inside it. Prose brings two questions code does not, and the pane's code blocks differ from the editor's code in two ways.

**Line length.** On screen, comprehension of prose was highest at about 55 characters per line, and reading speed did not change between 55 and 100 (Dyson and Haselgrove, International Journal of Human-Computer Studies 54, 2001); readers prefer 45 to 72 characters (summarised from Dyson's and related studies). A reply row in the pane runs to 840 px (`Row.tsx` `maxWidth`), about 107 characters of 13 px monospace. Code is measured by its own lines and never set to a reading measure, so this rule is the pane's alone.

**Typeface.** For prose at normal sizes, proportional fonts read somewhat faster than monospace: about 5% at maximum speed (Mansfield, Legge and Bane 1996), faster for complex passages (Payne 1967), and monospace was better only near the acuity limit (Beldie, Pastoor and Schwarz, Human Factors 25, 1983). The pane sets everything in monospace (`ui-monospace`, 13 px), which is part of Substrate's look.

**Code inside replies is not highlighted.** `ModelReply.tsx` draws a fenced code block in one grey (#b9bec5) on #1a1c20, with its language named above it; the editor's palette (sprint 475) does not reach it.

**Wrapping runs the other way.** A reply's code block wraps (`white-space: pre-wrap`); the editor's code does not wrap by default (roadmap E19). In a conversation a block that scrolls sideways hides part of a message; the pane keeps wrapping.

## Takeaways

1. **E22, code in replies in the editor's palette.** A fenced block with a language is highlighted by the same parsers and the same palette as the editor (`@codemirror/language-data`, `@lezer/highlight`'s `highlightCode`), so code reads the same in both places, one key. The palette moves to one shared home both draw from. After E16, so the tuned notes reach both.
2. **E23, a reading measure for the reply's prose.** Paragraphs and lists in a reply run to at most 72 characters (`72ch`, exact in monospace), inside the 45–72 range readers prefer and near the 55 that comprehension favoured; code blocks, tables and tool cards keep the row's full width. With E18 and E21, in the pane's first sprint.
3. **Not taken: a proportional font for the pane's prose.** The gain is about 5%, and monospace is part of Substrate's design ("we can't sacrifice the design of this at all").
4. **The pane keeps wrapping code**; E19's wrapping setting is the editor's.

## Sources

- Dyson, M. C., Haselgrove, M. (2001). The influence of reading speed and line length on the effectiveness of reading from a screen. International Journal of Human-Computer Studies 54, 585–612. https://journals.uc.edu/index.php/vl/article/view/5671 (related Dyson work) ; summary: https://humanfactors.com/newsletters/optimal_line_length.html
- Line length preference and speed, summarised: https://www.blog.theteamw.com/2009/10/26/100-things-you-should-know-about-people-2-line-length/
- Beldie, I. P., Pastoor, S., Schwarz, E. (1983). Fixed versus variable letter width for televised text. Human Factors 25, 273–277 (as cited in) https://www.cs.umb.edu/~ram/rsvp/publications/SID2002.doc
- Mansfield, J. S., Legge, G. E., Bane, M. C. (1996). Psychophysics of reading XV: font effects in normal and low vision. https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/files/media/mansfield96_psychophysics_of_reading_xv-_font_effects_in_normal_and_low_vision.pdf
- Payne (1967), proportional versus standard spacing: https://journals.uc.edu/index.php/vl/article/view/4991
