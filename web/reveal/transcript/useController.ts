// Sprint 072 — useSyncExternalStore adapter for SessionController.
//
// SessionController exposes `subscribe(listener: (snap) => void):
// Unsubscribe` and `snapshot(): Snapshot`. React's
// useSyncExternalStore wants `(subscribe: (onChange) => Unsub,
// getSnapshot: () => T) => T`. This hook wires the two through
// `window.__vm` (PaneRegistry). Tearing-free reads under React 18
// concurrent rendering.

import { useCallback, useSyncExternalStore } from "react";
import type { Snapshot } from "../../vm";

interface ControllerLike {
  snapshot(): Snapshot;
}
interface RegistryLike {
  get(paneId: number): ControllerLike | null;
  subscribe(listener: (paneId: number, snap: Snapshot) => void): () => void;
}

const EMPTY_SNAPSHOT: Snapshot = {
  sessionId: null,
  sessionName: null,
  driver: null,
  bundleSlug: null,
  workspacePath: null,
  workspaceShape: null,
  turnIndex: 0,
  transcript: [],
  parkReason: null,
  endedReason: null,
  driverRoster: [],
  driverDefault: null,
  driverGroups: [],
  liveSessions: [],
  recentWorkspaces: [],
  bundleRoster: [],
  connection: "idle",
  lastError: null,
  topologyGraph: null,
  rawEnvelopes: [],
  progressByCallId: {},
};

export function useController(paneId: number): Snapshot {
  // Subscribe at the registry level, filter by pane id. Reading
  // controller fresh in getSnapshot means a late-arriving spawn is
  // picked up on the next fire; a controller-level subscription
  // that captured `null` at first render never recovered.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const registry = (window as unknown as { __vm?: RegistryLike }).__vm ?? null;
      if (!registry) return () => undefined;
      return registry.subscribe((updatedPaneId) => {
        if (updatedPaneId === paneId) onChange();
      });
    },
    [paneId],
  );
  const getSnapshot = useCallback(
    () => {
      const registry = (window as unknown as { __vm?: RegistryLike }).__vm ?? null;
      const controller = registry?.get(paneId) ?? null;
      return controller ? controller.snapshot() : EMPTY_SNAPSHOT;
    },
    [paneId],
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}
