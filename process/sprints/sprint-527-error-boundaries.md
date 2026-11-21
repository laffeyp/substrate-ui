# Sprint 527 — A render error does not empty the window

```yaml
---
id: 527
status: closed
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W5)
pass_kind: functional
depends_on: [526]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

Error boundaries around the transcript, the meta view, the editor and each page (records, assay, studio) catch a render error in one area and show a fallback that names the area and offers a "Try again" button that resets the boundary. On catch, the boundary emits `WINDOW_FAULTED` with the component's name in the `area` payload field (a vocabulary change, proposed and ratified). The rest of the window stays drawn. One verifiable property: a gate that makes one transcript row throw from a planted fault sees the rest of the window drawn, the fault's fallback visible, and `WINDOW_FAULTED` in the trace with `area` naming the transcript.

## prerequisites

- 526 (W4: the bounded stream; W5 catches errors that remain after W2–W4 reduced the load)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json` (v0.73)
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/app/App.tsx` — where the boundaries wrap the areas; read the render tree to find each area's mount point
- `web/reveal/transcript/Transcript.tsx` — the transcript component, wrapped by a boundary
- `web/vm/signals.gen.ts` — the generated signal names; `WINDOW_FAULTED` already exists in the vocabulary (confirmed: v0.73 has it)

## signal contract

### Emits

- `WINDOW_FAULTED` (existing tag; payload change: `area` field added, proposed as P-0.74-WINDOW-FAULTED-AREA). Current payload is `{ component: string }`; the proposal adds `area` or reuses `component` with the boundary's name.

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary change is proposed, ratified, version bumped, and recorded before the code emits the new payload shape.
- Error boundaries do not suppress errors in event handlers or async code — only in the React render tree.
- A boundary's "Try again" resets its own state; it does not reload the page or discard other areas' state.

## artifact contract

### Files created

- `web/app/ErrorBoundary.tsx` — a reusable class component wrapping `componentDidCatch` and `getDerivedStateFromError`; accepts `area: string` and an `onError` callback; renders a fallback with the area name and a "Try again" button.

### Files modified

- `web/app/App.tsx` — wraps transcript, meta, editor and each page component with `<ErrorBoundary area="...">`.
- `web/vm/signals/versions/0.74.json` (or the next version) — `WINDOW_FAULTED` payload updated.
- `web/vm/signals/versions/0.74-rationale.md` — the proposal.

### Content assertions

- `ErrorBoundary.tsx` contains `componentDidCatch`.
- `App.tsx` contains at least four `<ErrorBoundary` elements wrapping distinct areas.
- The vocabulary's `WINDOW_FAULTED` tag's payload names the `area` or `component` field as a string.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:unit` returns 0 (includes `npm run signals`).
- `npm run gates:electron` — the new boundary gate passes; existing gates pass.

## observation contract

### UI driving steps

- A gate opens a session, injects a fault (a preload-exposed flag or a patched component that throws on a specific row), and checks that:
  - The transcript boundary's fallback is visible.
  - Other areas (the input bar, the pane tabs) are still drawn.
  - `WINDOW_FAULTED` appears in the trace.

### Expected runtime signals

- `WINDOW_FAULTED` with `area` or `component` naming the transcript.
- No `RENDERER_GONE`.

### Expected screenshot / visual state

- The fallback's text ("Something went wrong in the transcript" or similar) is visible where the transcript was; the rest of the window is intact.

## done criteria

An error in one area's render tree does not blank the window; the fallback names the area and offers recovery; the boundary emits `WINDOW_FAULTED`; a gate proves it.

## notes

- React error boundaries must be class components; function components cannot use `componentDidCatch`.
- The vocabulary proposal: check whether `WINDOW_FAULTED`'s existing `component` field already serves as `area`. If so, no payload change is needed — just ensure the boundary passes the area name as `component`. Read the vocabulary entry before proposing a change.
- Planting a fault: the gate can inject a row whose `text` property is a non-string (e.g., an object with a `toString` that throws), or the boundary gate can use a known-bad envelope shape.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in `signals/0.73.json` (or the proposed bump).
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot honored: 2 files modified + 1 created, one concept.
