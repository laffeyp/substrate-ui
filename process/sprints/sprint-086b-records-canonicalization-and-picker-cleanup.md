# Sprint 086b — Records canonicalization + workspace-picker cleanup

```yaml
---
id: 086b
status: pending
opened_at: 2026-09-25
opened_by: agent
phase: 9-followup
pass_kind: correctness
---
```

## scope

Sprint 086 landed collapsible workspaces, folder-picker "add
workspace", and paginated per-workspace + isolated-sessions
endpoints. Peter live-tested and hit five real defects:

1. `~/.substrate/sandbox` and `/Users/peterlaffey/.substrate/sandbox`
   render as two separate rows even though they are the same
   directory. The exact-string filter in the by-workspace endpoint
   means the second row shows zero sessions.
2. The "isolated sessions" bucket is a synthetic client-invention
   that groups sandbox-shaped session paths under a fake name.
   Peter's model: every session ran in a directory. Every
   directory is a row. No fake bucket.
3. Per-session sandboxes (`~/.substrate/sessions/<id>/workspace`)
   are the ONE case where per-directory rows would explode into
   thousands. Those collapse under one scrollable row rooted at
   `~/.substrate/sessions/`.
4. Load-more is a manual button. Peter wants infinite scroll:
   when the container is within 100px of its bottom the next
   page fetches automatically.
5. The workspace picker in the header popover renders the literal
   string `~/code/substrate` — a prototype-era placeholder. Same
   fake string is the fallback for the inherit-from-parent row
   when the parent pane has no bound workspace. The branch label
   `substrate/fix-race` is another hardcoded fake.

## deliverables

### server.py

- `_canonical_workspace(path)` — expand `~`, resolve absolute,
  strip trailing slash. Two rows that pointed at the same
  directory collapse.
- `_recent_workspaces()` rewrite: derive one row per distinct
  canonical workspace path across every session bucket. Kill the
  sandbox regex filter. Every distinct directory a session ever
  ran in becomes a row. Recent-workspaces.json entries feed in
  first (LRU), derived rows follow.
- Special case per-session sandboxes: any session whose workspace
  matches `.substrate/sessions/<id>/workspace$` counts under one
  synthesized workspace row rooted at `<home>/.substrate/sessions/`
  with shape `per-session-sandboxes`.
- `POST /api/session` handler canonicalizes `manifest.workspace`
  before passing it to `_remember_workspace`.
- `GET /api/sessions/by-workspace`: canonicalize the query
  `path` param AND each session's stored workspace path before
  comparing. Fixes the two-sandbox-rows-but-one-shows-zero bug.
- If `path` is the synthesized per-session-sandbox root, filter
  every session whose stored workspace matches the per-session
  sandbox regex instead of exact-match.
- Delete `GET /api/sessions/isolated`. `by-workspace` under the
  per-session-sandbox root covers it.

### web/vm/session_controller.ts

- Delete `loadIsolatedSessions`. `loadSessionsByWorkspace` is the
  one paged loader.
- No shape change to the workspace / snapshot types.

### web/vm/pane_registry.ts

- Delete the `loadIsolatedSessions` proxy.

### web/reveal_component.ts

- Remove the "isolated sessions" bucket producer entirely.
- `_workspaceGroups` builds one row per (canonical) recent
  workspace, sorted by newest-session-in-workspace desc.
- Add a per-workspace `isLoading` flag on `pagedByWs` entries
  so the scroll handler does not fire load-more while a fetch
  is in flight.
- Attach an `onScroll` handler to the scrollable container that
  fires `loadMore` when `scrollTop + clientHeight >= scrollHeight - 100`.
- Delete the `'~/code/substrate'` literal from state initializer
  (line 53), shape classifier (line 506), workspace-inherit
  fallback (lines 922 and 950), and new-session shape hint (line
  2139).
- Delete the `'substrate/fix-race'` literals (lines 975, 1081,
  2118). Replace with real derivation: if `pn.ws` is a git
  worktree branch surfaces the branch; otherwise the label is
  the path basename.
- `inheritFrom.ws || '~/code/substrate'` → `inheritFrom.ws || null`;
  only push the inherit row when the parent pane has a real
  bound workspace.

### web/reveal.html

- Delete the two literal `~/code/substrate` occurrences in the
  workspace popover (lines 30, 55). Replace with a real binding
  from the pane's bound workspace path.
- Scroll container `onScroll` wired to the group's `loadMoreOnScroll`.

## observation contract

### behavior gates

- Records page shows one row for `~/.substrate/sandbox` (or the
  expanded equivalent), not two.
- Every distinct directory across every session shows as a row
  except per-session sandboxes, which collapse under one
  `~/.substrate/sessions/` row.
- Per-session sandbox row expands and paginates through all rows
  via scroll — no button click.
- New session picker offers `~/.substrate/sandbox` (default) and
  "choose folder…" and, when applicable, "inherit · from <parent>"
  pointing at the parent's real workspace. The `~/code/substrate`
  string appears nowhere.
- Header popover for a bound pane names that pane's actual
  workspace path, not `~/code/substrate`.

### exit gates

- `npm run typecheck` — 0.
- `npm run lint` — 0.
- `npm run build` — 0.
- Live probe: fresh Electron, open Records → count of rendered
  workspace rows equals count of distinct canonical workspace
  paths on the server. `~/.substrate/sessions/` row's total
  matches the number of sessions in per-session sandboxes.

## follow-ups (out of scope for 086b)

- Per-workspace sort options (created_at vs last_touched vs
  name). Newest-first is fine as the only order until a user
  asks for another.
- Server-side search across sessions.
- Persisting expand state across page loads (localStorage).

## artifact

This card. Code lands in one commit alongside close.
