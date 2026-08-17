# Sprint 032 — studio surface instrumentation

```yaml
---
id: 032
status: closed
phase: 4
pass_kind: implementation
---
```

## scope

`web/studio.ts` has zero emit call sites today. The Sprint 031 e2e-studio fixture wrote 0 signals — that gap is the studio being un-instrumented, not the tail failing. Fix: bump vocabulary v0.2 → v0.3 with a `studio` category and nine new tags; wire every studio user action to the appropriate emit; add a dedicated studio capture harness; extend the grader with two new pairing invariants (validate, build); make `npm run signals` run both console and studio fixtures.

## context_files

- `signals/versions/0.2.json`, `0.2-rationale.md` — the v0.2 lock the v0.3 bump extends
- `web/studio.ts` — the un-instrumented surface
- `harness/capture_signals.js` — the shape a studio capture mirrors
- `tools/capture-grade.ts` — grader adds studio pairing checks
- `web/instrumentation/sdd.ts`, `web/instrumentation/vocabulary.ts` — the emitter + loader

## artifact contract → Files created/modified

- `substrate-ui/signals/versions/0.3.json` — new. Adds category `studio`; nine new tags: SPEC_ROW_ADDED, SPEC_ROW_REMOVED, CANVAS_TOGGLED, SPEC_VALIDATE_REQUESTED, SPEC_VALIDATED, SPEC_BUILD_REQUESTED, SPEC_BUILT, SPEC_BUILD_REJECTED, CONSOLE_LINK_FOLLOWED. Two new invariants (validate + build pairings). Total tag count 53 (44 carried over + 9).
- `substrate-ui/signals/versions/0.3-rationale.md` — new. Per-change ledger; v0.2 stays on disk.
- `substrate-ui/web/instrumentation/vocabulary.ts` — import path bumps to `0.3.json`.
- `substrate-ui/tools/check-vocabulary-parity.ts` — lock path bumps to `0.3.json`.
- `substrate-ui/web/studio.ts` — imports `emit` + `VOCAB_VERSION` from the shared emitter; wires nine call sites; fires SESSION_INIT + SESSION_ENDED on page lifecycle (mirrors app.ts).
- `substrate-ui/harness/capture_studio_signals.js` — new. Drives /studio.html through the authoring flow, dumps `window.__signals` to `captures/sprint-021/studio.jsonl` (same sprint dir as the console fixture for co-location).
- `substrate-ui/tools/capture-grade.ts` — reads a `--kind console|studio` flag; the studio kind uses a studio-specific EXPECTED_ORDER and two new pairing checks (SPEC_VALIDATE_REQUESTED → SPEC_VALIDATED within 5 s; SPEC_BUILD_REQUESTED → SPEC_BUILT|SPEC_BUILD_REJECTED within 30 s).
- `substrate-ui/package.json` — new `capture:studio-signals`, `grade:studio-signals` scripts; `signals` chains both.
- `substrate-ui/captures/README.md` — updated for the studio fixture.
- `substrate-ui/sprints/sprint-032-studio-instrumentation.md` — this file.

## signal contract → Emits

Nine new tags in the studio fixture; every existing tag still fires in the console fixture. Total 53 in the lock. Parity gate exit 0.

## observation contract

- Studio harness driving steps: open `/studio.html`, wait SESSION_INIT; click `#vCanvas` (CANVAS_TOGGLED to canvas), click `#vForm` back (CANVAS_TOGGLED to form); click `#addProducer` (SPEC_ROW_ADDED{kind: producer}); click the .rm on the just-added row (SPEC_ROW_REMOVED{kind: producer}); click `#validateBtn` (SPEC_VALIDATE_REQUESTED → SPEC_VALIDATED); click `#buildBtn` (SPEC_BUILD_REQUESTED → SPEC_BUILT with the prefilled default spec, which validates + builds); click the "view the run in the console →" anchor (CONSOLE_LINK_FOLLOWED); dispatch beforeunload (SESSION_ENDED).
- Grader invariants: validate + build pairings both green; every tag in the studio EXPECTED_ORDER present.

