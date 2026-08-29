# FOLD — piece-G mechanical translation, three documents reconciled

**Author:** Claude session 2026-08-28.
**Purpose:** three documents landed today on the same subject; this
file folds them into one operational plan under rule 12 (additive; the
three source docs stay untouched on disk).

**Source docs (unchanged):**

1. `process/PLAN-2026-08-28-piece-g-mechanical-translation.md` — my
   earlier two-phase plan (Phase 1 = daemon-side `driver_params`
   surface; Phase 2 = terminal.ts rewrite).
2. `process/REVIEW-2026-08-28-daily-driver-terminal-vs-spec.md` — the
   Architect-diagnosed confusion, confirmed against product spec §13
   View A and tech spec §10.
3. `process/FEATURE-MAP-2026-08-28-agent-terminal-to-daily-driver.md`
   — nineteen features across nine sections, each with substrate wire,
   sub-side status, DD-side status, and card that lands it.

All three agree: the daily-driver terminal ships piece B's transport
correctly and none of the agent terminal's controls; the substrate
side supports nearly every missing control; the fix is UI wiring plus
one substrate-side surface addition.

The three disagree on scope specifics. This fold reconciles.

---

## Reconciliation table

| Question | PLAN says | REVIEW says | FEATURE-MAP says | Fold decision |
|---|---|---|---|---|
| The one real substrate-side gap | driver_params on manifest + PATCH | think/max_tokens/timeout on session_topology + manifest | same; sprint 235 (topology) + PATCH growth | Two cards land together: **substrate 235** (topology signature) + **substrate-ui 032c** (manifest + PATCH + resolver). Both needed. |
| Should tools be lifted mid-session PATCH? | already live (verified) | live via 215c/217e | 🟡 deferred | Already PATCHable in `_session_patch` at server.py:2265 (`_PATCHABLE = {"driver", "name", "tools", "per_turn", "bundle"}`). **No sprint needed.** Map's `032c-tools` scope drops. |
| Should workspace be PATCH-able mid-session? | not in scope | not in scope | 🔴 map calls for it under 032c | **Reject** — product spec §9c: "SessionStarted.workspace_path frozen at seq 1." Workspace is intentionally create-only. Map's `032c-workspace` scope drops. |
| Should isolate be PATCH-able mid-session? | not in scope | not in scope | 🔴 map calls for it under 032c | **Reject** — same spec section: isolate is a create-time shape choice (mode 3). Map's `032c-isolate` scope drops. |
| Terminal.ts approach | rebuild-and-replace (Phase 2, one sprint) | add slash router alongside dock, retire dock later | slash router as a load-bearing single sprint (035s) + individual controls (035t-w) | **Adopt the review+map approach.** Chained cards, not a single big rebuild. The dock stays until every control has a terminal-view home. Safer, more disciplined. |
| Sprint 037c timing | folds into terminal rewrite | delete `#termdock` only after 035c + 035d land | same shape | **037c amended** — deletes `#termdock` DOM only after every dock control has a terminal-view home (035s + 035t + 035u + 035v-if-shipped land first). |
| Discipline rule | not proposed | proposed: product-spec conformance block in every card | not proposed | **Adopt** — add to `WORKING_AGREEMENT.md`: every piece-G sprint card cites the product-spec section it fulfills and names the surface controls that section calls for. |

## The reconciled sprint queue

Substrate side (two cards):

- **substrate sprint 235 — session_topology exposes driver params.**
  `session_topology(...)` accepts `think: bool | None = None`,
  `max_tokens: int | None = None`, `timeout: float | None = None`.
  Threads through to `_daemon_driver_resolver` at the call site
  (`substrate-ui/server.py::_build_session_topology_from_manifest`).
  For the Ollama branch, these become `OllamaResponder(think=...,
  max_tokens=..., timeout=...)` constructor args. For CLI /
  deterministic drivers, params ignored with a documented note (no
  equivalent knobs).

  Rule 6: one file (`substrate/src/substrate/topologies/session/__init__.py`).
  Test: session_topology built with `think=True` and driven yields
  ModelReply with think=True observable on the record's model producer.

Substrate-ui side (two prerequisite cards + five UI cards + one
discipline addition):

