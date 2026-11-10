# Sprint 425 — saving from the editor

```yaml
---
id: 425
status: closed
phase: code editor, the rest (roadmap r8), E4
pass_kind: functional
---
```

## scope

The buffer saves on command only (BLACKBOARD 2026-11-09, the save policy): File ▸ Save ⌘S (new menu item; the menu owns ⌘S), vim `:w` (`Vim.defineEx("write", "w")`, one for the window), nano ⌃O. Each save is one `PUT /api/session/<id>/file` with the SHA-256 the buffer read and `view: "editor"`, so one FileWritten on the record; the file's own line end goes back on (a mixed file takes the one it uses more). A re-read that finds the file equal to the buffer keeps the editor state, so `u` works after a save. A file changed on disk behind the buffer is refused (409): the buffer is kept and a bar offers reload (drop the buffer, read the file) or overwrite (save without the hash). Refusals, written: ⌘S outside the editor (`not_editor`), ⌘S or ⌘W with no file open (`no_file`), ⌘S in an ended session or a view-only pane. The centre's marks and the status line's count follow each change before the next paint (a microtask), and nano's run of cuts ignores transactions that carry only effects. Vocabulary v0.34: EDITOR_SAVE_CONFLICTED, EDITOR_CONFLICT_RESOLVED (choice), EDITOR_KEY_REFUSED reasons `not_editor`, `no_file`, EDITOR_DRAWN `conflict`; the anchor's third row takes the conflict bit (magic 0xB7). EDITOR_FILE_SAVED gets its emit site. Tool parity (D92): a save is the hand's `write_file`, one FileWritten per save.

Files: `editor/Centre.tsx`, `editor/bindings.ts`, `editor/StatusLine.tsx`, `editor/EditorView.tsx`, `state/editor.ts`, `state/shell.ts`, `App.tsx`, `derive/anchor.ts` and its spec, `electron/menu.ts`, `electron/preload.ts`, `web/reveal.ts`, the vocabulary (0.34, rationale, proposals, unemitted, regenerated); gate `harness/shakeout/editor_save.ts`; `editor_status.ts` reads the count once with no wait.

## context_files

- roadmap r8 E4 and its key table; BLACKBOARD 2026-11-09 (the save policy; the undo boundary; EDITOR_FILE_SAVED.command); `server.py` PUT …/file (base_sha256 → 409), `_line_endings`; `node_modules/@replit/codemirror-vim` README (`defineEx`), `dist/index.d.ts` (`cm6`); `electron/menu.ts` key-ownership note

## signal contract

Emits: EDITOR_FILE_SAVED (command), EDITOR_SAVE_CONFLICTED, EDITOR_CONFLICT_RESOLVED (choice), EDITOR_KEY_REFUSED (not_editor, no_file, ended_session, view_only), EDITOR_DRAWN.conflict; on the server FILE_WRITTEN per save and API_REFUSED files 409 per stale save.

## artifact contract

- The files above exist; `npm run signals` 0 at v0.34 (129 live tags emitted, 7 pending); unit specs 115; build 0.

## observation contract

`editor_save.ts`, from source and on the bundle, on a real repository: `:w`, `u` after it, ⌘S, CRLF kept, a stale save then overwrite, a stale save then reload, nano ⌃O: five FileWritten on the kernel record, each equal to the file's bytes after its save; EDITOR_FILE_SAVED vim_w, menu_s, vim_w, vim_w, nano_save; two EDITOR_SAVE_CONFLICTED, resolved overwrite then reload; refusals Meta+s not_editor, Meta+w no_file, Meta+s ended_session; the anchor's third row from a screenshot during the offer reads conflict and names the EDITOR_DRAWN with conflict true; server FILE_WRITTEN 5, API_REFUSED files 409 twice.
