---
id: 215
status: closed
phase: shell-to-react B1.3a
pass_kind: functional
---

# Sprint 215 — the boot script starts the mount registry

## scope

Plan round 5, row B1. Before the dialogs can replace their template block, the window needs something that mounts a React component into a div dc-runtime draws. `web/reveal.ts` creates the mount registry (`web/app/mount.ts`, sprint 206), registers one kind, `dialogs` (host `[data-app-mount="dialogs"]`, one root per window, rendering `Dialogs` with the 13px default size), and starts it. With no such host on the page yet, it mounts nothing. The transcript keeps its own mount code until its pane moves (group E).

Plan row B1 as written swaps in two files; the registry's start in the boot script is a third. Split as A7 was: this sprint, then the swap (216).

## context_files

`web/reveal.ts`, `web/app/mount.ts`, `web/app/Dialogs.tsx`.

## artifact contract

- Modified: `web/reveal.ts` (contains `createMountRegistry(document)` and `name: "dialogs"`).
- `npm run build` exits 0, run alone.

## signal contract

Emits: none.

## observation contract

Checked with sprint 216, whose host div is the first the registry finds: the dialogs, Escape and menu gates, and the pixel captures.

## result

Closed 2026-11-05. Build 0. The registry mounts the dialogs in sprint 216's run.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
