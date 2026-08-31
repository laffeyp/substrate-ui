# PLAN — piece G mechanical translation (2026-08-28)

**Author:** Claude session 2026-08-28.
**Trigger:** Architect ruling — "the whole point was mechanical translation.
Their absence in the daily-driver terminal is a system gap, not spec
compliance. Letter but not spirit." Correction of my prior framing.
**Principle stated:** whatever the agent terminal exposes today survives
into the daily-driver terminal, wired to session-world plumbing. Silence
in the spec is not exclusion; mechanical translation carries every real
capability forward.
**Status:** plan only. No code changes in this document.

## What the agent terminal exposes today (the source-of-truth inventory)

Grepped against `substrate-ui/web/app.ts:940-1200` + `web/index.html`
lines 258-278.

**Header controls.**

| Control | DOM | Source of truth |
|---|---|---|
| Driver picker | `#agentmodel` select | populated from `GET /api/models` |
| Params row | `#termparams` span | reads `STATE.term.params.{think, tokens, timeout}` |
| Hint | `#termhint` | chat mode toggle |
| Close | `#termClose` | dock only; retires with 037c |

**Bare-word commands (dock's router at app.ts:1000-1164).**

| Command | Effect | Session-world equivalent |
|---|---|---|
| `help` / `?` | print command list | client-side (`/help`) |
| `chat` / `agent` | enter chat mode | session-world is chat-only; retire |
| `model <name>` | swap driver | `PATCH /api/session/<id> {driver}` — live |
| `cwd [path]` / `workspace [path]` | set workspace | `POST /api/session {workspace}` at create; PATCH not supported (spec §9c — workspace immutable per session) |
| `worktree <repo>` / `wt <repo>` | git-worktree mode | `POST /api/session {workspace, workspace_shape:"worktree"}` at create — live |
| `diff` | show worktree diff | `GET /api/worktree_diff?path=…` — live |
| `think on\|off` | toggle Ollama `think` param | **GAP — no session-side surface** |
| `tokens N` | set `max_tokens` param | **GAP — no session-side surface** |
| `timeout N` | set request timeout | **GAP — no session-side surface** |
| `params` | print current params | print client-side; still needs storage |
| `exit` | leave chat | `POST /api/session/<id>/end` — live |
| `tail [--kind K] [--producer P]` | print events ≤ cursor | client-side; reads STATE.events |
| `cat <seq>` | print one event payload | client-side; reads STATE.events |
| `ls` | list application outputs | `GET /api/records/<name>/io` — live |
| `input` | print the run seed | same endpoint — live |
| `narrate` | print causal beats | client-side reads STATE.events |
| `inspect <kind\|instance>` | provenance chain | `GET /api/records/<name>/explain/<instance>` — live |
| `clear` | clear terminal | client-side |
| Arrow up/down | history navigation | client-side, `STATE.term.history` |

**The three real system gaps.** `think`, `tokens` (`max_tokens`),
`timeout`. All three:

- Are real `OllamaResponder.__init__` parameters
  (`substrate/src/substrate/adapters/models.py:133-165`).
- Ship in the dock's UI today.
- Have no session-side storage (`SessionManifest` at
  session_registry.py:78 lists 14 fields, none for driver params).
- Have no PATCH/POST wire (`_session_patch` at server.py:1054;
  `_session_create` at server.py:941).
- Bake fixed defaults at `_daemon_driver_resolver` at server.py:141
  (`OllamaResponder(model=name, timeout=300.0)` — think=False,
  max_tokens=0, num_ctx defaults).

`num_ctx` is the fourth OllamaResponder param. Per product spec §5f it
is daemon-selected from the tag's `/api/show` output (auto per model).
That path is not built yet either — the daemon hard-codes 32768. Same
class of gap; different fix (auto-derive vs user-set).

## Two-phase plan

### Phase 1 — daemon side: SessionManifest driver_params + PATCH/POST + resolver

**One concept.** Session persists driver params; the daemon reads them
when it builds the Responder; the UI can drive them via the same
PATCH surface it uses for `driver`, `tools`, `per_turn`.

**Files touched (four).**

1. `substrate-ui/session_registry.py` — SessionManifest gains
   `driver_params: dict[str, Any] | None = None`. New method
   `set_driver_params(session_id, params)` following the `set_driver`
   / `set_bundle` pattern (per-session lock; `_replace(manifest,
   driver_params=params)`; atomic manifest.json write).
2. `substrate-ui/server.py::_daemon_driver_resolver` — accept optional
   `params: dict | None`. Cache key changes from `name` to
   `(name, _params_tuple(params))`. For the Ollama branch, thread
   `think`, `max_tokens`, `timeout`, `num_ctx` into the
   `OllamaResponder(...)` construction. For claude/gemini/deterministic
   branches, params are ignored (those adapters have no equivalent
   knobs; document explicitly).
3. `substrate-ui/server.py::_session_create` — accept optional
   `driver_params` in the POST body. Validate shape (dict with keys in
   `{think, max_tokens, timeout, num_ctx}`, type-checked per key).
   Thread into `SessionRegistry.create(...)`.
4. `substrate-ui/server.py::_session_patch` — lift `driver_params`
   into `_PATCHABLE`. New branch calls
   `_SESSION_REGISTRY.set_driver_params(sid, params)`. Response body
   gains `driver_params` field.
5. `substrate-ui/server.py::_build_session_topology_from_manifest` —
   pass `manifest.driver_params` to `_daemon_driver_resolver(name,
   params)`.

**Tests (new file — `tests/test_server_session_driver_params.py`).**
Following the pattern from `test_server_session_patch_bundle.py`:

- `test_patch_driver_params_lands_on_manifest`
- `test_patch_driver_params_null_clears`
- `test_patch_driver_params_unknown_key_returns_400`
- `test_patch_driver_params_wrong_type_returns_400`
- `test_create_accepts_driver_params`
- `test_response_carries_driver_params_field`
- `test_next_turn_rebuilds_responder_with_new_params` — patch
  `{think: true}`, run one turn, assert the OllamaResponder-instance
  in the resolver cache has `_think == True` (or reach through the
  built topology).

**Vocab addition (v0.7.2 or fold into next version bump).** New tag
or extension: `DRIVER_PARAMS_PATCHED{session_id, params,
prior_params}`. Emitted from the UI-side when the terminal fires the
PATCH — same shape as `DRIVER_PATCHED`. Alternative: extend
`DRIVER_PATCHED` with an optional `params` payload field. Decision
belongs at the ratification moment; the plan carries both options.

**Scope call.** Rule 6 stretch acknowledged — five files touched
(session_registry + server.py + tests + vocab + rationale) but the
concept is exactly one ("SessionManifest gains driver-params surface").
Sub-500 lines across the change. Precedent: sprint 032b touched
server.py + session_registry + tests + rationale for the bundle PATCH
lift; same shape here.

**Prereqs.** None. Every dependency is landed piece-B code.

**Halt conditions.** `dual_contract_fail` if the OllamaResponder cache
key change breaks the F13 cache invariant (Responder shared across
turns for the same driver+params combo).

**Wall-clock estimate.** One hour of focused work; the tests are the
long tail.

### Phase 2 — UI side: port the dock's DOM into terminal.ts (mechanical translation, not rewrite)

**One concept.** The daily-driver terminal IS the agent terminal,
wired to session-world plumbing. Every control the dock has today
survives; the wiring underneath moves from `/api/agent` to
`/api/session/<id>/turn` + SSE.

**Files touched (three).**

1. `substrate-ui/web/terminal.ts` — REBUILT (not extended). Delete the
   current 325-line minimal shell. Land a new implementation that
   mounts DOM equivalent to the dock's `#termdock` block:
   - Header row: driver picker (select), params row (think toggle +
     tokens input + timeout input), workspace field, close/end button.
   - Body: message list with role markers.
   - Input row: prompt + input field.
   - Router: every dock command from the table above, `/`-prefixed per
     product spec §2a. Retired: `chat` (session-world is chat-only).
     Added: `/inspect`, `/list`, `/replay`, `/run`, `/context`,
     `/interrupt`, `/help` per spec §2a.
   - Wire: driver picker → `PATCH /api/session/<id> {driver}` +
     `DRIVER_PATCHED` emit. Params row → `PATCH /api/session/<id>
     {driver_params: {...}}` + the new `DRIVER_PARAMS_PATCHED` emit
     (Phase 1 daemon prereq). Workspace at create → `POST /api/session`
     body. `/exit` → `POST /api/session/<id>/end`. `/interrupt` →
     `POST /api/session/<id>/interrupt`. Message send → `POST
     /api/session/<id>/turn`. Live-follow → `GET /api/session/<id>/events`
     SSE.
2. `substrate-ui/web/app.ts` — delete the dock's ~300 lines of
   `renderTerm`, `runTerm`, `sendChatMessage`, `followLive` (agent-side),
   `termSubmit`, `termSetOpen`, `_selectModel`, `_setParam`. The dock
   is fully retired here (037c work moved forward — under the
   mechanical-translation principle, keeping two terminals is worse
   than retiring one).
3. `substrate-ui/web/index.html` — delete the `#termrow` block (dock
   DOM + `#termOpen` reopener). Header `terminal` toggle button
   removed (STATE.term.open goes away). CSS for `.term-*` classes
   stays — the new terminal.ts uses them.

**Harness update.** `harness/capture_terminal_session.js` extends its
assertions:

- Driver picker present in DOM; option list matches `/api/models`.
- Params row present; think toggle + tokens + timeout inputs live.
- Slash `/help` prints the command list.
- Slash `/model <name>` swaps driver and emits `DRIVER_PATCHED`.
- Slash `/inspect <record>` returns projection.
- Slash `/list records` returns the record list.
- Legacy dock DOM absent (grep `#termdock` inside the built dist
  returns zero).

**Grader update.** `EXPECTED_ORDER_SESSION` (per-kind fixture at
`tools/capture-grade.ts`) gains `DRIVER_PATCHED` and
`DRIVER_PARAMS_PATCHED` in the tail so the harness exercises them.

**Prereqs.** Phase 1 must land first. Without `driver_params` on the
manifest, the terminal's think/tokens/timeout inputs write to nothing.

**Scope call.** Rule 6 acknowledged stretch — three code files
(terminal.ts + app.ts + index.html) but the delete-and-replace shape
is one concept: retire the dock, land its replacement, no parallel
terminals. Rough size: terminal.ts grows from 325 → ~550 lines
(mostly slash router branches); app.ts loses ~300 lines; index.html
loses ~15 lines.

**Halt conditions.** `dual_contract_fail` if the harness sees
DRIVER_PARAMS_PATCHED without a matching `driver_params` field on
`GET /api/session/<id>`. `dual_contract_fail` if any dock slash from
the inventory table has no session-world equivalent that ships.

**Wall-clock estimate.** Half a day of focused work. The slash-router
port is mechanical (every branch has a one-to-one target) but there
are 18 branches.

## Sprint numbering

Phase 1 lands as substrate-ui sprint 032c — "session driver_params
schema growth." Sits alongside 032a (v0.7 vocab) + 032b (bundle
PATCH); mirrors the piece-B schema-growth family.

