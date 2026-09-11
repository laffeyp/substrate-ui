# Sprint 002 — first pane fills the window

---
id: 002
epic: B — Pane grid
status: closed
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json (Layer 1 pane/window; Layer 3 window_session + pane_session; Layer 7 anchor-pane-*-focus + anchor-pane-*-status); handoff_latest/docs/PANE-MECHANICS -2026-09-01-.md; D35
---

## scope

React renderer replaces the boot page. A window opens with one pane filling it, and the pane renders its full PaneHeader shell per D42 — every pane always carries the identical complete header from the first frame; the chip contents fill in across Sprints 031 (DriverChip), 032 (WorkspaceChip), 034 (BundlePopover), 035 (ToolsPopover). This sprint mounts the header shell with placeholder text, the two mandatory per-pane anchors (focus + status), and the state class that will grow. No split, no transcript, no reveal — just one full-shape pane and the eleven per-pane anchors dark until their sprints wire them.

## prerequisites

- Sprint 001 closed. `tests/harness/e2e_boot.js` PASS.

## signal contract

### Emits

- `WINDOW_OPENED` (`{window_id}`)
- `PANE_CREATED` (`{pane_id, window_id, parent_split_id: null, axis: null, ratio: 1.0}`)
- `PANE_FOCUSED` (`{pane_id, prior_pane_id: null}`)

### Consumes

None (boot sequence).

## artifact contract

### Files created / modified

- `package.json` — adds `react@18.3.1`, `react-dom@18.3.1`, `typescript@~5.6.3`, `esbuild@~0.24`
- `tsconfig.json` — strict TS; jsx=react-jsx; target=es2022
- `app/index.html` — mounts `#root`; carries the four app-scoped anchors (dialog, window-strip, bridge, last-tag) + heartbeat; drops the boot canvas
- `app/prototype-v7.html` — untouched (audit trail)
- `src/state/ShellState.ts` — the state class root; `{windows: Window[], panes: Record<pane_id, Pane>, focusedPaneId: string|null}`
- `src/reducer/ShellReducer.ts` — pure reducer over `ShellState`; every action returns a new state and a list of tags to emit
- `src/render/App.tsx` — mounts the reducer; renders `<WindowFrame>` per window
- `src/render/WindowFrame.tsx` — renders panes according to split tree (trivial for one pane)
- `src/render/Pane.tsx` — renders the pane frame + the eleven per-pane anchors (all painted byte 0 at mount)
- `src/render/PaneHeader.tsx` — full-shape header shell per D42 (DriverChip slot, WorkspaceChip slot, session-name slot, reveal-toggle handle, surface-icons row, close-x) with placeholder content until later sprints wire the chips
- `src/render/Anchor.tsx` — 1×1 canvas that paints from `byte` prop via rAF
- `src/observability/Emitter.ts` — single call site; validates against Draft-07; funnels to HarnessSink + AnchorPainter
- `src/observability/AnchorPainter.ts` — mount-time registration; per-anchor rAF-coalesced repaint
- `esbuild.config.mjs` — dev build; watches `src/**/*.{ts,tsx}`; writes `app/build.js`
- `tests/harness/e2e_first_pane.js` — three-channel harness for WINDOW_OPENED + PANE_CREATED + PANE_FOCUSED

### Content assertions

- `src/state/ShellState.ts` defines `Pane` with `{id, splitParentId, ratio, focused, boundSessionId, status}`
- `src/reducer/ShellReducer.ts` exports a pure `reduce(state, action)` — no direct emits inside
- `src/observability/Emitter.ts` rejects any tag not in the v0.1 vocabulary (grep-attributable)
- `app/index.html` contains `data-testid="anchor-bridge"`, `data-testid="anchor-dialog"`, `data-testid="anchor-window-strip"`, `data-testid="anchor-last-tag"`, `data-testid="anchor-heartbeat"`
- `app/build.js` produced by esbuild; served relatively from `app/index.html`

### Command exit codes

- `npx tsc --noEmit` returns 0
- `node esbuild.config.mjs` returns 0
- `python3 -m json.tool signals/0.1.json > /dev/null` returns 0
- `node tests/harness/e2e_first_pane.js` returns 0

## observation contract

### Driving steps

1. `SUBSTRATE_HARNESS=1 npx electron .`
2. Playwright waits for `[data-testid^="anchor-pane-"]` count === 11 (one pane, eleven per-pane anchors)
3. Playwright screenshots the pane's `anchor-pane-<id>-focus` region
4. Harness decodes byte via Addendum A2
5. Harness reads `<userData>/harness/last.jsonl` for WINDOW_OPENED, PANE_CREATED, PANE_FOCUSED in that order
6. Harness asserts three-channel agreement

### Three-channel agreement

- Structural: exactly one `[data-testid^="anchor-pane-"]` group; exactly eleven anchors inside it
- Perceptual: `anchor-pane-<id>-focus` byte === 255 (focused, per Layer 7 encoding); `anchor-pane-<id>-status` byte === 0 (unbound)
- Log ↔ signal: JSONL carries WINDOW_OPENED → PANE_CREATED → PANE_FOCUSED with matching `pane_id` and `window_id`

## done criteria

Electron launches; one pane renders; three tags emit in order; three channels agree on `focused, unbound`. Sprint 003 (splits) dispatches next.
