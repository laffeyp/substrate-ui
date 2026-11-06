---
id: 347
status: closed
phase: editor shared work 0(b)
pass_kind: functional
---

# Sprint 347 — the widget registry

## scope

Plan `process/planning/2026-11-05-editor-shared-work/PLAN-2026-11-05-editor-shared-work.md`, item 0(b). `web/app/widgets.ts` keeps one widget per key for the window's life (an element and its destroy): `useWidget` attaches it to a React host while the host is mounted and detaches it, keeping it, when the host unmounts; `dropWidget` destroys it. Nothing in the window uses it yet, so nothing a user sees changes. New dependencies, pinned and MIT: `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.15, `@codemirror/commands` 6.11.1 (the research's CodeMirror-over-Monaco choice, round 8); `WORKING_AGREEMENT.md`'s frontend line names them, and no longer names the retired UMD loading.

## artifact contract

- Created: `web/app/widgets.ts`, `web/app/__tests__/widgets.spec.ts`. Modified: `package.json`, `package-lock.json`, `WORKING_AGREEMENT.md`. `npm run build` 0; `npm run test:unit` 0; lint 0.

## observation contract

The spec, in jsdom with React 18.3.1: a CodeMirror editor with two history events and its cursor at 4 keeps its document ("one two three"), its cursor and its undo depth (2) through its host's unmount and a new host's mount, is made once, and undoes. With the registry destroying the widget on unmount, the spec fails.

## result

Closed 2026-11-05. Unit 143. Planted (unmount destroys): exit 1, `assert.ok(widgets.hasWidget("file:a.txt"))` false. The spec's first draft asserted a depth of 2 for two dispatches made at once; CodeMirror merges edits within its group delay, so each dispatch now isolates its history event.

## Rubber Duck pass

No signals.
