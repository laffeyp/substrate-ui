# Sprint 485 — a red-green colour-blind scheme, as an option

```yaml
---
id: 485
status: pending
phase: code editor (roadmap r16), E24
pass_kind: functional
---
```

## scope

`RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`; the Architect: "we still design to one core idea" and shift it against the viewer's perception curve. The one design solved for protan and deutan vision (Machado et al. 2009 simulation): notes that differ along the red–green axis (keyword against string, ΔE2000 3.2–4.2 simulated) move along the blue–orange axis those readers keep. Not the default. One verifiable property: under protan and deutan simulation every coloured pair is at least 10 ΔE2000 apart.

## prerequisites

- 484

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r16.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`
- `web/app/derive/palette.ts`; `web/app/state/settings.ts`

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- The default scheme is unchanged; this is an option.

## artifact contract

### Files created

- none

### Files modified

- `web/app/derive/palette.ts` (the scheme), `web/app/state/settings.ts` (the option)

### Content assertions

- A spec computes Machado 2009 protan and deutan simulation (severity 1.0) of each pair: at least 10 ΔE2000.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

The option chosen; main.rs's tokens decoded; each pair, simulated, at least 10 ΔE2000 apart.

### Expected screenshot / visual state

- main.rs with keywords and strings apart along blue–orange.

## done criteria

A person with red-green colour blindness can pick a scheme in which every token class is told apart.

## notes

The simulation matrices are Machado et al.'s published values.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: `palette.ts` and `settings.ts`.
