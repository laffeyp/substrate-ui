# Sprint 118 — Split-pane headers start at their left edge

```yaml
---
id: 118
status: closed
opened_at: 2026-10-09
closed_at: 2026-10-09
phase: 1
pass_kind: functional
---
```

## why

Reported 2026-10-09: with the window split, every pane header starts "substrate" 78px in, as if each pane had the macOS close/minimise/zoom buttons above it. The Electron stylesheet in `web/reveal.ts` padded every `[data-top-bar]` by 78px. A single pane's header is the window's top edge and needs the inset; split panes sit below the window's own 38px bar and none has the buttons above it.

## scope

- `reveal_component.ts`: each pane carries `corner` = '1' when it is the only pane. `reveal.html`: the pane top bar carries `data-corner`. `reveal.ts`: `[data-top-bar][data-corner="0"]` pads 10px, the header's own padding.

## artifact contract

### Files modified

- `substrate-ui/web/reveal_component.ts`, `substrate-ui/web/reveal.html`, `substrate-ui/web/reveal.ts`, `substrate-ui/package.json`

### Files created

- `substrate-ui/harness/shakeout/split_pane_header_inset.ts`

## observation contract

- Against the installed `/Applications/Substrate.app` (`SHAKEOUT_APP`): one pane, its header at y=0 with 78px padding; split right then down, three headers at y=38/38/456, each 10px padding with "substrate" 10px from its left edge.

## result

- Red on the installed build of 11:44: three split headers at 78px padding, label 78px in.
- Green on the reinstalled build of 11:51: single header 78px at y=0; split headers 10px, label 10px in.
- The first attempt kept the inset on the top-left split pane; the measurement showed it sits at y=38, below the window bar, so the inset now applies to a single pane only.
- The installed app is now built from the working tree (signed, not notarized): kernel 1.1.2 with uncommitted changes, marked not releasable by `fetch-python-runtime.sh`. Against it: driver_chip_on_resume, resume_after_two_ends, graph_model_lane_on_resume, lifecycle_gates, transcript_follow and split_pane_header_inset pass.
