---
id: 201
status: closed
phase: shell-to-react A5
pass_kind: functional
---

# Sprint 201 — the store pattern

## scope

Author `web/app/store.ts`: `createStore<T extends object>(initial)` returns `{ getSnapshot, set, subscribe }`. `getSnapshot()` returns the current state object, the same object until a change. `set(patch)` takes a partial state or a function of the current state returning one; it makes a new state object and notifies listeners only when some field's value changed (`Object.is`). `subscribe(listener)` returns an unsubscribe function; listeners take no arguments, so the store is what React's `useSyncExternalStore(subscribe, getSnapshot)` expects. A spec, `web/app/__tests__/store.spec.ts`, checks each rule, and `test:unit` runs `web/app/__tests__/*.spec.ts` as well. No state moves in this sprint: the settings fields move in A5b (`web/app/state/settings.ts`).

## prerequisites

- 200 closed

## context_files

- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r4.md` (The design: one store pattern)
- `web/vm/session_controller.ts:268–274` (the controller's `snapshot`/`subscribe`)
- React 18 `useSyncExternalStore` contract (react.dev reference: `getSnapshot` must return the same value while the store is unchanged; `subscribe` returns an unsubscribe function)
- `package.json` (`test:unit`)

## signal contract

None. The store emits nothing; tags stay where `SessionController` emits them.

## artifact contract

- Created: `web/app/store.ts`, `web/app/__tests__/store.spec.ts`. Modified: `package.json` (`test:unit` glob).
- `store.ts` exports `createStore` and the types `Store<T>`, `Patch<T>`; imports nothing.
- `npm run test:unit` 0, the store spec's tests counted in the total; `npx tsc --noEmit -p .` 0; `npm run signals` 0 (now scans `web/app/`).

## observation contract

A library with no caller yet; its spec is the observation. One spec renders a component with `react-dom/server`'s `renderToString` and `useSyncExternalStore` over a store, to show the shape React expects.

## done criteria

A typed store any area can hold its state in, read by React without a dependency.

## result

Closed 2026-11-04. `web/app/store.ts` (`createStore`, `Store<T>`, `Patch<T>`, `Listener`; no imports) and `web/app/__tests__/store.spec.ts` (5 tests) written; `test:unit` runs `web/app/__tests__/*.spec.ts`. `npm run test:unit` 0, 67 of 67 (62 before, plus 5). `npx tsc --noEmit -p .` 0. `npm run signals` 0, 36 tags, now scanning `web/app/`. Planted defect (notify on every set): 2 of the 5 tests fail; restored, 5 of 5.

The React test first failed: `renderToString` requires `useSyncExternalStore`'s third argument, `getServerSnapshot` ("Missing getServerSnapshot, which is required for server-rendered content"). The window renders only in the client, so the store does not grow a server snapshot; the spec passes `getSnapshot` in that place.

The plan's A5 row also moves the settings fields; its design section puts them in `web/app/state/settings.ts`, a third and fourth file. They move in A5b (agent-resolved on the BLACKBOARD).

## Rubber Duck pass

No signals: the store emits none. Observations: none in the six categories. Disposition: none needed.
