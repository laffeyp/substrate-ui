// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What meta's structure lens lists (sprint 300; plan PLAN-2026-11-04-shell-to-react-r5.md, D4). Moved
// from reveal_component.ts's renderVals (UI sprints 137, 138): every primitive of the record's
// topology in its own section, each heading defined on hover. Events lead: what emits each kind, and
// what it fires.

import type { TopologyGraph } from "../../vm/types";

/** One or two sentences per heading and tag, from Substrate's docs (docs/api.md, docs/tutorial.md,
 *  docs/adding-a-topology.md, kernel/topology.py). */
export const STRUCTURE_DEFS = {
  events: "An event is a typed record a producer emits. The run’s record is its events in order, and every other part reads them. Runtime: lifecycle events the runtime writes. Outside: written into the record by the app, for the user.",
  producers: "A producer is a callable that takes typed input and yields typed events. The runtime starts one each time a trigger fires and records its start and its end.",
  triggers: "A trigger starts a producer when an event it subscribes to arrives and its predicate holds over the views. PerEvent fires on every match; Once fires a single time.",
  routes: "A route stages data from an event into a named slot, and a later trigger reads it. Context reaches a producer’s next instantiation this way.",
  views: "A view is a deterministic projection the runtime keeps current over the events. Triggers read views by name to decide whether to fire and what to pass.",
  ends: "The termination policy decides when the run stops: it finalises the record, or pauses it to wait for input.",
  run: "The baseline is metadata recorded when the run opens (environment, fixtures, seeds), so the record reads from a known state. Exports are what a run composed inside another hands back to its parent.",
  initial: "An initial producer starts when the run opens, before any trigger.",
  instrument: "An instrument is a producer and its trigger registered together: it starts once for every event of one kind.",
  deterministic: "A deterministic producer gives the same events for the same input, so replay can run it again.",
} as const;

/** The runtime's own lifecycle kinds carry the kernel's namespace (`substrate.RunStarted`); a
 *  topology's kinds do not. */
export const isLifecycleKind = (kind: string): boolean => kind.startsWith("substrate.");

/** A break point after `substrate.`, for display only, so a narrow panel never splits a word. */
export const kindLabel = (kind: string): string => kind.replace(/^substrate\./, "substrate.​");

export interface StructureView {
  /** No topology, or one with no producers: the lens says so. */
  empty: boolean;
  producers: { name: string; emits: string; initialTag: string; instrumentTag: string; detTag: string }[];
  triggers: { id: string; onKinds: { name: string; label: string }[]; starts: string; policy: string }[];
  views: string[];
  termination: string;
  routes: { id: string; slot: string }[];
  run: { k: string; v: string }[];
  events: { name: string; label: string; by: string[]; fires: string[] }[];
}

export function structureView(graph: TopologyGraph | null): StructureView {
  const producers = graph ? graph.producers : [];
  const triggers = graph ? graph.triggers : [];
  const outside = new Set(graph?.outside ?? []);
  // b.instrument registers a trigger named after the producer it starts (kernel/topology.py).
  const instruments = new Set(triggers.filter((t) => t.id === t.starts).map((t) => t.starts));
  const kinds = new Set<string>();
  producers.forEach((p) => p.emits.forEach((k) => kinds.add(k)));
  triggers.forEach((t) => (t.on || []).forEach((k) => kinds.add(k)));
  outside.forEach((k) => kinds.add(k));
  // The topology's kinds first, then the runtime's, each in code-unit order.
  const order = [...kinds].sort((a, b) => (isLifecycleKind(a) === isLifecycleKind(b) ? (a < b ? -1 : a > b ? 1 : 0) : isLifecycleKind(a) ? 1 : -1));
  const baseline = graph?.baseline ?? {};
  const config = graph?.config ?? {};
  return {
    empty: producers.length === 0,
    producers: producers.map((p) => ({
      name: p.kind,
      emits: p.emits && p.emits.length ? p.emits.join(", ") : "—",
      initialTag: p.initial ? "initial" : "",
      instrumentTag: instruments.has(p.kind) ? "instrument" : "",
      detTag: p.deterministic ? "deterministic" : "",
    })),
    triggers: triggers.map((t) => ({
      id: t.id, starts: t.starts, policy: t.policy || "—",
      onKinds: (t.on && t.on.length ? t.on : String(t.onKind || "").split(", ").filter(Boolean)).map((k) => ({ name: k, label: kindLabel(k) })),
    })),
    views: graph?.views ?? [],
    termination: (graph?.termination ?? []).join(" · ") || "—",
    routes: (graph?.routes ?? []).map((r) => ({ id: r.id, slot: r.slot })),
    run: [
      { k: "vocab version", v: String(config.vocab_version ?? "—") },
      { k: "exports", v: graph?.exports && graph.exports.length ? graph.exports.join(", ") : "none" },
      ...Object.keys(baseline).sort().map((k) => ({ k: "baseline · " + k, v: String(baseline[k]) })),
    ],
    events: order.map((k) => {
      const by = producers.filter((p) => p.emits.includes(k)).map((p) => p.kind);
      if (isLifecycleKind(k)) by.push("runtime");
      if (outside.has(k)) by.push("outside");
      const fires = triggers.filter((t) => (t.on || []).includes(k)).map((t) => t.id);
      return { name: k, label: kindLabel(k), by, fires: fires.length ? fires : ["—"] };
    }),
  };
}
