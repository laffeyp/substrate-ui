# Sprint 145 — Naming sessions

```yaml
---
id: 145
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 15; OPEN-ITEMS 22)
asked: 2026-10-11 (Architect)
---
```

## scope

**Found.** Double-clicking the top bar's name changes only the pane's label in the window: nothing reaches the daemon, and the name is gone after a restart. The bar shows the pane's label (`pane-1`), never the session's name. `/name <new>` does PATCH the session's name, but the bar does not show it.

**After.**
- The top bar shows the focused pane's session name when it has one, else the pane's label.
- Renaming in the bar (double-click, type, ↵) names the session: with a session open, `PATCH /api/session/<id> {name}` (the path `/name` uses); before the session opens, the name is sent with `POST /api/session` when it opens. Esc cancels; an empty name changes nothing.
- The name holds in the top bar, the records page, the workspace bar's list of previous sessions, and across a restart (the manifest keeps it; a reattached pane reads it).
- A name another session already has is refused by the daemon (409); the transcript says so, as `/name` does today.

## checks

- An Electron gate: bind a pane, rename it in the bar before sending; send a message; the manifest holds the name; rename again with the session open; the bar, the manifest and `/api/session` list show the new name; reload the window, the reattached pane's bar shows it.
- `tsc` clean; unit specs; the Electron gates.

## result

- **Built.** `reveal_component.ts`: `_paneTitle` (the session's name, else the pane's label) feeds the bar's crumb and the rename field; ↵ calls the controller's new `nameSession`. `session_controller.ts`: `nameSession` renames an open session (`renameSession`, PATCH) or holds the name, and `openSession` sends a held name as `name`. The records page and the previous-sessions list already read the manifest's `name`.
- **Gate** `naming_sessions.ts` (in `gates:electron`): named before opening, the session opens with that name; renamed while open, the manifest, `/api/session` and the bar agree; after a reload the reattached pane's bar shows it.
