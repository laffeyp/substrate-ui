# Sprint 422 — the editor's inspector, on real data

```yaml
---
id: 422
status: closed
phase: code editor, the rest (roadmap r8), E6
pass_kind: functional
---
```

## scope

`web/app/editor/Inspector.tsx` (new) fills the right column under `INSPECTOR <file>`, as frame 24a's markup in the sheet of record draws it: OUTLINE (the centre's syntax tree; the symbol around the caret lit, with its line) and CHANGES IN THIS FILE (one card per hunk vs main: `@@ a–b`, `+n −m`, its author `by the session · turn N · seq N <tool>`, `by hand` or `unattributed`) under plain headers; ACTIVITY, HISTORY and INFO ruled, drawn open, folding on ▾/▸ (D85). Held back, by the order of 2026-11-09: FIND / REPLACE and HISTORY's ⌘Z footer with E4, ACTIVITY's ◂ and the ⌃⇧` record chip with E5.

Vocabulary v0.32 (P-0.32-EDITOR-DRAWN-INSPECTOR): EDITOR_DRAWN carries `outline_rows`, `hunks`, `activity_rows`, `history_rows`; the pixel anchor gains a second row (magic 0xB5; seq, tab_count and the four counts; CRC-8) painted above the first; EDITOR_HUNK_DRAWN gets its emit site and leaves `unemitted.json`.

Corrections to sprint 421, found against the kernel's tools: read_file's result is a numbered window (`<n>\t<line>`, a `… N more line(s)` marker when cut), so only a whole read is the file's text (`readResult`); a hunk's author is carried line by line, and gap by gap for removals, forward through every edit the record holds, so a later edit that inserts lines above a hunk no longer moves it off its author. The centre writes its caret line; a write landing on the record reads the file again and the caret keeps its line (it had gone back to line 1).

Files: `editor/Inspector.tsx`, `derive/inspector.ts` and its spec, `derive/anchor.ts` and its spec, `editor/EditorView.tsx`, `editor/Centre.tsx`, `state/editor.ts`, `App.tsx`, `web/vm/signals/unemitted.json`, `harness/shakeout/lib/editor_pixels.ts`; gate `harness/shakeout/editor_inspector.ts`.

## context_files

- frame 24a and its markup in `design/received/handoff 5/sheets/Substrate Shell Directions v11.dc.html`; spec r6 §5 "Code", §5.0; D6, D54, D81, D82, D85 (`DESIGN-DECISIONS -through 2026-11-04-.md`); roadmap r8 E6; TECHNIQUES §2 and Addendum A2/B1 (the anchor); `../substrate/src/substrate/topologies/tool_loop/tools.py`

## signal contract

Emits: EDITOR_DRAWN (with the four counts), EDITOR_HUNK_DRAWN (author, line_count) per drawn hunk; DIFF_READ with hunks (server, sprint 418) and FILE_READ on each read.

## artifact contract

- The files above exist; `npm run signals` 0 (126 live tags emitted, 8 pending); `npx tsx --test web/app/__tests__/*.spec.ts` 0; `npm run build` 0.

## observation contract

`harness/shakeout/editor_inspector.ts`, from source and on the bundle: a real repository (main; branch `fix` changes TAX_RATE); the live roster's default model asked to read src/cart.ts and edit one line; a save by hand inserting two lines at the top; a second save of the same text. The DOM, the anchor's two rows decoded from a screenshot, EDITOR_DRAWN at the seq they name, the last EDITOR_HUNK_DRAWN per hunk and DIFF_READ agree with `git diff -U0` against main's merge-base, the kernel record's events on disk and the file on disk; `total` lit with its line after a click in its body and after the second save; ACTIVITY folds and opens. The column's screenshot is read beside 24a.
