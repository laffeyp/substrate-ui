# How the code should look to a person (round 2): colour as notes in one key

*2026-11-11. Round 1 (`RESEARCH-2026-11-11-colour-spacing-wrap.md`) studied whether colour makes letters easier to read, found that brightness contrast decides that, and treated hue as the weaker partner. The Architect rejected that: "The colors used matter a lot … The colors are really there. They really have an effect." He set the frame: build for regular vision, with red-green colour blindness as a separate option ("We build for regular vision, we can take lessons from other stuff … a red, green, colorblind thing would be like another option"), and proposed the hypothesis this round tests: "Maybe colors that are closer together are easier for the eye to move over … subtle differences that lead the eye and the mind"; "these all operate as different notes within the same key … not … a huge contrasty thing people hate." Round 1's findings on spacing and wrapping stand; this round replaces its colour takeaways.*

## What round 1 missed

Colour's job in code is finding and grouping: seeing every string at a glance, where a definition starts, which words are the language's. Round 1's highlighting studies measured small comprehension tasks (Sarkar 2015; Hannebauer et al. 2018, who name their choice of tasks as a likely limitation), and Legge's studies measured reading speed letter by letter. None measured scanning a page of code, so none could see what colour does there.

## What colour does

**Colour is found before it is read.** Single features such as colour are registered early, automatically and in parallel; an item that differs from its neighbours by colour alone is found at once, however many neighbours there are (Treisman and Gelade, Cognitive Psychology 1980). Colour coding shortened choice reaction times by up to about 36% over no colour in the display-design literature (Human Factors 1975 review; a U.S. Navy-related report).

**The eye moves through colour groups.** Searchers take same-coloured groups in turn (Bundesen and Pedersen 1983), so each colour must mark something worth finding, and few are better than many.

**Close hues are more harmonious and less cluttered.** People like a colour pair more, and judge it more harmonious, the closer its hues (Schloss and Palmer, Attention, Perception & Psychophysics 73, 2011; 992 pairs of 32 colours). Colour variability raises measured visual clutter, and clutter makes search harder (Rosenholtz, Li and Nakano, "Measuring visual clutter", Journal of Vision 2007). Large hue jumps buy separation at the cost of harmony and clutter; small steps within one family keep both. The Architect's hypothesis holds: notes in one key, not a contrasty spread.

**The trade-off's other side.** Colours in different named families are told apart faster than colours in one family (Witzel and Gegenfurtner, Journal of Vision 2011), and search slows as distractors come close in colour to the target. So the steps within the key must stay large enough to see: harmony sets the range, discriminability sets the minimum step.

**Warm advancing and cool receding** has mixed evidence (VSS 2024: no search-time difference for warm against cool targets). Not used.

## Sprint 475's palette is already in one key

Measured in CIE LCh (`colour-science`):

| Class | Colour | L* | Chroma | Hue |
|---|---|---|---|---|
| keyword | #82a5c8 | 66.4 | 22.0 | 261° |
| type | #a9c0d8 | 76.7 | 14.8 | 260° |
| meta | #9c8fc4 | 62.3 | 30.2 | 302° |
| string | #b7a4d8 | 70.6 | 29.3 | 306° |
| number | #cc8fb8 | 66.5 | 31.8 | 338° |
| plain text | #d7dade | 86.9 | 2.3 | 263° |
| name | #e8eaee | 92.7 | 2.2 | 272° |
| punctuation | #8a9099 | 59.6 | 5.5 | 267° |
| comment | #62676f | 43.4 | 5.1 | 268° |

Every coloured class sits in one 77° arc, blue through violet to pink, at low chroma; the greys are tinted toward the same blue. That is the key, and it is why the palette reads as one piece. Inside the key: two pairs share a note, keyword and type (261°, 260°) and string and meta (306°, 302°), told apart by lightness steps of 10 and 8 L*; and keyword, string and number share a lightness (L* 66–71).

## Takeaways (replace round 1's colour takeaways)

1. **Keep the key; tune the notes.** The coloured classes stay in the 260°–340° arc at chroma at most 35, the greys stay tinted to it. Each coloured class gets its own note: the pairs that share one (keyword/type, string/meta) are moved apart in hue within the arc or given a clear lightness step; keyword, string and number get small lightness steps so they are not separated by hue alone. No colour moves more than 10 ΔE2000 from where sprint 475 put it, so the palette stays the one the Architect chose. The check, on decoded pixels: every pair of coloured classes at least 8 ΔE2000 apart; every coloured hue inside the arc; no chroma above 35.
2. **Lightness carries rank, gently.** Names brightest, plain text, then the coloured classes, punctuation and comments lowest, as sprint 475 has them; round 1's steeper ladder is dropped, since big steps are the contrast the Architect does not want.
3. **Ghost is the key with the colour taken out**: the same lightness steps in the tinted greys.
4. **Red-green colour blindness is its own scheme, an option, not the default.** Protanopia and deuteranopia lose the red–green axis (Machado et al. 2009), so in that scheme the notes that differ along it (keyword blue against string lavender, ΔE2000 3.2–4.2 when simulated) move along the blue–orange axis those readers keep. The default is built for regular vision.

## Sources

- Treisman, A., Gelade, G. (1980). A feature-integration theory of attention. Cognitive Psychology 12(1), 97–136. https://users.cs.utah.edu/~miriah/uncertainty/FeatureIntegrationTheoryOfAttention.pdf
- Review and Analysis of Color Coding Research for Visual Displays (Human Factors, 1975). https://scilit.com/publications/17ff1ae4b164881a6f549402f006c1b5 ; https://apps.dtic.mil/sti/pdfs/ADA031105.pdf
- Schloss, K. B., Palmer, S. E. (2011). Aesthetic response to color combinations: preference, harmony, and similarity. Attention, Perception & Psychophysics 73, 551–571. https://palmerlab.berkeley.edu/pdf/Schloss&Palmer(2011).pdf
- Rosenholtz, R., Li, Y., Nakano, L. (2007). Measuring visual clutter. Journal of Vision. https://dspace.mit.edu/handle/1721.1/37593
- Witzel, C., Gegenfurtner, K. R. (2011). Category effects for colour. Journal of Vision. https://pmc.ncbi.nlm.nih.gov/articles/PMC3050514
- Winawer, J., Witthoft, N. (2020). Effects of color terms on color perception. https://bpb-us-e1.wpmucdn.com/wp.nyu.edu/dist/4/2136/files/2020/05/Winawer-Witthoft2020_ReferenceWorkEntry_EffectsOfColorTermsOnColorPerc.pdf
- Visual search for warm and cool colours (VSS 2024). https://www.visionsciences.org/presentation/?id=1231
- Machado, G. M., Oliveira, M. M., Fernandes, L. A. F. (2009). https://www.inf.ufrgs.br/~oliveira/gmmachado.html
- Round 1's sources stand for spacing and wrapping.
