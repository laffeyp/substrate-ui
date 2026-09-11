// src/render/lens/filters.ts — pure filter functions applied to the
// transcript row stream before it hits a lens. Level narrows by producer
// class; direction narrows by graph-edge kind. Neither talks to the
// bridge — the filters are client-side over data already in ShellState.
//
// A row's producer class is inferred from its envelope.producer_kind
// string. The "app" set is the ratified kernel-producer name list from
// substrate's Producer taxonomy: session, tool_loop, planner, executor,
// notebook. Anything else is framework noise — Predicate, Route, Timer,
// Snapshotter — and gets filtered out at level=app.

import { StreamLevel, StreamDir } from "@/observability/reasons";
import type { TranscriptRow } from "@/state/ShellState";

// App-level producer classes — the substrate kernel names for user-
// facing work. Framework producers (Predicate, Route, Timer, etc.)
// are filtered out when the level toggle is on "app".
export const APP_PRODUCER_KINDS: readonly string[] = [
  "Session", "ToolLoop", "Planner", "Executor", "Notebook",
];

export function filterByLevel(rows: readonly TranscriptRow[], level: StreamLevel): TranscriptRow[] {
  if (level === StreamLevel.ALL) return [...rows];
  const app = new Set(APP_PRODUCER_KINDS);
  return rows.filter((r) => app.has(r.producer_kind));
}

// Direction edges: an edge is temporal (down) when a row's producer
// wrote to a child producer's queue; peer (side) when two peer
// producers share a graph edge. The reducer projects both edge sets;
// the direction toggle only picks which set the lens draws.
export type EdgeKind = "down" | "side";

export function filterEdgesByDir(edges: readonly { kind: EdgeKind }[], dir: StreamDir): typeof edges[number][] {
  const want: EdgeKind = dir === StreamDir.DOWN ? "down" : "side";
  return edges.filter((e) => e.kind === want);
}
