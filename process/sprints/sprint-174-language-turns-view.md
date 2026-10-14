# Sprint 174 — The turns view: message and reply side by side

```yaml
---
id: 174
status: closed
closed_at: 2026-10-13
phase: language
pass_kind: functional
depends_on: [173]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
---
```

## scope

From the Architect's first look at the installed lens. The turns stream showed six pair measures as grey bars ("other": none answers to a setting but length ratio), and the deviation and ribbons tabs drew nothing on it (no windows, no warm-up). Style match read "—" with no reason.

- **Views per stream.** Replies and messages keep bars, deviation and ribbons. Turns has "side by side" (first) and "measures". A view the stream lacks falls back to its first.
- **Side by side.** Per turn and per watched measure, the message's value to the left of a centre line and the reply's to the right, in the measure's group colour, one scale per lane for both sides (zero to the highest of either, rounded up, as sprint 173). The readout shows "message · reply". A note above the rows says which side is which.
- **Measures.** The six pair measures as bars, grouped and coloured from the existing palette: LENGTH (length ratio) in the length colour; ECHO (echo, copied, longest copy, distance) in the guidance colour; STYLE (style match) in the tone colour.
- **Style match before its threshold.** Until each side's window holds 1,600 words (`measures.MIN_WORDS_LSM`, generated, not retyped), the cell draws a faint bar of the shorter side's progress, its hover names both sides' words, and the readout reads "N of 1,600".

## observation contract

Unit: tabs per stream and the fallback; side-by-side widths from the route's user and model values on the shared lane scale; relation lane colours and group labels; style-match progress from the lines' window words. Gate `language_lens_turns`: on a deterministic session, the turns stream opens on side by side; each words cell's two widths equal the route's message and reply words on the lane's scale; the measures view's style-match readout reads "N of 1,600" with N the shorter window.

## result

- **Built.** `language_lens.ts`: `languageViewTabs(stream)` and `languageView(stream, view)`; side by side reads the replies' and messages' lanes, one `top` per lane over both sides, the message's bar ending one pixel left of the centre line and the reply's (`bar2`) starting one pixel right, a centre guide per lane, readout "message · reply"; `relationGroup(key)` puts length ratio under LENGTH (length colour), echo, copied, longest copy and distance under ECHO (guidance colour), style match under STYLE (tone colour); `windowWords` reads each side's window words from the lines, and style match draws the shorter side's progress with "N of 1,600" in the readout. Kernel `4296e70f`: `language_catalog.LSM_MIN_WORDS`, generated as `LANGUAGE_LSM_MIN_WORDS`.
- **From the screenshots.** "per 1,000 words" cut off in a 78 px header: the header reads "per 1k words", the hover keeps the full unit. A lane with no scale drew its window curve as a vertical line at its edge: no curve now. The side-by-side note was cut by the scroller: it sits above it and wraps.
- **Tests.** Unit (20 in `language_lens.spec.ts`): tabs and fallback; side-by-side widths and centre; groups and colours; style-match progress. Gate `language_lens_turns` (in `gates:electron`): three deterministic turns' words cells equal the route's message and reply words on the lane's scale; LENGTH, ECHO, STYLE headers; style match reads "9 of 1,600".
