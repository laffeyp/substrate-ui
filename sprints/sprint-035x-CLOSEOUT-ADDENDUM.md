# Sprint 035x CLOSEOUT ADDENDUM — slash-command extraction

Rule 12 addendum to `sprint-035x-slash-command-extraction.md`.

## What landed

`_slashRoute` in `web/terminal.ts` — 306 lines of chain-of-`if` — is
gone. Replaced by a 3-line delegate to `route()` in
`web/terminal/slash/index.ts`. Seventeen slash handlers under
`web/terminal/slash/{name}.ts`, one class per slash, each 8-61 lines.

**Shared surface (`web/terminal/types.ts`):**
- `TerminalHandle`, `PendingContext`, `CLS`, `HELP_TEXT` — extracted
  from `terminal.ts` so slash files depend on the shape, not the
  session-machine impl.
- `SlashCommand` + `SlashContext` — the contract every slash
  implements: `execute(args, ctx)`.

**Shared helpers (`web/terminal/helpers.ts`):**
- `push(body, text, cls)` and `formatParamsHint(params)` — stateless
  pure helpers the slash files import.

**Dispatcher (`web/terminal/slash/index.ts`):**
- Imports twenty SlashCommand instances (17 slashes + `/narrate`
  alias + shape assertions).
- `route(line, ctx) → Promise<boolean>`. Ten lines.
- Unknown slash prints "unknown slash: X. Try /help" — same shape as
  the prior chain's fallback.

**Endpoint DIP:** `TerminalHandle.endSession(reason)` is a callback
`mountTerminal` binds to the module-private `_endSession(h, body,
reason)` after `body` is available. The `/exit` slash file calls
`h.endSession("user_end")` with no import of terminal.ts internals.
Dependency-inverted; no circular ESM imports.

## Deviations from the pending card

- **Card said 17 files under `web/terminal/slash/{name}.ts`.** Landed
  shape: 19 files under `web/terminal/slash/` (17 slash files +
  `inspect.ts` also exports `narrateSlash` as an alias since they
  share a body + inline body, so no `narrate.ts`; router picks up
  both names). The card's "one file per slash" reads literally as
  17 files; the shared-body pattern for `/inspect` and `/narrate` is
  cleaner as one file with two exports.

- **`terminal.ts` shrank from 903 → 583 lines (–35%, dropped 320).**
  Delta split: `_slashRoute` body 306 lines, `_HELP_TEXT` 23 lines,
  `TerminalHandle` interface 44 lines, `PendingContext` 4 lines,
  `CLS` 7 lines, `_push` 7 lines, `_formatParamsHint` 9 lines.

- **No user-facing behavior change.** Every 035s harness assertion,
  every 037a E2E assertion, every 037b perceptual frame, every
  036f parity test still passes byte-identically. Extraction is
  source-side only.

## Sort discipline held

The one behavioral difference between the old chain and the new
router is where argument parsing lives — but every slash file mirrors
the original's parse → validate → build fetch → check → emit + push
sequence. Grep for `emit(` across the seventeen files shows the same
five tags (DRIVER_PATCHED, TOOLS_RESTRICTED, BUNDLE_ATTACHED,
DRIVER_PARAMS_PATCHED, plus /exit routes through _endSession which
owns DRIVER_SESSION_ENDED) at the same call sites.

## Follow-on found during extraction

The `/help` harness assertion expects the literal string `/model <name>`.
The first extraction pass reworded to `/model <driver>` (clearer but
different string); the assertion caught it. Reverted the copy to
the original wording. Recorded here: any future help-text edit needs
to keep the 035s harness assertions in mind.

## Observation contract — what passed

- `check:tsc-new` clean (regex covers `terminal|controls/|lib/`; new
  `terminal/` subtree matches on the `terminal` fragment).
- Full `npm run signals` chain PASS across SEVENTEEN JS fixtures + 10
  pytest parity cases + 1 session-jsonl grader — every single-slash
  harness (035s / 035t / 035u / 035v / 035w) plus every downstream
  desktop-picker harness (036a-e) and the E2E (037a) plus the
  session capture (037b) all green.
- Grep for the retired `_slashRoute` body in `web/`: not found.
- Grep for `import` of the slash package: three sites — the router
  index (self), terminal.ts, and nothing else.

## Definition of done — satisfied

- `web/terminal/slash/` exists with 19 files.
- `_slashRoute` in `terminal.ts` collapsed to ≤5 lines (3 executable).
- Every 035 harness green.
- Full signals chain green.
- ARCH-1 + CQ-6 retired.
