# Sprint 071 — mount seam, feature-flagged

```yaml
---
id: 071
status: closed
phase: 8
pass_kind: architecture
closed_at: 2026-09-23
---
```

## close (2026-09-23)

Two mount divs land in `web/reveal.html` — `<div id="vm-transcript-mount">` inside the terminal-view scroller and `<div id="vm-transcript-mount-reveal">` inside the reveal-view scroller. Each dc-runtime `<sc-for pn.liveTranscript>` block is now wrapped in `<sc-if value="{{ notAtomTranscript }}">`. `reveal.ts` reads the flag from `?atom-transcript=1` or `localStorage.atomTranscript`; a `MutationObserver` on `document.body` catches each mount div as it enters the DOM and creates a `ReactDOMClient.createRoot` on it, rendering the stub `<Transcript paneId={focused} view="terminal"|"reveal" />` that returns null. React and ReactDOM come from the same `window.React` / `window.ReactDOM` UMD instances dc-runtime already uses — bridged through `web/shims/react.ts` and `web/shims/react-dom-client.ts`, mapped by a Vite `resolve.alias`. tsconfig gains `"jsx": "react-jsx"`.

Dual + observation contract green:
- **Signal.** No new tags. Parity gate 30/30 green.
- **Artifact.** `web/reveal/transcript/{index.ts,Transcript.tsx}`, `web/shims/{react.ts,react-dom-client.ts}` land. `reveal.html`, `reveal.ts`, `reveal_component.ts`, `tsconfig.json`, `vite.config.ts` modified. `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke:vm` all exit 0.
- **Observation.** Flag OFF: `npm run pixel:diff` reports "12/12 match baseline". Flag ON (`harness/mount_seam_check.ts`): terminal mount present + empty, reveal mount present + empty after `⌃\`` toggle, two `[reveal] transcript root mounted` console lines, zero page errors, zero dc-runtime transcript rows visible.

Rubber Duck: the MutationObserver design surfaced a subtlety — the reveal-view mount only appears when the user toggles reveal; the check must exercise the toggle to prove both roots attach. Resolved-here by ordering the observation-contract assertions: terminal first (default state), then toggle, then reveal.

## scope

Add a feature-flagged mount seam for a future React-based transcript. `reveal.html` grows one placeholder `<div>` per view (terminal, reveal). `reveal.ts` creates a React root on each when the flag is on. `web/reveal/transcript/index.ts` exports a stub `Transcript` component that renders `null`. The dc-runtime transcript stays behind an `sc-if !enableAtomTranscript` guard. Nothing user-visible changes when the flag is off; when the flag is on, the transcript is blank while the header, prompt, and dialogs stay identical.

## prerequisites

- 070 (pixel baseline).

## context_files

- `sdd-kit-2/AGENTS.md`
- `process/planning/PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (§5.4, §7 Sprint 071, §9 R3).
- `web/reveal.html` (lines 87, 251 — current transcript scroll containers).
- `web/reveal.ts` (subscribe wiring at lines 105-148).
- `web/reveal_component.ts` (`renderVals` return-object shape).
- `web/dist/support.js` (React nesting via `createRoot`; line 196).
- `captures/pixel-baseline-2026-09-23/` (the diff target).

## signal contract

### Emits

None new. All existing controller-side signals continue firing unchanged.

### Consumes

- Every context file above.

### Invariants

- `signals/0.1.json` unmodified; parity gate green (30/30).
- With the flag OFF the shell renders exactly as it did at Sprint 070 (pixel diff clean).
- With the flag ON, no runtime error lands on the console; the mount divs contain empty React roots.
- No changes under `electron/*`, `substrate/*`, `web/vm/*`.

## artifact contract

### Files created

- `web/reveal/transcript/index.ts` — exports `Transcript` (stub renders `null`).
- `web/reveal/transcript/Transcript.tsx` — the stub component.

### Files modified

- `web/reveal.html` — add `<div id="vm-transcript-mount">` inside the current terminal-view scroller (line 87 area); add `<div id="vm-transcript-mount-reveal">` inside the reveal-view scroller (line 251 area). Wrap the existing `<sc-for pn.liveTranscript>` blocks in `<sc-if value="{{ !enableAtomTranscript }}">`.
- `web/reveal.ts` — read `?atom-transcript=1` URL param or `localStorage.atomTranscript`; when set, call `ReactDOM.createRoot` on each mount div and render `<Transcript paneId={fp.id} view="terminal"|"reveal" />`.
- `web/reveal_component.ts` — one line in `renderVals`'s return object: `enableAtomTranscript: <read the flag>`.

### Content assertions

- `web/reveal/transcript/Transcript.tsx` exports `Transcript` and `Transcript(...)` returns `null`.
- `web/reveal.html` contains `id="vm-transcript-mount"` and `id="vm-transcript-mount-reveal"`.
- `web/reveal.html` contains `sc-if value="{{ !enableAtomTranscript }}"` wrapping both `<sc-for pn.liveTranscript>` blocks.
- `web/reveal.ts` imports from `react-dom/client` and creates a root only when the flag is set.

### Command exit codes

- `npm run typecheck` returns 0.
- `npm run lint` returns 0.
- `npm run build` returns 0.
- `npm run smoke:vm` returns 0.
- `npx tsx web/vm/tools/check-vocabulary-parity.ts` returns 0 (30 tags).
- `npm run pixel:diff` returns 0 with the flag off (loaded via default URL).

## observation contract

### UI driving steps

- Load `http://127.0.0.1:8765/` — no flag. Screenshot terminal view.
- Load `http://127.0.0.1:8765/?atom-transcript=1` — flag on. Screenshot terminal view.

### Expected log substrings

- On flag-off boot: no lines containing "createRoot" or "React root mounted for transcript" in the console.
- On flag-on boot: exactly two `[reveal] transcript root mounted` lines (one per view), and no `page error` lines.

### Expected runtime signals

- Every existing lock tag continues firing under both flag states. No new tag appears.

### Expected screenshot / visual state

- Flag off: pixel diff against Sprint 070 baseline is zero across all 12 captures.
- Flag on: the header row, driver picker, prompt row, and dialogs match Sprint 070; the transcript region is blank (the mount div is empty, no rows render). Pixel diff of `empty` state is clean; other states differ (they intentionally show a blank transcript).

## done criteria

The feature flag exists, both mount divs exist, React roots mount on the flag, the stub component renders nothing. The dc-runtime transcript still renders with the flag off; the pixel-baseline gate passes for the flag-off boot.

## notes

React nesting (§9 R3) — `createRoot` on a descendant of dc-runtime's root is legal in React 18. The dev-mode warning only fires when the same container is passed twice; distinct descendant containers do not trigger it.
