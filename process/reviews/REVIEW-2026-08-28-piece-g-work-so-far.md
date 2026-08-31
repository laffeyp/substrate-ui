# REVIEW — piece-G work so far (sprints 032a + 033)

**Reviewer:** Claude session 2026-08-28.
**Scope:** everything piece-G has landed as of review open — sprint 032a (v0.7 vocab lock) and sprint 033 (two-view scaffold). Every other piece-G card is `pending`. The v0.7 lock was reviewed separately in `REVIEW-2026-08-28-v0.7-lock-and-queue-state.md`; this review does not repeat those findings.
**Harness familiarization pass:** read `process/HARNESS-CATALOG.md` in full; read the new `harness/capture_view_toggle.js` in full; read the grader extensions in `tools/capture-grade.ts` around the `VIEW_TO_PANE_ID` and `VIEW_SCOPE_TO_PANE` additions; viewed both perceptual screenshots (`33-desktop-view-console.png` at 33 KB, `33-terminal-view-empty.png` at 25 KB — both well under Addendum A6's 2000 px viewability cap).

The review holds sprint 033 to three standards: SDD discipline (dual + observation contract, harness-is-code-too, halt-and-articulate), substrate standards (F-API-6 boundary, vocabulary-at-speaker's-mouth, canonical home), and the harness conventions the HARNESS-CATALOG itself codifies (eight adoption points).

Findings ranked most severe first.

---

## H1 — `capture_view_toggle.js` is not wired into the standing `npm run signals` gate.

`package.json`'s `signals` script chains `check:vocab-parity → capture:signals → grade:signals → capture:studio-signals → grade:studio-signals`. There is no `capture:view-toggle` step in the script list; grep returns zero matches for `view_toggle` or `view-toggle` in `package.json`. The new harness runs by hand only: `node harness/capture_view_toggle.js`.

Sprint 033 closed on the harness passing "at close of dispatch." That is one data point. Every future `npm run signals` run — the standing regression gate — will not exercise the two-view scaffold. A regression in `PANE_SWITCHED{to_pane, prior_pane}` shape, or in focus-restore behavior, or in `STATE.view` transitions, will pass the gate silently until someone remembers to invoke the harness manually.

This is the exact class of drift the harness catalog was instantiated to prevent. Addendum A5 (repo-scope the observation tooling) reads: "A required contract that can be skipped is not required."

**Fix.** Add two lines to `package.json` scripts:

```
"capture:view-toggle": "node harness/capture_view_toggle.js",
"signals": "npm run check:vocab-parity && npm run capture:signals && npm run grade:signals && npm run capture:studio-signals && npm run grade:studio-signals && npm run capture:view-toggle",
```

Update `HARNESS-CATALOG.md` to add a "wired into `npm run signals`" column and mark this row `yes`. Same edit closes the class for every future piece-G harness (035, 037a, 037b) — the catalog gains the column as its own audit surface.

## H2 — `PANE_SWITCHED.to_pane` closed set expressed in grader code, not the vocab lock.

`signals/versions/0.7.json` for `PANE_SWITCHED`:

```json
{
  "name": "PANE_SWITCHED",
  "category": "pane",
  "stratum": "event",
  "payload": ["to_pane", "prior_pane", "subject_record"],
  "optional_payload": [],
  "note": "User toggled between run, topology, scene, or io. Renamed from v0.1..."
}
```

Four values enumerated in the note. No `payload_types` declaration. `to_pane` is a bare string in the schema. Sprint 033 extends the effective value set to six (`run | topology | scene | io | terminal | desktop`) by editing `tools/capture-grade.ts`'s `VIEW_TO_PANE_ID` map and adding a `VIEW_SCOPE_TO_PANE` Set. The vocab file was untouched.

Under `grammar/PRINCIPLES.md` commitment 2 ("schema enforced at the speaker's mouth"), the closed set belongs in the lock. `sdd.ts::emit` currently accepts any string for `to_pane` and no validator catches a typo (`"terminall"` fires clean). The grader catches it downstream via the pane-render pairing check, but only for the four values the map declares — a typo maps to "no entry, fail." That is still validation, but at the grader, not the emitter.

Two ways to hold discipline:

- Declare `payload_types: { to_pane: "pane_id" }` on `PANE_SWITCHED` in v0.8; ship a `PANE_IDS` closed set alongside the existing `SUBSTRATE_KINDS` set; extend `sdd.ts::emit` to validate the field against the set at the speaker's mouth.
- Or: update the note to enumerate the six values (make the vocab lock's own text the source of truth for the enum) and add a `check:vocab-parity` extension that walks the note's enumeration and cross-checks it against `VIEW_TO_PANE_ID` in the grader.

The first is the disciplined move. The second is the honesty patch that costs less.

**Fix.** Ratify the six-value set in v0.7 (or v0.7.1) with a rationale-doc addendum naming the extension. Choose one enforcement path.

## H3 — Scroll-preservation contract asserted-and-not-verified.

Sprint 033's card says "scroll position + cursor selection preserved across flips." The harness at line 104-106:

```js
// Scroll restore is best-effort; the rail may re-render on focus. Assert non-regression only
// (the desktop view stayed visible, no scroll reset to 0 mid-flip).
if (typeof afterRestore.railScroll === "number") ok(`rail scroll after restore: ${afterRestore.railScroll} (before: ${beforeFlipOut.railScroll})`);
```

The assertion is `typeof x === "number"`. A future edit that resets scroll to 0 on every flip passes: 0 is a number. The `ok()` line prints both values but never compares them. KIT_DIARY finding 53 (piece-B closure review fold, 2026-08-26) named exactly this class: "a 'guard' that never fires is not a guard, it is documentation."

The comment reads "best-effort" — but the card's `definition of done` reads "scroll + cursor preserved." The card is stricter than the harness.

**Fix.** Either enforce (`afterRestore.railScroll === beforeFlipOut.railScroll`, or within a small tolerance if a re-render legitimately shifts by ±5 px), or amend the card to match the harness's actual bar. The former is the disciplined move — the two-view scaffold's whole point is that flipping is stateful.

## H4 — `VIEW_SCOPE_TO_PANE` exemption is too broad on the desktop side.

`tools/capture-grade.ts:382`:

```ts
const VIEW_SCOPE_TO_PANE = new Set(["terminal", "desktop"]);
```

Rationale in the adjacent comment: "the container flip is the observation; no separate paint is contracted." That rationale is correct for `terminal → desktop` flips against the empty terminal view (no downstream pane to paint). It is wrong on the round-trip: flipping *back* to desktop should re-mount whatever inner pane the user was viewing (`STATE.graphView` = run | topology | scene | io) and one of the four downstream `*_RENDERED` tags should fire.

Current grader skips the check for `to_pane === "desktop"` entirely. A flip to desktop that mounted no inner pane at all — a real regression where the desktop container renders empty — would pass the grader silently. The pairing invariant this exemption weakens is the one the substrate-ui BLACKBOARD's 2026-06-17 entry named as load-bearing: "graded file contents while the app produced silent audio" — DOM-mounted without paint.

**Fix.** Split the exemption:

```ts
// Terminal view has no downstream inner-pane paint (empty view until sprint 035).
// Desktop view mounts whatever pane STATE.graphView names; a flip to desktop is
// followed by exactly one of {GRAPH,TOPOLOGY,SCENE,IO}_RENDERED. Do not skip.
const VIEW_SCOPE_TO_PANE_EXEMPT = new Set(["terminal"]);
```

Then the grader's flip-to-desktop check walks the next pane-render and confirms it fires, without pinning which specific inner pane (any of the four is legal). This restores the pairing contract for the desktop half and keeps it honest for the terminal half. Revisit after sprint 035 lands `terminal.ts` — the exemption for `terminal` disappears once the terminal view has its own contracted paint.

## H5 — `pageerror` trap missing on the new harness.

`HARNESS-CATALOG.md` §"How to write a piece-G harness" point 3: "DOM error trap: `p.on('pageerror', (e) => errors.push(String(e.message)))` and assert `errors.length === 0` at the end." The new harness reads `window.__signals` and the DOM state via `page.evaluate`; it does not listen for uncaught page errors. A runtime error during flip that leaves the DOM in a state matching the 12 assertions passes silently.

**Fix.** Two-line trap at the top; `check(errors.length === 0, ...)` at the end. Same pattern the other four `e2e_*.js` harnesses already carry.

## H6 — Sprint 033 slug was reused after a same-day revert; the reverted card is not on disk.

The BLACKBOARD tail carries an entry (line 78 at review open) with ~~strikethrough~~ prefix: "2026-08-17 — Sprint 033 (language pass, UI-NEXT item 1) CLOSED. REVERTED same day; see entry above." Grep for `sprint-033-language*.md` under the substrate-ui tree (including `_deprecated/`) returns zero hits. The card that was authored, dispatched, and reverted lives only in the BLACKBOARD strikethrough entry.

`AGENTS.md` rule 12 (audit trail is the work): "restructures always land in new files / folders / round-N versions." A reverted sprint's card should stay on disk under its original name; the two-view-scaffold sprint should have taken 033a or 034 or a new slug. Reusing 033 for a distinct concept, then relying on a BLACKBOARD strikethrough to name the reuse, thins the audit trail.

Two ways to close:

- Author `sprint-033-language-pass.md` retroactively with `status: reverted-2026-08-17` frontmatter, its original scope, and a body pointer to the BLACKBOARD entry that reverted it. The two-view scaffold's card becomes `sprint-033-two-view-scaffold.md` (which is where it already is), and the two cards share slug prefix `033-` without ambiguity because the *file names* differ.
- Ratify the current shape explicitly: add a `## Decisions` entry naming that the substrate-ui project accepts BLACKBOARD strikethrough as sufficient audit-trail for same-day reverts, on the grounds that the sprint had zero on-disk footprint outside the card and the reverting entry names every affected surface. Rule-12 exception, ratified.

Either closes it. The current state is ambiguous.

## H7 — Substrate mirror stale; `SUBSTRATE_KINDS` closed set drifts against real substrate.

`signals/mirror/` contains `substrate-0.2.json` and `README.md` — no `substrate-0.3.json`. Substrate is on v0.3 since 2026-08-27 (piece-B `cancel_producer` primitive bump; two optional payload fields on `substrate.ProducerCancelled`). The mirror-drift block is named as sprint 033a (pending). Not a piece-G-code defect; a standing-gate defect the queue names correctly.

Consequence: `check:vocab-parity` validates emit sites against the v0.2 mirror. A hypothetical UI emit that carries `substrate_kind: "substrate.ProducerCancelled"` with `cause` in the payload would validate against the closed set (v0.2 knows the tag) but the two v0.3 optional fields would not be in the schema the mirror reflects. Every existing `substrate_kind` value happens to still validate (v0.2 is a strict subset of v0.3 tag names), so no live break — but the gate is one substrate-side v0.3-only kind away from a false-clean grade.

Not a new finding; a texture note on H4 of the v0.7 review, tracked through 033a.

## H8 — Positive: 6 of 8 catalog adoption points held cleanly.

Checking the new harness against `HARNESS-CATALOG.md` §"How to write a piece-G harness":

1. **Base URL** — `const BASE = process.env.UI_BASE || "http://127.0.0.1:8765"` ✓
2. **Launch shape** — `chromium.launch({ channel: "chrome", headless: true })` ✓
3. **DOM error trap** — missing (H5) ✗
4. **Fail collection** — `fails[]` + `ok`/`fail` helpers + `process.exit(1)` on `fails.length` ✓
5. **Signal-trace tail** — reads `window.__signals` in-place; does not use `maybeCaptureTail` to dump JSONL for later grader consumption. Partial. The pattern per the catalog is "call `maybeCaptureTail(page, name)` at end; runs iff `CAPTURE_SIGNALS=1`." This harness could ship free signal-trace on demand; it does not.
6. **Perceptual pair** — two screenshots viewed, both under 2000 px ✓
7. **Signal grader extension** — `VIEW_TO_PANE_ID` extended cleanly; `VIEW_SCOPE_TO_PANE` added (weakened per H4). Partial credit.
8. **`package.json` script** — missing (H1) ✗

Six clean, two partial, two missed. The two missed are H1 (script wiring) and H5 (pageerror trap), both one-line fixes.

## H9 — Positive: two-track observation contract genuinely held.

The 2026-06-17 BLACKBOARD entry ("PERCEPTUAL-TRACK DISCIPLINE FAILURE (Architect-caught)") named the anti-pattern: "graded file contents while the app produced silent audio." Sprint 033 does not repeat it. Structural track: 12 assertions in the harness against DOM state, `STATE.view`, `PANE_SWITCHED` shape. Perceptual track: two screenshots the agent (this reviewer) opened and read — the desktop screenshot shows the full console preserved under `#view-desktop` (rail + graph pane + event stream + inspector + seq cursor + transport + all header controls); the terminal screenshot shows the header state persists across the flip (`launch_agent_calc_535fd021c0a3` bold + `01M15J91WSEZ` id + FINALISED badge in the header) with the `the terminal view lands here in sprint 035` placeholder centered.

The screenshots' payloads confirm the card's own load-bearing claim ("the app state persists across the flip") in the pixels — the FINALISED verdict badge visible on both screenshots is the same live-selected record. That is the two-track discipline working as designed.

## H10 — Positive: F-API-6 boundary intact on the web/ side.

Grep for direct kernel imports in `web/**/*.ts` returns zero (the one hit was inside a built `web/dist/assets/main-*.js` bundle string, which is the bundled output containing the literal "substrate." prefix, not an import). The two-view scaffold does not reach into substrate; it edits `web/app.ts` and `web/index.html` locally, with `tools/capture-grade.ts` as the only cross-cutting change. `web/instrumentation/sdd.ts` imports from `../signals/versions/current.json` (UI's own lock) and `../signals/mirror/substrate-0.2.json` (the mirror). Both are local surfaces. Boundary held.

## H11 — Positive: halt-and-articulate on the harness lifecycle.

The card's `## halt conditions` names `bridge_mapping_required` for the Ctrl+\` rebinding case (if a shared code path forces a bigger refactor) and `dual_contract_fail` on scroll/cursor drift. Neither halted. The BLACKBOARD close entry names the specific choice made (Ctrl+\` was `termSetOpen()` → now `_toggleView("ctrl_backtick")`) with a one-release compat note (dock still opens via `#termOpen` until 037c). That is the discipline: the change is named at its exact call site, the compat window is named as a card in the queue, no silent removal.

## H12 — Positive: grader extension is localized and reversible.

The grader changes for sprint 033 are three surfaces: two new entries in `VIEW_TO_PANE_ID` (terminal, desktop), one new `VIEW_SCOPE_TO_PANE` Set with two members, and a comment explaining the exemption. Total delta: ~10 lines in one file. Reversible in one commit. Sprint 037c's cleanup pass has small work here.

---

## What is on track

- 032a (vocab lock) landed clean, per the separate v0.7 review.
- 033 landed clean per the observation contract: DOM state, `STATE.view` transitions, `PANE_SWITCHED` shape, focus-restore, two screenshots viewed.
- Two-track discipline held (H9): structural harness + perceptual screenshots.
- F-API-6 boundary held (H10).
- Halt-and-articulate discipline held (H11).
- Grader extension is minimal and reversible (H12).
- Six of eight catalog adoption points held (H8).

## What is off track

- **H1 (script wiring gap)** is the load-bearing finding. The harness exists but is not gated. Fix before the next piece-G sprint lands or the discipline erodes across a session.
- **H2 (closed set in grader, not lock)** is a discipline drift the vocab pass could have caught. Fix at the next vocab version.
- **H3 (scroll assertion vacuous)** is exactly the pattern KIT_DIARY 53 warns about. One-line assertion tightening.
- **H4 (desktop exemption too broad)** weakens the pane-render pairing on flip-back. One-line grader edit.
- **H5 (missing pageerror trap)** is a two-line adoption-point gap.
- **H6 (slug reuse without on-disk revert card)** is a rule-12 audit-trail thinness. Retro-author the reverted card or ratify the strikethrough-only pattern.
- **H7 (mirror stale)** is tracked by 033a, not a new finding.

Cost to close H1 through H6: under one hour of card-body-and-scripts edits. H2 alone is a v0.7.1 lock decision; the rest are card-scoped.

---

## Antipatterns

Named separately because the user asked for them explicitly. Some overlap the findings above; each carries the antipattern's class and the disciplined fix.

### AP1 — Sleep-based synchronization (`waitForTimeout(120)` × four).

`harness/capture_view_toggle.js` at lines 48, 71, 95, 97: four `await page.waitForTimeout(80 | 120)` calls after click/keyboard events. Addendum A4 names this exactly: "Fix at root, never with a sleep." The right shape is `await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 })` — condition-based, not time-based. A slow CI box exceeding the 120 ms sleep flakes the harness; a fast box wastes 120 ms per step.

Class: **race-hidden-with-sleep** (KIT_DIARY finding 63 also warned this class the piece-B side). Grep confirms every other harness in the repo has the same shape — `e2e_console.js` alone carries 46 `waitForTimeout` calls. This is a project-wide antipattern; sprint 033 reinforced it instead of breaking the pattern.

**Fix (repo-wide).** Replace every `waitForTimeout(N)` with `waitForFunction(cond, {timeout: max_ms})`. Start with the four in the new harness; open the wider fix as its own hygiene sprint after piece G.

### AP2 — DOM-index-keyed snapshot/restore.

`_snapshotView` at web/app.ts:1206-1212 walks `root.querySelectorAll("*")` and keys each scroll by `${tag}#${id||''}.${idx}` where `idx` is the position in the walk. `_restoreView` at 1233-1240 then does `nodes[idx]` and checks the tag name matches.

This binds to DOM insertion order. Every appended stream row, every rail refresh, every incoming `RECORD_STREAMED` envelope during the flip window shifts the indices; the tag-name check catches gross drift (SPAN vs DIV) but not fine drift (two SPANs swap positions). Substrate-ui's stream is live-follow: a `PRODUCER_STARTED` landing on the record between snapshot and restore is not a hypothetical.

Class: **fabricated stable identifier over unstable state**. The disciplined fix is to key only by stable identifier (`el.id`) and skip elements without one — the snapshot preserves what it can reliably preserve, and the alternative (fabricating an id per element) is worse than losing scroll on unstable rows.

**Fix.** Rewrite `_snapshotView` to walk only elements with a non-empty `id`; use `id` as the key. Drop the `idx` and the tag-check. Six lines.

### AP3 — Module-level mutable state (`_lastRealFocus`) driven by a global `focusin` listener, to defeat a focus-theft the same handler could avoid.

web/app.ts:1196-1205: `let _lastRealFocus: {...} | null = null;` mutated by a `document.addEventListener("focusin", ...)`. Every focus event in the entire application writes to this global. It exists to work around the fact that click on `#view-toggle` steals focus, so `document.activeElement` at handler-entry names the button, not the field the user was in.

The disciplined fix is at the event-lifecycle: `mousedown` fires **before** focus moves. Bind the toggle to `mousedown`, read `document.activeElement` at handler entry, drop the global listener and the module-level `let` in one edit. The current shape is a symptom-tracker instead of a root-fix.

Class: **background state grown to compensate for a foreground bug**. The comment at line 1192-1195 acknowledges the workaround ("clicking the toggle steals focus, so...") without recognizing the primitive that avoids it.

**Fix.** Rebind toggle from `click` to `mousedown`. Drop `_lastRealFocus`, drop the `focusin` listener, drop the tracked-vs-active fallback in `_snapshotView`. Net: −12 lines of module state + one global listener.

### AP4 — String-literal view ids scattered across three files; no shared const.

`"desktop"` and `"terminal"` appear in `web/app.ts` (4 STATE.view sites + a class name + emit payloads), `tools/capture-grade.ts` (`VIEW_TO_PANE_ID` + `VIEW_SCOPE_TO_PANE`), and `harness/capture_view_toggle.js` (assertion strings). No shared `VIEW_IDS = {DESKTOP:"desktop", TERMINAL:"terminal"} as const`.

Sprint 035 will add behavior gated on `STATE.view === "terminal"`. Every downstream sprint proliferates the literal further. Same class as the substrate SDD review F5 (session-vocab kind names as 28 raw literals across the session module).

**Fix.** Add `web/view-ids.ts` exporting `VIEW_IDS` and `type ViewId`. Grep-and-replace the current call sites (small — <10 sites). The grader can import `VIEW_IDS` from the web/ tree or duplicate the const — either way, the vocabulary lives at one seam. Compare to `web/instrumentation/vocabulary.ts` which already does this for signal tags.

### AP5 — One tag with two grading semantics (`PANE_SWITCHED`).

Extends H4. `PANE_SWITCHED` in v0.7 covers both inner-pane switches (four values, paint-pairing required) and view-scope container flips (two values, exempted from pairing). One tag, two contracts. `grammar/PRINCIPLES.md` commitment 1 ("the vocabulary is the contract, refactored like a public API") argues against overloading: one tag means one thing.

Class: **tag polymorphism**. The grader's `VIEW_SCOPE_TO_PANE` exemption is the visible signature of the overload — a Set that names which values of one tag are graded differently.

**Fix.** `TAG_SPLIT_PROPOSED` in v0.8: rename `PANE_SWITCHED` (inner-pane) unchanged; introduce `VIEW_SWITCHED{to_view, prior_view}` (view-scope). Each has one grading contract. The migration is small — the two view-scope call sites in app.ts, the grader's two Sets collapse to one, the harness updates its assertions.

### AP6 — `(window as any).STATE = STATE;` — observability seam without a named home.

web/app.ts:1276-1278 assigns `STATE`, `loadRecords`, `selectRecord` to `window` under `any`-cast. The pattern is deliberate — the harness reads `window.STATE` to inspect view transitions — but no module names this as an observability contract. Every future observer (a new harness, a bookmark, a browser console script) must know that STATE lives on window and that its shape may change.

Class: **implicit contract via global bag**. The disciplined fix is a `web/observability.ts` module that exports a typed `installObservabilitySurface(state, actions)` helper; app.ts calls it once; the harness's TypeScript declaration knows the shape. Not urgent — the current shape works — but the boundary is undocumented.

**Fix (opportunistic).** During Plan 1's substrate-ui refactor (from the substrate-side hygiene-splits plan), extract the observability seam into its own file.

### AP7 — Silent swallow in `catch (_)`.

web/app.ts:1246: `try { el.setSelectionRange(snap.focus.start, snap.focus.end); } catch (_) { /* non-text input */ }`. The comment names one legitimate cause; the catch swallows every other cause too — a detached element, a cross-origin iframe, a browser bug. Same class as the substrate code-quality review Q6 (twenty-seven `except: pass` sites).

**Fix.** Narrow to the expected exception: `catch (err) { if (!(err instanceof DOMException)) console.warn("focus-restore selectionRange failed:", err); }`. Two lines; preserves the intent, surfaces the unexpected.

### AP8 — Card enumeration ≠ implementation footprint.

The card's `## artifact contract → Files created/modified` lists `web/index.html`, `web/app.ts`, `tools/capture-grade.ts`, and the card itself. The `## scope` names "two view containers + header toggle" plus "scroll position + cursor selection preserved across flips."

The implementation adds: a `focusin` global listener (AP3), a module-level `_lastRealFocus` (AP3), a `_snapshotView`/`_restoreView` pair using DOM-index keying (AP2), an `on-terminal` CSS class toggled on the button (implicit UI state), and a `STATE.viewSnap: {desktop, terminal}` field. All defensible as one concept ("scaffold the two-view scaffold + its state preservation") but none named in the card body. A reader of the card cannot reconstruct the implementation footprint.

Class: **card underspecifies scope**. Not a defect at the concept level (rule 6 holds — one concept, two-view scaffold); a defect at the artifact-enumeration level (the internal helpers are load-bearing surface the card does not name).

**Fix.** Retro-edit the card's `## artifact contract` to enumerate the added helpers: `_snapshotView`, `_restoreView`, `_toggleView`, the `focusin` listener, `STATE.viewSnap`. Or (better) do the AP2/AP3 fixes first, then re-audit the card against the simpler implementation.

---

*REVIEW-2026-08-28-piece-g-work-so-far.md. Twenty findings total — twelve base + eight antipatterns. Twelve base: six off-track (all one-hour fixes or less), five positive checks, one texture note tracked elsewhere. Eight antipatterns: three major (sleep-sync AP1, DOM-index-keyed snapshot AP2, module-global focus tracker AP3), five minor. Sprint 033's actual behavior clean; the discipline around the harness plus the internal implementation shape is where the drift lives. Author: Claude session 2026-08-28.*
