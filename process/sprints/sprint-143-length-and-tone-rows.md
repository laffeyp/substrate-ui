# Sprint 143 — Length and Tone rows in the workspace bar

```yaml
---
id: 143
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 10; OPEN-ITEMS 16)
asked: 2026-10-11 (Architect)
pairs_with: kernel sprint 296 (the controls)
---
```

## scope

- Two rows under GUIDANCE in the model column, in its style: **LENGTH** terse · normal · full, and **TONE** blunt · neutral · formal · dry. Each opens at its default (normal, neutral). They are picked after the guidance level, with the same keys (← → along a row, ↵ picks), and the last pick starts the session.
- The picks go to `POST /api/session` as `length` and `tone`. The model chip's card (sprint 139) names them beside guidance.

## checks

- A gate: pick a workspace, a model, a guidance level, then `terse` and `blunt`; the session's manifest holds `length: terse`, `tone: blunt`, and its record holds two `control` fragments with those texts. Picking the defaults writes none.
- Screenshot at full width and in a split pane; the Electron gates.

## result

- **Built.** `web/reveal.html`: LENGTH and TONE lines under GUIDANCE at the foot of the model column, three 31px lines; the workspace column's spacer grows to match. `web/reveal_component.ts`: `LENGTH_OPTIONS`, `TONE_OPTIONS`; the guidance pick opens LENGTH, the length pick opens TONE, the tone pick starts the session; ← → ↵ and esc/↑ (back a line), as on the guidance line. A picked position shows in white once its line closes; the guidance hint goes blank once a model is picked. The chip's card reads length and tone. `session_controller.ts`: `pickControls`, sent as `length` and `tone` in `POST /api/session`, read back on attach. `server.py`: accepts both at creation and in PATCH (400 on an unknown position), returns them, and passes them to the topology at their defaults when unset.
- **Gate** `length_tone_rows.ts` (in `gates:electron`): terse and blunt reach the manifest, `SessionStarted` and two `control` fragments; the chip's card names both; a second pane at the defaults writes none. `bindPaneAsUser` steps through LENGTH and TONE at their defaults.
- **Checks.** `tsc` clean; unit specs 37/37; UI Python 244 passed; Electron gates 16/16 on a package built from this source. Screenshots at 1512 points, one pane and two.
