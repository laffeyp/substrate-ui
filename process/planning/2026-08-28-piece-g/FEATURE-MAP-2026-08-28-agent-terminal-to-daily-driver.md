# FEATURE MAP — agent terminal → daily-driver terminal

**Author:** Claude session 2026-08-28.
**Purpose:** the mechanical translation table that was missing when sprint 035 landed. Every feature the agent terminal ships today gets one row: what it does, what UI it exposes, what substrate endpoint or slash it wires to, whether the daily-driver terminal (`web/terminal.ts`) has it yet, and the exact card that would land it.
**Sources read to build this map:** `web/index.html:275–293` (`#termdock` DOM), `web/app.ts::runTerm` (~180-line dispatcher at line 997), `web/app.ts::sendChatMessage` (line 336–387), `web/app.ts::STATE.term.*` fields (twelve fields, grep-enumerated), `substrate-ui/server.py::_agent_models` (line 516), `substrate-ui/server.py::_session_patch` (line 2242), `substrate/src/substrate/cli.py::_slash_route` (line 1053), `substrate/src/substrate/adapters/models.py::OllamaResponder.__init__` (line 140), `substrate/src/substrate/topologies/session/__init__.py::SessionStarted` (line 70). Product spec §2 §2a §4 §13. Tech spec §10.

Read the map before writing another piece-G sprint. A feature that is already on the substrate side and already reachable through a slash on the CLI does not need a new endpoint; it needs one JS handler in `terminal.ts`.

---

## Legend

- **Feature.** What the user does or gets.
- **Agent-terminal home.** Where it lives today in `#termdock` — DOM id, command string, or STATE field.
- **Substrate wire.** The daemon endpoint, slash command, or Responder constructor arg that carries the behavior.
- **Substrate-side status.** ✅ live · 🟡 partial · 🔴 not shipped.
- **Daily-driver home (proposed).** Where the equivalent lives in `web/terminal.ts` after the mechanical translation.
- **Daily-driver status.** ✅ wired · 🟡 partial · 🔴 not wired.
- **Card that lands it.** New sprint id, or reference to an existing one.

---

## Section 1 — Session lifecycle

| Feature | Agent-terminal home | Substrate wire | Sub side | Daily-driver home | DD side | Card |
|---|---|---|---|---|---|---|
| Open a session (implicit on first turn) | first `sendChatMessage` fires `POST /api/agent?model=...` | `POST /api/session {driver, name?, workspace?, workspace_shape?, seed?, bundle?}` (215c) | ✅ | `_openSession` at terminal.ts:109 | ✅ | shipped 035 |
| Send a user turn | plain text in `#terminput` when chat mode active | `POST /api/session/<id>/turn {text, context?}` (214a + 217e) | ✅ | `_sendTurn` at terminal.ts:234 | ✅ | shipped 035 |
| End session cleanly | `exit` command (or `/exit` when chatting) → `CHAT_EXITED` | `POST /api/session/<id>/end {source}` (215a) | ✅ | `/exit` slash at terminal.ts:308 | ✅ | shipped 035 |
| Interrupt current turn | Ctrl+C never wired on the agent terminal (only the graph header) | `POST /api/session/<id>/interrupt` (215b + 217c/217d primitive) | ✅ | Ctrl+C handler | 🔴 | **035b-interrupt** — one keyboard handler + POST |
| Reconnect to conversation | `chat` command reactivates the buffered convo | Every session persists as its own record; `POST /api/session` with `name=<known>` returns the same session_id | ✅ | Read STATE.term.chat.convo on mount; if a named session already exists, GET the record's tail via SSE | 🔴 | **035c-resume-named** — check by-name; open EventSource with `since_seq=<tail>` |
| End with reason surfaced on record | `/exit` fires `SessionEnded{reason: "user_exit"}` | POST /end body accepts `source` field | ✅ | terminal.ts:262 passes `source: reason` | ✅ | shipped 035 |
| Park on terminal close | closing the browser tab does nothing today | Daemon holds the session in `parked` state; `substrate resume <name>` picks up (piece D) | ✅ | Do nothing on tab close (default) — daemon parks; server SIGTERM handler (215d) closes the record cleanly | ✅ | shipped 215d |

