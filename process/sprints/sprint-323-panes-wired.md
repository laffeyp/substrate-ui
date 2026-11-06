---
id: 323
status: closed
phase: shell-to-react E2.3
pass_kind: functional
---

# Sprint 323 — the template hosts the panes view

## scope

`web/reveal.html`: the panes block gives way to `<div data-app-mount="panes">` under `showTerminal`. `web/reveal.ts` registers the mount and stops attaching transcript roots to terminal hosts; the meta view's transcript column still mounts through the observer until E4. `web/reveal_component.ts` writes the panes view after each render.

## artifact contract

- Modified: `web/reveal.html` (no `{{ panes }}` loop), `web/reveal.ts` (no terminal attach), `web/reveal_component.ts`. `npm run build` 0; lint 0.

## observation contract

`pane_grid`, `transcript_follow`, `input_bar`, `split_returns_to_panes`, `tool_output_toggle`, `session_start_line`, `transcript_root_kept` exit 0; pixels equal `baseline-2026-11-05-d2`.

## result

Closed 2026-11-05. All seven 0; pixels 28/28. Three files (drift entry).

## Rubber Duck pass

No signals.
