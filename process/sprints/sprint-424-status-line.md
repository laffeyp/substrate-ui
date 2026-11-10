# Sprint 424 — the editor's status line

```yaml
---
id: 424
status: closed
phase: code editor, the rest (roadmap r8), E4
pass_kind: functional
---
```

## scope

`web/app/editor/StatusLine.tsx` (new) at the foot of the centre, as 24a's markup draws it: under vim the mode (`-- NORMAL --`, `-- INSERT --`, `-- VISUAL --`, `-- VISUAL LINE --`, `-- VISUAL BLOCK --`, `-- REPLACE --`, from the vim package's `vim-mode-change`), then `file · line:col`, then `+N −M vs <base>` for the buffer as typed (left out outside git), the binding at the right; under nano no mode field, and ⌃G shows nano's keys until the next action. `web/app/derive/status_line.ts` (new): the base's text is the file as read with its -U0 hunks undone, so no second read. The centre's added and removed marks and the count are recounted against the base after each change, before the next paint (`lineHunks`; sprint 425 moved this from a 150 ms pause), so the marks and the count come from one diff. The line diff keeps the shared head and tail without the table. Vocabulary v0.33: EDITOR_DRAWN gains `mode`, `read_only`, `unsaved`; `binding` is required on EDITOR_OPENED and EDITOR_DRAWN; the anchor's third row (magic 0xB6) carries mode, binding, read-only and the unsaved count. App renders with the editor's components (`flushSync`), so every drawn mode is recorded.

Files: `editor/StatusLine.tsx`, `derive/status_line.ts` and its spec, `derive/inspector.ts`, `derive/anchor.ts` and its spec, `editor/Centre.tsx`, `editor/bindings.ts`, `editor/EditorView.tsx`, `state/editor.ts`, `App.tsx`, the vocabulary (0.33, rationale, proposals, regenerated), `harness/shakeout/lib/editor_pixels.ts`; gate `harness/shakeout/editor_status.ts`; probe `harness/shakeout/probes/vim_mode_probe.ts`.

## context_files

- frame 24a and its status line in `Substrate Shell Directions v11.dc.html`; spec r6 §5 "Code"; D53; roadmap r8 E4; `node_modules/@replit/codemirror-vim/dist/index.js` (`vim-mode-change`, `getCM`); `server.py` `_workspace_hunks` (`base`)

## signal contract

Emits: EDITOR_DRAWN with `binding`, `mode`, `read_only`, `unsaved`; EDITOR_OPENED with `binding`.

## artifact contract

- The files above exist; `status_line.spec.ts` 2/2, `anchor.spec.ts` 5/5, unit specs 115+; `npm run signals` 0 at v0.33; `npm run build` 0.

## observation contract

`editor_status.ts`, from source and on the bundle, on a real repository with a branch: the status line on opening equals `git diff --no-index --numstat` of main's copy against the buffer; `gg4j3l` puts 5:4; `i`, typing, Enter: the count and the centre's marks equal git's for the buffer; `v`, `V`, Escape; nano: no mode, ⌃G's keys gone on the next key; the anchor's third row from a screenshot in insert mode names the EDITOR_DRAWN with mode insert, one unsaved buffer; EDITOR_DRAWN modes normal, insert, normal, visual in order. The status line read beside 24a.