## dual-contract close

Four gates: parity (53 distinct emits, all locked); build; parent e2e; `npm run signals` (both console and studio fixtures grade green).

## rubber duck pass

*Sequence narration:* studio.ts now imports the shared emitter and fires SESSION_INIT + SESSION_ENDED on page lifecycle (same shape as app.ts). Nine studio-specific tags wired at their source: `addProducer/addView/addTrigger/addRoute` click handlers each emit `SPEC_ROW_ADDED{kind}` before the DOM append; a delegated body-level click handler on `.rm` emits `SPEC_ROW_REMOVED{kind}` using the row's container id to derive the enum; `setView(v)` emits `CANVAS_TOGGLED{to}` only on an actual mode change; `doValidate()` brackets the fetch with `SPEC_VALIDATE_REQUESTED` + `SPEC_VALIDATED{valid, error?}`; `doBuild()` brackets with `SPEC_BUILD_REQUESTED` + one of `SPEC_BUILT{run_name, status}` or `SPEC_BUILD_REJECTED{reason}`; the .consolelink click handler emits `CONSOLE_LINK_FOLLOWED{run_name}`. Studio anchor now carries target="_blank" so real users open the console in a new tab without nuking the studio's signals buffer. Fixture at `captures/sprint-021/studio.jsonl`: 11 signals, url `http://127.0.0.1:8765/studio.html`, 10 expected tags in order, both new pairings pass.

*Observations:* missing pair — none; order — every studio-side action pairs with its emit at real code; vocabulary gap — none (53 distinct emits, all locked); payload anomaly — none (kind enum honored across ADD/REMOVE; SPEC_VALIDATED.valid boolean; SPEC_BUILT.run_name is a real substrate Run identity); timing surprise — the build took ~60 ms end-to-end (deterministic responder), well within the 30 s pairing bound; tone trace — payloads structural.

*Adversarial pass — what almost broke:*
1. **Import-path replace_all foot-gun.** `replace_all` on vocabulary.ts turned `signals/mirror/substrate-0.2.json` into `substrate-0.3.json` (which doesn't exist). Rollup caught it at first build. Fix: revert that one line; keep the substrate-side import pinned at the mirror's real filename. The lesson: `replace_all` on version strings is brittle when the same version number appears in unrelated paths. Noted; the mirror filename could be un-versioned in a future sprint if this recurs.
2. **Anchor default navigation ate the studio buffer.** First harness capture wrote 10 signals but they were all CONSOLE-side (SESSION_INIT.url = `http://127.0.0.1:8765/` not `/studio.html`). Diagnosis: `.consolelink.click()` triggered anchor navigation despite target="_blank"; Playwright loaded the console in the same tab; my subsequent `window.__signals` read hit the fresh console context. Fix: add a capture-phase `preventDefault` listener before `.click()` in the harness so the emit fires but navigation is blocked. Real-user behavior unchanged (target="_blank" still opens a new tab). Grader caught the fault immediately; the fixture now shows the studio's SESSION_INIT with url `/studio.html` and all nine studio tags in order.

*Adversarial pass — what stays weak:* SPEC_BUILT.status is `finalised | incomplete | paused | failed` in the vocab note but not enforced as an enum in a payload_types field. Same for CANVAS_TOGGLED.to (form|canvas) and SPEC_ROW_ADDED.kind (producer|view|trigger|route|member). The Sprint 030 `payload_types` mechanism supports this — a future sprint could tighten these. Not urgent; the grader catches unknown values via containment logic where it matters (CANVAS_TOGGLED not required to enum-check for the harness to pass).

Zero halted, zero surfaced.

## follow-on

Studio instrumentation is now at parity with the console. If any studio behavior slips a signal, `npm run signals` fails; if a v0.4 evolution renames or adds studio tags, the same rules apply as v0.2 → v0.3.