- **substrate-ui sprint 032c — SessionManifest.driver_params + PATCH
  surface.** Adds `driver_params: dict[str, Any] | None = None` to
  `SessionManifest`. New method `SessionRegistry.set_driver_params(sid,
  params)` following the `set_driver` / `set_bundle` pattern.
  `_daemon_driver_resolver(name, params=None)` extended; cache key
  changes from `name` to `(name, params_tuple)`. `_session_patch`
  lifts `driver_params` into `_PATCHABLE`.
  `_build_session_topology_from_manifest` reads
  `manifest.driver_params` and passes to the substrate 235
  session_topology kwargs. Six tests (happy PATCH, null clears,
  unknown key 400, wrong type 400, response body carries the field,
  cache-eviction on param change).

  Rule 6 acknowledged stretch — three code files (session_registry +
  server.py + tests) + rationale, one concept. Precedent: sprint 032b
  bundle-PATCH lift.

- **substrate-ui sprint 034a — GET /api/bundles + GET
  /api/records?exclude_sessions=true.** Already queued; consumes
  substrate `list_bundles()` (sprint 238, closed today).

- **substrate-ui sprint 035s — slash router in terminal.ts.** Ports
  `substrate/src/substrate/cli.py::_slash_route` (line 1053) into
  `web/terminal.ts` as a `_slashRoute(line, handle)` function that
  returns `true` if handled. Wires every slash whose daemon endpoint
  already ships:
  `/exit` (already), `/model`, `/context`, `/inspect`, `/narrate`,
  `/tail`, `/cat`, `/list [records|topologies|sessions|applications]`,
  `/replay`, `/run`, `/diff`, `/studio`, `/help`.

  Twelve new slashes. Each is one JS handler that hits one live
  daemon endpoint. Zero substrate-side prereqs.

  Rule 6 stretch acknowledged: one file (terminal.ts) grows from
  ~325 → ~600 lines. Concept: one slash router, mechanically ported.
  Precedent for a large single-concept sprint: piece D's
  `_slash_route` in cli.py which this ports.

- **substrate-ui sprint 035t — header driver picker.** Adds a
  `<select id="terminal-driver">` element to the terminal-view header
  populated from `GET /api/models`. Wires `onchange` to `PATCH
  /api/session/<id> {driver}` + emits `DRIVER_PATCHED` on the ack.
  Prompt renders `${driver} ›` (already does via existing
  `_updatePrompt`); wires refresh on PATCH ack.

  Rule 6: two files (terminal.ts + index.html for the select DOM if
  the terminal doesn't inject it dynamically — decision at author
  time).

- **substrate-ui sprint 035u — Ctrl+C interrupt.** Adds a `keydown`
  handler on the terminal input that on Ctrl+C fires `POST
  /api/session/<id>/interrupt` (piece B 215b + 217c). Also useful:
  Ctrl+C outside a turn-in-flight prints a hint per product spec §10
  Ctrl+C-at-idle line.

  Rule 6: one file. One concept.

- **substrate-ui sprint 035v — params drawer + `/set` slash.** Waits
  on substrate 235 + substrate-ui 032c. Adds `/set think {on|off}`,
  `/set tokens N`, `/set timeout N` to the slash router. Adds a hint
  span in the terminal header showing current params (matches
  `#termparams` from the agent terminal). Fires `DRIVER_PARAMS_PATCHED`
  on PATCH ack (new v0.7.2 tag — see vocab addition below).

  Rule 6: one file. One concept — params drawer.

- **substrate-ui sprint 035w — create-time controls drawer.** Waits
  on 034a. Adds a `new session` affordance in the terminal-view
  header (a header button or slash `/new`) that opens a small dialog
  for driver / bundle / workspace / tools / isolate + `--name`. Fires
  the five `_SELECTED` / `_ATTACHED` / `_TOGGLED` tags per v0.7's
  `driver_session` category on the ACK.

  Rule 6 stretch acknowledged: one dialog with five controls, one
  concept ("new-session create-time flow").

- **037c amendment.** Rewrite the observation contract: "Dock DOM
  deletion permitted only after every dock control has a home in
  terminal.ts. Precondition: sprints 035s, 035t, 035u, and 035w have
  landed. Sprint 035v ships if substrate 235 lands before 037c; if
  not, the params row of the deleted dock has no home and the
  deletion is deferred until 235 + 035v close."

  Rule 6: two files (app.ts + index.html). One concept.

Discipline addition (kit-scoped):

- **WORKING_AGREEMENT.md addition.** New section: "Product-spec
  conformance in observation contracts. Every piece-G sprint card
  body cites the product-spec section it fulfills and enumerates the
  surface controls that section names. The observation contract
  asserts the user-facing surface, not just the wire-level tag
  emissions."

Vocab addition (v0.7.2 or fold-into-next-version):

