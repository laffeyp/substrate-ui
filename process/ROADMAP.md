# ROADMAP — forward work (as of 2026-06-23, session close)

A full description of the work still to be done across **substrate** + **substrate-ui**, so the next
session can pick up cold. Ordered by the Architect's sequencing: the *foundation* (the real tool
suite) is done; the **interactive agent** is the north star but is GATED on a usage/theory pass; then
the **agent-IDE** arc. Nothing here is started unless marked.

---

## Status snapshot (done + green at close)

- **substrate** `laffeyp/Substrate` — full suite green (≈327 passed / 1 skip); ruff + mypy --strict
  clean; conformance green; CI matrix green. New this session: the `tool_loop` real tool suite
  (`tools.py`, no-permissions-by-default), the currency gate, `game_of_life_glider`.
- **substrate-ui** `laffeyp/Substrate-Ui` — 25 server tests + the gated `npm run e2e` + `capture:scene`
  (pixel decode) all green; CI green. New this session: the terminal, content views, run-as-graph
  legibility, sprint 012 drift polish (rAF replay, rail grouping + prune, glider decode).
- Both repos committed + pushed. The duplex-pipe reviewer confirmed the tool-suite work (reviews #51/#52).

---

## 1. The interactive open-source-model agent — THE NORTH STAR (GATED on a theory pass)

**What.** Talk to an open-source model in the terminal the way you use Claude Code; watch the run grow
live in the UI; read the conversation in the terminal. A human-in-the-loop `tool_loop`/conversation
topology backed by `OllamaResponder`, with the real `FULL_SUITE` tools available, driven from the
terminal (`run`/`chat`), the run animating live across the graph / stream / scene.

**Why.** The console's read surfaces (graph, stream, scene, terminal, replay) and the real tool suite
are now built. This is the surface that turns the console from a *lens* into an interactive *product*
— "the perfect product" (the Architect's words): talk to it, watch everything grow.

**GATING — the theory pass (do this FIRST; NO code yet).** The Architect deferred the build until we
think through *how* we will use it. Answer these before a sprint card:
1. **Interaction model.** Turn-by-turn chat (the human types, the model answers, repeat) vs. an
   autonomous run you watch vs. both? How does the human inject input mid-run? (`pause_await_input`
   (R-2) + `/api/resume` already exist — a paused run awaits input and continues.)
2. **Topology shape.** `tool_loop` with a real model + `FULL_SUITE` + a per-turn pause? Or a
   conversation topology? Given **no-permissions-by-default**, tool calls do NOT gate for approval by
   default — so what is the human's role each turn (just watching? steering? approving only when they
   opt in via the future `pause_await_input` gate)?
3. **Terminal commands.** `run <topology>` / `chat <message>`; how the dock streams model output +
   tool results; how the terminal POSTs to a live run and reads it back (live-attach exists:
   `followLive` + the live record-grows path).
4. **UI live-watch.** The run grows live (`followLive`), the conversation shows in the terminal, the
   scene/graph animate as the agent works — confirm the one-cursor architecture carries a *live* run
   (it carries replay today).
5. **Natural-language tool-calling.** The walkthrough convention is calculator-only (`TOOL <name> <a>
   <b>`, two numeric args). A real agent needs string args + variable arity + a real model deciding —
   this is a tool-suite NEXT item (§2) and a hard dependency.

**Dependencies.** §2 (natural-language tool-calling, the model seam); the terminal (built, read-only);
live-attach (built); `pause_await_input` (built, R-2); a `CliResponder`/`OllamaResponder` choice (§4).

**Output of the theory pass.** A design doc (`substrate/docs/interactive-agent.md` or
`substrate-ui/`), then a sprint card declaring the dual + observation contract, *then* build.

---

## 2. Tool-suite NEXT (substrate — `docs/tool-loop-tool-suite.md`)

The real suite ships (read_file / list_dir / grep / web_fetch / edit_file / write_file / bash +
calculator), ungated by default. Remaining, in dependency order for the interactive agent:

- **Natural-language tool-calling for `FULL_SUITE`** (string args, variable arity, a real model
  emitting tool calls) — the bridge to §1. Highest priority of this group.
- **Per-tool input schema as a msgspec `Struct`** (today args are a positional list) — typed, validated.
- **OPT-IN `pause_await_input` gate** (the human-in-the-loop seam; NOT the default — the no-permissions
  philosophy stands). For operators who want approval before a mutating tool runs.
- **A `toModelOutput`-style projection** (opencode) if raw tool results get noisy for small local models.
- **The substrate-native `delegate` / `run_topology` tool** — a tool whose execution is an
  `embedded_substrate` (the "substrate as a tool" idea; `docs/substrate-as-a-tool.md`).

---

## 3. The agent-IDE / code editor — research direction (BACKLOG)

**What.** Beyond reading: control your LLMs from the terminal, and VIEW + WRITE their code in the UI
as a full editor. The arc: read → converse-with-a-model → view its output → edit → a full
agent-driven editor over the substrate record. "Why not."

**Status.** Parked research direction (`process/BACKLOG.md`). Gated on §1 (the interactive agent) —
once you can talk to a model in the terminal and watch its code, the editor is the next compounding
step. Ties to the content views (done) and the tool suite (done).

---

## 4. Open Architect rulings (need a decision before building)

- **The static topology-structure view.** `/topology_graph` is built + tested but the console never
  renders it — only the dynamic run-as-graph ships. The view header reads "TOPOLOGY · RUN-AS-GRAPH ·
  STRUCTURE · SCENE", but STRUCTURE has no static view. *Wire it, or defer?* (substrate-ui BLACKBOARD,
  2026-06-17 wider-perceptual finding.)
- **substrate repo-root signposting.** The substrate repo buries canonical specs under the SDD audit
  trail; a README "canonical specs / the rest is history" block and/or relocating superseded drafts
  under `specs/history/`. Touches the *published* runtime repo. (substrate-ui BLACKBOARD, review #43
  finding 1.)
- **CLI-backed models seam.** The `Responder` seam takes any command-line model (Claude Code / Codex /
  Gemini via a `CliResponder`) — verified prior art (OpenDesign `agent-adapters`). A real
  `CliResponder` is unbuilt; relevant to §1 (which model backs the interactive agent — local Ollama
  vs. a CLI model).

---

## 5. Housekeeping / drift (noted, not urgent)

- **Drift item D** — fold `capture_scene.js`'s structural assertions into the canonical
  `e2e_console.js` / `capture_console.js` (today the scene harness stands alone). The rest of the
  drift watchlist is FOLDED (sprint 012: rAF replay, rail grouping + prune, glider decode).

---

## Where things are tracked

- `substrate-ui/process/BLACKBOARD.md` — `## Built`, `## Sprint tail`, `## Drift watchlist`,
  `## Surfaced for review`, `## Deferred`.
- `substrate-ui/process/BACKLOG.md` — the Architect's running notes; the agent-IDE direction.
- `substrate-ui/process/KIT_DIARY.md` — hypotheses + per-session learnings.
- `substrate/docs/tool-loop-tool-suite.md` — the tool-suite design + NEXT (§2).
- `substrate/docs/{tool-loop-futures,substrate-as-a-tool}.md` — the agent/meta design sketches.
- `substrate/process/BLACKBOARD.md` — the runtime-side build log.
