# Sprint 136 — One top bar

```yaml
---
id: 136
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 5)
asked: 2026-10-11 (Architect)
---
```

## scope

Today the window has two kinds of top bar (`web/reveal.html`):

- **The app bar**, lines 19–44. It has two forms. With one pane in the terminal view it is hidden (`showStrip`, `showFullHeader` both false). With several panes it is a strip holding only the window-button dots. In the reveal view and on records, assay and studio it is the full bar: the substrate mark, the crumb, the driver chip, the workspace chip, the esc hint, records, studio and the reveal button.
- **A header on every pane**, lines 47–64. Each holds the dots (single pane only), the substrate mark with that session's status dot, the pane name (double-click renames), the driver chip, the workspace chip, records, studio and the reveal button, at 10px against the app bar's 10.5–11.5px.

After this sprint:

- **One bar, always.** The full app bar shows in every view, at its current sizes and layout. The strip form goes.
- **No pane headers.** Splitting creates no bar. The focused pane is the one at full opacity, as now (`dim`, `reveal_component.ts:1442`).
- **The bar shows the focused pane.** The crumb names it, and double-clicking the crumb renames it, as the pane name did. The status dot is its session's. The driver and workspace chips are its own, in the terminal view too, not only when revealed. The reveal button reveals it. Focus moving to another pane changes all of these.
- **Electron.** The window-button inset applies to the one bar. The `data-corner` rule (`web/reveal.ts:115`) and the per-pane `corner` binding go.
- **What stays.** The driver chip keeps its dropdown; sprint 137 (roadmap step 6) makes it an indicator. Pane focus, drag-swap and split gutters are unchanged.

## checks

- `harness/shakeout/split_pane_header_inset.ts` asserted three header bars after two splits. Rewritten: after two splits the window has exactly one `[data-top-bar]`, it holds the window-button inset, and focusing each pane in turn changes the crumb to that pane's name.
- `harness/shakeout/driver_chip_on_resume.ts` reads the chip from `[data-dropdown-region="driver-pane"]`. It reads the bar's driver chip, which for the focused resumed pane must name `deterministic`.
- `tsc` clean; the 11 Electron gates pass.

## result

- **Built.**
  - `web/reveal.html`: the strip and the per-pane headers are gone. One bar, always shown, carries the focused pane's status dot, name (`data-crumb`; double-click renames), driver chip, workspace chip, records, studio and the reveal button. The chips show in every view but records, assay and studio. Panes carry `data-pane`.
  - `web/reveal_component.ts`: the bar binds the focused pane's row (`fpDot`, `fpEditing`, `fpStartEdit`, …). The chip dropdowns open outside the reveal view too. The 20 pane-header bindings nothing reads any more are removed, along with `corner`, `showStrip`, `showFullHeader`, `singlePane` and `compact`. The workspace chip reads `⌥ —` before a workspace is picked, and `⌥ sandbox` for a per-session sandbox, where it had read a bare `⌥`.
  - `web/reveal.ts`: the `data-corner` rule is gone. The crumb is no-drag: in a drag region a double-click zooms the window instead of renaming.
- **Gates.**
  - `split_pane_header_inset.ts` became `one_top_bar.ts` (and in `gates:electron`). It checks one bar and one "substrate" label at the top edge with the 78px inset, with one pane and with three. After each pane is clicked, the bar reads `pane-<id>`. On the old UI it fails at the split step: the old template has no `data-pane`, and it draws four bars with three panes.
  - `driver_chip_on_resume.ts` reads the bar's chip; it shows `deterministic` for the resumed pane.
- **Checks.** `tsc` clean; unit specs 34/34; all 11 Electron gates pass on the source build. Screenshots of the unbound, bound, split and revealed states show one bar.
- **Seen, not changed.** `gripStart` (the pane drag source) was already bound to no element before this sprint, so dragging a pane to swap it has no handle. `both_session_shapes` still shows `fragment_source_failed · role · FileNotFoundError('reviewer.md')`.