- **DRIVER_PARAMS_PATCHED{session_id, params, prior_params}** — new
  tag in `driver_session` category. Emitted from terminal.ts on
  successful PATCH of `driver_params`. Fires from sprint 035v.

## Sequencing

Blocking chain:

```
substrate 235 ─┐
               ├─→ substrate-ui 032c ─→ substrate-ui 035v (params drawer)
                                       └─→ 037c precondition #4

substrate 238 (closed today) ─→ substrate-ui 034a ─→ 035w (create controls) ─┐
                                                                             ├─→ 037c precondition #3
substrate-ui 032b (closed today) ────────────────────→ 035w bundle branch ───┘

(no substrate prereqs) ─→ substrate-ui 035s (slash router) ──→ 037c precondition #1
                       └→ substrate-ui 035t (driver picker) ──→ 037c precondition #2
                       └→ substrate-ui 035u (interrupt)      ──→ 037c precondition #3
```

Recommended dispatch order:

1. **substrate 235** (topology params surface) + **substrate-ui 032c** (manifest + PATCH) — parallel; both must land before 035v.
2. **substrate-ui 034a** (GET /api/bundles + /api/records?exclude_sessions) — independent; unblocks 035w.
3. **substrate-ui 035s** (slash router) — independent; twelve slashes online in one commit.
4. **substrate-ui 035t** (driver picker) — independent; ships alongside 035s.
5. **substrate-ui 035u** (interrupt) — independent; keyboard binding.
6. **substrate-ui 035v** (params drawer) — after 235 + 032c.
7. **substrate-ui 035w** (create controls) — after 034a.
8. **substrate-ui 037c** (dock retirement) — after 035s + 035t + 035u + 035v + 035w.
9. **substrate-ui 034b + 036a-f + 038** — the remaining piece-G queue (desktop-view rail + five session controls + parity test + review fold). These are the pre-existing piece-G queue; sequencing unchanged. Desktop view still gets its own control set per tech spec §10.

Nine substrate-ui cards + two substrate-side cards (235 + 238 already
closed + 239 already closed + 240 already closed) close the mechanical
translation. Piece G total: **fifteen executable substrate-ui sprints**
after this fold (034a, 034b, 032c, 035s-w, 036a-f, 037c, 038).

## What this fold explicitly retires or corrects

- **PLAN Phase 2 as one sprint** — retire. Adopt the chained
  035s-035w approach from the map. Reason: rebuild-and-replace
  removes the dock before its controls have terminal-view homes;
  chained approach preserves user surface throughout.
- **Map's 032c "tools/workspace/isolate PATCH growth"** — correct.
  tools is already PATCHable (server.py:2265). workspace/isolate are
  spec'd create-only (product spec §9c "workspace_path frozen at seq
  1"). Only `driver_params` needs manifest-schema growth, which is
  what the fold's 032c targets.
- **Sprint 035 CLOSEOUT** — augment. The existing
  `sprint-033-CLOSEOUT-ADDENDUM.md` pattern (rule-12 additive)
  applies. New file:
  `sprints/sprint-035-CLOSEOUT-ADDENDUM.md` naming the mechanical-
  translation gap sprint 035's observation contract missed. Cites
  this fold + the review + the feature map as the corrective set.

## Standing at end of fold

**Substrate-side closed today:** 238 (`list_bundles`), 239
(`current.json` symlink), 240 (`SessionStarted` instrument).

**Substrate-side needed (fold-identified):** 235
(session_topology driver params).

**Substrate-ui closed today:** 032a (v0.7), 032b (bundle PATCH),
033 (view scaffold), 033a (mirror bump), 035 (session transport —
now known to be under-scoped; addendum names the gap).

**Substrate-ui pending (fold-consolidated):** 032c (driver_params
manifest + PATCH), 034a (bundles endpoint), 034b (rail rewrite), 035s
(slash router), 035t (driver picker), 035u (interrupt), 035v (params
drawer), 035w (create controls), 036a-f (desktop-view five controls
+ parity test), 037a-b (session harness — check whether 035s+037c
supersede parts), 037c (dock retirement — precondition-gated), 038
(fold pass).

## One-line takeaway

The mechanical translation gap is a chain of nine substrate-ui cards
+ one substrate-side card + one vocab addition. Every one of them is
named. Every one of them has a live daemon prereq or a queued sub
card. Nothing is deferred; nothing is unclear.

---

*FOLD-2026-08-28-piece-g-mechanical-translation.md. Reconciles PLAN
+ REVIEW + FEATURE-MAP into one operational sprint queue. Rule 12
additive — the three source docs stay untouched on disk. Author:
Claude session 2026-08-28.*
