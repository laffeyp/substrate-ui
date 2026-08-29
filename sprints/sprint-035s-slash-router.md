# Sprint 035s — slash router in web/terminal.ts

```yaml
---
id: 035s
status: closed
phase: 5
pass_kind: functional
---
```

## Product-spec conformance

**Fulfills:** PRODUCT-SPEC-2026-08-17-round12.md §2a "Slash commands
inside a session" (nine slashes: /exit, /model, /tools, /context,
/inspect, /list, /replay, /run, /help). §13 View A "just the agent
terminal, filling the window; same DOM as substrate-ui's integrated
terminal today" — the agent terminal exposes a bare-word router
today; the daily-driver terminal ships slash-prefixed equivalents so
the user sits in view A for daily work without needing to leave.

**Enables:** the mechanical translation of the agent terminal into
the daily-driver terminal per FOLD-2026-08-28-piece-g-mechanical-translation.
Load-bearing single sprint per the feature map.

## Scope

Ports substrate/src/substrate/cli.py::_slash_route (line 1053) into
web/terminal.ts as `_slashRoute(h, body, line): Promise<boolean>`.
Twelve slashes wire to live daemon endpoints, three print hints:

- `/exit` → routes through existing _endSession (was already there).
- `/model <name>` → PATCH /api/session/<id> {driver} + DRIVER_PATCHED emit.
- `/tools <a,b,c>` → PATCH /api/session/<id> {tools} + TOOLS_RESTRICTED emit.
- `/bundle <name>` → PATCH /api/session/<id> {bundle} + BUNDLE_ATTACHED emit.
- `/context <lo-hi> [--kind K]` → stashes on handle; next _sendTurn threads into POST body's `context` field (per piece B sprint 217e).
- `/inspect [<record>]` + `/narrate [<record>]` → GET /api/records/<name>/narrate; defaults to current record.
- `/tail [<record>]` → GET /api/records/<name>/events; prints seq + kind list.
- `/cat <seq> [<record>]` → GET /api/records/<name>/events; prints one event's payload.
- `/list [records|topologies|sessions|applications|bundles]` → GET the corresponding daemon endpoint; `bundles` prints sprint-034a-pending hint.
- `/replay <record>` → daemon has no endpoint; prints CLI-only hint.
- `/run <application>` → POST /api/topology/<name>/run.
- `/diff` → GET /api/worktree_diff?path= via GET /api/session/<id>'s workspace.
- `/studio` → window.open('/studio.html', '_blank').
- `/interrupt` → POST /api/session/<id>/interrupt.
- `/help` → prints the slash inventory to the terminal body.
- Unknown slash → error line.

**Rule-6 stretch acknowledged:** one file (web/terminal.ts) grows
from ~360 to ~600 lines. One concept: the slash router, mechanically
ported from the CLI. Two typed HTTP helpers added (_fetch, _fetchGet)
alongside the existing _postJson — same discriminated-union
FetchResult shape. Precedent for a large single-concept sprint: piece
D's own _slash_route in cli.py.

## Artifact contract → Files created/modified

- `web/terminal.ts` — new `_slashRoute` function (~230 lines); new
  `_fetch<T>` + `_fetchGet<T>` helpers (~40 lines); `TerminalHandle`
  extended with `pendingContext: PendingContext | null` and
  `currentRecord: string | null`; `_openSession` sets `currentRecord`;
  `_sendTurn` threads `pendingContext` into POST body then clears;
  `mountTerminal` initializes the two new fields; the keydown handler
  routes through `_slashRoute` instead of inline `/exit`.
- `harness/capture_terminal_slash_router.js` — new; 20 assertions
  across all slashes.
- `package.json` — new `capture:terminal-slash-router` script wired
  into `npm run signals`.

## Signal contract → Emits

Three v0.7 tags on PATCH ACK (no vocab additions this sprint):

- `DRIVER_PATCHED{session_id, driver, prior_driver}` on `/model`.
- `TOOLS_RESTRICTED{session_id, tools}` on `/tools`.
- `BUNDLE_ATTACHED{session_id, bundle, prior_bundle}` on `/bundle`.

## Observation contract

- **Harness driving steps.** Open session ("hello"). Then run every
  slash in sequence: /help, /model, /tools, /bundle, /context, /tail,
  /narrate, /cat, /list (records + sessions + topologies + applications
  + bundles), /replay, /studio, /interrupt, /nonexistent-slash, /exit.
- **Expected emits.** DRIVER_PATCHED, TOOLS_RESTRICTED, BUNDLE_ATTACHED,
  DRIVER_SESSION_ENDED all land per the sequence above.
- **Expected body-line prints.** /help inventory, /context pending
  confirmation, /tail event count, /narrate multi-line output, /cat
  seq-0 header, /list records count, /list bundles sprint-034a hint,
  /replay CLI-only hint, unknown-slash error line.
- **Expected side effects.** /studio opens a new tab (page-event
  observed).
- Twenty assertions PASS in isolation and under the chained `npm run
  signals`.
- `check:tsc-new` clean.

## Halt conditions

- `dual_contract_fail` if any slash's PATCH-ACK does not land its
  paired v0.7 tag.
- `bridge_mapping_required` if a slash needs a daemon endpoint that
  does not ship (currently: /replay printed as CLI-only hint; /list
  bundles printed as 034a-pending hint — both intentional).

## Definition of done

Slash router on disk. Twelve slashes wired to live endpoints; three
print hints. Twenty harness assertions PASS. Full `npm run signals`
chain PASS on v0.7.2. Cleared: 037c dock retirement precondition #1
(slash router in place).
