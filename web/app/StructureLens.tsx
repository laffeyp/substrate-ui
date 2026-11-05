// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's structure lens (sprint 301; plan PLAN-2026-11-04-shell-to-react-r5.md, D4): the focused
// session's topology, section by section: producers, triggers, views, ends, routes, run, events.
// Styles are the template's (reveal.html structure block) and web/app/structure.css; the lists come
// from web/app/derive/structure.ts, the graph from web/app/state/stream.ts.

import * as React from "react";
import { useMemo, useSyncExternalStore } from "react";
import { STRUCTURE_DEFS, structureView } from "./derive/structure";
import { stream } from "./state/stream";
import "./structure.css";

const col: React.CSSProperties = { color: "#62676f", fontSize: 10, letterSpacing: ".12em" };
const tag: React.CSSProperties = { color: "#82a5c8", fontSize: 10.5 };
const grid = (columns: string): React.CSSProperties => ({ display: "grid", gridTemplateColumns: columns, columnGap: 24, rowGap: 2, alignItems: "baseline" });

function Heading({ def, first, children }: { def: string; first?: boolean; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="st-h" title={def} style={{ color: "#62676f", fontSize: 10, letterSpacing: ".12em", cursor: "help", textDecoration: "underline dotted rgba(255,255,255,.18)", textUnderlineOffset: 3, display: "inline-block", margin: first ? "6px 0 6px" : "16px 0 6px" }}>{children}</div>
  );
}

const Cols = ({ names }: { names: string[] }) => <>{names.map((n) => <span key={n} className="st-col" style={col}>{n}</span>)}</>;
const Stack = ({ items, attr }: { items: string[]; attr?: string }) => (
  <span className="st-stack" style={{ display: "flex", flexDirection: "column" }}>
    {items.map((it, at) => <span key={at} {...(attr ? { [attr]: it } : {})}>{it}</span>)}
  </span>
);

