# How the code should look to a person: colour, spacing, wrapping

*2026-11-11. The Architect asked (BLACKBOARD `user`, this date) for the colour psychology of highlighting, "the little extra lens on top" of the palette sprint 475 chose, which "looks amazing right now"; a second scheme, "ghost", all whites and greys; whether the pane's line spacing ("like 1.5 spaced") and the editor's are right; and whether long lines should wrap. Accessibility counts here only for red-green colour blindness ("anything esoteric, unless we can learn from it").*

## What was measured on Substrate

The type, as drawn in build 1794447087 (`harness/shakeout/type_metrics.ts`): the pane's transcript text is 13 px on a 26 px line, a ratio of **2.0**, double spacing, not 1.5; the same rows in the editor's terminal are 13 px on 22.1 px (1.70); the code is 13 px on 23 px (**1.77**); the input bar 13 px on 18.2 px (1.40).

Sprint 475's palette, on the ground #212327, by the WCAG contrast formula and CIE L* (`colour-science`):

| Class | Colour | Contrast | L* |
|---|---|---|---|
| names defined and called | #e8eaee | 13.1:1 | 92.7 |
| plain text | #d7dade | 11.2:1 | 86.9 |
| types | #a9c0d8 | 8.4:1 | 76.7 |
| properties | #b9bec5 | 8.4:1 | 76.8 |
| strings | #b7a4d8 | 7.0:1 | 70.6 |
| numbers | #cc8fb8 | 6.1:1 | 66.5 |
| keywords | #82a5c8 | 6.1:1 | 66.4 |
| meta | #9c8fc4 | 5.4:1 | 62.3 |
| punctuation | #8a9099 | 4.9:1 | 59.6 |
| comments | #62676f | 2.8:1 | 43.4 |

Keywords, numbers and strings sit within 4.2 L* of each other: hue alone separates them. Simulated for full red-green colour blindness (Machado et al. 2009, `matrix_cvd_Machado2009`, severity 1.0, in linear RGB), the closest pairs by CIEDE2000 are keyword/string 3.2 and keyword/number 3.5 (protan), keyword/string 4.2 (deutan): a reader with protanopia or deuteranopia sees keywords and strings as one colour. With normal vision the closest pair other than names/text is keyword/type at 8.8.

## What the research says

**Highlighting helps a little, and less with experience.** Sarkar (PPIG 2015; 10 subjects, eye-tracked, within-subjects) found highlighting significantly shortens task time, and the effect weakens as programming experience grows. Hannebauer, Hesenius and Gruhn (Empirical Software Engineering 23(5), 2018; 390 undergraduates) found no evidence that highlighting improves novices' comprehension. Beelders and du Plessis (Journal of Eye Movement Research, 2015) found more fixations and regressions on black-and-white code than on colour, but not significantly. Highlighting is a modest aid, and its value depends on what it marks.

**Lightness carries legibility; hue alone is weaker.** Legge and Rubin (1986) found text legibility set mainly by luminance contrast with the ground, not by the colours used; Legge et al. (1990) found colour contrast can match luminance contrast only when high, and never for low-vision readers. Reading speed changes little until contrast falls below about 10% (Legge and Cheung 2004).

**Few colours, used for few things.** Displays are commonly held to five to seven colours at a time (the guideline quoted in Healey, IEEE Visualization 1996, from military display work). Prokopov's essay ("I am sorry, but everyone is getting syntax highlighting wrong", tonsky.me, 2025: a practitioner's argument, not a study) holds: highlight constants (strings, numbers), definitions and comments; leave keywords, variable uses and calls plain, because they are most of the code and "if everything is highlighted, nothing stands out"; don't force equal lightness, since "our eyes are way more sensitive to differences in lightness than in color"; let brightness carry rank (a function's definition brighter than a variable's). Others write that over-highlighting is about as unhelpful as none (Xie 2017; Chan 2025).

**Line spacing.** Print studies found readers prefer and read fastest with about 2 points of leading on 7–10 point type, and more leading began to undo the gain (Tinker and Paterson, summarised in Tinker 1963); WCAG 2.x 1.4.8 (AAA) asks prose for line spacing of at least 1.5. For monospace code no controlled study was found; practitioner guidance puts code at 1.45–1.6 and notes that box-drawing characters are drawn to touch line to line, which looser spacing breaks.

**Wrapping.** VS Code's `editor.wordWrap` defaults to `off`; when on, a wrapped line takes the indentation of its first line (`editor.wrappingIndent`, default `same`), and the setting can differ per language (`"[markdown]": {...}`).

