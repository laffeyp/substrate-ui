# Sprint 076 — retire the dc-runtime transcript path

```yaml
---
id: 076
status: pending
phase: 8
pass_kind: architecture
---
```

## scope

Delete the dc-runtime transcript rendering path. Remove the feature flag; the React atom transcript becomes the only path. Take out the `sc-for pn.liveTranscript` blocks in `reveal.html`, the row-provider block in `reveal_component.ts`, the sticky-bottom autoscroll in `reveal.ts`, the pane's scroll refs (`termScrollRef` / `revScrollRef` / `_scrolls`), and the `enableAtomTranscript` flag. The reveal-shell transcript now runs entirely through the React atom tree from Sprints 071-075.

## prerequisites

- 075 (scroll anchor + caret-pin flow passing).

## context_files

- `sdd-kit-2/AGENTS.md`
- `process/planning/PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (§7 Sprint 076, §9 R8).
- `web/reveal.html` (transcript `sc-for` blocks; sc-if wrappers from Sprint 071).
- `web/reveal_component.ts` (row provider at `_liveBindingsFor` lines ~330-517; termScrollRef/revScrollRef around 1670-1729; `_scrolls` state).
- `web/reveal.ts` (subscribe callback lines 105-148, including sticky-bottom autoscroll block).
- `harness/shakeout/*` (every flow — the shakeout must stay green).

## signal contract

### Emits

None new.

### Consumes

- Every context file above.

### Invariants

- `signals/0.1.json` unmodified. Parity gate green (30/30).
- Every runtime signal that fired before Phase 8 opened still fires. Every emit call site is either untouched (controller side) or now in the React tree (transcript side).
- After merge, the code path for the transcript is one — the React tree. No sc-for over `pn.liveTranscript` remains.
- No changes to `signals/0.1.json`, `substrate/*`, `electron/*`, or `app/prototype-v7.html`.

## artifact contract

### Files created

None.

### Files modified

- `web/reveal.html` — delete the `<sc-if value="{{ !enableAtomTranscript }}">` wrappers introduced in 071 and the `<sc-for list="{{ pn.liveTranscript }}">` blocks they wrapped, from both the terminal-view scroller and the reveal-view scroller. Keep `<div id="vm-transcript-mount">` and `<div id="vm-transcript-mount-reveal">`.
- `web/reveal_component.ts` — delete the `_liveBindingsFor` row provider's `rows.map(...)` block that computed each transcript row's props (approx 190 lines). Delete `filteredRows`, `liveTranscript`, and `enableAtomTranscript` from the return object. Delete `_scrolls`, `_termScrollEl`, `_revScrollEl`, `termScrollRef`, `revScrollRef`, `onTermScroll`, `onRevScroll`.
- `web/reveal.ts` — delete the sticky-bottom autoscroll block at lines 117-138 (superseded by `useScrollAnchor`).
- `web/reveal.ts` — always mount the React roots; drop the `?atom-transcript=1` gate.
- `web/vm/tools/check-vocabulary-parity.ts` — still scans `web/reveal_component.ts`; no change (no signals moved).

### Content assertions

- `grep -c "pn.liveTranscript" web/reveal.html` returns 0.
- `grep -c "enableAtomTranscript" web/reveal.html web/reveal.ts web/reveal_component.ts` returns 0.
- `grep -c "termScrollRef\|revScrollRef\|_scrolls" web/reveal_component.ts` returns 0.
- `web/reveal.html` still contains `id="vm-transcript-mount"` and `id="vm-transcript-mount-reveal"`.
- Bundle size: `web/dist/reveal.html` at most 60 KB gzipped.

### Command exit codes

- `npm run typecheck` returns 0.
- `npm run lint` returns 0.
- `npm run build` returns 0.
- `npm run smoke:vm` returns 0.
- `npx tsx web/vm/tools/check-vocabulary-parity.ts` returns 0 (30 tags, 30 emitted).
- `npm run shakeout` returns 0 across all flows (28 existing + `caret_pin`).
- `npm run pixel:diff` returns 0 across all 12 baseline captures.

## observation contract

### UI driving steps

Same 12-state matrix Sprint 070 baselined:

- `empty`, `one_turn`, `multi_tool`, `mid_scroll`, `descended`, `error` × two viewports.

Plus the caret-pin flow from Sprint 075.

### Expected log substrings

- No warnings about missing keys.
- No `page error` lines during the pixel-diff or shakeout runs.
- The build reports one bundled `<script>` per entry, no duplicate transcript modules.

### Expected runtime signals

- Every tag in the lock (30) fires under the shakeout flows that exercise them. The parity gate verifies this end-to-end.

### Expected screenshot / visual state

- All 12 baseline captures diff clean.
- The caret-pin flow's 0-pixel drift assertion still holds under the flag-removed build.

## done criteria

The dc-runtime transcript is gone from the codebase. The React atom transcript is the only path. Every gate (typecheck, lint, smoke, parity, shakeout, pixel-diff) is green. Bundle ≤ 60 KB gzipped. Phase 8 closes here.

## notes

Rollback path (R8): `git revert` of this commit restores 071-075's feature-flagged parallel-path state. Both paths remain in git history for later reference; per hard rule 12 no source files get deleted outside of the commit boundary.

No Electron smoke in this sprint. `electron/main.js:100-101` still loads `app/prototype-v7.html`; repointing Electron at the reveal shell is a separate follow-up sprint outside Phase 8.
