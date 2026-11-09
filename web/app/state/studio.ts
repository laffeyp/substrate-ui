// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Studio's state and its spec (sprint 334): moved from reveal_component.ts as it was before sprint 242
// removed it, which a refactor may not do (BLACKBOARD, 2026-11-05 failure entry). The page is inert
// ("coming soon…") until the Studio rewrite to a topology viewer lands
// (FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md, section 1, in
// process/planning/2026-09-27-post-ship-directions/); its state and actions are carried over as they
// were. It lived on the window's component, so it lasts across closing and opening the page.

import { createStore } from "../store";

export interface StudioProducer { name: string; initial: boolean; emits: string; model?: boolean; prompt?: string }
export interface StudioView { name: string; def: string }
export interface StudioTrigger { id: string; view: string; op: string; n: string; starts: string; on?: string; policy?: string; reads?: string }
export interface StudioRoute { id: string; kind: string; slot: string }

export interface StudioState {
  studioView: "form" | "canvas";
  studioOut: string;
  studioOutColor: string;
  topoName: string;
  prods: StudioProducer[];
  sviews: StudioView[];
  trigs: StudioTrigger[];
  sroutes: StudioRoute[];
  termKind: string;
  termOf: string;
  termN: string;
  termSeconds?: string;
  responder: string;
  seed: string;
  model: string;
  cardPos: Record<string, { x: number; y: number }>;
}

const INITIAL: StudioState = {
  studioView: "form", studioOut: "author a topology, then validate or build.", studioOutColor: "#62676f",
  topoName: "adversarial_pair_review",
  prods: [{ name: "builder", initial: true, emits: "Draft" }, { name: "attacker", initial: false, emits: "Critique" }, { name: "judge", initial: false, emits: "Verdict" }],
  sviews: [{ name: "draft_count", def: "KindCount(of Draft)" }, { name: "critique_buf", def: "KindBuffer(of Critique)" }],
  trigs: [{ id: "attack", view: "draft_count", op: "≥", n: "1", starts: "attacker" }, { id: "adjudicate", view: "critique_buf", op: "≥", n: "2", starts: "judge" }],
  sroutes: [{ id: "seed-judge", kind: "Draft", slot: "judge.draft" }],
  termKind: "threshold_count", termOf: "Verdict", termN: "1",
  responder: "deterministic", seed: "0", model: "llama3.2",
  cardPos: { builder: { x: 80, y: 80 }, attacker: { x: 390, y: 190 }, judge: { x: 700, y: 86 } },
};

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateStudio";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<StudioState>> | undefined>;
export const studio = scope[KEY] ?? (scope[KEY] = createStore<StudioState>(INITIAL));

type ListKey = "prods" | "sviews" | "trigs" | "sroutes";

export function updItem(key: ListKey, at: number, field: string, value: string): void {
  studio.set((s) => ({ [key]: (s[key] as unknown as Record<string, unknown>[]).map((x, j) => (j === at ? { ...x, [field]: value } : x)) } as Partial<StudioState>));
}

export function rmItem(key: ListKey, at: number): void {
  studio.set((s) => ({ [key]: (s[key] as unknown[]).filter((_, j) => j !== at) } as Partial<StudioState>));
}

/** The template's checks before validate or build. */
export function studioErrors(st: StudioState): string[] {
  const errs: string[] = [];
  if (!/^[a-z0-9_]+$/.test(st.topoName)) errs.push("name must be [a-z0-9_]+");
  if (!st.prods.length) errs.push("no producers");
  const names = st.prods.map((p) => p.name);
  if (!st.prods.some((p) => p.initial)) errs.push("no initial producer — nothing runs on the opening cohort");
  st.trigs.forEach((t) => {
    if (!names.includes(t.starts)) errs.push("trigger " + t.id + " starts unknown producer \"" + t.starts + "\"");
    if (t.view && !st.sviews.find((v) => v.name === t.view)) errs.push("trigger " + t.id + " reads unknown view \"" + t.view + "\"");
  });
  const emitted = new Set<string>();
  st.prods.forEach((p) => String(p.emits).split(",").map((x) => x.trim()).filter(Boolean).forEach((k) => emitted.add(k)));
  const consumed = new Set([st.termOf]);
  st.sviews.forEach((v) => { const m = String(v.def).match(/of\s+(\w+)/); if (m) consumed.add(m[1]); });
  st.sroutes.forEach((r) => consumed.add(r.kind));
  emitted.forEach((k) => { if (!consumed.has(k)) errs.push("emitted kind " + k + " is neither consumed nor terminal"); });
  return errs;
}

/** Studio state → the server's spec, as the template built it (the fields builder.py reads: kind,
 *  emits, initial, model, prompt on producers; name, kind, of on views; id, on, predicate, starts,
 *  policy, reads on triggers; id, of, slot on routes; termination, responder, seed, model_name). */
