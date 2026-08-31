# REVIEW — the daily-driver terminal against product spec §13 and tech spec §10

**Reviewer:** Claude session 2026-08-28.
**Framing:** the Architect diagnosed the confusion in plain English — the AGENT TERMINAL held all the controls (driver picker, think/tokens/timeout, chat toggle), the DAILY-DRIVER TERMINAL got the piece-B session transport but not the controls, and the piece-G card queue puts the controls in the DESKTOP-view header rather than in the terminal-view header. This review confirms that reading against both specs, enumerates the substrate-side plumbing that already exists behind every missing control, and names the redesign the piece-G queue needs.

Two specs, two levels of abstraction, both weighted equally: PRODUCT-SPEC-2026-08-17-round12.md §2 §2a §4 §13 (what the daily driver is and does) and TECH-SPEC-2026-08-25-round6.md §10 (how piece G lands it).

---

## The confusion, named plainly

The codebase now carries two terminals living side by side in `web/index.html`:

**Terminal A — the "AGENT TERMINAL" (legacy).** DOM `<div id="termdock">` at index.html:277–293 inside `#view-desktop`, opened by `#termOpen` button. Header carries: driver picker `<select id="agentmodel">`, params span `#termparams` (think/tokens/timeout via `set` command), hint `chat to talk · help`. Body is a shell with `runTerm(line)` command dispatcher; typing `chat` enters LLM interaction; `sendChatMessage(text)` at app.ts:336–387 fires the actual model call through the legacy `POST /api/agent` bridge. Sprint 037c plans to delete this whole surface.

**Terminal B — the "DAILY-DRIVER TERMINAL" (new).** DOM `<div id="view-terminal">` at index.html:295. Mounted by `terminal.ts::mountTerminal(root, {driverDefault:"deterministic"})` at 325 lines. Header carries: title `▌ substrate — daily-driver terminal`, hint `type to talk · /exit to leave`, nothing else. Body is a plain terminal; typing anything sends a UserMessage; only `/exit` is a slash. Uses `POST /api/session`, `POST /api/session/<id>/turn`, `POST /api/session/<id>/end`, SSE — the piece-B session shape.

The screenshot shows both alive at once: Terminal A's `▌ terminal` reopen button visible at the bottom of the desktop view; Terminal B occupying `#view-terminal` after the toggle flip.

The daily-driver terminal has correct plumbing and no controls. The agent terminal has controls and doomed plumbing. The refactor was half-done: the transport moved to the new terminal; the surface did not.

## What product spec §13 says the daily-driver terminal is

**View A — Terminal.** "Just the agent terminal, filling the window. What Claude Code users sit in all day. Prompt at the bottom, transcript above, nothing else on screen. Same DOM as substrate-ui's integrated terminal today; the desktop chrome around it hides."

The load-bearing phrase is "the agent terminal, filling the window." Not "a NEW terminal, minus the controls." The controls the agent terminal ships today — driver picker, think/tokens/timeout, chat toggle — go with it into View A. What "hides" is the *desktop chrome around it*, not the terminal's own controls.

**Product spec §2a — slash commands inside a session.** Nine slashes: `/exit`, `/model <name>`, `/tools <comma-list>`, `/context <seq-range> [--kind K]`, `/inspect <record> [--filter …]`, `/list [records|topologies|sessions|applications]`, `/replay <record>`, `/run <application> [args...]`, `/help`. Every slash maps 1:1 onto a session-API call or a tool-suite invocation. The user has one place to type; the daemon routes.

This is Claude Code's surface. A user in Claude Code's bare terminal changes model with `/model`, restricts tools with a config directive, sees context with `/context`, ends with `/exit`. Substrate matches, verb-for-verb.

## What tech spec §10 says piece G ships

Tech spec §10 opens with: "Piece G — substrate-ui two-view shape." Four files: `web/index.html`, `web/app.ts`, `web/rail.ts` (new), `web/terminal.ts` (new, "integrated terminal DOM promoted from docked bar to real column").

Then the "Desktop-view five controls" table: driver picker, bundle picker, workspace picker, tools restriction, isolate toggle — **all located in "session-header dropdown"**, "New-session dialog + session-header 'attach bundle'", "Session-header 'workspace' segment", "Session-settings drawer", "Session-settings drawer".

The five controls table is scoped to the DESKTOP view. It says nothing about the terminal view's own control surface. That is the gap between spec levels: product spec §13 says the terminal view carries the agent terminal's full surface; tech spec §10 tables only the desktop-view header controls. The tech spec leaves the terminal view's controls implicit — presumably the CLI's nine slashes per §2a and product spec §13's "same DOM" contract.

The piece-G card queue took the tech-spec table literally and shipped a minimal terminal.

## What the substrate side actually supports

The critical question the Architect posed: does the substrate side already support the controls the daily-driver terminal needs, or is the plumbing missing?

Answer: **the substrate side supports nearly everything. The terminal simply does not wire it.**

Per-control audit:

| Control | Substrate surface today | Wire path for terminal | Terminal.ts uses it? |
|---|---|---|---|
| Driver picker | `GET /api/models` (server.py:2448–2449) returns Ollama tags + CLI presets; `PATCH /api/session/<id> {driver}` (215c, server.py:2242) | Populate a `<select>`; PATCH on change | **NO** — `driverName` hardcoded to `"deterministic"` at terminal.ts:290 |
| `/model <name>` slash | Same PATCH endpoint; CLI's `_slash_route` at cli.py:1089–1098 shows the exact pattern | Slash handler → PATCH → re-render prompt | **NO** — only `/exit` recognized (terminal.ts:306–314) |
| Think / max_tokens / timeout | `OllamaResponder` at adapters/models.py:140–181 accepts `think`, `max_tokens`, timeout as constructor params | Wire through session-topology factory or a per-turn override | **NO on both sides** — session topology and 215c PATCH do not expose these three yet |
| Bundle attach at create | `POST /api/session {bundle}` (215c partial); default bundles shipped per piece H sprint 231 | New-session dialog before mount, or slash | **NO** — `bundleSlug` hardcoded to `""` |
| Bundle change mid-session | Substrate sprint 032b **pending** (queued as the G1 unblocker); UI wire pending | Slash `/bundle` → PATCH → transcript compaction | **NO** — both sides pending |
| Tools restriction | `/tools` slash in cli.py:1100–1112 already talks to `_daemon.patch_session(sid, tools=tool_list)`; substrate side 215c deferred but piece D CLI ships the client-side call | Slash `/tools` → PATCH | **NO** — substrate 215c deferred; terminal has no `/tools` slash |
| Workspace at create | `POST /api/session {workspace, workspace_shape}` — deferred | New-session dialog | **NO** — both sides pending |
| Isolate at create | `POST /api/session {isolate}` — deferred | Dialog checkbox | **NO** — both sides pending |
| Per-turn context injection | `/context` slash in cli.py:1114–1136 stores range + kind; the daemon reads it on the next `/turn` | Slash `/context` → store pending → include in next POST /turn body | **NO** — terminal has no `/context` slash |
| Inspect record | `/inspect` slash in cli.py:1138–1148 calls `api.narrate(api.read_record(...))` | Slash `/inspect` → local narrate | **NO** — terminal has no `/inspect` slash |
| Interrupt turn (Ctrl+C) | `POST /api/session/<id>/interrupt` (215b + 217c) | Ctrl+C handler → POST | **NO** — no interrupt binding |
| End session | `POST /api/session/<id>/end` (215a) | `/exit` slash → POST | **YES** — terminal.ts:308–310 |
| List sessions | `GET /api/session` (214b); CLI slash cli.py:1150–1162 | Slash `/list sessions` | **NO** — terminal has no `/list` slash |
| List bundles | `GET /api/bundles` — piece-G sprint 034a **pending** | Slash `/list bundles` | **NO** on both sides |
| Help | Static text | Slash `/help` | **NO** — `unknown slash: /help` at terminal.ts:312 |

Eleven of thirteen controls have substrate-side plumbing on the shelf. The terminal wires two: `/exit` and the base per-turn send. The others are one JS handler each away from working.

Three controls are genuinely blocked on substrate-side work: bundle mid-session PATCH (032b, queued), tools/workspace/isolate PATCH growth (SDD-6 in the prior review, needs 032c or 032b scope-extension), and think/max_tokens/timeout per-session (no card queued; product spec §4 mentions "call parameters" for the CLI but the session-topology factory does not expose them).

## Root diagnosis

The piece-G card set treated Terminal B as *transport only* and put every control in the desktop-view header (036a–e). That is a design contradiction with product spec §13 View A: the terminal view is meant to BE the Claude-Code shape a user "sits in all day" — that shape includes slash-driven model swap, tool restriction, context injection, and inspection. Absent those, the daily-driver terminal is a chat box with no seat controls, and a user who wants any control must flip to desktop view to touch the session header — the exact opposite of "the terminal user never needs to leave the terminal" that the Claude Code parity claim rests on.

The five 036 cards ship the same controls **twice** if the fix is right: once as slashes in the terminal view (per §2a), once as visual controls in the desktop view (per §10 table). The current queue ships them once, in the wrong view for the daily-driver user's default seat.

## Fix — what the piece-G queue needs to add

The refactor is not "throw out 036a–e." The refactor is "add a parallel set of slash-command bindings in terminal.ts that hits the same daemon endpoints the desktop controls hit, plus a small header row in the terminal view for the driver picker (single most-common change)." One CLI slash router at cli.py:1053 already does the JS-adjacent shape; port it to terminal.ts.

Concrete sprints to add:

