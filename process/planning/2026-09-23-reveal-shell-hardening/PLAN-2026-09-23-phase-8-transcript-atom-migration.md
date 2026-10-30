# Phase 8 — Atom-level transcript
## Migrating the reveal-shell transcript subtree off dc-runtime, preserving the visual surface

| Field | Value |
| --- | --- |
| Opened | 2026-09-23 |
| Status | Drafted, awaiting Architect ratification |
| Owner | Agent (Peter Architect) |
| Preceded by | `PLAN-2026-09-12-presentation-model-extract.md` (Phases 1–6); `PLAN-2026-09-23-reveal-shell-hardening.md` (Phase 7, in flight) |
| Diagnosis | `AUDIT-2026-09-23-dc-runtime-local-optimum.md` |
| Attempts audited | `POSTMORTEM-2026-09-23-caret-in-place-toggle.md` |
| Runs under | Browser at `http://127.0.0.1:8765/`, served by `server.py`, which serves the built `web/dist/reveal.html`. Electron is a separate shell today — `electron/main.js:100-101` calls `mainWindow.loadFile("app/prototype-v7.html")` (`SUBSTRATE_UI_LOAD=react` picks `app/index.html`). The reveal shell and the Electron shell are two different HTML documents; Phase 8 targets the reveal shell only. Repointing Electron at the reveal shell is a separate follow-up sprint outside Phase 8's scope. |
| Affects | `web/reveal.html`, `web/reveal.ts`, `web/reveal_component.ts`, `web/vm/*`, `vite.config.ts`, `harness/shakeout/*` |
| Does not affect | `substrate/*`; `web/vm/signals/versions/0.1.json` (locked); the `SessionController` public API; `electron/main.js`, `electron/preload.js`, `app/prototype-v7.html`, or the `window.bridge.request(op, payload)` protocol between preload and renderer. |

---

## 1. Executive summary