## Section 2 — Driver / model selection

| Feature | Agent-terminal home | Substrate wire | Sub side | Daily-driver home | DD side | Card |
|---|---|---|---|---|---|---|
| Pick a driver | `<select id="agentmodel">` populated from `/api/models`; `_selectModel(name)` writes `STATE.term.model` | `GET /api/models` (server.py:2448) | ✅ | Header `<select>` in `_mkChildren` at terminal.ts:54 | 🔴 (`driverName` hardcoded to `"deterministic"` at :290) | **035d-driver-picker** — populate select, wire to `PATCH /api/session/<id> {driver}` |
| Change driver mid-session | `model <name>` command; `_selectModel` re-populates picker but next turn's `POST /api/agent` carries the new model in the query string | `PATCH /api/session/<id> {driver}` (215c) — also fires `DRIVER_PATCHED` when 032a's v0.7 tag emits | ✅ | `/model <name>` slash + picker `onchange` | 🔴 | **035e-slash-model** — port cli.py:1089–1098 |
| See the current driver in the prompt | `#termprompt` shows `substrate$` unchanged; the picker is the read-out | Manifest carries `driver` field; SSE never re-emits it | ✅ | `promptTick` at terminal.ts:320 already updates prompt to `${h.driverName} ›` when session active | 🟡 (updates on state change but not on PATCH round-trip echo) | **035e** — same card; refresh on PATCH ack |
| Default driver from config | `/api/models` default field returns `kimi-k2.6:cloud` if present | Server picks from `prefer` list at server.py:534–540 | ✅ | terminal.ts `MountTerminalOptions.driverDefault` accepts a string; caller (app.ts:1283) passes `"deterministic"` | 🟡 — hardcoded string instead of reading `/api/models` default | **035d** — read `/api/models` default in `mountTerminal` |

## Section 3 — Call parameters (think / max_tokens / timeout)

