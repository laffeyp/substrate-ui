# Sprint 149 — ↓ keeps drilling down the model column

```yaml
---
id: 149
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
asked: 2026-10-11 (Architect: "once you start drilling in … you don't want to go back to the top. You want to just keep drilling in and just keep opening things and keep going down once that scroll bar is there versus cycling back up to the top.")
context_files:
  - web/reveal_component.ts
---
```

## scope

The model column has three groups (cli agents, ollama · cloud, ollama · local), each folded or open. ↓ walks the visible rows and, past the last row, wraps to the top. With the middle group open, the last group is pushed below the fold; ↓ reaches its folded header, then wraps to cli agents at the top, which the Architect called out.

After, two rules:

1. ↓ that lands on a folded group header while the group above it is open opens the landed group, so the next ↓ goes into its rows.
2. ↓ on the last row does not wrap when the column scrolls (its rows overflow it). With every row in view, ↓ still wraps as now. ↑ is unchanged.

The workspace column takes the same keys only if the Architect asks; this card is the model column.

## signal contract

No controller tags change.

## observation contract

Electron gate `model_down_drills.ts` on a live roster: open the picker's model column; open the middle group; ↓ to its end and once more: the last group's header is lit and opened, and ↓ lights its first model. ↓ to the last row and once more: the lit row stays the last row (no wrap) while the column scrolls.

## checks

- The gate red on the old code, green after; `tsc`; `bindPaneAsUser` gates.

## result

- **Built** (`reveal_component.ts` `_wsKey`, model branch): ↓ onto a folded group opens it when the nearest group above is open; ↓ on the last row stays when `[data-model-scroll]` overflows, and wraps to the top only when every row fits. ↑ and the workspace column are unchanged.
- **Gate** `model_down_drills.ts` (in `gates:electron`, live roster): red on the old code ("↓ onto ollama · local with ollama · cloud open left it folded"), green after: → opened ollama · cloud, ↓ walked its 9 models and opened ollama · local, lit deepseek-r1:8b, and ↓ on the last row (qwen2.5:7b-instruct-q4_k_m) stayed while the column scrolled. ↓ from a folded cli agents onto ollama · cloud left it folded.
- `no_default_model`, `ws_column_opens_down`, `length_tone_rows`, `model_chip_indicator` pass; `tsc` clean.
- **Rubber Duck Pass.** No controller tag moved; the gate reads the lit row's `data-model-row`, its chevron, and the column's scroll and client heights.