Phase 2 lands as substrate-ui sprint 035a — "terminal mechanical
translation." Supersedes the terminal-view minimal shell sprint 035
landed. Original 035 stays closed on disk per rule 12; a CLOSEOUT
addendum on 035 cites 035a as the corrective sprint that fulfilled
the mechanical-translation principle 035 named but did not honor.

Sprint 037c (legacy dock retirement) folds into 035a. Phase 2 removes
the dock as part of the mechanical-translation move; sprint 037c
becomes a no-op (marked closed with pointer to 035a).

## What this plan explicitly does NOT touch

- `web/rail.ts` extraction (sprint 034b) — separate concept.
- Five session-header controls in the DESKTOP view (sprints 036a-e).
  Terminal-view controls per Phase 2 above; desktop-view controls
  remain their own sprints.
- Any substrate-side kernel change. Every daemon-side change lands in
  substrate-ui (the daemon lives there).
- Auto-derive `num_ctx` from `/api/show` per product spec §5f. Phase 1
  makes `num_ctx` a settable field on driver_params; the auto-derive
  path is a follow-on sprint that fills it from the daemon at session
  create.

## Standard held

Mechanical translation is the principle: every capability that lives in
the agent terminal today survives into the daily-driver terminal.
Silence in the spec text is not exclusion. The one substrate-side gap
Phase 1 closes; the UI port Phase 2 lands. Two phases, no shortcuts,
no "not spec'd" rationalizations.

Awaiting Architect ratification before dispatch.