export function StructureLens(): React.ReactElement {
  const graph = useSyncExternalStore(stream.subscribe, stream.getSnapshot).topology;
  const view = useMemo(() => structureView(graph), [graph]);
  return (
    <div style={{ padding: "10px 16px 16px", fontSize: 12.5, lineHeight: 1.9 }}>
      {view.empty ? (
        <div style={{ color: "#62676f", fontSize: 11.5 }}>no topology loaded — bind a session or open a record to see its producers and triggers.</div>
      ) : (
        <div className="st">
          <Heading def={STRUCTURE_DEFS.producers} first>PRODUCERS ({view.producers.length})</Heading>
          <div className="st-grid" style={grid("minmax(0,max-content) minmax(120px,1fr)")}>
            <Cols names={["NAME", "EMITS EVENTS"]} />
            {view.producers.map((p) => (
              <div key={p.name} className="st-row" style={{ display: "contents" }}>
                <span className="st-cell st-first">
                  <span data-topo-producer={p.name} style={{ color: "#e2e5e9" }}>{p.name}</span>{" "}
                  <span className="st-tag" title={STRUCTURE_DEFS.initial} style={tag}>{p.initialTag}</span>{" "}
                  <span className="st-tag" title={STRUCTURE_DEFS.instrument} style={tag}>{p.instrumentTag}</span>{" "}
                  <span className="st-tag" title={STRUCTURE_DEFS.deterministic} style={{ ...tag, color: "#62676f" }}>{p.detTag}</span>
                </span>
                <span className="st-cell" style={{ color: "#9aa0a8" }}><span className="st-lab">emits</span>{p.emits}</span>
              </div>
            ))}
          </div>
          <div style={{ color: "#4a4e55", fontSize: 10.5, marginTop: 4 }}>initial — starts when the run opens · hover a heading or a tag for what it is</div>
          <Heading def={STRUCTURE_DEFS.triggers}>TRIGGERS ({view.triggers.length})</Heading>
          <div className="st-grid" style={grid("minmax(min-content,1fr) minmax(min-content,max-content) max-content max-content")}>
            <Cols names={["NAME", "ON EVENT", "STARTS PRODUCER", "POLICY"]} />
            {view.triggers.map((t) => (
              <div key={t.id} className="st-row" style={{ display: "contents" }}>
                <span className="st-cell st-first" data-topo-trigger={t.id} style={{ color: "#c9a0b8" }}>{t.id}</span>
                <span className="st-cell" style={{ color: "#9aa0a8" }}><span className="st-lab">on</span><Stack items={t.onKinds.map((k) => k.label)} /></span>
                <span className="st-cell" style={{ color: "#e2e5e9" }}><span className="st-lab">starts</span>{t.starts}</span>
                <span className="st-cell" style={{ color: "#62676f" }}><span className="st-lab">policy</span>{t.policy}</span>
              </div>
            ))}
          </div>
          <Heading def={STRUCTURE_DEFS.views}>VIEWS ({view.views.length})</Heading>
          <div style={{ display: "flex", flexWrap: "wrap", columnGap: 16, color: "#9aa0a8" }}>
            {view.views.map((v) => <span key={v} data-topo-view={v}>{v}</span>)}
          </div>
          <Heading def={STRUCTURE_DEFS.ends}>ENDS</Heading>
          <div data-topo-ends="1" style={{ color: "#9aa0a8", overflowWrap: "anywhere" }}>{view.termination}</div>
          <Heading def={STRUCTURE_DEFS.routes}>ROUTES ({view.routes.length})</Heading>
          {view.routes.length === 0 ? <div data-topo-routes-none="1" style={{ color: "#62676f" }}>none</div> : (
            <div className="st-grid" style={grid("max-content minmax(0,1fr)")}>
              <Cols names={["NAME", "SLOT"]} />
              {view.routes.map((r) => (
                <div key={r.id} className="st-row" style={{ display: "contents" }}>
                  <span className="st-cell st-first" data-topo-route={r.id} style={{ color: "#e2e5e9" }}>{r.id}</span>
                  <span className="st-cell" style={{ color: "#9aa0a8" }}><span className="st-lab">slot</span>{r.slot}</span>
                </div>
              ))}
            </div>
          )}
          <Heading def={STRUCTURE_DEFS.run}>RUN</Heading>
          <div className="st-grid" style={grid("max-content minmax(0,1fr)")}>
            {view.run.map((r) => (
              <div key={r.k} className="st-row" style={{ display: "contents" }}>
                <span className="st-cell st-first" style={{ color: "#62676f" }}>{r.k}</span>
                <span className="st-cell" style={{ color: "#9aa0a8", overflowWrap: "anywhere" }}>{r.v}</span>
              </div>
            ))}
          </div>
          <Heading def={STRUCTURE_DEFS.events}>EVENTS ({view.events.length})</Heading>
          <div className="st-grid" style={grid("minmax(0,max-content) minmax(0,max-content) minmax(120px,1fr)")}>
            <Cols names={["EVENT", "EMITTED BY", "FIRES TRIGGERS"]} />
            {view.events.map((e) => (
              <div key={e.name} className="st-row" style={{ display: "contents" }}>
                <span className="st-cell st-first" data-topo-event={e.name} style={{ color: "#e2e5e9" }}>{e.label}</span>
                <span className="st-cell" style={{ color: "#9aa0a8" }}><span className="st-lab">emitted by</span><Stack items={e.by} attr="data-topo-event-by" /></span>
                <span className="st-cell" style={{ color: "#c9a0b8" }}><span className="st-lab">fires</span><Stack items={e.fires} /></span>
              </div>
            ))}
          </div>
          <div style={{ color: "#4a4e55", fontSize: 10.5, marginTop: 16, lineHeight: 1.6 }}>Not in the record: each trigger’s predicate and input builder, and each view’s type, are code.</div>
        </div>
      )}
    </div>
  );
}
