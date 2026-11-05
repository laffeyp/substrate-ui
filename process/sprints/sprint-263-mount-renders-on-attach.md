---
id: 263
status: closed
phase: shell-to-react C1 fix
pass_kind: functional
---

# Sprint 263 — the mount registry renders a root as it attaches

## scope

`createMountRegistry` renders a new root under `flushSync`, so an area is drawn in the same frame as its host; `root.render` alone runs on React's next task, leaving a frame with the host empty. The spec checks that the component is in the DOM right after `scan()`, outside `act`.

It was written to fix `transcript_follow`'s switch step and did not: the probe after it showed the same 40px. It stays for the frame it saves; sprint 264 is the fix.

## artifact contract

- Modified: `web/app/mount.ts` (contains `flushSync(() => root.render`), `web/app/__tests__/mount.spec.ts`. `npm run test:unit` 0.

## observation contract

The new test fails with `flushSync` removed and passes with it.

## result

Closed 2026-11-05. Spec 6/6; planted: 5/6.

## Rubber Duck pass

No signals.
