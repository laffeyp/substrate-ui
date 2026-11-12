# Which text in the pane is brightest

*2026-11-11. The Architect: "the user's text is brighter than the response text … the LLM text not only does it need to be single space, but it needs to be brighter as well … is there a use in having a difference? I would almost say it should be the opposite … the user's ones would be a little bit dimmer than the LLM's ones … Or they'd be equal brightness."*

## What the pane draws

`web/reveal/transcript/Row.tsx` `styleFor`: the person's message is #e2e5e9 (L* 90.8; 13.5:1 on the pane's #1a1c20), the model's reply #b9bec5 (L* 76.8; 9.1:1). The reply, the text read most, is 14 L* dimmer than the message the person just typed. The code's text is #d7dade (L* 86.9), between them. Both rows are drawn at a 2.0 line height (`harness/shakeout/type_metrics.ts`; roadmap E18 takes it to 1.54).

## What the design systems say

- Material Design's dark theme sets text emphasis by white opacity: high emphasis 87%, medium 60%, disabled 38%, and keeps high-emphasis text off pure white (Material Design, "Dark theme" and "Text legibility"; the Material dark-theme codelab).
- Apple's Human Interface Guidelines order label colours primary, secondary, tertiary, quaternary: the primary label for primary content and titles, secondary for subtitles and less prominent text (HIG, Color and Dark Mode; WWDC 2019 session 808).

Both give the brightest text to the content being read and step down for what supports it. In the pane the content being read is the model's reply; the person's own message is known to them, and marked by its `›` glyph and its spacing. 87% white on #1a1c20 is about #e2e5e9: the colour the person's message has now.

Reading research on polarity and contrast is mixed and does not settle a shade (positive against negative polarity studies, 2013–2024; Legge and Cheung 2004: reading speed holds above about 10% contrast). The case here is hierarchy, not legibility: both rows are legible; the order is backwards.

## Takeaway

The model's reply takes the high-emphasis colour #e2e5e9; the person's message steps down one note in the same key, to the code's #d7dade, so the two differ subtly, the reply brighter, as the Architect proposed. Tool cards and status rows keep their dimmer steps. Graded on decoded pixels: the reply's glyphs brighter than the message's, by a small step (3 to 8 L*).

## Sources

- Material Design, Dark theme. https://m2.material.io/design/color/dark-theme ; Text legibility. https://m2.material.io/design/color/text-legibility.html ; codelab: https://codelabs.developers.google.com/codelabs/design-material-darktheme/
- Apple, Human Interface Guidelines: Color. https://developer-mdn.apple.com/design/human-interface-guidelines/foundations/color ; Dark Mode. https://developer.apple.com/design/human-interface-guidelines/dark-mode.md ; WWDC 2019 session 808. https://developer.apple.com/videos/play/wwdc2019/808/
- Polarity studies, summarised: https://www.alexandria.unisg.ch/server/api/core/bitstreams/62e4b3c1-0521-4d3a-bbad-e6e5eb81795e/content ; https://sreal.ucf.edu/wp-content/uploads/2019/10/Kim2019edm.pdf
- Legge, G. E., Cheung, S.-H. (2004). https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/2020-08/Legge%20Cheung%202004%20Psychophysics%20of%20reading-%20Implications%20for%20displaying%20text.pdf
