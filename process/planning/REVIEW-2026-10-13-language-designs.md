# REVIEW: the language design sheet against the build

*2026-10-13. The sheet `design-sheets/2026-10-13-language/Substrate Language Designs.dc.html` (frames 22b–d, 23a–c) and its decision log `DECISIONS D74-D80.md`, moved here from the top-level `language-designs/` folder. Read against `DESIGN-2026-10-13-language-in-the-app-r2.md`, the kernel as built (session vocabulary v0.11 § W, `substrate.language` 0.2.1), and the app (`web/reveal.html`, `web/reveal_component.ts`).*

## What the sheet settles

| r2 decision (§ 8) | The sheet | Where |
|---|---|---|
| 1. Default measures | the 13 watched measures, grouped length · tone · guidance, with group colours (length `#82a5c8`, tone `#7fb3b8`, guidance `#c9a0b8`) | D74, every frame |
| 2. Session indicator | drift-only; each shift written as its measure and ↑/↓ **right after the setting meant to move it**, the settings named: `guidance high · length full words ↑ · tone blunt hedges ↑`; hover opens one shift at a time; narrow panes wrap the settings to a second line | D76, D79 (locked), 22b |
| 3. Orientation | time down, 18 px rows, aligned with the graph | D74, D75 |
| 4. Reference band | replaced: the deviation view draws every lane in warm-up SDs with guides at ±2 SD; ribbons and bars draw no band | D75, 23c |
| 5. Window values | from `GET /api/session/<id>/language`, cached by last seq | D74 |
| 6. Short sessions | each reply's own bar only; no marks or band before the warm-up; the hover says so | D77, 22c |

And one change to r2: **the number-and-dot cells are gone** (D78). The page is a stream of drawings, one lane per measure, in three views behind one toggle: ribbons (23a, width = trailing window, each reply a hairline), bars (23b, the graph's own activation bars off a common baseline, the window as a curve along the bar ends) and deviation (23c, every lane in warm-up SDs). Numbers appear once, in a readout row for the selected turn (Few). That answers the Architect's "just like the down graph" more directly than r2's table did.

## Where the sheet matches the build

- **The data exists.** Per-reply values (`LanguageProfile`), shifts (`LanguageDrift`, with `source_seq` for "flagged at turn N") and setting changes (`SessionChanged`) are on every app session's record since today; the 22b/22d hover copy reads only those.
- **The recap reads "returned (replied)"** (D80), the kernel's v0.11 `Returned` with its reason.
- **The streams row** (replies · messages · turns) maps one to one onto `LanguageStream` `model`, `user`, `relation`.
- **The keyboard and the linked selection** (↑↓ turns, ←→ lanes, ↵ opens the turn; the seq as the referent) are the app's existing rules.
- **The explanations** (22d) use the structure page's own mechanism: dotted underline, help cursor, hover and focus, the r2 text for hedges word for word.
- **The marks are where the detector fires.** The sheet places ▲ by an exact port of `PageHinkley` with `DEFAULT_DRIFT` (D77), so the drawings and the record agree.

## Where the sheet and the build disagree, and the fix for each

1. **"Tone is set to blunt, so fewer were expected."** The 22b and 22d hover copy states an expected direction for a measure under a setting. D80 rejects colouring shifts by agreement "because… needs an intent table that does not exist", yet the copy needs the same table. The table can exist and need not be invented: Substrate's own control texts state each intent (`vocabulary.LENGTH_TEXTS`, `TONE_TEXTS`): terse "leave out background, restatement and offers of more" (words, restate, offer ↓); full "give complete replies" (words ↑); blunt "hedge only where the evidence is uncertain" (hedges ↓); formal "no slang" (contractions ↓); dry "without enthusiasm or exclamation" (positive emotion, exclamation marks ↓). Normal and neutral write no text and state no intent. **Fix:** an intent table in the language library, derived from those texts, one home, generated into the UI with the explanations; a shift with no stated intent gets copy without "so … expected". The guidance levels state their rules in bundle files, not in one line each; their intents stay out of the table until a level's rule names a measure.
2. **The change rule's label ends "· /length full".** `SessionChanged` records `field`, `old` and `new`; the record does not say whether a change came from a slash command, the picker or the bar. **Fix:** the label reads `length normal → full · turn 22`; recording the change's source would be a vocabulary change, not a drawing one.
3. **"Shift marks start after 20 replies."** Since library 0.2.1 the warm-up runs until its values vary: a measure that was zero for twenty replies (exclamation marks, often) starts later. **Fix:** the route returns, per lane, the turn its detector's warm-up ended (or "not yet"), and the hover reads from it: "Shift marks for this measure start once its values vary; so far they have not."
4. **The detector ported to JavaScript.** The sheet computes marks, bands and deviations with a JS port (`tools/lang-data.js`). The app must not carry a second implementation of the test. **Fix:** the route returns, per lane and turn, the warm-up mean and SD and the value in those SDs; the shifts already come from `LanguageDrift`. One implementation, in the kernel.
5. **The bar line changes form.** Today's line ends `… · high · normal · neutral`; the locked form names each setting and puts shifts after them. The `controls_mid_session` gate reads the current text and will be updated with it.
6. **Fixed lane scales** (`0–600`, `/1k 0–20`, …). Published reply lengths average 441 tokens (WildChat) with a long tail, so a fixed `0–600` words will clip. **Fix:** each measure's display range sits in the explanation table (a typical range), and a value past it draws to the edge with its number in the readout; no auto-rescaling that moves the lane under the reader.
7. **Colours.** Tone's `#7fb3b8` is the colour the graph gives `ToolResult`, and length's `#82a5c8` the colour of `Returned`. On the language page alone this is harmless; in the full graph view, language events sit beside tool results in the same teal. **Fix:** keep the sheet's colours on the language page and the bar line, and draw language events in the graph's plumbing grey, as they are now.
8. **Three views.** D76 ships all three; that is three renderers. **Build order:** bars first (the graph's own grammar, so the most code to share), then deviation (needs the route's SDs), then ribbons.

## Data the build adds to the route

`GET /api/session/<id>/language` returns, beside the lines `substrate language` writes: per lane, the warm-up end and its mean and SD; per lane and turn, the value in warm-up SDs. Shifts and setting changes are read from the record as the graph reads events now.

## Real records

The sheet's series are synthetic (D80: "no recorded session with LanguageProfile events was found"). Since today every app session records them; session `s_3de1000b91cb4d5eaa09efd9` (glm-5.2, two turns) is one. A long real session to draw comes from use, not from a test.

## Files

- `design-sheets/2026-10-13-language/Substrate Language Designs.dc.html` — the sheet (open in a browser; it loads `support.js` beside it and IBM Plex from Google Fonts).
- `design-sheets/2026-10-13-language/DECISIONS D74-D80.md` — the decision log.
- `design-sheets/2026-10-13-language/support.js` — the sheet's runtime.
