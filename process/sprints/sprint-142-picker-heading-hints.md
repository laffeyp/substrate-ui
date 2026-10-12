# Sprint 142 — Hints beside WORKSPACE and MODEL

```yaml
---
id: 142
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 9; OPEN-ITEMS 13–14)
asked: 2026-10-10 (Architect)
---
```

## scope

- A grey hint on the same line as each heading in the workspace bar, in the Architect's words. WORKSPACE: "choose where you want to work · or open a previous session". MODEL: "choose a model to work with". GUIDANCE waits for the Length and Tone rows (step 11).
- A narrow pane cuts the heading line with an ellipsis rather than wrapping it. The first-run screen's WORKSPACE heading is not this bar's and stays as it is.

## checks

- The bar shows both hints beside their headings, at full width and in a narrow pane (screenshot); the Electron gates.

## result

- **Built** (`web/reveal.html`). Both hints sit on their heading's line (`data-heading-hint`), grey, at normal letter spacing; the heading line cuts with an ellipsis in a narrow pane.
- **Checks.** Screenshots at 1512 points, one pane and two: both hints show; at half width the WORKSPACE hint ends "or open…". Electron gates 15/15 on a package built from this source.

## revision (same day, Architect)

- The workspace hint loses its dot: "choose where you want to work or open a previous session".
- Each hint is in double quotes, and so is the guidance line's "pick a model first".
- A new, lowest text level for these hints: `--tx-hint` (#3c3f45), one step below #4a4e55, in the class `.tx-hint` (`web/reveal.html`). The guidance line's description of the lit level keeps its ordinary grey. Measured in the app: all three hints render at rgb(60, 63, 69).

## outcome (same day, Architect)

- Tried and taken out: the WORKSPACE and MODEL hints and the quotes. The Architect's verdict: not appropriate, a good try. The headings are back as they were.
- Kept: "pick a model first" at the new lowest text level, `--tx-hint` / `.tx-hint`, without quotes.
