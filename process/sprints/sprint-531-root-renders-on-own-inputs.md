# Sprint 531 — The root renders when its own inputs change

```yaml
---
id: 531
status: closed-partial
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W9)
pass_kind: functional
depends_on: [530]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

`App` (the window's React root, `web/app/App.tsx`) subscribes to the shell store and today calls `setState({ controllerSnapshots: { ...snapshots } })` on every pane's every snapshot, which re-renders `App` and re-runs `publish()`. `App` draws from the snapshots only a thin projection: for each pane whether it shows a session (`showsBinding`: `sessionId` present or bound) and its picker/driver/name/activity state, and for the **focused pane only** the stream inputs `computeViews` reads (`rawEnvelopes`, `topologyGraph`, `language`). A non-focused pane that streams thousands of `ToolProgress` envelopes changes none of that projection. This sprint extracts that projection as a pure function and guards the shell subscription with it: `App` re-renders and `publish()` runs only when the projection changed. One verifiable property: feeding two snapshot sets that differ only in a non-focused pane's `progressByCallId`, the projection is equal (so `App` skips); feeding a change to the focused pane's `rawEnvelopes`, the projection differs (so `App` renders).

## prerequisites

- 530 (W8: indexed views; the data layer is bounded, now the render layer is bounded)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/app/App.tsx` — the class root. Read: `AppState` (holds `controllerSnapshots: Snapshots`); `componentDidMount`'s `applyShell` closure (lines ~666–694: reads `shell.getSnapshot()` → `{ snapshots, changedPane }`, calls `setState({ controllerSnapshots: { ...snapshots } })` on every change); `componentDidUpdate` → `publish()`; `publish()` (lines ~899–912: `computeViews()` then writes the `picker`, `find`, `stream`, `panesStore`, `chrome`, `firstRun`, `topBar` stores); `computeViews()` (lines ~1205–1232: reads `fsnap = this.snap(focused)` for the stream view and `showsBinding`/`session(p)` for every pane); the `showsBinding` helper (line ~185).
- `web/app/state/shell.ts` — the shell store: `mirrorSnapshot(paneId, snap)` (called from `web/reveal.ts` per pane snapshot) sets a fresh `{ snapshots: { ...st.snapshots, [paneId]: snap }, changedPane: paneId }`, so the store notifies on every pane snapshot.
- `web/app/store.ts` — `createStore`: `set()` notifies only when a field's value changed by `Object.is`; the window's per-area stores (`picker`, `stream`, `chrome`, `topBar`, …) are made with it. The view objects `publish()` builds are fresh each `computeViews`, so those `set()` calls notify every time today.
- `web/app/derive/panes.ts`, `web/app/derive/stream.ts` — the existing `web/app/derive/` pure-projection files, the pattern this sprint's new file follows.
- `web/vm/types.ts` — `Snapshot` and `Snapshots` shapes; the fields the projection reads (`sessionId`, `driver`, `endedReason`, `rawEnvelopes`, `topologyGraph`, `language`, and the turn/activity fields W8 added).

## signal contract

### Emits

No new tags.

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary file is not modified.
- Every field `App` draws still updates when it changes: a focused-pane envelope still reaches meta's lenses and find through `stream`; a pane gaining or losing a session still redraws its binding; a focus change still redraws.
- The guard filters only changes that touch no drawn field. It never drops a change to a drawn field.
- `publish()` still computes correctly — it runs less often.

## artifact contract

### Files created

