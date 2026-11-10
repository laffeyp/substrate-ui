# Sprint 429 — HISTORY's step back and forward

```yaml
---
id: 429
status: closed
phase: code editor, the rest (roadmap r10), E6
pass_kind: functional
---
```

## scope

The undo boundary's second half (BLACKBOARD 2026-11-09): with the buffer clean, Edit ▸ Undo (⌘Z) steps HISTORY back and Redo (⇧⌘Z) forward. HISTORY lights the row the file's text is (the newest whose text after it equals the file; "opened" at the session's opening text; none for a text off the record). A step back writes the lit row's earlier text, a step forward the newer row's text, into the buffer outside its own undo history, then saves it with view `history`: one FileWritten per step, no EDITOR_FILE_SAVED (a step is not a save command). A `history` FileWritten moves the lit row and adds no row; the text it restores takes back the line authors it had, so CHANGES keeps its authors. The footer reads `⌘Z steps back · ⌘⇧Z forward` (24a). After any save the store's file facts take the saved text, so the lit row follows when no record entry lands (a session that is off). The earlier texts are roadmap r10's table: a save's `old_text`; an edit_file's or write_file's text before it when the record holds it.

Files: `derive/inspector.ts` and its spec (`before`, `after`, `opened`, `litRow`, `stepText`, `HISTORY_VIEW`), `editor/Inspector.tsx`, `editor/Centre.tsx`; gate `harness/shakeout/editor_history.ts`.

## signal contract

Emits: UNDO_ROUTED to `history`; FILE_WRITTEN on the server per step.

## artifact contract

- The files above exist; inspector spec 9/9 (a step is not a row; the lit row; step texts; authors back); unit specs 116; build 0.

## observation contract

`editor_history.ts` from source and on the bundle: three saves by hand; ⌘Z three times writes T2, T1, T0 to disk with the lit row following and "opened" lit at T0, a fourth goes nowhere; ⌘⇧Z three times back to T3, a fourth nowhere; HISTORY keeps three rows; the kernel record holds 3 `editor` and 6 `history` FileWritten with those texts; UNDO_ROUTED undo→history ×3, undo→none, redo→history ×3, redo→none; EDITOR_FILE_SAVED 3.
