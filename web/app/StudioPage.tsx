// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Studio (sprint 334): "studio · author a topology", as the dc-runtime template (`web/reveal.html`
// at `d4322e1`) drew its studio block before sprint 243 removed it, which a refactor may not do
// (BLACKBOARD, 2026-11-05 failure entry). The page is inert until the Studio rewrite to a topology
// viewer lands (FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md, section 1, in
// process/planning/2026-09-27-post-ship-directions/): everything under the header is dimmed and
// takes no pointer. Its state and actions are web/app/state/studio.ts.

import * as React from "react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { doBuild, doValidate, dragCard, rmItem, studio, updItem, type StudioState } from "./state/studio";
import { emit as emitSignal } from "../vm/instrumentation/sdd";
import { PageDrawnPage, Signal } from "../vm/signals.gen";

const input: React.CSSProperties = { background: "#1a1c20", border: "1px solid rgba(255,255,255,.07)", borderRadius: 5, padding: "5px 11px", color: "#e2e5e9", fontFamily: "inherit", fontSize: 12, outline: "none" };
const heading: React.CSSProperties = { fontSize: 10, letterSpacing: ".12em", color: "#62676f", margin: "16px 0 6px" };
const add: React.CSSProperties = { color: "#82a5c8", border: "1px solid rgba(255,255,255,.09)", borderRadius: 4, padding: "0 7px", letterSpacing: 0, cursor: "pointer" };
const rm: React.CSSProperties = { color: "#62676f", border: "1px solid rgba(255,255,255,.09)", borderRadius: 4, padding: "0 7px", cursor: "pointer" };
const row: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginBottom: 6 };
const note: React.CSSProperties = { fontSize: 11, color: "#62676f" };
const set = (patch: Partial<StudioState>) => studio.set(patch);
const TERM_KINDS = ["quiescence_with_watchdog", "all_completed", "threshold_count", "cancel_all_others", "any_of", "all_of"];

type Edge = { d: string; stroke: string; dash: string };
type Label = { x: number; y: number; fill: string; text: string };

function canvasGeometry(st: StudioState): { edges: Edge[]; labels: Label[]; slots: { slot: string; x: number; y: number }[] } {
  const posOf = (n: string) => { const i = st.prods.findIndex((p) => p.name === n); return st.cardPos[n] || { x: 120 + (Math.max(i, 0) % 3) * 260, y: 300 }; };
  const srcOfKind = (k: string) => { const p = st.prods.find((pr) => String(pr.emits).split(",").map((x) => x.trim()).includes(k)); return p ? p.name : null; };
  const edges: Edge[] = [];
  const labels: Label[] = [];
  st.trigs.forEach((t) => {
    const v = st.sviews.find((vw) => vw.name === t.view); const m = v ? String(v.def).match(/of\s+(\w+)/) : null;
    const src = m ? srcOfKind(m[1]) : null; if (!src || !st.prods.find((p) => p.name === t.starts)) return;
    const a = posOf(src), b = posOf(t.starts);
    edges.push({ d: "M " + (a.x + 140) + " " + (a.y + 26) + " C " + (a.x + 210) + " " + (a.y + 26) + " " + (b.x - 70) + " " + (b.y + 26) + " " + b.x + " " + (b.y + 26), stroke: "#62676f", dash: "" });
    labels.push({ x: (a.x + b.x) / 2 - 55, y: (a.y + b.y) / 2 + 16, fill: "#c9a0b8", text: t.id + " · " + t.view + " ≥ " + t.n });
  });
  st.sroutes.forEach((r) => {
    const src = srcOfKind(r.kind); const tgt = String(r.slot).split(".")[0]; if (!src || !st.prods.find((p) => p.name === tgt)) return;
    const a = posOf(src), b = posOf(tgt);
    edges.push({ d: "M " + (a.x + 140) + " " + (a.y + 10) + " C " + (a.x + 240) + " " + (a.y - 40) + " " + (b.x - 60) + " " + (b.y - 30) + " " + (b.x + 150) + " " + (b.y + 4), stroke: "#a08fc9", dash: "4 3" });
    labels.push({ x: (a.x + b.x) / 2 - 55, y: Math.max(6, Math.min(a.y, b.y) - 42), fill: "#a08fc9", text: r.id + " · " + r.kind + " → " + r.slot });
  });
  const slots = st.sroutes.map((r) => {
    const tgt = String(r.slot).split(".")[0]; const i = st.prods.findIndex((p) => p.name === tgt); if (i < 0) return null;
    const pos = st.cardPos[tgt] || { x: 120 + (i % 3) * 260, y: 300 };
    return { slot: String(r.slot).split(".")[1] || r.slot, x: pos.x + 150, y: pos.y - 2 };
  }).filter((x): x is { slot: string; x: number; y: number } => !!x);
  return { edges, labels, slots };
}

