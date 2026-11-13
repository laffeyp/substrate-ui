# Sprint 498 — A session link binds the pane to the session's folder

```yaml
---
id: 498
status: closed
phase: continuing a session (roadmap 2026-11-12-continue-a-session r1, found in use)
pass_kind: functional
---
```

## scope

Found in use (the Architect, 2026-11-12: "the running session does not have a workspace! The workspace chip at the top is blank"). Sprint 496's link handler called `attachExisting` alone; the Records page first binds the focused pane to the session's folder, shape and name (`App.tsx`, `setOpenSession`), and the workspace chip and pane name read that binding (`App.tsx` line 1319). A `substrate://session/<id>` link now reads the session's manifest and opens it through `openSession`, the Records page's path. One verifiable property: after a session link, the workspace chip names the session's folder.

## context_files

- `web/reveal.ts`, `web/app/state/records.ts` (`openSession`), `web/app/App.tsx` (`setOpenSession`, the chip's label)
- `harness/shakeout/lifecycle_gates.ts` (F5)

## signal contract

### Emits

- The Records open's existing tags (`SESSION_ATTACH_STARTED`, `STREAM_ATTACHED`, `PANE_DRAWN` bound).

## artifact contract

### Files modified

- `web/reveal.ts`, `harness/shakeout/lifecycle_gates.ts`

### Command exit codes

- `npm run build`, `npm run test:unit`, `lifecycle_gates` from source and on the Next bundle return 0.

## observation contract

Gate F5: a session created on a scratch folder, its link sent; the session attaches and the workspace chip names the folder. Then in Substrate Next: the link to `s_52bd6e73d1224d5cb6d04830`; the chip names Agent Orchestration.

## done criteria

A session opened by its link shows its workspace.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] Two files.
- [x] Existing tags only.
- [x] Observation contract present.

## close (code)

`web/reveal.ts`: a session link fetches `/api/session/<id>` and opens the session through `openSession`, the Records page's path, which binds the focused pane to the manifest's folder, shape and name, then attaches. Gate F5 creates its session on a scratch folder and checks the chip.

- `lifecycle_gates` from source: all passed; F5's chip read `⌥ /var/folders/…/lifecycle-f5-ws-J8hJZg`. Mutant (the bare `attachExisting` of sprint 496): F5 fails with the chip `⌥ —`, the Architect's symptom. Build 0, `test:unit` 0.
- The continued session `s_52bd6e73d1224d5cb6d04830` is intact: its manifest names the Agent Orchestration folder, status parked, and Records lists it under that folder.

Installing into Substrate Next quits it, which ends the session at its current point (kept on disk, reopenable); held until the Architect says.

## close

Substrate Next rebuilt (`pack:next` 0); `lifecycle_gates` on the bundle all passed, F5's chip naming its folder; installed as build 1794548498, the old one to the Trash by version. `open substrate-next://session/s_52bd6e73d1224d5cb6d04830`: the trace reads `DEEP_LINK_RECEIVED` (`session`), `SESSION_ATTACH_STARTED`, `PANE_BOUND` (binding `session`, how `attach`), the Records path's bind, which sprint 496's handler never reached. The session shows ended: the quit before the install ended it; it stays in Records under Agent Orchestration and resumes on the next message.
