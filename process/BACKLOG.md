# BACKLOG — running notes & ideas (substrate-ui)

*A living document. The Architect surfaces notes while using the console — things to fix, or just to
think about (not necessarily to fix now). Captured here so nothing is lost; promoted into a sprint
card when picked up. Append-only-ish; mark items done/promoted rather than deleting.*

---

## Actionable (small fixes)

- **[2026-06-22] Inspector should work on the OUTPUT ARTIFACTS (I/O pane).** Clicking an artifact in
  the output "file folder" should open the inspector with its full payload / content — the same way
  clicking an event in the stream does. Today the I/O pane lists artifacts (gisted) but a click does
  not inspect. (The new terminal `cat <seq>` reads the full content; the GUI should too.)

## Legibility

- **[2026-06-22] Application-level content/code views are too terse.** The stream + inspector render
  application events (e.g. pair_coding `CodeChunk` / `ChunkBoundary`) as a *gisted* payload (path +
  kind); the actual CODE / turn text / model output is hard to read in the GUI. The terminal `cat
  <seq>` (sprint 010) now shows the full payload, but the GUI inspector should render content
  first-class too — a readable code/prose pane, ideally syntax-aware, not a one-line gist. This is
  the core of "I want to see more of the application-level code in here."

- **[2026-06-22] Run-as-graph: the spawn dot lands mid-bar and reads as "spawned inside itself."**
  The lane bar is FIRING-anchored (`fired_seq` -> `ended_seq`); the amber dot is the actual START
  (`started_seq`), which sits inside the bar because other Producers' events fill the seqs between
  scheduling and start. Correct, but confusing. Fix idea: draw the `fired_seq`->`started_seq` leading
  slice faint/hatched ("scheduled, not yet running"), the dot = start, the solid bar = running ->
  ended; and/or sharpen the legend + keep the existing tooltip. (Looks great visually as-is.)

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
