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
  subscribe(listener: (snap: Snapshot) => void): () => void;
  snapshot(): Snapshot;
}
interface RegistryLike {
  get(paneId: number): ControllerLike | null;
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
  const registry = (window as unknown as { __vm?: RegistryLike }).__vm ?? null;
  const controller = registry?.get(paneId) ?? null;
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!controller) return () => undefined;
      return controller.subscribe(() => onChange());
    },
    [controller],
  );
  const getSnapshot = useCallback(
    () => (controller ? controller.snapshot() : EMPTY_SNAPSHOT),
    [controller],
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}
