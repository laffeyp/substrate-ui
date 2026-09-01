// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
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

// Sprint 040 — narrow the wire-shape fields to what the UI actually READS.
// Every field on RunEvent / RunSummary / RunGraph corresponds to a real
// UI access site in web/app.ts or web/console/*. Fields the substrate
// side ships that the UI does not use are absent by design — the
// F-API-6 boundary means the UI mirrors its own reads, never
// substrate's full schema. Extend by adding fields at the read site.
export interface RunEvent {
  seq: number;
  kind: string;
  payload: Record<string, unknown>;
  t?: number;
  schema?: string;
  producer?: { kind?: string; instance?: string } | null;
}

export interface RunSummary {
  producers_started: number;
  producers_completed: number;
  producers_failed: number;
  producers_cancelled: number;
  input_build_failures: number;
  predicate_quarantines: number;
  invalid_emissions: number;
  application_events: Record<string, number>;
}

export interface RunGraphInstance {
  instance: string;
  kind: string;
  // Firing-anchored lifespan fields substrate emits per Producer instance.
  // The UI reads them in web/app.ts::renderGraph to draw the timeline bars.
  fired_seq?: number;
  started_seq?: number;
  ended_seq?: number;
  parent?: string | null;
  // Substrate ships more; the UI reads only what it uses.
  [k: string]: unknown;
}

export interface RunGraph {
  status?: string;
  final_reason?: string | null;
  paused_on?: string | null;
  live?: boolean;
  instances?: RunGraphInstance[];
  // Substrate ships more; the UI reads only what it uses.
  [k: string]: unknown;
}

export interface AppState {
  // Current record identity + its loaded body.
  name: string | null;
  events: RunEvent[];
  graph: RunGraph;
  summary: RunSummary;
  manifest: unknown;
  topology: unknown;
  scene: unknown;
  // Cursor + transport.
  cursor: number;
  playing: boolean;
  speed: number;
  // Selection + view mode.
  sel: number | string | null;
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
  // Delegate crumb — cleared on rail-pick, set on delegate follow. Untyped
  // in the current app; typed here as the union of what the UI writes.
  delegateParent?: string | null;
}

const _EMPTY_SUMMARY: RunSummary = {
  producers_started: 0,
  producers_completed: 0,
  producers_failed: 0,
  producers_cancelled: 0,
  input_build_failures: 0,
  predicate_quarantines: 0,
  invalid_emissions: 0,
  application_events: {},
};

const _EMPTY_GRAPH: RunGraph = {};

export function createAppState(): AppState {
  return {
    name: null,
    events: [],
    graph: { ..._EMPTY_GRAPH },
    summary: { ..._EMPTY_SUMMARY, application_events: {} },
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
    // Sprint 045: the daily driver IS the terminal. Land there on first
    // load so a user opening the app can type immediately. `?view=desktop`
    // in the URL lands on the record browser instead — used by the
    // Playwright harnesses that assert `#view-desktop.active` on goto.
    view: (new URLSearchParams(window.location.search).get("view") === "desktop"
      ? "desktop"
      : "terminal"),
    viewSnap: { desktop: null, terminal: null },
    delegateParent: null,
  };
}