The reveal shell's transcript renders every row through dc-runtime's single-template pipeline. dc-runtime re-invokes the whole class-body `renderVals()` on every state change and returns a flat prop bag; its `<sc-for>` primitive keys children by array index (`web/dist/support.js:555, 636`)[[1]](#r1); it exposes no memoization, layout-effect, or per-atom identity mechanism. The transcript has outgrown that model: five successive attempts to hold a tool card's caret line in place across a click failed for reasons the audit traces to that constraint. This phase migrates only the transcript subtree — the largest offender and the one with an identity requirement — off dc-runtime, onto a real React 18 component tree with `React.memo`-isolated atoms and a scroll container anchored to atom identity rather than pixel `scrollTop`. Every surface that does not exhibit the identity requirement (header, dialogs, studio, records, descent chrome, prompt row, find bar) stays on dc-runtime. The look does not change. Signals do not change. SessionController does not change. The observation is the pixel baseline plus the existing SDD parity gate.

Phase 8 targets the reveal shell that runs in the browser at `http://127.0.0.1:8765/` (`server.py` serving `web/dist/reveal.html`). Electron is on a different code path today. `electron/main.js:100-101` calls `mainWindow.loadFile(path.join(__dirname, "..", "app", target))` where `target` is `app/prototype-v7.html` by default; the inline comment reads "Load the prototype by default — it IS the shell." That prototype predates the reveal-shell extraction (Phase 5) and has not been repointed since. Repointing Electron at the built reveal shell is a distinct future sprint, not part of Phase 8.

Phase 8 does not fix the Electron shell in the same motion. The Electron shell will inherit the fix only after that repoint sprint lands. In the meantime, `AUDIT-2026-09-23-dc-runtime-local-optimum.md`'s diagnosis applies to both shells — they both use dc-runtime with the same identity-limitation properties — but the migration work here changes only the browser reveal shell's substrate.

The remaining Electron facts relevant to Phase 8's design are engine facts, not integration facts: Electron's renderer is Chromium at the version its release pins (Electron 33 = Chromium 130; Electron 34 = Chromium 132). Every DOM and React 18 primitive Phase 8 relies on (`createRoot`, `useSyncExternalStore`, `useLayoutEffect`, `IntersectionObserver`, `overflow-anchor`) is available in every Chromium version Electron has shipped since v20. When the Electron repoint sprint lands, the migrated shell renders identically under Electron because Chromium is Chromium.

## 2. Problem statement, in concrete

The user clicks a tool card's caret. The caret's line — the row containing the tool name and the `▾/▸` chevron — must not shift in the viewport. The card body (args, streaming pane, output pane, error line, call-id footer) must render below the caret line; content below the body must be pushed downward; the scrollbar may grow.

The instrumented probe at `harness/caret_probe.ts` (removed at end of session; see `AUDIT-2026-09-23-dc-runtime-local-optimum.md §5`) drove one bash tool session at a viewport height that forced the transcript to overflow. Signal samples (via a temporary `TOOL_CARD_TOGGLED` vocab entry, since reverted):

```text
click   1:  header_top=111  body_count=0  scroll_top=0   scroll_height=245
settled 1:  header_top=111  body_count=1  scroll_top=0   scroll_height=345
click   2:  header_top=27   body_count=1  scroll_top=84  scroll_height=443
settled 2:  header_top=111  body_count=0  scroll_top=0   scroll_height=245
```

The harness reported PASS on those numbers (header_top identical at click 1 and settled 2). The Architect confirmed the visible symptom persists in a real Chrome instance. The reproducer conditions differ from the probe's; the drift the user sees is not the drift the probe measures. The signal is real but insufficient — it does not observe the actor that is moving the caret in the Architect's case. The three plausible remaining actors are named in the audit; each requires a fix that dc-runtime does not host natively.

## 3. Root cause

The audit at `AUDIT-2026-09-23-dc-runtime-local-optimum.md §"The fundamental constraint"` enumerates five substrate properties that make the caret pin unachievable inside dc-runtime. Summarised here for reference:

1. **Fresh callback identities per render.** `renderVals()` returns a flat prop object; React sees a new function for every attribute value on every render[[2]](#r2). Ref callbacks[[3]](#r3) unbind and re-bind, each schedules an `rAF`[[4]](#r4) that writes `scrollTop`.
2. **Index-keyed lists.** `walkFor` in `web/dist/support.js:636–643` returns `h(Fragment, { key: i }, ...)`. React reuses DOM at each index across filter changes[[5]](#r5).
3. **No component boundaries.** One `DCLogic` subclass renders everything; there is no `React.memo`[[6]](#r6) subtree isolation.
4. **No layout-effect access.** dc-runtime does not surface `useLayoutEffect`[[7]](#r7) to the template consumer.
5. **Chromium's `overflow-anchor: auto` default.** Chromium adjusts `scrollTop` on content growth without notice[[8]](#r8); `overflow-anchor: none` removes one actor but not the others.

Standard-shape React lists resolve these by construction (see §5). dc-runtime cannot host that shape without leaving its template model.

## 4. Constraints

### 4.1 Visual invariant (hard gate)

The rendered surface stays pixel-identical to today's, save for anti-aliasing tolerance. The gate is a Playwright[[9]](#r9) screenshot compare against a baseline captured in Sprint 070 (see §7). Zero-tolerance on layout deltas.

The baseline and the diff run under identical rendering conditions: Playwright `newContext({ deviceScaleFactor: 2, viewport: {…}, colorScheme: "dark" })`. Retina (DPR 2) is the shipping display class; running the baseline at DPR 1 and the diff at DPR 2 would flag every anti-aliased edge as a delta. Baseline runs on macOS arm64 with Chromium at the version Playwright pins for its release channel; CI must match. Any DPR or platform drift is a Sprint-070-blocker, not a downstream regression.

Enumerable properties frozen: transcript row spacing (`line-height:2` for terminal view, `1.95` for reveal view — `reveal.html:87, 251`); row indentation and margin-top per role (see `reveal_component.ts:434–440`); glyph column width (24 px, from `margin-right:6px` on `reveal.html:92` plus `max-width:calc(100% - 24px)` on `reveal.html:94, 113`); tool-card header font and colours (`reveal.html:113`); card-body indent (`margin:6px 0 8px 24px`, `reveal.html:115`); background `#26292e`; caret glyphs `▾/▸`; streaming pane max-height `220px` and colour `#7fb3b8` (`reveal.html:120`); output pane colour `#9aa0a8` (`reveal.html:124`); error colour `#c26058` (`reveal.html:127`); call-id footer format (`reveal.html:129`).

### 4.2 SDD contract (hard gate)

`web/vm/signals/versions/0.1.json` is locked at 30 tags as of 2026-09-22[[10]](#r10). The parity gate `web/vm/tools/check-vocabulary-parity.ts` scans `web/vm/`, `web/reveal.ts`, and `web/reveal_component.ts` and asserts every declared tag is emitted and every emit is declared. Phase 8 introduces zero new tags, retires zero, moves every existing emit call site verbatim into the new component tree, and passes the gate at every sprint boundary.

### 4.3 Bundle budget

Current build (post-Sprint 062): `web/dist/reveal.html` 210 KB (44 KB gzipped), `web/dist/assets/reveal-*.js` 33 KB (10 KB gzipped). React 18.3.1 UMD is already loaded from `cdnjs.cloudflare.com` (`reveal.html:8-9`); the marginal cost of the transcript component tree is the code we write, not React itself. Phase 8 target: reveal bundle stays ≤ 60 KB gzipped after Sprint 076.

### 4.4 Runtime dependencies

React 18.3.1 (present, external UMD). ReactDOM 18.3.1 with `createRoot`[[11]](#r11) (present; `support.js:196` checks for it). Vite 5 build (already in `vite.config.ts:14`). No new runtime dependencies. Development-only additions: `@types/react` and `@types/react-dom` (typescript typings; do not ship in the bundle).

## 5. Design

### 5.1 The atom model

The transcript is a linear log of `RecordEnvelope` objects (`web/vm/types.ts`) with strict-monotonic `seq` per session. Each envelope becomes zero or one row in the render. Under the current row filter (`reveal_component.ts:519`), a `ToolResult` folds into its `ToolCall`; every other envelope produces one row. The atom is the row; its stable identity is:

- For `ToolCall` rows: `row.callId` (already unique per session, guaranteed by substrate's `Runtime._loop`, `../substrate/src/substrate/runtime.py`).
- For every other kind: `row.seq` (envelope seq).

The atom's local state is `{ open: boolean }`, applicable only to tool cards. Every other row is stateless in the view layer. Local state lives inside the row component via `useState`[[12]](#r12); it is not lifted into the shell's global state. The `SessionController.snapshot()` object stays unchanged.

Rendering an atom is a pure function of its envelope, its local state, and its progress entry from `snapshot.progressByCallId[callId]`. The progress entry drives the streaming pane; it comes from `SessionController.handleEnvelope`'s `ToolProgress` branch (`web/vm/session_controller.ts:762`).

**Key priority.** `envelope.callId` is defined for `ToolCall` and `ToolResult` kinds only (`web/vm/session_controller.ts:749, 781`). Every other kind — `UserMessage`, `ModelReply`, `Park`, `SessionEnded`, `FinalAnswer`, `TurnError` — has no `callId`. Row's React `key` is therefore `envelope.callId ?? \`seq:${envelope.seq}\``; the `seq:` prefix avoids the unlikely collision between a `callId` string that happens to equal a numeric seq's `toString`.

### 5.2 The scroll anchor

Terminals scroll by line, not by pixel. xterm.js's `Terminal.scrollLines`[[13]](#r13) and iTerm2's scrollback line model[[14]](#r14) both track viewport position as "topmost visible line + offset within that line". When new lines land or a line's height changes, the offset from the anchor line is preserved; earlier lines' positions are invariant.

The migrated transcript adopts the same pattern. `<Transcript>` tracks two values:

- `anchorSeq: number | null` — the `seq` of the topmost visible envelope in the viewport, or `null` for auto-follow-bottom.
- `anchorOffsetPx: number` — pixels from the top of the anchor atom's DOM element to the top of the scroll container's viewport.

On every commit, `useLayoutEffect`[[7]](#r7) reads the current DOM position of the anchor atom (via a `Map<seq, HTMLElement>` populated by refs on each row) and adjusts `scroll_container.scrollTop` so `anchorOffsetPx` is preserved.

Auto-follow-bottom is the default when the user has never scrolled up. `onScroll` updates `anchorSeq` to the topmost visible row via `IntersectionObserver`[[15]](#r15) (already supported by React refs on each row). When `anchorSeq === null`, the effect scrolls to `scrollHeight - clientHeight` instead of restoring an offset. This preserves the sticky-bottom behaviour today's shell has via `reveal.ts:117-138` + `_scrolls[fp.id]`.

**Observer / streaming race.** `ToolProgress` envelopes can arrive every 50–100 ms during a live streaming tool. Each envelope re-renders the affected `ProgressStream` (its parent stays memoized). The `IntersectionObserver` callback and the `useLayoutEffect` restore both fire on the same paint tick and can race — the observer may report the anchor left the viewport in the same tick the layout effect restores its position. Mitigation: the observer's callback stores the observed seq in a `useRef` and schedules one trailing `requestAnimationFrame`[[4]](#r4) per tick, coalescing multiple observations into one commit. The layout effect always reads the ref (not the observer's own state) so a mid-tick observer notification never wins.

### 5.3 Component contracts

Every component below is authored under `web/reveal/transcript/`. All files `.tsx`, TypeScript strict mode.

```ts
// web/reveal/transcript/Transcript.tsx
export interface TranscriptProps {
  paneId: number;
  view: "terminal" | "reveal";
}
export function Transcript(props: TranscriptProps): React.ReactElement;
```

`Transcript` subscribes to the pane's `SessionController` via `useSyncExternalStore`[[16]](#r16) (idiomatic React 18 external-state hook; guarantees tearing-free reads across concurrent renders). It renders one `<Row>` per row in the filtered transcript, memoized by atom key. It owns the anchor state.

**Adapter contract.** `useSyncExternalStore` expects `subscribe: (onStoreChange: () => void) => () => void` and `getSnapshot: () => Snapshot`. `SessionController.subscribe(listener)` calls the listener with `(paneId, snap)`. The adapter (author under `web/reveal/transcript/useController.ts`) wraps:
```ts
export function useController(paneId: number): Snapshot {
  const registry = window.__vm as PaneRegistry;
  const controller = registry.get(paneId);
  const subscribe = useCallback((onChange: () => void) => {
    return controller.subscribe(() => onChange());
  }, [controller]);
  const getSnapshot = useCallback(() => controller.snapshot(), [controller]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
```
`SessionController.subscribe` returns an `Unsubscribe` today (`web/vm/session_controller.ts:133-137`); the adapter forwards it verbatim.

```ts
// web/reveal/transcript/Row.tsx
export interface RowProps {
  envelope: RecordEnvelope;
  paired?: RecordEnvelope;             // ToolResult paired to a ToolCall
  progress?: ToolProgressEntry;        // from snapshot.progressByCallId
  view: "terminal" | "reveal";
  paneId: number;
  registerRef: (seq: number, el: HTMLElement | null) => void;
}
export const Row = React.memo(function Row(props: RowProps) { ... });
```

`Row` dispatches on `envelope.kind` and `envelope.role` to one of five sub-renderers: `PlainText`, `ModelReply`, `ToolCard`, `Park`, `Warning`. Each sub-renderer is a leaf component with no children of consequence — no further branching that could produce identity churn.

```ts
// web/reveal/transcript/ToolCard.tsx
export interface ToolCardProps {
  call: RecordEnvelope;         // the ToolCall envelope
  result?: RecordEnvelope;      // the paired ToolResult, if any
  progress?: ToolProgressEntry; // streaming entry
  autoOpenWhileRunning: boolean;
  view: "terminal" | "reveal";
  onDescend?: (recordRoot: string) => void;
  onEmit: (tag: string, payload: Record<string, unknown>) => void;
}
export const ToolCard = React.memo(function ToolCard(props: ToolCardProps) { ... });
```

`ToolCard` owns `const [openLocal, setOpenLocal] = useState<boolean | undefined>(undefined)`. `undefined` means "defer to auto-open", `true`/`false` are user-explicit. The click handler flips visible open to its opposite (mirroring today's `!visiblyOpen` fix in intent). `useCallback` gives the handler stable identity across renders; `React.memo` on the whole component prevents parent re-renders from touching it when nothing about this atom's props changed.

### 5.4 The mount seam

`reveal.html` grows two `<div>` placeholders — one for the terminal-view transcript, one for the reveal-view transcript. dc-runtime treats each as an opaque leaf (no `<sc-for>`, no `<sc-if>` inside). Concretely:

```html
<!-- reveal.html:87 -->
<div id="vm-transcript-mount" ref="{{ termScrollRef }}"
     style="flex:1;overflow-y:auto;overflow-x:hidden;padding:16px 22px;line-height:2;font-size:{{ fontSize }}px;min-width:0">
</div>

<!-- reveal.html:251 -->
<div id="vm-transcript-mount-reveal" onClick="{{ focusTranscript }}" ref="{{ revScrollRef }}"
     style="flex:1;overflow-y:auto;overflow-x:hidden;padding:20px 26px;line-height:1.95;font-size:{{ fontSize }}px;min-width:0">
</div>
```

`reveal.ts` creates a `ReactDOM.createRoot` on each mount div (once, on shell boot) and renders `<Transcript paneId={focusedId} view="terminal|reveal" />`. The `paneId` prop threads through so the React tree subscribes to the correct controller from `PaneRegistry.get(paneId)`.

`termScrollRef` / `revScrollRef` continue to fire on the mount div; the current sticky-bottom code in `reveal.ts:117-138` moves into `<Transcript>`'s scroll-anchor logic. `reveal.ts` no longer knows about scroll position.

### 5.5 What dc-runtime keeps

Every surface below stays on dc-runtime, unchanged, because none of them exhibits an atom identity requirement:

- The pane strip (`reveal.html:43-60`).
- The driver picker, workspace chip, records/studio/reveal buttons (`reveal.html:52-59`).
- The descent chrome (`reveal.html:65-85`).
- The find bar (`reveal.html:62-64`).
- The prompt row (searching by `promptVal`, `onPrompt` in `reveal_component.ts`).
- The studio surface (records overlay, canvas, form).
- The settings and export dialogs.
- The scripted-mode demo blocks (`reveal.html:140-170`, kept behind `pn.scriptedOn`).

## 6. Signal preservation, verbatim

Every emit site currently in the transcript path is mapped to its post-migration home:

| Current emit | Fired at | Post-migration home |
| --- | --- | --- |
| `STREAM_ATTACHED` | `SessionController.attachStream` | Unchanged — still in the controller |
| `STREAM_CLOSED` | `SessionController.handleStreamClose` | Unchanged |
| `STREAM_RECONNECTING` | `SessionController.handleStreamError` | Unchanged |
| `STREAM_ENVELOPE_APPENDED` | `SessionController.handleEnvelope` | Unchanged |
| `TURN_SUBMITTED`, `TURN_ACK`, `TURN_REFUSED`, `TURN_PARKED` | `SessionController.sendTurn` and its callback chain | Unchanged |
| `CHILD_RECORD_ATTACH_REQUESTED` | `SessionController.attachRecordRoot` | Unchanged (invoked by `ToolCard.onDescend`) |
| Every other tag in the 30-tag lock | Various controller methods | Unchanged |

The transcript itself emits nothing today. It reads snapshot state and derives view props. That property survives the migration: the React tree reads via `useSyncExternalStore` and calls no `sddEmit` in the migration path. If a future sprint adds a `TRANSCRIPT_ATOM_TOGGLED` diagnostic tag (see §11.3), it is a distinct vocab-bump sprint after Phase 8 closes, not part of this phase.

## 7. Sprints

Each sprint is a single-commit unit. Each ends with the full observation contract (§8) passing. Any pixel or signal drift blocks the merge.

### Sprint 070 — pixel baseline capture

**Deliverables.**

- `harness/pixel_baseline.ts` — Playwright script that opens a headless Chromium at 1440×900 and 900×380 viewports; drives a canned session sequence via `SessionController` (deterministic driver for empty/one-turn/warning states; real driver behind an env flag for tool-card, descent, multi-tool, mid-scroll states); captures screenshots per state × viewport.
- `captures/pixel-baseline-2026-09-23/` — 12 PNGs (6 states × 2 viewports).
- `harness/pixel_diff.ts` — Playwright script that captures the same states against the current build and diffs against the baseline with `pixelmatch`[[17]](#r17) at a tolerance of 0.1% pixel difference.
- `npm run pixel:baseline` and `npm run pixel:diff` in `package.json`.

**Exit.** Fresh clone of the repo produces identical baseline. `npm run pixel:diff` reports 0/12 deltas.

### Sprint 071 — mount seam, feature-flagged

**Deliverables.**

- `web/reveal/transcript/index.ts` — placeholder exporting a stub `Transcript` component that renders `null`.
- `reveal.html` — two `<div id="vm-transcript-mount">` inserts (§5.4). The existing `<sc-for list="{{ pn.liveTranscript }}">` blocks stay in place, wrapped in `<sc-if value="{{ !enableAtomTranscript }}">`.
- `reveal.ts` — reads `?atom-transcript=1` URL param or `localStorage.atomTranscript`; when set, creates a React root at each mount div. When unset, no React root; dc-runtime path stays live.
- `reveal_component.ts:renderVals` — computes `enableAtomTranscript` boolean and passes as a template value.

**Exit.** With flag OFF, `npm run pixel:diff` clean. With flag ON, the mount divs contain empty React roots and the transcript is blank; header, prompt, and dialogs unaffected. Smoke green, parity green.

### Sprint 072 — plain rows

**Deliverables.**

- `web/reveal/transcript/Row.tsx` — dispatch on `envelope.role` for `user | park | ended | warning`. Each maps to a `<div>` with the exact style computed today in `reveal_component.ts:326-343`.
- `web/reveal/transcript/Transcript.tsx` — subscribes via `useSyncExternalStore` to `pane.controller.snapshot()`; renders `<Row>` per filtered row with `key={envelope.callId ?? envelope.seq}`.

**Exit.** Flag ON, viewport at 1440×900, one-turn deterministic session: `npm run pixel:diff` reports zero delta against Sprint 070 baseline for that state. Smoke green.

### Sprint 073 — model-reply blocks

**Deliverables.**

- `web/reveal/markdown.ts` — extract `_mdBlocks`, `_mdInlines`, `_mdRenderBlock`, `_mdRenderInline` from `reveal_component.ts:771-812`; unit-test each against fixtures under `web/reveal/__tests__/markdown.spec.ts` (fenced code block preservation, list nesting, inline emphasis, code-tick, heading level).
- `web/reveal/transcript/ModelReply.tsx` — consumes the markdown parser, renders paragraph / code_block / ul / ol / heading with the exact markup at `reveal.html:96-108`.

**Exit.** Flag ON, session with one model reply exercising every block kind: pixel diff clean.

### Sprint 074 — tool cards

**Deliverables.**

- `web/reveal/transcript/ToolCard.tsx` per §5.3. Includes auto-open-while-running rule (matching current `reveal_component.ts:428-431`, `toolRunning || streamingShow`), local `useState({ open })`, `useCallback` handler, streaming pane, output pane (via `JSON.stringify` fallback matching `reveal_component.ts:1032-1041`), error line, call-id footer, descend affordance.
- `web/reveal/transcript/ProgressStream.tsx` — subscribes to `snapshot.progressByCallId[callId]`, renders the streaming text with same colour/styling as `reveal.html:120`. On streaming updates, `React.memo` prevents non-streaming siblings from re-rendering.

**Exit.** Flag ON, sessions: (a) one bash tool at rest, (b) one bash tool mid-stream, (c) one delegate tool with `child_root`. Pixel diff clean for each. The bash-mid-stream case adds a runtime assertion: sibling `<Row>` components render exactly once per new envelope (measured by a temporary render-counter under a `?trace-renders=1` flag; removed at sprint close). This proves the atom isolation §3.3 promised.

### Sprint 075 — scroll anchor

**Deliverables.**

- `web/reveal/transcript/useScrollAnchor.ts` — the hook implementing §5.2. Owns `anchorSeq`, `anchorOffsetPx`, and an `IntersectionObserver` that updates them on user scroll. Exposes `registerRow(seq, element)` and `layoutEffect()` callable from `<Transcript>`.
- Integration into `<Transcript>`: `useLayoutEffect` reads DOM after render, restores scroll position from the anchor, or sticks to bottom when `anchorSeq === null`.
- `harness/shakeout/caret_pin.ts` — new flow that opens a session, drives three tool calls to fill the viewport, scrolls mid-way, clicks a caret, and asserts the row's `getBoundingClientRect().top` at pre-click equals its `top` at post-settle within one pixel. Reads a new payload field on `TRANSCRIPT_ATOM_TOGGLED`? No — the caret is a UI action; the assertion runs by `page.evaluate` reading `document.querySelector` for that row. This flow is Playwright-based, not the NodeSubstrateClient shape the other shakeout flows use; it lives alongside them and runs from `npm run shakeout`.

**Exit.** Flag ON, mid-scroll caret toggle: `caret_pin.ts` reports 0-pixel drift across 5/5 runs. Pixel diff clean. Smoke green. Full shakeout green.

### Sprint 076 — retire the dc-runtime path

**Deliverables.**

- `reveal.html` — remove the `<sc-if !enableAtomTranscript>` guards; remove the `<sc-for pn.liveTranscript>` blocks entirely. Both mount divs are unconditional.
- `reveal_component.ts` — remove `_liveBindingsFor`'s `rows.map(...)` block (approx. 300 lines at current `reveal_component.ts:330-517`); remove `filteredRows`, `liveTranscript`, `_scrolls`, `_termScrollEl`, `_revScrollEl`, `termScrollRef`, `revScrollRef`, `onTermScroll`, `onRevScroll`. Remove `enableAtomTranscript` flag and its callers.
- `reveal.ts` — remove the sticky-bottom autoscroll block at `reveal.ts:117-138`.
- The dc-runtime side of the reveal-shell's transcript is now ~500 lines lighter.

**Exit.** Flag removed; only the React path exists. Full pixel diff across all 12 baseline captures reports zero delta. Smoke green. Parity green. Full shakeout (28 flows × 5 = 140 driven turns) green. Bundle ≤ 60 KB gzipped. No Electron smoke: `electron/main.js:100-101` still loads `app/prototype-v7.html`; Phase 8 does not change what Electron renders. The Electron repoint sprint runs its own smoke after it lands.

## 8. Observation contract

Every sprint above runs, at merge time:

1. `npm run typecheck` — TypeScript strict, zero errors.
2. `npm run lint` — ESLint flat config, zero errors.
3. `npm run smoke:vm` — 11-step VM smoke against the SessionController.
4. `npx tsx web/vm/tools/check-vocabulary-parity.ts` — 30 tags declared, 30 emitted, zero drift.
5. `npm run pixel:diff` — zero delta against Sprint 070 baseline for every state relevant to the sprint.
6. `npm run shakeout` (Sprint 076 only) — 28 flows × 5 = 140 driven turns all pass.

Any red gate blocks the merge. No exceptions.

## 9. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Pixel diff fails on font rendering across CI vs local (subpixel AA differences) | Medium | Low | Baseline captured on the same OS/GPU stack the local dev machine uses; CI runs the same containerised Chromium build. Tolerance 0.1% pixel diff (pixelmatch default). |
| R2 | `useSyncExternalStore` incompatibility with the shell's setState pattern | Low | High | Pre-Sprint-072 spike: verify `useSyncExternalStore` reads correctly against a `Snapshot` that mutates by `patch()`. Fallback: manual `useEffect + useState` subscription. |
| R3 | React `createRoot` interferes with dc-runtime's ReactDOM.render root | Low | High | dc-runtime's root mounts at `#dc-root` (`support.js:196`); the transcript mount divs are descendants of that. React `createRoot` on a descendant creates a nested root; React 18 supports this[[18]](#r18). Verified in Sprint 071. Note: React 18 in dev mode logs a warning ("You are calling ReactDOM.createRoot() on a container that has already been passed to createRoot()") only if the *same* container is passed twice; separate descendant containers do not trigger it. If the warning appears, the mount seam ID is wrong. |
| R4 | Chromium's `overflow-anchor` fights the atom anchor even after our own scrollTop restore | Medium | Medium | `overflow-anchor: none` on the mount div at the start of Sprint 075. Documented in the `useScrollAnchor` module header. |
| R5 | Bundle size overshoots 60 KB gzipped | Low | Low | Measured at end of Sprint 074. If close: extract `web/reveal/transcript/*` into a lazy chunk via `React.lazy`[[19]](#r19); mount blocks briefly on first paint but keeps the header bundle small. |
| R6 | Model-reply markdown parser diverges from current behaviour on edge cases (fenced blocks with lang, nested lists) | Medium | Medium | Sprint 073 ships unit tests against fixtures from real captured sessions (`captures/shakeout-2026-09-23/`); tests are the regression witness. |
| R7 | The scroll anchor over-fires on rapid streaming (many `ToolProgress` chunks/sec) | Medium | Low | `useScrollAnchor.layoutEffect` throttles via `requestIdleCallback`[[20]](#r20) fallback to `requestAnimationFrame`. Documented rate cap in the hook header. |
| R8 | Real-world sessions have descent, fan-out, and interrupt flows the sprint plan does not exercise | High | Medium | Sprint 076's shakeout gate covers every existing flow. If a flow fails after 076, roll back to the feature-flag state (Sprint 071–075 already have the flag path, revert 076's guard removal). |
| R9 | The Architect discovers a visual delta post-close | Medium | High | The pixel gate is the primary guard. A missed delta is a Sprint-076-post regression; the sprint's rollback path is the feature-flag re-instatement. |

## 10. Non-goals

- **No redesign.** No new colours, spacing, animations, or affordances. If a redesign is desired, it is a separate epic that starts after Phase 8 closes.
- **No migration of dialogs, studio, records, descent, find bar, or prompt row.** Every surface not exhibiting the atom identity requirement stays on dc-runtime.
- **No new SDD tags.** The vocab lock 0.1 stays at 30 tags. A future observability sprint may add `TRANSCRIPT_ATOM_TOGGLED` and friends behind a version bump.
- **No changes to `electron/main.js`, `electron/preload.js`, `app/prototype-v7.html`, or the bridge protocol.** Electron currently loads `app/prototype-v7.html`, a separate shell that predates the reveal-shell extraction. Phase 8 does not repoint Electron at the reveal shell — that is a follow-up sprint. The Electron shell continues to render the prototype until that repoint lands.
- **No dc-runtime patch.** The plan is to hand off a subtree to React, not to alter dc-runtime itself.
- **No changes to `SessionController` public API.** The controller does not know a migration is happening.
- **No changes to the substrate side of the wire (`substrate/*`).** Signals, envelope shapes, and topology graph stay identical.

## 11. Appendices

### Appendix A — dc-runtime primitives inventory

For reference to §5.4 and §5.5. Sourced from `web/dist/support.js` at HEAD:

| Primitive | Purpose | Line(s) |
| --- | --- | --- |
| `walkElement` | Compile an HTMLElement into a `(vals, ctx, key) => ReactNode` renderer | 553 |
| `walkFor` | Compile `<sc-for>` into a keyed-by-index Fragment | 619, key at 636 |
| `walkIf` | Compile `<sc-if>` into a conditional Fragment | 646 |
| `walkComponent` | Compile `<dc-import>` for embedding external DC components | 667 |
| `walkXImport` | Compile `<x-import>` for React components from `window` scope | 683 |
| `DCLogic` (base class) | Provides `state`, `setState`, `forceUpdate`, `renderVals` | 828 |
| `DCHost.__setLogicState` | Merges patch into `logic.state`, bumps `__v` version, forces re-render | 1094 |
| `compileAttr` | Compile `"foo {{ bar }}"` into a `(vals) => string` | 587 |

None of these primitives expose stable-identity semantics. `walkFor`'s `key: i` is the immediate blocker.

### Appendix B — transcript row grammar

The current template dispatches on `row.role` and `row.kind`:

| `row.role` | `row.kind` | Rendered as |
| --- | --- | --- |
| `user` | `UserMessage` | `<span>` with `›` glyph, colour `#e2e5e9`, top margin 12px |
| `model` | `ModelReply` | `<span>` containing `blk.isP/isCode/isUl/isOl/isH` blocks |
| `tool` | `ToolCall` | Header span `▾/▸`, expandable body (args / streaming / output / error / footer) |
| `tool` | `ToolResult` | Filtered out (folded into ToolCall's card body) |
| `park` | `Park` | `◐` glyph, colour `#82a5c8` |
| `ended` | `SessionEnded` | `◇` glyph, colour `#62676f` |
| `warning` | `FinalAnswer` / `TurnError` | `!` glyph, colour `#c26058` |

Each `Row` sub-component in §5.3 maps one-to-one to a row of this table.

### Appendix C — bundle-size measurement command

```bash
cd substrate-ui
npm run build
du -sh web/dist/reveal.html web/dist/assets/reveal-*.js
gzip -c web/dist/reveal.html | wc -c
gzip -c web/dist/assets/reveal-*.js | wc -c
```

## 12. References

<a id="r1"></a>[1] Substrate-ui, `web/dist/support.js`, function `walkFor` at line 619. Emits `h(React.Fragment, { key }, list.map((item, i) => h(React.Fragment, { key: i }, ...)))`. The inner `key: i` is index-only.

<a id="r2"></a>[2] React 18 reconciliation: "prop equality is by reference." Documented in the React source tree at `packages/react-reconciler/src/ReactChildFiber.new.js`, and summarised at <https://react.dev/reference/react/memo#skipping-re-rendering-when-props-are-unchanged>. Two different function values, even with identical bodies, are not equal.

<a id="r3"></a>[3] React callback refs: "If you pass a different function ... React will call your old ref callback with `null`, then your new ref callback with the current DOM node." — React docs, <https://react.dev/reference/react-dom/components/common#ref-callback>.

<a id="r4"></a>[4] `Window.requestAnimationFrame`: fires the callback before the next repaint. MDN, <https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame>.

<a id="r5"></a>[5] React on index keys: "we don't recommend using indexes for keys if the order of items may change. This can negatively impact performance and may cause issues with component state." — React docs, <https://react.dev/learn/rendering-lists#why-does-react-need-keys>. For filtered lists, "the order of items may change" is exactly the failure mode.

<a id="r6"></a>[6] `React.memo`: "lets you skip re-rendering a component when its props are unchanged." — <https://react.dev/reference/react/memo>.

<a id="r7"></a>[7] `useLayoutEffect`: "fires synchronously after all DOM mutations." — <https://react.dev/reference/react/useLayoutEffect>. Guarantees the effect reads the post-commit DOM before the browser paints, unlike `useEffect`.

<a id="r8"></a>[8] CSS `overflow-anchor` property: "when the browser resizes elements above the viewport, it adjusts the scroll position to compensate." — CSS Scroll Anchoring Module Level 1, <https://drafts.csswg.org/css-scroll-anchoring/>, and MDN <https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-anchor>.

<a id="r9"></a>[9] Playwright screenshot compare: `expect(page).toHaveScreenshot()` with `maxDiffPixelRatio`. — <https://playwright.dev/docs/test-snapshots>.

<a id="r10"></a>[10] Substrate-ui, `web/vm/signals/versions/0.1.json`, `locked_at: "2026-09-22"`, `tag_count: 30`. Ratification documented in `process/BLACKBOARD.md` under `## Decisions`.

<a id="r11"></a>[11] `ReactDOM.createRoot`: React 18 root API. — <https://react.dev/reference/react-dom/client/createRoot>.

<a id="r12"></a>[12] `React.useState`: per-component local state. — <https://react.dev/reference/react/useState>.

<a id="r13"></a>[13] xterm.js, `Terminal.scrollLines(amount: number)`. Source: <https://github.com/xtermjs/xterm.js/blob/master/src/browser/Terminal.ts>, method on `Terminal`. Documented at <https://xtermjs.org/docs/api/terminal/classes/terminal/#scrolllines>.

<a id="r14"></a>[14] iTerm2 scrollback line model. Session log architecture described in `Documentation/design/scrollback.md` in the iTerm2 repo (<https://github.com/gnachman/iTerm2>). Anchor is a `(line-index, offset)` pair.

<a id="r15"></a>[15] `IntersectionObserver` API: "asynchronously observe changes in the intersection of a target element with an ancestor element or with a top-level document's viewport." — MDN, <https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API>.

<a id="r16"></a>[16] `useSyncExternalStore`: React 18 hook for reading from an external, mutable source without tearing under concurrent rendering. — <https://react.dev/reference/react/useSyncExternalStore>. Original RFC: <https://github.com/reactwg/react-18/discussions/86>.

<a id="r17"></a>[17] `pixelmatch`: image comparison library used by Playwright's screenshot tests. — <https://github.com/mapbox/pixelmatch>.

<a id="r18"></a>[18] React 18 nested roots: `createRoot` may be called on a DOM node inside another React tree; the two roots reconcile independently. Discussed in the React 18 upgrade guide, <https://react.dev/blog/2022/03/08/react-18-upgrade-guide#multiple-roots>.

<a id="r19"></a>[19] `React.lazy`: "lets you defer loading a component's code until it is rendered for the first time." — <https://react.dev/reference/react/lazy>.

<a id="r20"></a>[20] `Window.requestIdleCallback`: schedules work during idle periods. MDN, <https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback>. Falls back to `requestAnimationFrame` in Safari.

<a id="r21"></a>[21] Ink (React for CLI apps): Vadim Demedes. Uses React's reconciler with a custom renderer targeting the terminal. Source: <https://github.com/vadimdemedes/ink>. Demonstrates the atom-per-line pattern this plan adopts.

<a id="r22"></a>[22] Fowler, Martin. *Presentation Model*. <https://martinfowler.com/eaaDev/PresentationModel.html>. The base pattern the reveal shell's `SessionController` already implements; Phase 8 is the View-layer partner change.

<a id="r23"></a>[23] Ivanov, Petyo. *react-virtuoso*. Virtualised list with position anchoring. Source: <https://github.com/petyosi/react-virtuoso>. Not adopted here (the shell's row counts are small enough not to need virtualisation), but the anchor design draws from it.

<a id="r24"></a>[24] Vaughn, Brian. *react-window*. Fixed-size and variable-size virtualised lists. <https://github.com/bvaughn/react-window>. Same disclaimer as R23.

<a id="r25"></a>[25] "Reveal shell hardening" prior plan doc: `process/planning/PLAN-2026-09-23-reveal-shell-hardening.md`. Phase 7 in the reveal-shell timeline; Sprints 058 (extract inline script), 059 (enums), 060 (renames), 062 (lint) landed 2026-09-23; Sprint 061 (demo data excision) deferred.

<a id="r26"></a>[26] "Local optimum" audit: `process/planning/AUDIT-2026-09-23-dc-runtime-local-optimum.md`. Diagnosis referenced throughout §3.

<a id="r27"></a>[27] "Caret-in-place-toggle" post-mortem: `process/planning/POSTMORTEM-2026-09-23-caret-in-place-toggle.md`. Records the five failed attempts and their revert points.

<a id="r28"></a>[28] Substrate SDD kit v2: `../substrate/kits/sdd-kit-2/`. The observation contract discipline this plan preserves.

---

End of document.
