# Sprint 161 — Guidance, length and tone on the session bar, changed by slash commands

```yaml
---
id: 161
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: the session's guidance, length and tone shown in the pane and changed mid-session; "let's make it happen")
research: substrate/process/planning/RESEARCH-2026-10-12-controls-mid-session-r2.md (Settled)
kernel: K296 (length, tone), K298 (guidance as its bundle; § U)
context_files:
  - server.py
  - scripts/gen_kinds.py
  - web/vm/session_controller.ts
  - web/reveal_component.ts
---
```

## scope

1. **Server.** `PATCH /api/session/<id>` takes `guidance`: a level (`harness`, `low`, `medium`, `high`) or `auto`; it sets the bundle to `guidance_bundle(level)`, with `auto` the model's default level as at open.
2. **Generated levels.** `scripts/gen_kinds.py` writes `GuidanceLevel` and the level-to-bundle map into `web/vm/controls.gen.ts`; the picker's `GUIDANCE_OPTIONS` reads its levels and bundles from it (labels and one-line notes stay the UI's).
3. **Slash commands.** `/length <terse|normal|full>`, `/tone <blunt|neutral|formal|dry>`, `/guidance <auto|harness|low|medium|high>` send the `PATCH` and update the snapshot from the reply; with no argument, each names the current value and the choices; a refused value shows the server's message.
4. **Bar line.** The session bar line ends with the three values: "turn 3 · 12s · 2 tools · returned · low · normal · neutral" (guidance shown as its level; a bundle that is no level shows its name).

## signal contract

No controller tag changes; the change reaches the record as K296 and K298 record it.

## observation contract

Electron gate `controls_mid_session.ts`: bind pane 1 (deterministic), send a message; the bar line ends with the guidance level, `normal`, `neutral`. `/tone blunt`: the manifest's tone is `blunt` and the bar line shows it; the next message's record holds `SessionChanged {tone: neutral → blunt}` and its prompt carries "Environment update: tone changed from neutral to blunt." beside the message. `/guidance low`: the manifest's bundle is `standard-low`, the bar line shows `low`, the next prompt carries "guidance changed from … to low". `/length enormous` shows the refusal and changes nothing.

Live check: a kimi session, `/length terse` after two turns at `normal`; the next three replies' word counts against the two before.

## checks

- The gate red, then green; `test_envelope_kinds_generated_096` (freshness); UI Python suite; unit specs; `tsc`.

## result

- **Built.** `server.py`: `guidance` joins `_PATCHABLE`; a level or `auto` becomes the bundle through `set_bundle`; an unknown level is refused naming `auto, harness, low, medium, high`. `scripts/gen_kinds.py` writes `GUIDANCE_LEVEL_BUNDLES` into `controls.gen.ts`; `GUIDANCE_OPTIONS` reads it. `SessionController.setControl` (a pick before open, a PATCH after) and `guidanceLevel`; `/guidance`, `/length`, `/tone` in the slash table (no argument names the current value). The bar line (`data-session-bar-line`, both views) ends with "· <guidance> · <length> · <tone>".
- **Gate** `controls_mid_session.ts` (in `gates:electron`): red on the old code (the bar line ended at "returned (replied)"), green after: "… · high · normal · neutral" → "… · low · normal · blunt"; the record holds `SessionChanged` tone neutral→blunt and bundle standard→standard-low; `/length enormous` refused and nothing changed. The first green run found `guidance` missing from the PATCH allow-list.
- **Tests** `tests/test_server_session_patch_guidance_161.py`, 3 (a level, `auto`, a refusal). UI Python 249 passed, 5 skipped; unit specs 37/37; `length_tone_rows`, `model_half_starts_session`, `no_default_model`, `input_bar`, `both_session_shapes`, `tool_output_toggle` pass.
- **Live** (kimi-k2.7-code:cloud, five explanation questions, `/length terse` before the third): words per reply 200, 186 at normal; 133, 75, 185 at terse. The change took hold for two replies and the third came back to normal length, the drift the research names (Li et al.; Wan et al.). One run with different questions: it shows the effect, it does not measure it.
- **Rubber Duck Pass.** A slash command sends a PATCH; the manifest changes; the next turn's first step records `SessionChanged`, the session-prompt producer writes the new text (§ P.4, § T.3, § U.1) and the composer draws the line beside that turn's message (§ U.2). No controller tag moved.
