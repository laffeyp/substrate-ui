# Sprint 431 — following the session's edits (kernel calls)

```yaml
---
id: 431
status: closed
phase: code editor, the rest (roadmap r10), E7
pass_kind: functional
---
```

## scope

While the editor is open in a pane (D93; roadmap r10 E7, the follow rules), each kernel `edit_file` or `write_file` call on a workspace file made after it opened is marked at its call and resolved at its result. On the file shown, the lines the call will replace are edged in the accent and scrolled into view, and when the result lands the file is read again and its first changed line brought into view; on another file the view stays (the person's focus wins) and the file's tree row is marked until the result, its changed-vs-main dot following. With unsaved changes the buffer is kept, the confirmation says `conflict`, and the next save is refused as stale with the reload-or-overwrite offer. A failed call withdraws its mark. Nothing is followed or written while the editor is closed (S11). A call's result is the first ToolResult after it with its call_id: the kernel numbers call ids per turn, and pairing by id alone gave a later turn's call an earlier turn's result (found by the gate; fixed in the inspector's ACTIVITY and HISTORY too). Harness drivers' calls (Claude, Codex, Cursor; HarnessToolCall) are the next card. Vocabulary v0.40: the follow tags keyed by the call's seq with `result_seq`; S10 restated and checked in `electron/invariants.ts` with planted breaks; EDITOR_DRAWN `follow_marks`, in the anchor's third row (0xBA).

Files: `derive/follow.ts` (new) and its spec, `derive/inspector.ts` (`resultOf`), `editor/EditorView.tsx` (`Follow`), `editor/Centre.tsx` (marks, the landed line in view), `editor/FileTree.tsx`, `state/editor.ts`, `App.tsx`, `derive/anchor.ts` and its spec, `electron/invariants.ts` and `invariants.spec.ts`, the vocabulary; gate `harness/shakeout/editor_follow.ts`.

## signal contract

Emits: EDITOR_FOLLOW_MARKED (seq), EDITOR_FOLLOW_CONFIRMED (seq, result_seq, conflict), EDITOR_FOLLOW_WITHDRAWN (seq, result_seq), EDITOR_DRAWN.follow_marks; INVARIANT_BROKEN S10 only for planted breaks.

## artifact contract

- The files above exist; unit specs 119 (follow 1, invariants with S10's 2, anchor 5); `npm run signals` 0 at v0.40 (136 live tags emitted, 3 pending); build 0.

## observation contract

`editor_follow.ts`, from source and on the bundle, with the live roster's model prompted from the editor's terminal: every MARKED is an edit call on the kernel record after the editor opened, and each is resolved once with its own ToolResult's seq; turn 1 (the open file and another): one tab, the buffer equals the disk, the changed line in view, the other file dotted; turn 2 (unsaved typing): CONFIRMED conflict true, the buffer kept, ⌘S meets the offer; turn 3 (an absent search text): WITHDRAWN; follow_marks rises while a call is in flight and ends 0 in EDITOR_DRAWN and the anchor; no INVARIANT_BROKEN. On the bundle also `editor_inspector`, `editor_history`, `editor_meta_pane`, `editor_editing`.
