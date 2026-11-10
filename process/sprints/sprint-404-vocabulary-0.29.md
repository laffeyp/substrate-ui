# Sprint 404 — vocabulary v0.29: the editor as a view, and Phase 1's layout

```yaml
---
id: 404
status: closed
phase: code editor, phase 1 (round 6)
pass_kind: architecture
---
```

## scope

Bump the vocabulary from v0.28 to v0.29 through typed proposals, so Phase 1's behaviour (roadmap r6, R1–R10) has tags before any code emits them. `web/vm/signals/versions/0.29.json` and `0.29-rationale.md` are written; `current.json` points at 0.29; the generated files are regenerated; `proposals.json` gains one entry per change; `unemitted.json` lists every declared tag with no emit site. The changes:

1. `VIEW_CHANGED`: its note names `editor` among the open views (the field is a string of the open view).
2. `PANE_DRAWN.state` loses `editor`: the editor is a window view, and panes are not drawn under it.
3. `EDITOR_KEY_REFUSED.reason` gains `no_session`.
4. `EDITOR_COLUMN_FOLDED` gains required `cause`: `key | menu | rail | focus`.
5. `EDITOR_OPENED.binding` and `EDITOR_DRAWN.binding` become optional: no binding setting exists until Phase 2, and a value written now would be invented (D6).
6. `EDITOR_DRAWN` gains required `dock` (`bottom | right`), `sides_swapped`, `focus`, `tree_rows`, `modified_dots`.
7. New: `EDITOR_DOCK_SET` (`dock`), `EDITOR_SIDES_SWAPPED` (`swapped`), `EDITOR_FOCUS_SET` (`on`), `EDITOR_COLUMN_RESIZED` (`column`, `size`), and the server's `DIFF_READ` (`session_id`, `base`: `main | default_branch | first_commit | none`, `files`).

## prerequisites

- 403

## context_files

- `../sdd-kit-3/grammar/PRINCIPLES.md`, `../sdd-kit-3/grammar/BOOTSTRAP.md` (steps 2, 3, 9 and 12)
- `web/vm/signals/versions/0.28.json`, `0.28-rationale.md`, `web/vm/signals/proposals.json`
- `scripts/gen_signals.py` (what it generates from enums and optional fields)
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r6.md` (R1–R10, "Vocabulary")
- Design: spec r6 §4, §5.1; D7, D51, D86; frames `runs/design/sheet-v11/24a.png`, `24h.png`, `16c.png`

## signal contract

### Emits

- none at runtime: a vocabulary sprint. The Signal Report narrates the changes.

### Invariants

- v0.28.json is not modified.
- E1 holds on every new field: no path, no file text.
- Every enum lists its values; every field is typed.

## artifact contract

### Files created

- `web/vm/signals/versions/0.29.json`, `web/vm/signals/versions/0.29-rationale.md`

### Files modified

- `web/vm/signals/versions/current.json` (→ 0.29.json), `web/vm/signals/proposals.json`, `web/vm/signals/unemitted.json`; regenerated `web/vm/signals.gen.ts`, `electron/signals.gen.ts`, `signals_gen.py`; `WORKING_AGREEMENT.md` vocabulary row.

### Content assertions

- 0.29.json parses; `vocabulary_version` is `0.29`; `tag_count` equals the length of `tags` (135).
- `EDITOR_KEY_REFUSED.field_types.reason` contains `no_session`; `PANE_DRAWN.field_types.state` does not contain `editor`.
- `proposals.json` holds seven `P-0.29-*` entries, each ratified with its grounds.

### Command exit codes

- `python3 scripts/gen_signals.py --check` returns 0 after regeneration.
- `npm run signals` returns 0.
- `npm run build` returns 0.

## done criteria

v0.29 is current; the code's generated names include the new tags and values; nothing emits them yet, and the pending list says so.

## self-review checklist

- [x] Scope names one verifiable property: v0.29 current, generated, consistent.
- [x] `context_files` includes the design inputs the tags describe.
- [x] Emits: none.
- [x] Artifact contract gradable.
- [x] Observation contract: n/a (no behaviour).
- [x] Two authored files plus regenerated and list files, one concept.
