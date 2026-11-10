# Sprint 428 — FIND / REPLACE in the open file

```yaml
---
id: 428
status: closed
phase: code editor, the rest (roadmap r10), E6
pass_kind: functional
---
```

## scope

The inspector's FIND / REPLACE, as frame 24a's markup draws it, between CHANGES and ACTIVITY: the query with `N of M`, Aa and `.*`; the replacement with ↵ (replace this match) and all. ⌘F and ⌥⌘F in the editor put the focus in the query or the replacement, opening the section and unfolding the inspector if folded; with the focus in the terminal ⌘F is the transcript's find (roadmap r10 key table). ↵ and ⇧↵ in the query step through the matches; Escape returns to the code. The matching is `@codemirror/search`'s query and commands in each buffer's state, without its panel; every match is marked in the accent, the current one stronger; the query is kept across files. One EDITOR_FIND_QUERIED per find, when the person acts on it or typing pauses; EDITOR_REPLACED per replace. Vocabulary v0.37 (P-0.37-FIND-IN-FILE).

Files: `editor/Inspector.tsx`, `editor/Centre.tsx`, `state/editor.ts`, `keymap.ts` and its spec, `App.tsx`, the vocabulary; gate `harness/shakeout/editor_find.ts`.

## signal contract

Emits: EDITOR_FIND_QUERIED (regex, case_sensitive, match_count), EDITOR_REPLACED (scope, count), KEY_ROUTED Meta+f → editor-find.

## artifact contract

- The files above exist; keymap spec 7/7 (⌘F, ⌥⌘F, ⌘F in the terminal); unit specs 115; `npm run signals` 0 at v0.37; build 0.

## observation contract

`editor_find.ts` from source and on the bundle: ⌘F puts the focus in the query; "price" counts 6 (1 of 6; ↵ 2; ⇧↵ 1), Aa 4, `.*` `price\w*` 6, each equal to a JavaScript regex over the buffer and to the marks drawn; ⌥⌘F, "Cost", ↵ replaces one and all the rest, each equal to String.replace; ⌘S writes it to disk; ⌘F in the terminal opens the transcript's find; EDITOR_FIND_QUERIED carries each find's count; EDITOR_REPLACED one 1, all 1.
