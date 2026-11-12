# Sprint 476 — the outline names C and C++ functions, structs and classes

```yaml
---
id: 476
status: closed
phase: code editor (roadmap r15), E15 item 2
pass_kind: functional
---
```

## scope

BLACKBOARD 2026-11-11 `surfaced`: OUTLINE lists `fn` with no name for `int main(void)` in main.c. `outlineOf` in `Centre.tsx` finds a function's name among its direct children, as the JavaScript and Python trees give it. The C and C++ tree (`@lezer/cpp`, which `@codemirror/language-data` loads for both languages) names a function inside its declarator: `FunctionDefinition › [PointerDeclarator ›] FunctionDeclarator › Identifier | FieldIdentifier | ScopedIdentifier`. It also has no outline entry for `StructSpecifier` or `ClassSpecifier`.

This sprint:

- Moves `outlineOf` into `web/app/derive/outline.ts`, a pure function a unit spec can call.
- Names a C or C++ function by its declarator's name (`main`, `make` for `int *make(int)`, `A::f`).
- Lists a struct or class that has a body, as `struct` or `class`, with the functions inside it one level deeper.

One verifiable property: for a C file, OUTLINE shows each function's and struct's name.

## prerequisites

- 472, 475.

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`
- `BLACKBOARD.md`: the `surfaced` entry of 2026-11-11 on the C outline
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r15.md` E15
- `web/app/editor/Centre.tsx` (`OUTLINE_NODES`, `NAME_NODES`, `outlineOf`), `web/app/editor/Inspector.tsx` (the OUTLINE rows, `data-outline-row`)
- `node_modules/@lezer/cpp` (the node names, printed for sample code: `FunctionDefinition`, `FunctionDeclarator`, `PointerDeclarator`, `Identifier`, `FieldIdentifier`, `ScopedIdentifier`, `StructSpecifier`, `ClassSpecifier`, `TypeIdentifier`, `FieldDeclarationList`)
- `harness/shakeout/editor_highlight_seen.ts` (opens main.c)

## signal contract

### Emits

No new tag. `outline_rows` on the existing inspector tag counts the rows, now including C's.

### Consumes

- The parser's syntax tree.

### Invariants

- The outline for TypeScript, JavaScript, Python, JSON, Markdown and CSS is unchanged.
- The vocabulary file is not modified.

## artifact contract

### Files created

- `web/app/derive/outline.ts`
- `web/app/__tests__/outline.spec.ts`

### Files modified

- `web/app/editor/Centre.tsx`: imports `outlineOf` from `derive/outline.ts`; its own copy and tables removed.
- `harness/shakeout/editor_highlight_seen.ts`: after main.c's colours, OUTLINE has a row named `main`.

### Content assertions

- `derive/outline.ts` exports `outlineOf(state: EditorState)`.
- `Centre.tsx` contains no `OUTLINE_NODES`.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `editor_highlight_seen.ts`, from source and on the bundle: the gate's repository holds main.c (`int main(void)`); once main.c is shown in its colours, the inspector's OUTLINE has a row `[data-outline-row="main"]` whose kind reads `fn`.

### Expected runtime signals

- The inspector's existing tag carries `outline_rows` 1 for main.c.

### Expected screenshot / visual state

- OUTLINE for main.c reads `fn  main`.

## done criteria

A C or C++ file's outline names its functions, structs and classes.

## notes

The outline's kinds are display text (`Inspector.tsx` draws `row.kind`); the vocabulary carries only `outline_rows`, so `struct` needs no vocabulary change. Python's tree also uses the node name `FunctionDefinition`. Its name is a direct `VariableName` child, so the direct-child lookup runs first and the declarator lookup only after it finds nothing.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (a C file's OUTLINE names its functions and structs).
- [x] context_files cover the outline's code, its rows, the C tree's node names and the gate.
- [x] No tag needed; `outline_rows` exists.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] ≤2 source files: `derive/outline.ts` (new) and `Centre.tsx`; plus a spec and a gate step.

## close

`outlineOf` lives in `web/app/derive/outline.ts`; `Centre.tsx` imports it and keeps no outline tables. A function whose name is not a direct child (C, C++) is named by its declarator, through pointer and reference declarators (`make` for `int *make(int)`, `ref` for `int &ref()`, `A::f`, `~A`); `StructSpecifier` and `ClassSpecifier` with a body are rows (`struct`, `class`), and a row's depth counts the classes and structs around it, in place of the old enter/leave counter.

Spec `outline.spec.ts`, 3 tests: C (`struct point`, `fn make`, `fn main`; `struct point p;` not listed), C++ (`class A`, its `m` and `~A` one deeper, `A::f`, `ref`), and Python, TypeScript and Markdown with the rows the old code gave. Found writing it: Python's rows end on the line after the body, because its body node takes the trailing newline; the old code read ends the same way, so the spec's first expectation was wrong, not the code. The spec imports `@codemirror/lang-cpp`, `-python`, `-javascript`, `-markdown` directly, because `LanguageDescription.load()` reaches the ES-module copy of `@codemirror/state` while the spec runs the CommonJS copy.

Mutant: the declarator lookup removed fails the C and C++ tests with rows `fn ` and no name, the symptom seen in sprint 475's screenshot.

Gate `editor_highlight_seen` from source and on the bundle (build 1794450418, packaged true): main.c's OUTLINE reads `["fn main"]`; the colours as in sprint 475. On the bundle also `editor_inspector` (TypeScript OUTLINE Cart, add, total, formatPrice, as before), `editor_centre`, `editor_view` 0.

Command exit codes: `npm run build` 0; `npm run test:unit` 0, 234/234.

Rubber Duck Pass. No tag added or changed; `editor_inspector`'s trace reads EDITOR_DRAWN `outline_rows` 4 for cart.ts, its four rows. No observations.

Installed: CFBundleVersion 1794450418.