- `web/app/derive/app_inputs.ts` — a pure function `appInputs(snapshots, focused, panes) -> AppInputs` returning only what `App` draws (per-pane `{ id, showsSession, driver, name-relevant, activity/turn state }` and the focused pane's `{ rawEnvelopes, topologyGraph, language }` by reference), plus `sameAppInputs(a, b)` doing a shallow compare (reference-equality on `rawEnvelopes`, so a fresh per-batch array counts as changed; value-equality on the scalar binding fields). No React import; no side effects.
- `web/app/__tests__/app_inputs.spec.ts` — the spec.

### Files modified

- `web/app/App.tsx` — the shell subscription (`applyShell`) computes `appInputs` for the new shell snapshot, compares with the last via `sameAppInputs`, and returns early (no `setState`, no `publish`) when equal. `App` keeps `controllerSnapshots` in state (it feeds `computeViews`); the change is the guard around the `setState`, not the removal of the field.

### Content assertions

- `web/app/derive/app_inputs.ts` exists, exports `appInputs` and `sameAppInputs`, and imports nothing from `react`.
- `App.tsx` imports `appInputs`/`sameAppInputs` from `./derive/app_inputs` and calls them inside the shell subscription.
- `App.tsx`'s shell subscription has an early return guarded by `sameAppInputs` before the `setState({ controllerSnapshots` write.
- `web/app/__tests__/app_inputs.spec.ts` asserts: (a) two snapshot sets differing only in a non-focused pane's `progressByCallId` give `sameAppInputs(a, b) === true`; (b) a change to the focused pane's `rawEnvelopes` gives `sameAppInputs === false`; (c) a non-focused pane gaining a `sessionId` gives `sameAppInputs === false`.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run build` returns 0.
- `npm run test:unit` returns 0 (the new spec included).
- `npm run gates:electron` — all existing gates pass.

## observation contract

### UI driving steps

- Run `harness/shakeout/long_session_open.ts` (the W1 gate): the session opens and draws its last row; working-set and time bounds hold.
- Run `transcript_follow`: envelopes arrive, the transcript follows, `App` does not flash or stutter.
- Run a two-pane gate where one pane is focused and streaming and the other is non-focused and streaming; confirm the focused transcript follows and the picker/topbar stay correct.

### Expected log substrings

- `PANE_FOCUS_CHANGED` once on the pane switch.
- No `RENDERER_GONE`.

### Expected runtime signals

- `TRANSCRIPT_ROW_DRAWN` for the focused pane's rows through to the last.
- No `WINDOW_FAULTED`.

## done criteria

`App` re-renders and `publish()` runs only when the projection of what `App` draws changed; a non-focused pane's streaming envelopes no longer re-render the root; every existing gate passes.

## notes

- Why the projection, not deleting `controllerSnapshots`: `computeViews` reads `fsnap = this.snap(focused)` for the stream view that feeds meta's lenses and find, and reads every pane's snapshot through `showsBinding`. `App` needs the snapshots; what it does not need is to re-render when a snapshot field it never draws (a growing `progressByCallId`, a new `rawEnvelope` on a non-focused pane) changes. The projection names exactly the drawn fields; the guard skips the rest.
- The focused pane's `rawEnvelopes` is a fresh array per batch (sprint 524, W2), so `sameAppInputs` compares it by reference and the focused pane still re-renders per batch — correct, because meta and find read it. W9's win is the non-focused panes: with W2 already folding to one snapshot per frame, W9 removes every non-focused pane's frame from `App`'s render set. On a single-pane session the render count is unchanged; the gain shows with delegates and runs open (multiple panes).
- Leave `publish()`'s per-store `set()` calls as they are unless a store write is measurably hot; `createStore.set` already no-ops an unchanged field. Narrowing each view object to a stable reference is a separate concern; this card's contract is the root-render guard.
- `appInputs` must read the turn/activity fields W8 (sprint 530) added to the snapshot, not re-scan `rawEnvelopes`.

## self-review checklist

- [x] Scope is concrete and bounded (one paragraph; one verifiable property — the projection's equality under a non-focused progress change vs a focused envelope change).
- [x] `context_files` covers everything the worker reads; every path verified to exist (`web/app/store.ts`, `web/app/state/shell.ts`, the `derive/` files).
- [x] Signal contract's `Emits` is empty; no vocabulary change.
- [x] Artifact contract is gradable: content assertions are greppable, the spec is runnable, command exit codes are runnable.
- [x] `pass_kind: functional`: observation contract present.
- [x] Sprint sweet spot: two source files (App.tsx + the new pure projection) plus its spec; one concept (the root renders on its own inputs).
```
