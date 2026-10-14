# Sprint 186 — Housekeeping from the read

```yaml
---
id: 186
status: closed
closed_at: 2026-10-14
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-create-topology.md
---
```

## scope

Research create-topology § 8. Remove `src/` (21 files, outside the build and imported by nothing) and `scripts/gen-tags.mjs` and `scripts/gen-anchors.mjs`, which write into it; take `builder.py` out of `electron-builder.config.js`; take the unreachable sample code out of `web/reveal_component.ts` (the sample delegate children, fan-out rows, new-session form, old driver menu, sample envelopes and sample find text) and their bindings; ⌘F's transcript scope counts the pane's own transcript rows.

## observation contract

`npm run build` and the unit tests pass; the find bar counts a word typed into a real session's transcript; the existing gates for the meta view pass.

## result

- **Removed.** `src/` (21 files, 3,685 lines; outside `tsconfig.json`'s `include` and the Vite build, imported by nothing, importing a `signals/0.1.json` that no longer exists) and `scripts/gen-tags.mjs` and `scripts/gen-anchors.mjs`, which wrote into it. `builder.py` from `electron-builder.config.js`'s `files` and `asarUnpack` (the file is gone). From the shell (`web/reveal_component.ts`, `web/reveal.html`): the sample delegate descent (its children, crumbs, ancestors, input and both views' blocks, which wrapped the real view in `notDescended`), the fan-out rows, the sample find text, the new-session form, the old driver menu and workspace toggle, the sample envelopes and their tool cycle, the child-answer toggle, `extraSessions`, `sentLines`, the unused transcript rows, the rate-limit footer prop and the settings row "nested descent" with its stored preference. The keys lose their fan-out and descent branches; Esc's interrupt no longer passes a descent target.
- **Made true.** ⌘F's transcript scope counts the focused pane's own transcript rows. The footer's status reads the focused pane's session: nothing without one, `● live` while its stream is open, `◇ ended` after it ends, `○ <connection>` otherwise; it read `● live` always, from a flag nothing set.
- **Gates.** New `harness/shakeout/find_counts_transcript.ts` (in `gates:electron`): the footer is empty, then `● live`; a word sent reads `1 matching lines`, a word in no row `0`; on the old code the word read `0`. `npm run build` passes; `session_start_line`, `input_bar`, `tool_output_toggle`, `one_top_bar`, `structure_lists_producers`, `stream_follows_bottom`, `split_returns_to_panes`, `run_panes` and `delegate_pane` pass.
- **2026-10-14, zeroed with the create-topology tool.** The footer change is undone: the footer reads as before. The rest of this card stands: the dead `src/` tree, its generators, `builder.py` in the packaging and the shell's unreachable sample code stay removed, and ⌘F counts the real transcript. See `../substrate/process/planning/POSTMORTEM-2026-10-14-create-topology-without-substrate-r2.md`.
