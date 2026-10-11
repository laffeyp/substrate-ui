# Sprint 128 — Keys for the workspace bar

```yaml
---
id: 128
status: open
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md
asked: 2026-10-10 (Architect)
---
```

## why

After U124 the Architect tried the bar by keyboard. Two gaps showed. The arrows only work once the path box has been clicked. And no key opens a nested row: the workspace half cannot reach a folder's sessions, and the model half needs → to open a group.

## scope

- **↵ picks, ⇧↵ opens.** Both halves work the same way.
  - ⇧↵ (or ⌥↵) on a row that can open toggles it open or folded.
  - ↵ picks the row. A row with nothing to pick (cli agents, ollama · cloud, ollama · local) opens on ↵ as well.
  - A row with a default, such as `claude` or `codex` with their families, starts on its default with ↵ and opens with ⇧↵.
- **Sessions in the key list.** An open folder's session rows join the workspace half's key list; ↵ on one resumes that session.
- **Arrows without a click.** While a pane with no session is focused and no other text box has the cursor, ↑↓, ↵, ⇧↵, ⌥↵, → ← and esc go to its bar. Before a folder is armed they work the workspace half; after, the model half, as U124 set.
- → and ← stay as a second way to open and fold.

## checks

- Fresh window, no click: ↓ ↵ arms `~/.substrate/sandbox`; ↵ on `cli agents` opens it; ⇧↵ on `claude` shows its families; ↵ on a family starts the session on that family.
- ⇧↵ on a folder with sessions shows them; ↓ onto one and ↵ resumes it.
