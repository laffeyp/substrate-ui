// web/vm/pane_registry.ts — the pane→controller map.
//
// One SessionController per session. Panes are pure View concerns and
// route their reads/writes through the registry to a controller. The
// registry also exposes back-compat proxy methods so shell code that
// used `window.__vm.<action>` before the split-pane change keeps
// working: those calls now go to the ACTIVE pane's controller.

import { SessionController } from "./session_controller";
import type { SubstrateClient } from "./client";
import type { ControllerEvent, OpenSessionRequest } from "./session_controller";
import type { Snapshot } from "./types";

export interface PaneRegistryDeps {
  makeClient: () => SubstrateClient;
}

/** One typed event, tagged with the pane it fired on. Views and
 * harnesses read `__vmTape` as a stream of these. */
export interface PaneEvent extends ControllerEvent {
  paneId: number;
}

type PaneListener = (paneId: number, snap: Snapshot) => void;
type PaneEventListener = (ev: PaneEvent) => void;

export class PaneRegistry {
  private byPane = new Map<number, SessionController>();
  private paneListeners = new Set<PaneListener>();
  private paneEventListeners = new Set<PaneEventListener>();
  private activePaneId: number | null = null;

  constructor(private readonly deps: PaneRegistryDeps) {}

  /** Get or lazily-create the controller for a pane id. Two calls
   * with the same id return the same controller instance. */
  spawn(paneId: number): SessionController {
    const existing = this.byPane.get(paneId);
    if (existing) return existing;
    const controller = new SessionController(this.deps.makeClient());
    controller.subscribe((snap) => {
      for (const l of this.paneListeners) l(paneId, snap);
    });
    controller.onEvent((ev) => {
      const tagged: PaneEvent = { ...ev, paneId };
      for (const l of this.paneEventListeners) l(tagged);
    });
    this.byPane.set(paneId, controller);
    if (this.activePaneId === null) this.activePaneId = paneId;
    return controller;
  }

  /** Return the controller for a pane, or undefined if not spawned. */
  get(paneId: number): SessionController | undefined {
    return this.byPane.get(paneId);
  }

  /** Drop a pane's controller. Any live SSE stream on it closes. */
  drop(paneId: number): void {
    const controller = this.byPane.get(paneId);
    if (!controller) return;
    controller.disconnect();
    this.byPane.delete(paneId);
    if (this.activePaneId === paneId) {
      const first = this.byPane.keys().next();
      this.activePaneId = first.done ? null : first.value;
    }
  }

  /** Choose which pane's controller the back-compat proxy points at. */
  setActive(paneId: number): void {
    if (this.byPane.has(paneId)) this.activePaneId = paneId;
  }

  /** The currently-active controller, or a freshly-spawned pane-1
   * controller if the registry is empty. Callers that hit this on an
   * empty registry are almost certainly early-boot; keep it safe. */
  active(): SessionController {
    if (this.activePaneId === null) return this.spawn(1);
    const c = this.byPane.get(this.activePaneId);
    return c ?? this.spawn(1);
  }

  /** Subscribe to snapshot changes across every pane. Every already-
   * spawned controller's current snapshot replays synchronously so a
   * late subscriber does not miss the boot-time patches. */
  subscribe(listener: PaneListener): () => void {
    this.paneListeners.add(listener);
    for (const [paneId, controller] of this.byPane) listener(paneId, controller.snapshot());
    return () => { this.paneListeners.delete(listener); };
  }

  /** Subscribe to typed events across every pane. */
  onEvent(listener: PaneEventListener): () => void {
    this.paneEventListeners.add(listener);
    return () => { this.paneEventListeners.delete(listener); };
  }

  /** Every pane id currently registered, in insertion order. */
  paneIds(): number[] { return Array.from(this.byPane.keys()); }

  // ── back-compat proxy to the active pane's controller ──────────────
  // The shell and both harnesses (`parity`, `vm_smoke`) call these on
  // `window.__vm`. Each forwards to the active controller so callers
  // written before the pane split keep working.
  snapshot(): Snapshot { return this.active().snapshot(); }
  loadDriverRoster(): Promise<void> { return this.active().loadDriverRoster(); }
  loadLiveSessions(): Promise<void> { return this.active().loadLiveSessions(); }
  loadRecentWorkspaces(): Promise<void> { return this.active().loadRecentWorkspaces(); }
  loadBundleRoster(): Promise<void> { return this.active().loadBundleRoster(); }
  openSession(req?: OpenSessionRequest): Promise<void> { return this.active().openSession(req); }
  sendTurn(text: string): Promise<void> { return this.active().sendTurn(text); }
  submitLine(text: string): Promise<boolean> { return this.active().submitLine(text); }
  endSession(reason: string): Promise<void> { return this.active().endSession(reason); }
  attachExisting(id: string): Promise<void> { return this.active().attachExisting(id); }
  attachRecordRoot(recordRoot: string): Promise<void> { return this.active().attachRecordRoot(recordRoot); }
  pickDriver(name: string): void { this.active().pickDriver(name); }
  pickBundle(slug: string | null): void { this.active().pickBundle(slug); }
  interruptTurn(tier: "soft" | "hard" = "hard", recordRoot?: string): Promise<void> { return this.active().interruptTurn(tier, recordRoot); }
  validateSpec(spec: Record<string, unknown>): Promise<{ valid: boolean; error?: string }> { return this.active().validateSpec(spec); }
  buildSpec(spec: Record<string, unknown>): Promise<{ ok: boolean; run?: Record<string, unknown>; error?: string }> { return this.active().buildSpec(spec); }
}
