# Sprint 502 — Splitting the editor

```yaml
---
id: 502
status: pending
phase: editor features (roadmap 2026-11-14 r2, E4)
pass_kind: functional
---
```

## scope

The Architect, 2026-11-14, supersedes D49 (c) and code-editor roadmap E1's refusal: ⌘D splits the editor right, ⌘⇧D down, and the tab menu does the same; a new group opens empty; a tab dragged across a boundary moves to that group; a group's last tab closed removes the group. Each group has its own tabs and shown file (sprint 499's state, one level down). The grid allows any layout up to 3 groups across and 3 down; a split past that is refused. One verifiable property: ⌘D then ⌘⇧D gives three groups, each showing its own file.

## signal contract

Vocabulary proposal: `EDITOR_KEY_REFUSED` reason `no_split` retired for ⌘D/⌘⇧D (TAG_DEPRECATION or payload change), a tag for a group opened or closed with its count, and the refusal past 3 × 3.

## observation contract

Gate on the bundle: the keys, the menu, a drag across, the limit; screenshots read. Mutants: the old refusal back; no limit.
