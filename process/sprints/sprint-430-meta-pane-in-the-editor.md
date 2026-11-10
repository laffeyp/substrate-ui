# Sprint 430 — the meta pane inside the editor view

```yaml
---
id: 430
status: closed
phase: code editor, the rest (roadmap r10), E5
pass_kind: functional
---
```

## scope

⌘M (meta's key) and View ▸ Meta in the editor open the meta pane inside the editor view, in the right column in place of the inspector, and close it; the editor stays the view (no VIEW_CHANGED); the column unfolds if folded, and its rail names what is folded (INSPECTOR or META). There is no chip (the Architect, 2026-11-09, a deviation from frames 24a and 24b and spec r6 §4's ⌃⇧`: "It's command M. It's the meta pane ... It's not called record"). The meta pane is the meta view's machinery column (`MetaView`, without its split gutter; D81) at 400 px under `META <name> · N events`. ACTIVITY's ◂ opens the meta pane on the stream lens with the call's seq lit, inspected and scrolled into view (`followBottom` gains `stopFollowing`, the state a scroll up gives, since its scroll event comes a frame after the jump's rows). The footer adds `seq N selected` and the hint `⌘M meta`. Vocabulary v0.38 (P-0.38-RECORD-COLUMN): SEQ_SELECTED.how `editor_activity`; EDITOR_INSPECTOR_SWAPPED emitted; EDITOR_DRAWN.showing follows the column; the anchor's third row carries it (0xB9, bit `meta`); v0.39 corrects those tags' notes to ⌘M and the meta pane.

Files: `editor/EditorView.tsx` (`toggleMetaPane`, `openSeq`), `editor/Inspector.tsx`, `MetaView.tsx`, `state/meta.ts`, `state/editor.ts`, `derive/footer.ts` and its spec, `Footer.tsx`, `keymap.ts` spec, `App.tsx` (`toggleMeta` in the editor), `derive/anchor.ts` and its spec, `web/reveal/follow_bottom.ts`, the vocabulary; gates `harness/shakeout/editor_meta_pane.ts`, `editor_keys.ts`.

## signal contract

Emits: EDITOR_INSPECTOR_SWAPPED (showing), SEQ_SELECTED (how editor_activity), EDITOR_DRAWN.showing lenses, KEY_ROUTED Meta+m → toggle-meta with no VIEW_CHANGED.

## artifact contract

- The files above exist; unit specs 116 (window) and 190 with the transcript's; `npm run signals` 0 at v0.39; build 0.

## observation contract

`editor_meta_pane.ts` from source and on the bundle with the live roster's model: the inspector 300 px; ⌘M opens the meta pane at 400 px with no chip and the header's event count equal to the kernel record's envelopes on disk, the editor still the view; ◂ on the edit's ACTIVITY row opens the seq of the record's edit_file ToolCall, inspected and in view, the footer `seq N selected` and `⌘M meta`; folded, the rail reads META and ⌘M unfolds it; the anchor's third row reads meta open and names the EDITOR_DRAWN with showing lenses. `editor_keys` (⌘M opens and closes the meta pane in the editor); the meta view's `stream_follows_bottom`, `meta_inspector_io_scene`, `side_graph_scroll`.