export function StudioPage(): React.ReactElement {
  const st = useSyncExternalStore(studio.subscribe, studio.getSnapshot);
  // PAGE_DRAWN (sprint 372): the form's rows, its producers, views, triggers and routes, when the
  // page opens and when their count changes. The page is inert: no endpoint stands behind it.
  const rows = st.prods.length + st.sviews.length + st.trigs.length + st.sroutes.length;
  useEffect(() => { emitSignal(Signal.PAGE_DRAWN, { page: PageDrawnPage.STUDIO, rows, inert: true }); }, [rows]);
  // A card dragged on the canvas follows the pointer while the button is down.
  const drag = useRef<string | null>(null);
  useEffect(() => {
    const move = (ev: MouseEvent) => { if (drag.current) dragCard(drag.current, ev.movementX, ev.movementY); };
    const up = () => { drag.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);
  const tab = (on: boolean): React.CSSProperties => ({ cursor: "pointer", padding: "2px 10px", whiteSpace: "nowrap", color: on ? "#d7dade" : "#62676f", background: on ? "#2e3138" : "transparent" });
  const resp = (on: boolean): React.CSSProperties => ({ cursor: "pointer", padding: "3px 10px", color: on ? "#d7dade" : "#62676f", background: on ? "#2e3138" : "transparent" });
  const geo = canvasGeometry(st);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#212327" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 40px 0", fontSize: 11.5, flex: "none" }}>
        <span style={{ color: "#62676f" }}>studio · author a topology</span>
        <span style={{ flex: "none", display: "flex", border: "1px solid rgba(255,255,255,.09)", borderRadius: 4, overflow: "hidden" }}>
          <span onClick={() => set({ studioView: "form" })} style={tab(st.studioView === "form")}>form</span>
          <span onClick={() => set({ studioView: "canvas" })} style={tab(st.studioView === "canvas")}>canvas</span>
        </span>
        <span style={{ marginLeft: "auto", color: "#62676f" }}>coming soon…</span>
      </div>
      <div style={{ opacity: 0.4, pointerEvents: "none", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {st.studioView === "form" && (
          <div style={{ flex: 1, overflow: "auto", padding: "14px 40px 8px" }}>
            <div style={{ maxWidth: 880, fontSize: 12 }}>
              <div style={{ ...heading, margin: "8px 0 6px" }}>TOPOLOGY NAME</div>
              <input value={st.topoName} onChange={(ev) => set({ topoName: ev.target.value })} style={{ ...input, minWidth: 240 }} />
              <div style={heading}>PRODUCERS <span onClick={() => set({ prods: [...st.prods, { name: "producer_" + (st.prods.length + 1), initial: false, emits: "" }] })} style={add}>+ producer</span></div>
              {st.prods.map((p, i) => (
                <div key={i} style={row}>
                  <input value={p.name} onChange={(ev) => updItem("prods", i, "name", ev.target.value)} style={{ ...input, width: 130 }} />
                  <span onClick={() => set({ prods: st.prods.map((x, j) => (j === i ? { ...x, initial: !x.initial } : x)) })} style={{ cursor: "pointer", color: "#9aa0a8", fontSize: 11, display: "flex", gap: 5, alignItems: "center" }}>
                    <span style={{ width: 11, height: 11, border: `1px solid ${p.initial ? "#82a5c8" : "#4a4e55"}`, borderRadius: 2, background: p.initial ? "#82a5c8" : "transparent", display: "inline-block" }} />initial
                  </span>
                  <span style={{ color: "#62676f" }}>emits</span>
                  <input value={p.emits} onChange={(ev) => updItem("prods", i, "emits", ev.target.value)} style={{ ...input, minWidth: 180, color: "#9aa0a8" }} />
                  <span onClick={() => rmItem("prods", i)} style={rm}>✕</span>
                </div>
              ))}
              <div style={note}>a Producer brings a computation; "initial" Producers run on the run's opening cohort. emits = comma-separated event kinds.</div>
              <div style={heading}>VIEWS <span onClick={() => set({ sviews: [...st.sviews, { name: "view_" + (st.sviews.length + 1), def: "KindCount(of )" }] })} style={add}>+ view</span></div>
              {st.sviews.map((v, i) => (
                <div key={i} style={row}>
                  <input value={v.name} onChange={(ev) => updItem("sviews", i, "name", ev.target.value)} style={{ ...input, width: 130, color: "#88b0d0" }} />
                  <span style={{ color: "#62676f" }}>=</span>
                  <input value={v.def} onChange={(ev) => updItem("sviews", i, "def", ev.target.value)} style={{ ...input, minWidth: 210, color: "#9aa0a8" }} />
                  <span onClick={() => rmItem("sviews", i)} style={rm}>✕</span>
                </div>
              ))}
              <div style={{ ...note, marginTop: 5 }}>a View is a running projection of the Bus a Predicate reads. KindCount(of) counts a kind; KindBuffer(of) buffers it.</div>
              <div style={heading}>TRIGGERS <span onClick={() => set({ trigs: [...st.trigs, { id: "trigger_" + (st.trigs.length + 1), view: "", op: "≥", n: "1", starts: "" }] })} style={add}>+ trigger</span></div>
              {st.trigs.map((t, i) => (
                <div key={i} style={{ ...row, flexWrap: "wrap" }}>
                  <input value={t.id} onChange={(ev) => updItem("trigs", i, "id", ev.target.value)} style={{ ...input, width: 130, color: "#c9a0b8" }} />
                  <span style={{ color: "#62676f" }}>when</span>
                  <input value={t.view} onChange={(ev) => updItem("trigs", i, "view", ev.target.value)} style={{ ...input, width: 130, color: "#88b0d0" }} />
                  <span style={{ color: "#9aa0a8" }}>≥</span>
                  <input value={t.n} onChange={(ev) => updItem("trigs", i, "n", ev.target.value)} style={{ ...input, width: 44 }} />
                  <span style={{ color: "#62676f" }}>→ starts</span>
                  <input value={t.starts} onChange={(ev) => updItem("trigs", i, "starts", ev.target.value)} style={{ ...input, width: 120 }} />
                  <span onClick={() => rmItem("trigs", i)} style={rm}>✕</span>
                </div>
              ))}
              <div style={{ ...note, marginTop: 5 }}>a Trigger starts a Producer when its Predicate over a View matures. predicate: View &lt;op&gt; n — leave the View blank for always.</div>
              <div style={heading}>ROUTES <span onClick={() => set({ sroutes: [...st.sroutes, { id: "route_" + (st.sroutes.length + 1), kind: "", slot: "" }] })} style={add}>+ route</span></div>
              {st.sroutes.map((r, i) => (
                <div key={i} style={{ ...row, flexWrap: "wrap" }}>
                  <input value={r.id} onChange={(ev) => updItem("sroutes", i, "id", ev.target.value)} style={{ ...input, width: 130, color: "#a08fc9" }} />
                  <span style={{ color: "#62676f" }}>stages</span>
                  <input value={r.kind} onChange={(ev) => updItem("sroutes", i, "kind", ev.target.value)} style={{ ...input, width: 110, color: "#9aa0a8" }} />
                  <span style={{ color: "#62676f" }}>→ slot</span>
                  <input value={r.slot} onChange={(ev) => updItem("sroutes", i, "slot", ev.target.value)} style={{ ...input, width: 140, color: "#a08fc9" }} />
                  <span onClick={() => rmItem("sroutes", i)} style={rm}>✕</span>
                </div>
              ))}
              <div style={{ ...note, marginTop: 5 }}>a Route stages an event of a kind into a future Producer's named input slot — carrying data into instances the Trigger will create.</div>
              <div style={heading}>TERMINATION POLICY</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {TERM_KINDS.map((k) => <span key={k} onClick={() => set({ termKind: k })} style={{ cursor: "pointer", padding: "3px 10px", borderRadius: 4, fontSize: 11.5, color: st.termKind === k ? "#a08fc9" : "#62676f", background: st.termKind === k ? "#2e3138" : "transparent" }}>{k}</span>)}
              </div>
              {st.termKind === "threshold_count" && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <span style={{ color: "#62676f" }}>kind</span>
                  <input value={st.termOf} onChange={(ev) => set({ termOf: ev.target.value })} style={{ ...input, width: 120 }} />
                  <span style={{ color: "#62676f" }}>n</span>
                  <input value={st.termN} onChange={(ev) => set({ termN: ev.target.value })} style={{ ...input, width: 44 }} />
                  <span style={{ color: "#62676f", fontSize: 11 }}>· any_of / all_of compose member policies</span>
                </div>
              )}
            </div>
          </div>
        )}
        {st.studioView === "canvas" && (
          <div style={{ flex: 1, overflow: "auto", padding: "14px 40px 8px" }}>
            <div style={{ fontSize: 11, color: "#62676f", marginBottom: 8 }}>node-graph — drag the Producer cards; solid edges are Triggers; dashed edges feed a Route's named slot</div>
            <div style={{ position: "relative", height: 420, border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, background: "#1a1c20", overflow: "hidden", width: 960 }}>
              <svg viewBox="0 0 960 420" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: 960, height: 420, pointerEvents: "none" }}>
                {geo.edges.map((ed, i) => <path key={i} d={ed.d} stroke={ed.stroke} strokeWidth="1.5" fill="none" strokeDasharray={ed.dash} />)}
              </svg>
              {geo.labels.map((cl, i) => <div key={i} style={{ position: "absolute", left: cl.x, top: cl.y, color: cl.fill, fontSize: 10, background: "rgba(26,28,32,.88)", borderRadius: 4, padding: "1px 6px", pointerEvents: "none", whiteSpace: "nowrap" }}>{cl.text}</div>)}
              {st.prods.map((p, i) => {
                const pos = st.cardPos[p.name] || { x: 120 + (i % 3) * 260, y: 300 };
                return (
                  <div key={i} onMouseDown={(ev) => { ev.preventDefault(); drag.current = p.name; }} style={{ position: "absolute", left: pos.x, top: pos.y, background: "#26292e", border: `1px solid ${p.initial ? "#82a5c8" : "rgba(255,255,255,.12)"}`, borderRadius: 8, padding: "8px 12px", cursor: "grab", userSelect: "none", minWidth: 110, pointerEvents: "auto" }}>
                    <div style={{ color: "#e2e5e9", fontWeight: 600 }}>{p.name}</div>
                    <div style={{ color: "#82a5c8", fontSize: 11 }}>emits {p.emits || "—"}</div>
                    {p.initial && <div style={{ color: "#62676f", fontSize: 10 }}>▸ initial</div>}
                  </div>
                );
              })}
              {geo.slots.map((sn, i) => <div key={i} style={{ position: "absolute", left: sn.x, top: sn.y, background: "rgba(160,143,201,.12)", border: "1px dashed #a08fc9", borderRadius: 6, padding: "5px 9px", color: "#a08fc9", fontSize: 11 }}>slot: {sn.slot}</div>)}
            </div>
          </div>
        )}
        <div style={{ flex: "none", display: "flex", gap: 10, alignItems: "center", padding: "10px 40px 16px", flexWrap: "wrap", fontSize: 12 }}>
          <span style={{ color: "#62676f", fontSize: 11 }}>responder</span>
          <span style={{ flex: "none", display: "flex", border: "1px solid rgba(255,255,255,.09)", borderRadius: 4, overflow: "hidden", fontSize: 11.5 }}>
            <span onClick={() => set({ responder: "deterministic" })} style={resp(st.responder === "deterministic")}>deterministic</span>
            <span onClick={() => set({ responder: "ollama" })} style={resp(st.responder === "ollama")}>ollama</span>
          </span>
          <span style={{ color: "#62676f", fontSize: 11 }}>seed</span>
          <input value={st.seed} onChange={(ev) => set({ seed: ev.target.value })} style={{ ...input, width: 44 }} />
          <span style={{ color: "#62676f", fontSize: 11 }}>model</span>
          <input value={st.model} onChange={(ev) => set({ model: ev.target.value })} style={{ ...input, width: 100 }} />
          <span onClick={() => { void doValidate(); }} style={{ padding: "6px 16px", background: "#2e3138", borderRadius: 5, color: "#d7dade", cursor: "pointer" }}>validate</span>
          <span onClick={() => { void doBuild(); }} style={{ padding: "6px 16px", background: "#1a1c20", border: "1px solid #82a5c8", borderRadius: 5, color: "#82a5c8", cursor: "pointer", fontWeight: 600 }}>build &amp; launch ▸</span>
          <span style={{ color: "#62676f", fontSize: 11 }}>deterministic = pure + seeded (replay-stable) · ollama = a real local LLM, fails loudly if not running</span>
          <div style={{ flexBasis: "100%", padding: "10px 13px", background: "#1a1c20", borderRadius: 6, color: st.studioOutColor, fontSize: 12 }}><span style={{ color: "#62676f", marginRight: 8 }}>output</span>{st.studioOut}</div>
        </div>
      </div>
    </div>
  );
}
