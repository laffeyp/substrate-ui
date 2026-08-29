// state.ts — the AppState schema (ARCH-2 fix from REVIEW-2026-08-28-piece-g-full).
//
// The god-struct `STATE` in app.ts had grown to 23 fields inferred from the
// literal at declaration time. Its inferred type made every subsequent
// assignment fight tsc — `events: never[]` at boot, then `.push(envelope)`
// widening the type in incompatible ways across ~40 call sites. This file
// gives STATE a shape; downstream sprints (034b rail, 036 controls) can
// bump the shape by editing this interface, and future readers get a
// grep-target for what STATE holds.
//
// `unknown` is used where the underlying substrate wire shape is opaque to
// the UI (records, graphs, manifests) — the UI reads specific fields off
// these objects at each render call site rather than mirroring the whole
// substrate schema here. That is deliberate; F-API-6 lives at the browser
// seam, and mirroring substrate structs in TS would tie substrate-ui to
// substrate's release cadence.

import type { ViewId } from "./view-ids";

export interface ViewSnapshotBag {
  desktop: unknown;
  terminal: unknown;
}

export interface AppState {
  // Current record identity + its loaded body.
  name: string | null;
  events: unknown[];
  graph: unknown;
  summary: unknown;
  manifest: unknown;
  topology: unknown;
  scene: unknown;
  // Cursor + transport.
  cursor: number;
  playing: boolean;
  speed: number;
  // Selection + view mode.
  sel: unknown;
  mode: string;
  graphView: string;
  live: string | null;
  resumable: Set<string>;
  // Assay board.
  assay: string | null;
  assays: unknown[];
  assayReport: unknown;
  // Piece-G two-view scaffold (sprint 033).
  view: ViewId;
  viewSnap: ViewSnapshotBag;
}

export function createAppState(): AppState {
  return {
    name: null,
    events: [],
    graph: null,
    summary: null,
    manifest: null,
    topology: null,
    scene: null,
    cursor: 0,
    playing: false,
    speed: 30,
    sel: null,
    mode: "read",
    graphView: "run",
    live: null,
    resumable: new Set(),
    assay: null,
    assays: [],
    assayReport: null,
    view: "desktop",
    viewSnap: { desktop: null, terminal: null },
  };
}
