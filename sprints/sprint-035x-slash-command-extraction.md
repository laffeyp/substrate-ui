# Sprint 035x — extract `_slashRoute` into `web/terminal/slash/`

```yaml
---
id: 035x
status: closed-2026-08-29
phase: 5
pass_kind: refactor
---
```

## Product-spec conformance

**Fulfills:** PRODUCT-SPEC-2026-08-17-round12.md §13 View A (terminal
implementation). No new user-facing behavior; the fourteen slashes
covered by the existing 035s/t/u/v/w cards stay identical. Refactor
target.

**Consumes:** REVIEW-2026-08-28-piece-g-eod ARCH-1 + CQ-6. The 308-line
chain-of-`if` `_slashRoute` at `web/terminal.ts:555` is exactly the
antipattern the substrate cli.py:1053 code-quality review named as Q11.
Same class, same fix, different runtime.

## Scope

Extract fourteen slash handlers from `_slashRoute` into a
`web/terminal/slash/` package. One file per slash. `_slashRoute` in
`terminal.ts` collapses to a ten-line dispatcher that looks up a
handler in a `SLASH_COMMANDS` map and calls it. Total LOC unchanged;
per-file LOC drops ~20×.

Fourteen files, one class each, common interface:

```ts
export interface SlashCommand {
  name: string;                  // "/exit"
  needsSession: "yes" | "no" | "queue";
  parse(args: string[]): { ok: true; parsed: unknown } | { ok: false; error: string };
  execute(h: TerminalHandle, parsed: unknown): Promise<{ok: boolean, message?: string}>;
}
```

Files: `exit.ts`, `help.ts`, `model.ts`, `tools.ts`, `set.ts`,
`context.ts`, `inspect.ts`, `list.ts`, `replay.ts`, `run.ts`, `diff.ts`,
`studio.ts`, `bundle.ts`, `interrupt.ts`, plus `workspace.ts`,
`isolate.ts`, `name.ts` from 035w — seventeen files, ~15-30 lines each.

## Prerequisites

- 035s/t/u/v/w all closed (all fourteen slashes exist in `_slashRoute`).

## Context files

- `substrate-ui/web/terminal.ts` — `_slashRoute` at line 555.
- `substrate/src/substrate/cli.py::route` at line 1053 — the analogous
  CLI-side chain that Q11 named. Same fix has to land on the CLI too.
- REVIEW-2026-08-28-piece-g-eod ARCH-1 + CQ-6.

## Artifact contract → Files created/modified

- `web/terminal/slash/index.ts` — new. Exports `SlashCommand` interface,
  `SLASH_COMMANDS` map, `route(line, h) → Promise<boolean>`.
- `web/terminal/slash/{exit,help,model,tools,set,context,inspect,list,`
  `replay,run,diff,studio,bundle,interrupt,workspace,isolate,name}.ts`
  — seventeen new files, one class each.
- `web/terminal.ts::_slashRoute` — collapse to ten lines: parse the
  slash keyword, look up in `SLASH_COMMANDS`, call `execute`, render.
- `harness/capture_terminal_slash_router.js` — unchanged; the split
  passes through the same DOM + emit sites.

## Signal contract → Emits

Same emits as before per slash. No new tags, no removed tags. Payload
shapes unchanged. `check:vocab-parity` stays 58 live / 11 retired.

## Observation contract

- 035s harness passes on the extracted implementation (fourteen slashes
  produce the same body-line + emit pattern).
- `check:tsc-new` clean with `terminal/slash/` in the whitelist.
- No test file line count grows — the refactor is source-side only.
- `wc -l terminal.ts` drops by ~280.

## Halt conditions

- `dual_contract_fail` if any of the fourteen 035 harnesses regresses.
- `vocabulary_change_required` — not applicable; no vocab change.

## Definition of done

`_slashRoute` at ≤ 30 lines. Seventeen slash files exist. Every 035
harness green. Full signals chain green.
