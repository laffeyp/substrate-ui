# Classic tree — retired 2026-09-22 (phase 6)

This is the source of the sprint-051-era substrate-ui shell — the
"classic" console that predated the presentation-model-extract
branch. It is preserved intact, not deleted. Nothing here is routed
by the running server. Nothing here is built by Vite. But every
file that lived at the top of the repo up to phase 6 is present
under this directory's mirror structure, ready to mine or bring
back.

## Why it's kept

- **Assay material.** The classic tree carried assay-related
  harnesses (`e2e_assay.js`, `capture_assay.js`, `open_assay.js`,
  the sprint-021 signal fixtures under `captures/`) that the reveal
  shell has not yet reabsorbed. When the assay work resumes, mine
  from here.
- **The 0.7.3 vocabulary.** `signals/versions/0.1.json` through
  `0.7.3.json` are the audit trail of how the classic shell evolved
  its signal vocabulary through Sprints 019-032 and 037c. Every
  tag retirement and rename lands there. The reveal shell's own
  `web/vm/signals/versions/0.1.json` starts a fresh series but
  cites patterns learned from this history.
- **Reference implementations of surfaces the reveal shell will
  eventually grow.** The Studio (`studio.ts` + `studio.html`), the
  desktop-view pickers (`web/controls/`), the console panes
  (`web/console/`), the rail (`rail.ts`), the terminal
  (`terminal.ts` + `web/terminal/`) are all working reference
  code. When the reveal shell needs an equivalent surface, look
  here first for what already worked and what did not.

## What's here

- `web/` — every `.ts` and `.html` that fed the classic Vite build.
  Top-level entries (`app.ts`, `rail.ts`, `studio.ts`,
  `terminal.ts`, `state.ts`, `observability.ts`, `view-ids.ts`,
  `index.html`, `studio.html`) plus the four sub-directories
  (`console/`, `controls/`, `terminal/`, `instrumentation/`,
  `lib/`).
- `signals/versions/` — the classic vocabulary lock series 0.1
  through 0.7.3, with rationale docs alongside each JSON. The
  `current.json` symlink is preserved as it stood at retirement.
- `tools/` — `check-vocabulary-parity.ts` (classic parity gate),
  `capture-grade.ts`, `sync-substrate-vocab.ts`.
- `harness/` — every `capture_*.js` / `capture_*.py`, every
  `e2e_*.js` / `e2e_*.py`, plus `open_assay.js`, `see.ts`, and
  the old two-shell `parity.ts`. `harness/lib/capture-tail.js`
  is a shared utility for the tail-based capture flows.

## What is NOT here

- `web/vm/` — the reveal shell's Presentation Model. Stays at the
  top of the repo.
- `web/reveal.html`, `web/reveal.ts` — the reveal shell entry.
  Stays.
- `harness/shakeout/`, `harness/vm_smoke.ts` — the reveal shell's
  test harnesses. Stay.
- The captures directory at the top of the repo. Its historical
  entries (screenshots, sprint-021 fixtures) are still there, and
  the shakeout reports the reveal shell writes land there too.

## How to bring the classic shell back

Nothing is stripped or gutted; the source compiles as it stood at
phase 6 close. To reactivate:

1. `git mv _deprecated/classic-tree/web/index.html web/index.html`
   (and similarly for the seven other top-level classic web files
   and the five sub-directories).
2. `git mv _deprecated/classic-tree/signals signals`,
   `git mv _deprecated/classic-tree/tools tools`.
3. `git mv _deprecated/classic-tree/harness/lib harness/lib` (and
   the classic harness scripts).
4. `vite.config.ts` — add `main`, `studio` back to
   `rollupOptions.input` alongside `reveal`.
5. `server.py` `_static` — restore the `/classic` route to
   `_static_root(WEB, "/index.html")`.
6. `package.json` — restore the classic scripts (`e2e`,
   `capture`, `signals`, and every other classic gate).
7. `npm run build` and reboot the server.

The classic shell then serves at `/classic` under the new setup,
or takes back `/` if the reveal shell's `_static` branch is
reverted.

## What the retirement solves

- **Two vocabularies, one repo.** The classic 0.7.3 lock and the
  reveal 0.1 lock coexisted in confusing proximity while both were
  live. Retirement moves the classic lock to
  `_deprecated/classic-tree/signals/`, so the reveal shell's own
  `web/vm/signals/` is the only current vocabulary at the top of
  the repo.
- **Parity gate scope.** The classic parity gate (formerly at
  `tools/check-vocabulary-parity.ts`, now
  `_deprecated/classic-tree/tools/check-vocabulary-parity.ts`)
  scanned all of `web/`. That would fire on the reveal shell's
  emit sites — but those emit through the reveal shell's own
  parity gate at `web/vm/tools/check-vocabulary-parity.ts`, which
  scans `web/vm/` and `web/reveal.ts` only. Retirement makes
  the surface each gate covers self-evident.
- **Vite build weight.** The classic build had three entries
  (main, studio, reveal). One entry (reveal) builds faster and
  leaves no ambiguity about which HTML is production.
- **Ambient legibility.** A fresh reader arriving at the top of
  the repo sees the reveal shell — `web/reveal.html`,
  `web/reveal.ts`, `web/vm/`, `harness/shakeout/`. The classic
  shell is one directory hop away, clearly labeled retired, still
  fully readable.

## Retirement provenance

- Phase 5 close: `web/vm/signals/versions/0.1.json` ratified
  2026-09-22 after the 28-flow × 5-run shakeout closed 129 tags
  at 5/5. Documented at the top of
  `substrate-ui-working/process/BLACKBOARD.md ## Decisions`.
- Phase 6 execution: this file, and the git moves that put every
  classic-tree source path under `_deprecated/classic-tree/`.
- The plan doc that framed both phases:
  `substrate-ui-working/process/planning/PLAN-2026-09-12-presentation-model-extract.md`.
