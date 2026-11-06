---
id: 334
status: closed
phase: shell-to-react, restoration
pass_kind: functional
---

# Sprint 334 — every removal and design choice of the move undone

## scope

The user's decision (BLACKBOARD, 2026-11-05): the move was a refactor and changes nothing; every removal is undone; the fixes stay, logged. Restored, each as the template and component drew and computed it:

1. Studio: the top bar's "studio" button, its page ("studio · author a topology", form and canvas, "coming soon…", the body dimmed and inert), its sample topology and canvas drag, `SessionController.validateSpec` and `buildSpec` with their registry proxies, `Surface.Studio`, the "› studio" crumb. `web/app/StudioPage.tsx`, `web/app/state/studio.ts`. The five `SPEC_*` tags are live again in vocabulary 0.5.
2. The export dialog (19f), drawn as before; nothing opens it, as before (`web/app/Dialogs.tsx`, `state/dialogs.ts`).
3. The design tool's tweak props (transcriptFontSize, columns, rows, view, firstRun, simulateRateLimit) with their defaults and effects, the template's prop sync, and the "◌ rate-limited · retry 3/6 in 14s" footer status (`App.tsx`, `state/chrome.ts`, `derive/footer.ts`, `Footer.tsx`, `state/first_run.ts`, `FirstRun.tsx`).
4. The assay page: the template's empty-state note and its tier table over the template's empty arm list (`web/app/AssayPage.tsx`); the agent's page, its store, derive module, spec and gate are in `_deprecated/assay-page-b5/`. ⌘3 and View ▸ Assays still open it (a logged fix).
5. First run: "s-1a04" in its top bar and "~/Documents/substrate · default · created on bind" as its workspace (`FirstRun.tsx`).
6. The workspace card's branch line (`substrate/<name>` for a git folder, else the folder) and its raw shape, and the top bar's `⌥ substrate/<name>` for a git folder (`derive/workspace_card.ts`, `TopBar.tsx`, `state/top_bar.ts`, `App.tsx`).
7. The scene lens's grid search as it was: the first row's first value checked, an oversized grid ending the search with no grid, and its empty line (`derive/scene.ts`, `SceneLens.tsx`).
8. The records page's times as computed before (the floored clock less the fractional start: "11.75s ago") and its 500 ms redraw (`derive/records.ts`, `RecordsPage.tsx`).

Specs and gates that asserted a removal now assert the restored behaviour: `workspace_card.spec.ts`, `records.spec.ts`, `io_scene.spec.ts`, `harness/shakeout/workspace_card.ts`, `first_run_footer.ts`, `assay_page.ts`. New gate `harness/shakeout/studio_page.ts` (59 in `gates:electron`).

## artifact contract

- `npm run build` 0; `npm run test:unit` 0; `npm run signals` 0 (vocabulary 0.5: 38 tags, 38 live, all emitted); `npx eslint web/` 0; `tsc -p harness` 0.

## observation contract

`workspace_card`, `first_run_footer`, `assay_page`, `studio_page` exit 0. Pixels against `baseline-2026-11-04`, the captures from before the move: every difference is a logged fix.

## result

Closed 2026-11-05. All four gates 0. Pixels: 20 of 28 equal to `baseline-2026-11-04`. The eight that differ: end-dialog ×2 (the dialog names the session, not "fix-race-in-metering": logged fix), meta-inspector ×2 (the payload as recorded: logged fix), panes-picker ×2 and panes-two ×2 (the footer no longer says "● live" with no session: logged fix). Over the two-file rule by far (drift): one restoration across the files each removal touched.

## Rubber Duck pass

`SPEC_VALIDATE_REQUESTED`, `SPEC_VALIDATED`, `SPEC_BUILD_REQUESTED`, `SPEC_BUILD_REJECTED`, `SPEC_BUILT` are declared live and emitted by the restored controller methods; Studio's inert body means the window does not reach them, as before sprint 242.
