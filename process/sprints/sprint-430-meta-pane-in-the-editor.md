# Sprint 430 — the session's record in the editor's right column

```yaml
---
id: 430
status: closed
phase: code editor, the rest (roadmap r10), E5
pass_kind: functional
---
```

## scope

⌃⇧` (and each column header's chip) swaps the editor's right column between the inspector (`⌃⇧\` record` chip, 300 px) and the session's record (frame 24b: `RECORD <name> · N events`, the lit `⌃⇧\` inspector` chip, the five lenses of the meta view at 400 px, a row inspected inline), unfolding the column if folded; the rail names what is folded. The lenses are the meta view's machinery column (`MetaView`, without its split gutter; D81: the lenses take their width from their column). ACTIVITY's ◂ opens the record on the stream lens with the call's seq lit, inspected and scrolled into view (`followBottom` gains `stopFollowing`, the state a scroll up gives, since its scroll event comes a frame after the jump's rows). The footer adds `seq N selected` and the hint `⌃⇧\` inspector ⇄ record` (24b). Vocabulary v0.38 (P-0.38-RECORD-COLUMN): SEQ_SELECTED.how `editor_activity`; EDITOR_INSPECTOR_SWAPPED emitted; EDITOR_DRAWN.showing follows the column; the anchor's third row carries it (0xB9).

Files: `editor/EditorView.tsx`, `editor/Inspector.tsx`, `MetaView.tsx`, `state/meta.ts`, `state/editor.ts`, `derive/footer.ts` and its spec, `Footer.tsx`, `keymap.ts` and its spec, `App.tsx`, `derive/anchor.ts` and its spec, `web/reveal/follow_bottom.ts`, the vocabulary; gate `harness/shakeout/editor_record.ts`.

## signal contract

Emits: EDITOR_INSPECTOR_SWAPPED (showing), SEQ_SELECTED (how editor_activity), EDITOR_DRAWN.showing lenses, KEY_ROUTED ⌃⇧` → swap-record.

## artifact contract

- The files above exist; unit specs 190 (window and transcript); `npm run signals` 0 at v0.38; build 0.

## observation contract

`editor_record.ts` from source and on the bundle with the live roster's model: the inspector 300 px ⇄ the record 400 px with the header's event count equal to the kernel record's envelopes on disk; ◂ on the edit's ACTIVITY row opens seq of the record's edit_file ToolCall, inspected and in view, the footer `seq N selected`; folded, the rail reads RECORD and ⌃⇧` unfolds it; the anchor's third row reads record and names the EDITOR_DRAWN with showing lenses. The meta view's `stream_follows_bottom`, `meta_inspector_io_scene`, `side_graph_scroll` from source; `stream_follows_bottom`, `editor_keys`, `editor_editing` on the bundle. The column read beside 24b.
