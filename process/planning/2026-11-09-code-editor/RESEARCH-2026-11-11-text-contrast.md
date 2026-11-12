# How far text sits from its ground, in Substrate, VS Code and Ghostty

*2026-11-11. The Architect: BLACKBOARD.md in Substrate "might be too bright"; VS Code's and Ghostty's text "isn't trying to stand out … it kind of fits in"; the substrate terminal "undershot"; "Quantify it according to a proper theory"; "If you are faking something or simulating something, there's no point to it."*

## What was measured

Every number comes from an app's own pixels, never from a page imitating its settings:

- **VS Code 1.138.** Launched from its install with a fresh profile, by `harness/shakeout/text_tone.ts`. The Architect's profile names no theme, and its stored theme is "Dark 2026", the theme the fresh profile drew.
- **Substrate.** Launched the way the gates launch it, by the same script, opening the same copy of `BLACKBOARD.md`. The Architect also sent two screenshots, one of the pane and one of the editor with its terminal; they were converted from Display P3 to sRGB.
- **Ghostty 1.3.1.** One screenshot from the Architect, in sRGB. This shell has no Screen Recording permission, and Ghostty draws with Metal, so a screenshot is the only way to read its pixels.

How each number is read:

- **Ground:** the commonest colour in the block.
- **Text:** the brightest 2% of the block's pixels.
- **Gap:** the text's lightness minus the ground's, in CIE L* (0 is black, 100 is white).

| Surface | Ground L* | Text L* | Gap |
|---|---|---|---|
| VS Code editor | 6.2 | 79.8 | 73.6 |
| VS Code terminal | 8.7 | 79.5 | 70.8 |
| Ghostty, Claude Code's main text | 18.0 | 92.2 | 74.2 |
| Substrate editor, BLACKBOARD.md | 13.6 | 87.0 | 73.4 |
| Substrate pane, reply (#b9bec5) | 13.6 | 76.8 | 63.2 |
| Substrate editor's terminal, reply | 13.6 | 78.8 | 65.2 |

## What it shows

**The three apps share one gap.** Their main text sits 71–74 L* above its ground. They reach it different ways. VS Code puts grey text on a near-black ground. Ghostty puts near-white text on a lighter ground. Substrate's editor sits between the two.

L* is the CIE scale built to be perceptually even: equal steps look like equal steps of lightness. On it, the apps agree on the gap even though their absolute colours differ by up to 12 L*.

APCA, the contrast model drafted for WCAG 3, does not order them. It scores Ghostty highest (Lc 89), above Substrate's editor (Lc 81.5) and VS Code (Lc 71), yet the Architect reads Ghostty as fitting in.

**Substrate's terminal reply undershoots.** It sits 63–65 L* above its ground, 9–11 short of the other three. That is the undershoot the Architect saw.

**The editor's "too bright" is not explained.** The editor's gap matches VS Code's and Ghostty's. With the same file open in both apps, Substrate's editor lights less of its block than VS Code's: 5.5% against 6.8%, and the block's mean sits 14.2 L* above its ground against VS Code's 18.9.

What does differ is absolute level: Substrate's letters are 7 L* lighter than VS Code's, on a ground 7 L* lighter. Ghostty's letters are lighter still, on a lighter ground, and it fits in. So no measured quantity separates Substrate's editor from the two apps that fit in.

## Takeaways

1. **E21 sets the reply to the shared gap.**
   - The model's reply becomes #d7dade (L* 86.9; a 73.2 gap on the pane's #212327). That is the editor's own text colour and the gap VS Code and Ghostty draw.
   - The person's message steps down to #cbcfd4 (L* 83.0; gap 69.3). It is dimmer than the reply, as the Architect asked.
   - E21 earlier named #e2e5e9 for the reply: a 77.1 gap, above every app measured, so it is not taken.
   - The gate checks decoded pixels: the reply's text sits 70–76 L* above its ground, and the message's text sits below the reply's.
2. **The editor's colours stay as they are.** Nothing measured here sets them apart from VS Code's or Ghostty's.

## Sources

- CIE 1976 L*a*b*: CIE 15:2004, Colorimetry.
- APCA, apca-w3 0.1.9: https://github.com/Myndex/apca-w3
- VS Code 1.138, `/Applications/Visual Studio Code.app`; the stored theme in `~/Library/Application Support/Code/User/globalStorage/state.vscdb`, key `colorThemeData`.
- The capture: `harness/shakeout/text_tone.ts`. The screenshots are not copied into this repository.