## What Substrate takes from it

1. **A lightness ladder under the hues.** Each class gets its own lightness step before its hue: names and definitions brightest; plain text; strings and numbers a step down, apart from each other; keywords a step further down, so the words of the language recede and what the code defines and holds comes forward; punctuation and comments lowest. Keywords keep their blue and the palette keeps its hues (the Architect: "the colors you've picked here are amazing"); the ladder moves their lightness. The check: every pair the gate names differs by at least 8 L*, and under protan and deutan simulation by at least 10 ΔE2000. This takes Prokopov's rank-by-brightness and Legge's luminance finding without dropping keyword colour.
2. **Ghost is the ladder alone.** All whites and greys: the same lightness steps with the hue taken out. Built on (1), it carries the same structure; a setting picks Substrate or ghost.
3. **Line spacing nudged, not redesigned.** The pane's 2.0 is looser than the print evidence and the 1.5 the WCAG prose criterion names; the code's 1.77 is above the practitioner range. Both move to 20 px on 13 px (1.54): the pane's transcript text and the code editor's lines. Box-drawing output in the transcript keeps its rows touching.
4. **Wrapping as a setting.** Off for code, as VS Code's default; on for Markdown and plain text, where lines are prose; one key switches it for the file shown (⌥Z, as VS Code); a wrapped line takes its first line's indentation.
5. **Not taken.** Leaving keywords uncoloured (Prokopov): the Architect likes the coloured keywords, and (1) lets them recede instead. Comment contrast (2.8:1) stays as D7 draws it: comments are dim by design, and reading speed holds above about 10% contrast. Accessibility beyond red-green, per the Architect.

## Sources

- Sarkar, A. (2015). The impact of syntax colouring on program comprehension. PPIG 2015. https://advait.org/files/sarkar_2015_syntax_colouring.pdf ; https://www.ppig.org/papers/2015-ppig-26th-sarkar1/
- Hannebauer, C., Hesenius, M., Gruhn, V. (2018). Does syntax highlighting help programming novices? Empirical Software Engineering 23(5), 2795–2828. https://doi.org/10.1007/s10664-017-9579-0
- Beelders, T., du Plessis, J.-P. (2015). Syntax highlighting as an influencing factor when reading and comprehending source code. Journal of Eye Movement Research. https://bop.unibe.ch/JEMR/article/view/2429
- Legge, G. E., Rubin, G. S. (1986). Psychophysics of reading IV: wavelength effects. https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/files/media/legge86_psychophysics_of_reading._iv._wavelength_effects_in_normal_and_low_vision.pdf
- Legge, G. E., Parish, D. H., Luebker, A., Wurm, L. H. (1990). Psychophysics of reading XI: comparing luminance and color contrast. https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/files/media/legge90_psychophysics_of_reading._xi._comparing_luminance_and_color_contrast.pdf
- Legge, G. E., Cheung, S.-H. (2004). Psychophysics of reading: implications for displaying text. https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/2020-08/Legge%20Cheung%202004%20Psychophysics%20of%20reading-%20Implications%20for%20displaying%20text.pdf
- Healey, C. G. (1996). Choosing effective colours for data visualization. IEEE Visualization '96. https://healey.csc.ncsu.edu/publications/15843.pdf
- Machado, G. M., Oliveira, M. M., Fernandes, L. A. F. (2009). A physiologically-based model for simulation of color vision deficiency. IEEE TVCG 15(6). https://www.inf.ufrgs.br/~oliveira/gmmachado.html ; implementation used: `colour-science`, `matrix_cvd_Machado2009`.
- Prokopov, N. (2025). I am sorry, but everyone is getting syntax highlighting wrong. https://tonsky.me/blog/syntax-highlighting/ (practitioner essay)
- Xie, Y. (2017). On syntax highlighting. https://yihui.org/en/2017/07/on-syntax-highlighting/ ; Chan, A. (2025). https://alexwlchan.net/2025/syntax-highlighting/ (practitioner posts)
- Tinker, M. A. (1963). Legibility of Print. https://www.gwern.net/doc/design/typography/1963-tinker-legibilityofprint.pdf
- W3C. Understanding SC 1.4.8 Visual Presentation. https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation
- VS Code settings (`editor.wordWrap`, `editor.wrappingIndent`), as documented in the default settings: https://vscode-docs1.readthedocs.io/en/latest/getstarted/settings/
- Practitioner guidance on code line height and box-drawing glyphs: https://madegooddesigns.com/line-height-letter-spacing/ ; https://bugs.launchpad.net/bugs/800055
