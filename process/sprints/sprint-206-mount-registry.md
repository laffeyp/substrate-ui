---
id: 206
status: closed
phase: shell-to-react A6
pass_kind: functional
---

# Sprint 206 — the mount registry

## scope

`reveal.ts:192–240` attaches the React transcript to each `[data-vm-transcript-mount]` div that dc-runtime draws, and a `MutationObserver` re-attaches it after dc-runtime clears the div. When the div was cleared or replaced, it unmounts the old root and makes a new one, so the component's state is lost on every re-attach. `web/app/mount.ts` generalizes it for every area the move adds: `createMountRegistry()` takes kinds, each a selector, a key read from the host (a pane id), and a render function. A scan attaches one root per host; a host cleared or replaced keeps its root, whose element is put back into the host, so the component's state survives; a host gone from the page unmounts its root. `start()` scans on every DOM change; its return value stops it and unmounts every root. Mounted nowhere yet; `reveal.ts` keeps its own code until the transcript moves to the registry (A7 or the transcript's swap).

## prerequisites

- 204 closed

## context_files

- `web/reveal.ts:192–240`
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r5.md` (A6; "How each area moves", step 2)
- `process/planning/2026-11-04-editor-level/RESEARCH-2026-11-05-editor-view-r11.md` (shared item 0(b): a widget keeps its state through a re-attach)
- React 18 `createRoot` (react.dev reference); `react` 18.3.1 exports `act`

## signal contract

None. The registry emits nothing.

## artifact contract

- Created: `web/app/mount.ts`, `web/app/__tests__/mount.spec.ts`. Modified: `package.json` and `package-lock.json` (devDependencies `jsdom` 29.1.1, `@types/jsdom` 28.0.3); `WORKING_AGREEMENT.md`'s dependency line names `jsdom`.
- `npm run build` 0, run alone; `npm run test:unit` 0 with the mount spec's tests counted; `npm run signals` 0.

## observation contract

A library with no caller yet; its spec runs it in jsdom with React 18.3.1. The spec shows: a host gets its component; a host whose children are cleared gets the same root back with its state (a counter at 2 stays at 2, mounted once); a host replaced by a new element with the same key keeps its state; a removed host unmounts its component; `start()` re-attaches after a clear without a manual scan. A planted fault (a new root on every re-attach, as `reveal.ts` does) fails the state tests.

## done criteria

One registry that every moved area can mount through, which keeps a component's state when dc-runtime redraws around it.

## result

Closed 2026-11-05. `web/app/mount.ts` (`createMountRegistry`, `MountKind`, `Mounted`, `MountRegistry`) and `web/app/__tests__/mount.spec.ts` (5 tests) written; `jsdom` 29.1.1 and `@types/jsdom` 28.0.3 added as devDependencies and named in `WORKING_AGREEMENT.md`, whose frontend line now also says React loads from `./vendor/` (sprint 199), not the CDN. jsdom 30 was installed first and replaced: its Node range (`^22.22.2 || ^24.15.0 || >=26.0.0`) excludes this machine's Node 25.9; 29's (`^20.19.0 || ^22.13.0 || >=24.0.0`) covers it and CI's Node 22.

The first build failed on lint (`id-length`: `g` and `h` in the spec); renamed. `npm run build` 0, run alone. `npm run test:unit` 0, 72 of 72 (67 before, plus 5). `npm run signals` 0. The spec, in jsdom with React 18.3.1: a host gets its component; a cleared host gets the same root back with its state (n=2 stays n=2, mounted once, and a later click still reaches it); a host replaced by a new element keeps its state; a removed host unmounts its component and leaves the other; `start()` puts a cleared root back on its own and its stop unmounts. Planted fault (a new root on every re-attach, as `reveal.ts` does today): 3 of the 5 tests fail; restored, 5 of 5. The window does not use the registry yet, so no app gate or pixel capture changes.

## Rubber Duck pass

No signals: the registry emits none. Observations: one, a dependency whose newest release excludes the Node in use; resolved here by pinning 29.1.1. Disposition: resolved-here.
