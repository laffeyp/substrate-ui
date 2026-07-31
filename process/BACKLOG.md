# BACKLOG — running notes & ideas (substrate-ui)

*A living document. The Architect surfaces notes while using the console — things to fix, or just to
think about (not necessarily to fix now). Captured here so nothing is lost; promoted into a sprint
card when picked up. Append-only-ish; mark items done/promoted rather than deleting.*

---

## Actionable (small fixes)

- **[2026-06-22] [DONE — sprint 011] Inspector should work on the OUTPUT ARTIFACTS (I/O pane).** Each
  output artifact row is now clickable -> `inspectEvent(seq)` (cursor + hover), filling the inspector
  with its full content, like a stream event. Gated in e2e §16.

## Legibility

- **[2026-06-22] [DONE — sprint 011] Application content/code views are too terse.** The inspector now
  renders string payload fields that are code/prose/model-output (newlines or ≥40 chars) as a
  dedicated readable CONTENT block (real newlines, monospace, green left-border) above the raw
  payload — e.g. a `CodeChunk` shows `def solve(x):` as actual code. Verified both tracks (e2e §16 +
  viewed). RESIDUAL (future, low): syntax-aware highlighting; the content detection is a heuristic.

- **[2026-06-22] [DONE] Run-as-graph: the spawn dot lands mid-bar and reads as "spawned inside
  itself."** Diagnosed by correlating `run_graph` (cells: fired=5/7/9…, started=55/58/61…,
  ended=57/60/63…; dot@0.96 of the firing-anchored bar) with the screenshot — the bar conflated
  QUEUED time (94%, waiting in the single-writer admission queue) with RUNNING time (~4%). FIXED:
  each lane now splits into a faint hatched `fired->started` (queued) segment + a solid status-
  coloured `started->ended` (ran) segment, with the dot at the boundary (the run START). Verified
  both ways: 53/53 lanes correlate render↔log (`dot==run-start`); viewed. Gated in e2e_console.js §2.

- **[2026-07-30] [promoted -> sprint 015] The selected call options must be OBVIOUS in the agent terminal.** After the token-cap fix, the Architect ruled: the parameters a turn runs with (driver, thinking on/off, token cap, timeout) must be visible in the dock head and settable in place — not implicit constructor state you discover by reading a record.

- **[2026-07-30] A parameters pane.** Beyond the head strip: a pane that shows every parameter the call is made with, per instantiation, per gateway (Ollama and a CLI driver have different knob sets). Design direction; ties to the thinking-capture decision (THINKING-CAPTURE-RESEARCH-2026-07-30) — `think on` changes behavior today and should capture the monologue once the engine records it.

- **[2026-07-31] Workflow parity — ship the patterns as applications.** The agent-CLI products' workflow features (subagent fan-out, pipelines, verify panels, background notify, standing multi-agent mode) map onto existing substrate primitives almost 1:1 — the capability table is in `../COCKPIT-DIRECTION-round2-2026-07-30.md` item 11. The build items it resolves to: the `delegate` tool, the MCP servers, the application manifest, and a workflow-shaped application library (fan-out review, best-of-N + adversarial verify, research sweep) registered and launchable. Substrate's edge over all of them: every step is on a replayable record.

## Research directions (park; revisit when the interactive-agent terminal lands)

- **[2026-06-22] substrate-ui -> an agent-IDE / code editor.** Beyond reading: *control your LLMs from
  the terminal*, and VIEW + WRITE their code in the UI as a full editor. "Why not also write code in
  here / control your LLMs from here and view their code, as a full editor?" The honest answer is
  mostly "why not" — park as one of the very-next directions once the interactive model agent in the
  terminal exists. Ties to: the terminal (sprint 010), the interactive open-source-model agent (next),
  the application-content code views (above), and the parked tool-suite note
  (`../substrate/docs/tool-loop-tool-suite.md`). The arc: read -> converse-with-a-model -> view its
  output -> edit -> a full agent-driven editor over the substrate record.

---

*Append new notes with a date and a one-line context. Promote to a sprint card when worked; mark the
item `[promoted -> sprint NNN]` rather than deleting (the audit trail is the work).*