| Feature | Agent-terminal home | Substrate wire | Sub side | Daily-driver home | DD side | Card |
|---|---|---|---|---|---|---|
| Toggle thinking mode | `think on|off` command; `_setParam("think", bool)`; hint span shows `think on/off` | `OllamaResponder(think=True/False)` at adapters/models.py:181 — Responder constructor accepts it | ✅ **at the Responder**; ❌ **at the session-topology surface** — factory does not expose `think` | Slash `set think on/off` or params drawer | 🔴 | **235-session-topology-driver-params** on substrate side; **035f-set-slash** on UI side |
| Cap max_tokens | `tokens N` (0 = uncapped); `_setParam("tokens", n)` | `OllamaResponder(max_tokens=N)` at adapters/models.py:175 | ✅ **at Responder**; ❌ **at topology** | Slash `set tokens N` | 🔴 | **235** + **035f** |
| Per-turn timeout | `timeout N` (seconds); `_setParam("timeout", n)` | Timeout lives on the outer `Runtime.run/resume` call site; `delegate.py:113` uses it via `asyncio.wait_for`; session_topology does not expose | 🟡 (mechanism exists; no config seam through topology) | Slash `set timeout N` | 🔴 | **235** + **035f** |
| Display current params | `#termparams` span: `think on · tokens ∞ · timeout 300s` | Manifest could carry them if the topology exposed them | 🔴 (no manifest field for params) | Right-hand hint span in terminal header (like the agent terminal's `#termparams`) | 🔴 | **235** — add `params: {think, max_tokens, timeout}` to `SessionManifest`; **035d** — render it |

## Section 4 — Workspace / worktree / isolate

| Feature | Agent-terminal home | Substrate wire | Sub side | Daily-driver home | DD side | Card |
|---|---|---|---|---|---|---|
| Set workspace path (create-time) | `cwd <path>` command; `STATE.term.workspace = <path>` | `POST /api/session {workspace, workspace_shape}` — spec'd, PATCH deferred by 215c | 🟡 (accept on POST — verify; PATCH deferred) | New-session dialog OR slash `set workspace <path>` before first turn | 🔴 | **032c-session-create-workspace-isolate** — extend 215c/032b to accept workspace on POST |
| Trigger a git worktree | `worktree <repo>` command; sets STATE.term.worktree; sendChatMessage adds `&worktree=<repo>` to `/api/agent` | `POST /api/session {workspace: <repo>}` where `<repo>` is a git dir → session_worktree at server.py:571 creates branch `substrate/<session>` | ✅ | Automatic when workspace points at a git repo; slash `workspace <repo>` | 🔴 | **032c** on substrate side + **035g-workspace-slash** |
| Display resolved workspace | `sendChatMessage` prints `· workspace: <path> (branch <name>)` on first turn | Manifest carries `workspace` + `workspace_shape` | 🟡 | Terminal header status line or a dim print line on session-open (matches agent terminal's `· workspace: …` line) | 🔴 | **035d** — read from manifest on `_openSession` return |
| Show diff of what the agent changed | `diff` command; `GET /api/worktree_diff?path=<p>` | Endpoint exists in server.py | ✅ | Slash `/diff` | 🔴 | **035h-slash-diff** — one handler |
| Isolate (per-child subdirectory) | Not in agent terminal | `POST /api/session {isolate: true}` — spec'd, deferred | 🔴 | New-session slash `set isolate on` (create-time) | 🔴 | **032c** + **035g** |

## Section 5 — Tools + tools restriction

| Feature | Agent-terminal home | Substrate wire | Sub side | Daily-driver home | DD side | Card |
|---|---|---|---|---|---|---|
| Restrict tool suite (create-time) | Not in agent terminal | `POST /api/session {tools: [...]}` — spec'd, deferred | 🔴 | Slash `set tools <comma-list>` before first turn | 🔴 | **032c** + **035g** |
| Restrict tool suite (mid-session) | Not in agent terminal | `PATCH /api/session/<id> {tools}` — deferred by 215c; CLI already ships `/tools` slash at cli.py:1100 hitting the same endpoint | 🟡 (deferred substrate-side; client-side exists) | Slash `/tools <comma-list>` | 🔴 | **032c** on substrate + **035i-slash-tools** on UI |
| List active tools | Not in agent terminal | Manifest carries `tools` field; `GET /api/session/<id>` returns it | ✅ | Slash `/tools` (no args) reads and prints | 🔴 | **035i** |

## Section 6 — Slash-driven inspection + navigation

| Feature | Agent-terminal home | Substrate wire | Sub side | Daily-driver home | DD side | Card |
|---|---|---|---|---|---|---|
| Inject context slice into next turn | Not in agent terminal | `POST /api/session/<id>/turn {text, context: {parent_seq_range, kinds}}` (217e); CLI has `/context` slash at cli.py:1114 | ✅ | Slash `/context <lo-hi> [--kind K]` | 🔴 | **035j-slash-context** — port cli.py:1114–1136 |
| Inspect a record | `inspect <ref>` command; `GET /api/records/<name>/explain/<instance>` | Tool `inspect_record` (piece F, sprints 226-228); CLI `/inspect` at cli.py:1138 | ✅ | Slash `/inspect <record> [--filter …]` | 🔴 | **035k-slash-inspect** |
| Narrate a record | `narrate` command; local walk over STATE.events | `api.narrate(api.read_record(root))` | ✅ | Slash `/narrate` (current record) or `/narrate <other>` | 🔴 | **035k** — same card |
| Tail events | `tail [--kind K] [--producer P]` command | Local read of the current record; no daemon call | ✅ | Slash `/tail [--kind K]` | 🔴 | **035l-slash-tail** |
| Print one event | `cat <seq>` command | Local | ✅ | Slash `/cat <seq>` | 🔴 | **035l** |
| List records / topologies / sessions / applications / bundles | `ls` command (records only in agent terminal) | `GET /api/records`, `GET /api/topologies`, `GET /api/session`, `GET /api/applications`, `GET /api/bundles` (034a pending) | ✅ (records, sessions); 🟡 (bundles blocked on 034a) | Slash `/list [records\|topologies\|sessions\|applications\|bundles]` | 🔴 | **035m-slash-list** — port cli.py:1150 |
| Replay a record | Not in agent terminal | `api.assert_replayable(path, level)`; CLI has `/replay` at cli.py:1191 | ✅ | Slash `/replay <record>` | 🔴 | **035n-slash-replay** |
| Run an application as a delegate child | Not in agent terminal | `POST /api/topology/<name>/run` (225a, piece E); CLI `/run` slash at cli.py:1202 (deferral marker) | 🟡 (endpoint shipped in piece E) | Slash `/run <application> [args...]` | 🔴 | **035o-slash-run** |
| Help | `help` command; multi-line printout | Text | — | Slash `/help` prints the nine-slash inventory | 🔴 (currently prints "unknown slash: /help") | **035p-slash-help** |

## Section 7 — Bundle attach / detach

| Feature | Agent-terminal home | Substrate wire | Sub side | Daily-driver home | DD side | Card |
|---|---|---|---|---|---|---|
| Attach a bundle at create-time | Not in agent terminal | `POST /api/session {bundle}` (215c partial); five default bundles per piece H sprint 231 | 🟡 (accepted; verify write-through) | Dialog OR slash `set bundle <name>` before first turn | 🔴 | **032c** on substrate + **035g** on UI |
| Attach bundle mid-session | Not in agent terminal | `PATCH /api/session/<id> {bundle}` + `set_bundle(sid, bundle)` in `SessionRegistry` + `TranscriptCompacted{reason:"bundle_changed"}` on record | 🔴 (sprint **032b pending**) | Slash `/bundle <name>` | 🔴 | **032b** on substrate + **035q-slash-bundle** on UI |
| List available bundles | Not in agent terminal | `GET /api/bundles` (sprint 034a pending) | 🔴 | Slash `/list bundles` | 🔴 | **034a** on server + **035m** on UI |
| Show a bundle's contents | Not in agent terminal | CLI has `bundle show <name>` verb (piece D sprint 222) hitting local file read | ✅ | Slash `/bundle show <name>` | 🔴 | **035q** |

## Section 8 — Studio + authoring surface

| Feature | Agent-terminal home | Substrate wire | Sub side | Daily-driver home | DD side | Card |
|---|---|---|---|---|---|---|
| Open Studio (topology authoring) | Not in agent terminal (a header button reaches /studio.html) | `/studio.html` served by server.py static route | ✅ | Slash `/studio` opens `/studio.html` in a new tab OR keep header button | 🔴 | **035r-slash-studio** (trivial `window.open`) |
| Open builder / bundle wizard | Not in agent terminal | CLI `bundle create --wizard` (piece H sprint 232) | ✅ | Slash `/bundle create <name> [--template T]` | 🔴 | **035q** — same as bundle attach card |

## Section 9 — Signal-vocabulary contract from v0.7

Five tags land in v0.7's `driver_session` category. Terminal.ts emits ZERO of them today. Every row above that touches PATCH must emit its paired tag.

| v0.7 tag | Fires on | Terminal.ts emit site (currently) | Fix |
|---|---|---|---|
| `DRIVER_PATCHED{session_id, driver, prior_driver}` | successful PATCH of `driver` | none | 035e — after PATCH ack |
| `BUNDLE_ATTACHED{session_id, bundle, prior_bundle?}` | successful POST or PATCH of `bundle` | none | 035q — after ack |
| `WORKSPACE_SELECTED{session_id, workspace, workspace_shape}` | successful POST of `workspace` | none | 035g — after ack |
| `TOOLS_RESTRICTED{session_id, tools}` | successful PATCH of `tools` | none | 035i — after ack |
| `ISOLATE_TOGGLED{session_id, isolate}` | successful POST of `isolate` when user-set | none | 035g — after ack |

Absent these emits, the v0.7.1 grader has no witness for the daily-driver terminal's PATCH round-trips. Parity smoke (per each control's card) becomes the standing check.

---

## Summary count

Thirteen agent-terminal capabilities. Two live in terminal.ts (open, turn, exit). Eleven not wired. Every one of the eleven has substrate-side plumbing already shipped (nine) or blocked on one named substrate card (two: `bundle mid-session` on 032b, `tools/workspace/isolate` growth on 032c).

**No new substrate-side endpoints are needed** for driver picking, driver PATCH, interrupt, end, per-turn context, inspect, narrate, tail, cat, list, replay, run, studio-open, or bundle-list (once 034a lands). Every one exists.

**Substrate-side gaps** the map surfaces:

- Session-topology does not expose `think` / `max_tokens` / `timeout` as per-session config even though `OllamaResponder` accepts them. **Sprint 235** on substrate side.
- `SessionManifest` PATCH still defers `bundle` (032b), `tools`, `per_turn`, `workspace`, `workspace_shape`, `isolate`. **Sprint 032c** to lift the four. (032b already queued for bundle.)

**UI-side sprints** the map calls for, grouped by natural chain (each ≤2 files, one concept per rule 6):

- **035b-interrupt** — Ctrl+C → POST /interrupt.
- **035c-resume-named** — named-session reconnect.
- **035d-driver-picker + header status line** — one `<select>`, one status line, populated from `/api/models`.
- **035e-slash-model** — port /model slash.
- **035f-set-slash** — `set {think|tokens|timeout}` (waits on 235).
- **035g-workspace-slash** — set workspace / worktree / isolate at create (waits on 032c).
- **035h-slash-diff** — /diff hitting `/api/worktree_diff`.
- **035i-slash-tools** — /tools (waits on 032c for PATCH; independent for list).
- **035j-slash-context** — /context <lo-hi> [--kind K].
- **035k-slash-inspect** — /inspect + /narrate.
- **035l-slash-tail** — /tail + /cat.
- **035m-slash-list** — /list …
- **035n-slash-replay** — /replay.
- **035o-slash-run** — /run application.
- **035p-slash-help** — /help.
- **035q-slash-bundle** — /bundle attach/show/list (waits on 032b + 034a).
- **035r-slash-studio** — window.open('/studio.html').

Sixteen UI-side cards. Not sixteen sprints of effort — most collapse into a **one-shot "slash router in terminal.ts" sprint (035b–p group)** that ports cli.py:1053's dispatcher and wires every daemon call that already exists. That single sprint carries the eleven slashes that need no new substrate-side work; the remaining five (interrupt, driver picker header, bundle, workspace, params) each ship as their own card because each has a substrate-side dependency.

**Realistic queue after the map:**

1. **Sprint 032b** (substrate-ui) — bundle mid-session PATCH. Already queued. **Blocking.**
2. **Sprint 032c** (substrate-ui) — SessionManifest schema growth: tools, workspace, workspace_shape, isolate PATCH-able / create-time. **Blocking.**
3. **Sprint 235** (substrate) — session_topology exposes think, max_tokens, timeout; manifest carries them. **Blocking for params drawer.**
4. **Sprint 034a** (substrate-ui) — `GET /api/bundles`. Already queued. **Blocking for /bundle list.**
5. **Sprint 035s-slash-router** (UI) — port cli.py's `_slash_route` into terminal.ts; wire eleven slashes that need no substrate work: `/exit` (already), `/model`, `/context`, `/inspect`, `/narrate`, `/tail`, `/cat`, `/list` (records/sessions/topologies/applications), `/replay`, `/run`, `/help`, `/diff`, `/studio`.
6. **Sprint 035t-driver-picker** (UI) — header `<select>` populated from `/api/models`, PATCH on change, prompt renders `${driver} ›`.
7. **Sprint 035u-interrupt** (UI) — Ctrl+C → POST /interrupt.
8. **Sprint 035v-params-drawer** (UI) — `set think/tokens/timeout` slashes + hint span. Waits on 235.
9. **Sprint 035w-create-controls** (UI) — bundle, workspace, tools, isolate at create-time. Waits on 032c + 034a + 032b.

Nine cards close the terminal-view surface. Three substrate-side blockers (032b, 032c, 235) unlock them. All of it is the mechanical translation the sprint-035 landing skipped.

---

## One-line takeaway

The daily-driver terminal ships piece B's transport correctly and piece 0/A/C/D/E/F/H's controls not at all. Every control the agent terminal ships today has a substrate-side wire on the shelf — three exceptions have named cards. The missing artifact was this feature map; the missing sprint is the slash router. Both are cheap; both are the whole remaining piece-G gap.

---

*FEATURE-MAP-2026-08-28-agent-terminal-to-daily-driver.md. Ninteen agent-terminal features across nine sections; substrate side supports nine outright, two blocked on named cards, one gap needing new substrate work. Six existing sprint cards; nine new UI-side sprints and three substrate-side unblockers close the mechanical translation. Author: Claude session 2026-08-28.*