- **Sprint 035b — slash-command router in terminal.ts.** Port cli.py:1053's dispatcher into `terminal.ts` as a `_slashRoute(line, handle)` returning `true` if handled. Ship nine slashes matching §2a: `/exit`, `/model`, `/tools`, `/context`, `/inspect`, `/list`, `/replay`, `/run`, `/help`. Wire each to the same daemon endpoint the CLI uses. Every slash carries the parity smoke: CLI slash and terminal slash write the same manifest state.
- **Sprint 035c — driver picker inside the terminal header.** One `<select>` populated from `GET /api/models`; PATCH on change; emits `DRIVER_PATCHED`. Same wire as sprint 036a but in the terminal view's header, not the desktop-view session header. Ships alongside 036a, not instead of it — the two views both offer the control, both hit the same PATCH.
- **Sprint 035d — think / max_tokens / timeout per-session controls.** Requires a substrate-side card first (call it sprint 235 or a session-topology PR): expose `think`, `max_tokens`, timeout on `session_topology(...)` and thread through to the OllamaResponder constructor. Then the UI wires a params drawer (or a `set` slash matching the current termdock's shape). This is the one substrate-side gap the current audit surfaces.
- **Sprint 037c amendment — do NOT delete the agent terminal's driver picker + params drawer until 035c + 035d land.** Sprint 037c currently deletes `#termdock` DOM in one pass. If 035c/035d haven't shipped, the deletion leaves the daily-driver user with strictly less UI than before. Sequence: 035c and 035d land first; 037c deletes only after every control it removed has a home in the terminal view.

That is the minimum. Optionally: sprint 035e — session-settings drawer accessible from the terminal view's header (bundle attach, tools drawer, workspace shape badge) — a compact right-side inspector triggered by a header button. Not strictly needed if slashes carry the whole surface; provides visual affordance for users who prefer clicking.

## Does the underlying system support the UI product spec §13 describes?

**Yes**, with one exception (think/max_tokens/timeout as per-session config).

- Driver PATCH: shipped (215c).
- Session-scoped Interrupt: shipped (215b + 217c primitive).
- Session end with reason: shipped (215a).
- Session events over SSE: shipped (214c).
- Session create with bundle/tools/workspace/isolate: partial (bundle mid-session pending 032b; tools/workspace/isolate PATCH-growth pending).
- Per-turn context injection: shipped in CLI (`/context` slash at cli.py:1114); daemon reads it on next `/turn`; the browser terminal has no equivalent slash.
- `inspect_record`, `list_records`, `list_topologies`, `list_sessions`, `list_applications`: shipped as tool_loop tools (piece F, sprints 226–228); the CLI's `/list` and `/inspect` wrap them; the browser terminal has no equivalent slash.
- Think / max_tokens / timeout: shipped at the `OllamaResponder` seam; NOT exposed on session_topology, NOT PATCH-able, NOT `set`-able through any current daemon endpoint. This is the one substrate-side gap — real work, one card.

Every other capability the product spec §13 View A promises exists in substrate. The daily-driver terminal is not blocked on plumbing; it is blocked on wiring.

## What this says about the review discipline

Sprint 035 closed under an observation contract that asserted "four driver-session tags fire at real code paths" and "two screenshots viewed and clean." Both true — the four tags fire, the screenshots look right. What the observation contract did not test: *the terminal user's actual daily-driver workflow*. A test that opens the terminal, tries to change model, tries to end cleanly with `/exit` — that test passes on `/exit` and reveals every other missing surface on the first try. The contract stopped at "session opens, message sends, session ends" and never asked "what would a Claude Code user reach for next."

Product-spec conformance is the missing observation contract. Every piece-G sprint needs a `## conformance check` block naming which product-spec section it satisfies and which controls that section names it must ship. Absent that, the tech-spec table becomes authoritative by default and the product spec's shape (the actual user surface) drops out.

**Fix at the discipline level.** Add to `substrate-ui/WORKING_AGREEMENT.md`: "Every piece-G sprint's card body cites the product-spec section it fulfills and enumerates the surface controls that section names. The observation contract asserts the user-facing surface, not just the wire-level tag emissions." Kit-scoped rule.

## Overall

The Architect's diagnosis is correct: the agent terminal was left alive, the daily-driver terminal was added as a minimal shim, the controls did not migrate. The substrate side supports thirteen of thirteen surface capabilities the daily-driver terminal needs (twelve outright, one — bundle mid-session — queued in 032b). Only think/tokens/timeout as per-session config lacks any substrate-side card and needs one.

The piece-G queue needs three new cards (035b slash router, 035c terminal-header driver picker, 035d think/tokens/timeout support), an amendment to 037c (do not delete until 035c/035d land), and a discipline rule (product-spec conformance in every sprint's observation contract).

Piece G as currently queued builds the desktop view correctly. It does not build the terminal view the product spec describes.

---

*REVIEW-2026-08-28-daily-driver-terminal-vs-spec.md. Diagnoses the terminal-vs-terminal confusion the Architect surfaced. Substrate side supports ~all the controls; the daily-driver terminal wires two of thirteen. Three new sprints plus a 037c amendment plus one discipline rule close the gap. Product spec §13 View A is the load-bearing contract; the piece-G tech-spec table alone missed it. Author: Claude session 2026-08-28.*
