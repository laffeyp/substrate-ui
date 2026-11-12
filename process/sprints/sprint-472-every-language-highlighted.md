# Sprint 472 — every common language and format is highlighted

```yaml
---
id: 472
status: closed
phase: code editor (roadmap r13), E15
pass_kind: functional
---
```

## scope

Roadmap r13 E15 (the Architect, 2026-11-11: syntax highlighting for "everything from JSON to Rust"). The centre picks a language from seven families by extension (`language()` in `Centre.tsx`); Rust, Go, C, YAML, TOML, SQL and the rest draw as plain text. This sprint picks a file's language with `LanguageDescription.matchFilename` over `@codemirror/language-data`'s 143 descriptions, by extension or by whole name (`Dockerfile`), and loads it the first time a file of it opens (its `load()`, a chunk of its own in the build); until it loads, and for a file no description matches, the file is plain text. The language goes into a compartment, so a file shown before its language loads takes it when it arrives, with the caret and history kept. The colours stay the editor's own `HighlightStyle` (comments dim and italic, strings grey), which both the parsers and the stream modes feed. INFO's `type` and the status line name the language. A file that is not text gets none.

## prerequisites

- 465 (the code's buffer for every file).

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md` (dependency policy)
- `BLACKBOARD.md`: the `user` entry of 2026-11-11 on highlighting; the `agent-resolved` entry choosing `@codemirror/language-data`
- `ROADMAP-2026-11-09-code-editor-r13.md` E15; `RESEARCH-2026-11-11-binary-files-and-highlighting.md` (how every common language is highlighted)
- `web/app/editor/Centre.tsx` (`language`, `HIGHLIGHT`, the state's extensions, `CONF`); `web/app/editor/StatusLine.tsx`; `web/app/editor/Inspector.tsx` and `web/app/derive/inspector.ts` (`fileType`); `web/app/state/editor.ts`
- `node_modules/@codemirror/language/dist/index.d.ts` (`LanguageDescription`, `matchFilename`, `load`, `support`)

## signal contract

### Emits

No new tag. The language is the file's, not an event; INFO and the status line show it.

### Consumes

- The file's name.

### Invariants

- A file with no matching description opens as before, as plain text.
- No path or text in any payload (E1).

## artifact contract

### Files created

- `harness/shakeout/editor_highlight.ts`

### Files modified

- `web/app/editor/Centre.tsx`, `web/app/editor/StatusLine.tsx`, `web/app/derive/inspector.ts` and `web/app/__tests__/inspector.spec.ts`, `web/app/editor/Inspector.tsx`, `web/app/state/editor.ts`; `package.json`, `package-lock.json`; `WORKING_AGREEMENT.md` (the dependency)
- `harness/shakeout/editor_inspector.ts`: INFO's `type` reads `TypeScript`, not `TypeScript (by extension)`

### Content assertions

- `package.json` pins `@codemirror/language-data` 6.5.2.
- `Centre.tsx` has no `language()` switch; it calls `LanguageDescription.matchFilename` and reconfigures a language compartment when `load()` resolves.

### Command exit codes

- `npm run build` returns 0 (each language a chunk of its own)
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `editor_highlight.ts`, from source and on the bundle. A repository written by the gate holds main.rs, main.go, config.yaml, Cargo.toml, query.sql, Dockerfile, App.kt and notes.zz, each but the last with a comment and a string. The deterministic driver; in the editor, for each:

1. Open it: once its language loads, the comment draws dim and italic and the string grey; INFO's `type` and the status line name the language: Rust, Go, YAML, TOML, SQL, Dockerfile, Kotlin.
2. notes.zz: plain text, no italic span, `type` `.zz file`.

### Expected runtime signals

- window-1.jsonl: EDITOR_FILE_OPENED per file, as before.

### Expected screenshot / visual state

- main.rs and query.sql highlighted.

## done criteria

A file in any common language or format opens highlighted, its language named.

## notes

Kotlin, TOML and Dockerfile come through `@codemirror/legacy-modes` stream modes, already installed; Rust, Go, YAML and SQL through full parsers that `@codemirror/language-data` brings as its own dependencies.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (a file's language is picked by its name, loaded, highlighted and named).
- [x] context_files cover the centre, the status line, INFO, the store, the library's types, the research.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [ ] ≤2 files: no. The centre picks and loads; the status line and INFO name it through the store; logged as a bypass.

## close

`Centre.tsx`: `languageOf(path)` (`LanguageDescription.matchFilename` over `@codemirror/language-data`'s 143 descriptions, by the file's name) in place of the seven-way `language()` switch; the language in `CONF.language`, a compartment, reconfigured when `load()` resolves into the buffer still shown, and for a kept buffer; the outline taken again once the parser arrives; none for a file that is not text. The store's `language` names it; the status line shows it before the binding; INFO's `type` is it, or `.ext file`, or `plain text`. The build splits the languages into chunks of their own (120 files in `web/dist/assets`, among them `toml-*.js`, `sql-*.js`, `dockerfile-*.js`, `clike-*.js`).

Gate `editor_highlight` from source and on the bundle (build 1794444400, packaged true): main.rs Rust, main.go Go, config.yaml YAML, Cargo.toml TOML, query.sql SQL, Dockerfile Dockerfile, App.kt Kotlin, each comment dim (`rgb(98, 103, 111)`) and italic, each string grey (`rgb(154, 160, 168)`), the name in INFO and the status line; notes.zz plain, `.zz file`, no language shown. A mutant that finds no language for any file fails it (main.rs never highlighted). Screenshots read: main.rs's comment italic and dim, its string grey, `Rust` in the status line and INFO.

`editor_inspector` failed once from source after its `type` expectation was updated: the live model `kimi-k2.7-code:cloud` called `read_file` on `src/cart.ts` and ended its turn with "Done." (stop reason `end_turn`, 189 completion tokens) without the `edit_file` the gate asks for, so the session made no edit. The cause is the model's answer on that run, not the window; the gate passed on the next run from source and on the bundle, with OUTLINE `Cart, add, total, formatPrice` from the TypeScript parser loaded on first use.

Command exit codes: unit specs 231/231 (`fileType` with a language, an extension, neither); build 0. Gates on the bundle: `editor_highlight`, `editor_centre`, `editor_inspector`, `editor_status`, `editor_find` 0; from source also `editor_history`, `editor_edit_any_file`, `editor_type_digits` 0.

Rubber Duck Pass. No tag was added or changed; the window's trace holds EDITOR_FILE_OPENED per file as before. Observations: none.
