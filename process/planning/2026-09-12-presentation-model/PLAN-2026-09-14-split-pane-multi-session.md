# PLAN — split-pane multi-session · 2026-09-14

The last unblocked Phase-4 item from
`STATUS-2026-09-13-phase-5-6-landed.md`. Studio surface and
studio build/launch are the only items after this, and both block
on server-side topology endpoints outside this repo.

## The gap

Today one `SessionController` owns one session. `web/reveal.ts` builds
it at boot and exposes it as `window.__vm`. The reveal shell's local
`S.panes` array already renders multiple pane views, but every pane
speaks to the same controller. Two panes cannot hold two sessions.

## The move

One `SessionController` per session. A thin `PaneRegistry` on
`window.__vm` maps pane id → SessionController. The reveal shell's
pane loop reads its controller from the registry, subscribes to it,
and calls its actions directly. Panes are pure View concerns; every
session-shaped fact lives on its own controller.

This is Fowler's Presentation Model at pane granularity (PoEAA 2002,
"Presentation Model"). One controller = one session. Panes multiplex
Views over controllers.

## Shape

```
window.__vm = {
  panes: Map<number, SessionController>,
  active: number,
  spawn(paneId: number): SessionController,
  attach(paneId: number, sessionId: string): void,
  drop(paneId: number): void,
  get(paneId: number): SessionController | undefined,
  // Back-compat: `snapshot`, `openSession`, `submitLine`, `pickDriver`,
  // `pickBundle` etc. proxy to the active pane's controller so existing
  // callers keep working during the migration.
}
```

`__vmTape` becomes a per-pane tape (`{ paneId, tag, payload, at }`) so
the parity harness can filter to one pane.

## The pieces

1. `web/vm/pane_registry.ts` (new). Owns the map and the back-compat
   proxy. Exposes `spawn(id)`, `get(id)`, `drop(id)`, `setActive(id)`.
2. `web/reveal.ts` (edit). Build a registry, spawn pane 1 at boot,
   expose the registry as `window.__vm`. Move roster-loaders behind
   a "shared context" object the registry hands each controller, so
   the driver roster is fetched once and reused (not N times).
3. `web/vm/session_controller.ts` (edit). Accept a shared
   `BootContext` on construction: `driverRoster`, `driverDefault`,
   `bundleRoster`, `recentWorkspaces`. Fall through to those when the
   snapshot hasn't loaded them yet. Keeps roster fetches from
   fanning out per pane.
4. `web/reveal.html` (edit). Every place that reads `window.__vm`
   changes to `window.__vm.get(p.id)`. The pane subscription is
   installed at pane spawn, not at boot. Records-list click routes
   the session id to the focused pane's controller.
5. `harness/parity.ts` (edit). Drive two panes on two sessions;
   assert the tag sequences are independent per pane.
6. `harness/vm_smoke.ts` (edit). Build one controller directly (the
   registry adds nothing the smoke needs to check).

## Invariants

- One controller per session id. Attaching pane 2 to a session pane 1
  already holds returns the same controller.
- A controller with no pane attached does not attach its SSE stream.
  Detaching the last pane closes the stream and drops the controller
  after a short grace period (5 s) so a "close then reopen the same
  session" flip does not thrash the stream.
- The focused pane's controller is proxied under `window.__vm.*` for
  every existing shell binding. No pane routes through a stale
  controller.

## Test plan

- Smoke (`npm run smoke:vm`): unchanged surface, controller instance
  behaves as before. 11 steps still green.
- Parity (`npm run parity`): drive `/` reveal and `/classic` on
  independent sessions in two panes each; both shells emit the same
  15-tag surface per pane, no cross-pane bleed.
- Pixel (`npm run see`): two panes side-by-side each showing its own
  driver / bundle chip and transcript. Focused pane visibly ahead in
  its stream lens; unfocused pane at 55% opacity per existing shell
  rule.

## Order of landing

1. `pane_registry.ts` + boot rewire + back-compat proxy. Smoke stays
   green.
2. Wire the pane-spawn side (`Ctrl+D` and split gestures already
   present in the shell) to `registry.spawn(newId)`.
3. Rewire records-list click + slash router to route to the focused
   pane's controller.
4. Parity harness runs two panes on two sessions.
5. Freeze the change; the plan closes when parity + smoke + a
   two-pane pixel capture are all green.

## Non-invariants (things the plan deliberately does not do)

- No shared transcript between panes. Two panes on the same session
  see the same envelopes but each renders its own scroll position.
- No cross-pane copy. Selection stays local.
- No back-pressure or debouncing on rapid pane spawn/drop. If the
  session count climbs enough to matter, that is a separate concern.

## Follow-ups this opens

- The reveal shell's existing `S.allSessions` / `S.panes` local state
  becomes semi-redundant with the registry's session-shaped map. A
  later pass consolidates.
- The classic shell's Phase 2b rewire onto the controller becomes
  easier to reason about with per-session controllers in place.
- Studio surface (blocked) can hang its own controller off the same
  registry when the server endpoints land, so a Studio-authored
  topology becomes just another pane.

## Sources

- Fowler, *Patterns of Enterprise Application Architecture*,
  Addison-Wesley 2002 — "Presentation Model."
- Fowler, "Presentation Model" (essay, 2004).
- Cockburn, "Hexagonal Architecture," 2005 — the registry is the
  outer adapter; each controller is a port instance.