export function studioSpec(st: StudioState): Record<string, unknown> {
  const producers = st.prods.map((p) => ({
    kind: String(p.name || "").trim(),
    emits: String(p.emits || "").split(",").map((x) => x.trim()).filter(Boolean),
    initial: !!p.initial, model: !!p.model, prompt: String(p.prompt || "").trim(),
  })).filter((p) => p.kind);
  const views = st.sviews.map((v) => {
    const def = String(v.def || "");
    const m = def.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*of\s+([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*$/);
    const kind = m ? m[1] : def.split("(")[0].trim();
    const of = m ? m[2] : (def.match(/of\s+([A-Za-z_][A-Za-z0-9_]*)/) || [])[1] || "";
    return { name: String(v.name || "").trim(), kind, of };
  }).filter((v) => v.name && v.of);
  const triggers = st.trigs.map((t) => {
    const view = String(t.view || "").trim();
    const rawOp = String(t.op || "≥");
    const op = rawOp === "≥" ? ">=" : rawOp === "≤" ? "<=" : rawOp === "≠" ? "!=" : rawOp;
    const predicate = view ? { view, op, n: Number(t.n) || 0 } : null;
    return { id: String(t.id || "").trim(), on: String(t.on || "").trim(), predicate, starts: String(t.starts || "").trim(), policy: String(t.policy || "PerEvent"), reads: String(t.reads || "").trim() };
  }).filter((t) => t.id && t.starts);
  const routes = st.sroutes.map((r) => ({ id: String(r.id || "").trim(), of: String(r.kind || "").trim(), slot: String(r.slot || "").trim() })).filter((r) => r.id && r.of && r.slot);
  const termKind = st.termKind || "quiescence_with_watchdog";
  let termination: Record<string, unknown>;
  if (termKind === "all_completed" || termKind === "cancel_all_others") termination = { kind: termKind };
  else if (termKind === "threshold_count") termination = { kind: "threshold_count", of: String(st.termOf || ""), n: Number(st.termN) || 1 };
  else termination = { kind: "quiescence_with_watchdog", seconds: Number(st.termSeconds) || 1 };
  return {
    name: String(st.topoName || "authored").trim(), producers, views, triggers, routes, termination,
    responder: st.responder || "deterministic", seed: Number(st.seed) || 0, model_name: String(st.model || "").trim(),
  };
}

interface SpecVm {
  validateSpec?(spec: Record<string, unknown>): Promise<{ valid: boolean; error?: string }>;
  buildSpec?(spec: Record<string, unknown>): Promise<{ ok: boolean; run?: Record<string, unknown>; error?: string }>;
}
const vm = () => (window as unknown as { __vm?: SpecVm }).__vm;

export async function doValidate(): Promise<void> {
  const errs = studioErrors(studio.getSnapshot());
  if (errs.length) { studio.set({ studioOut: "invalid — " + errs.join(" · "), studioOutColor: "#c26058" }); return; }
  studio.set({ studioOut: "validating…", studioOutColor: "#62676f" });
  const v = vm();
  if (!v || typeof v.validateSpec !== "function") { studio.set({ studioOut: "controller unavailable", studioOutColor: "#c26058" }); return; }
  const r = await v.validateSpec(studioSpec(studio.getSnapshot()));
  if (r.valid) studio.set({ studioOut: "ok — builds through the real TopologyBuilder", studioOutColor: "#82a5c8" });
  else studio.set({ studioOut: "invalid — " + (r.error || ""), studioOutColor: "#c26058" });
}

export async function doBuild(): Promise<void> {
  const errs = studioErrors(studio.getSnapshot());
  if (errs.length) { studio.set({ studioOut: "build refused — " + errs.join(" · "), studioOutColor: "#c26058" }); return; }
  studio.set({ studioOut: "building & launching…", studioOutColor: "#62676f" });
  const v = vm();
  if (!v || typeof v.buildSpec !== "function") { studio.set({ studioOut: "controller unavailable", studioOutColor: "#c26058" }); return; }
  const r = await v.buildSpec(studioSpec(studio.getSnapshot()));
  if (!r.ok) { studio.set({ studioOut: "build rejected — " + (r.error || ""), studioOutColor: "#c26058" }); return; }
  const runName = String((r.run && r.run.name) || "");
  const status = String((r.run && r.run.status) || "unknown");
  studio.set({ studioOut: "built — " + runName + " (" + status + ") ▸", studioOutColor: "#82a5c8" });
}

/** A card dragged on the canvas moves with the pointer, held inside the canvas. */
export function dragCard(name: string, dx: number, dy: number): void {
  studio.set((s) => {
    const p = s.cardPos[name] || { x: 100, y: 100 };
    return { cardPos: { ...s.cardPos, [name]: { x: Math.max(0, Math.min(800, p.x + dx)), y: Math.max(0, Math.min(360, p.y + dy)) } } };
  });
}
