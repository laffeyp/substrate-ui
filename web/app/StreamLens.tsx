// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's stream lens (sprint 291; plan PLAN-2026-11-04-shell-to-react-r5.md, D2, F328): the lifelines'
// legend, one row per envelope with its seq, time, kind and gist, and under the lit row the inspector.
// Styles are the template's (reveal.html stream block). The rows come from web/app/derive/stream.ts;
// the record from web/app/state/stream.ts, the view's state from web/app/state/meta.ts and find's
// query from web/app/state/find.ts.
//
// F328: the inspector showed the payload with the producer's kind and instance merged in, which the
// lanes read; it now shows the record's payload as it arrived, and the producer on its own line.

import * as React from "react";
import { useMemo, useSyncExternalStore } from "react";
import { inspectorView, LANES, lensRows, streamRows, streamSpans, type LensRow, type StreamRow } from "./derive/stream";
import { eventTimes, type EventTime } from "../reveal/timeline";
import { find } from "./state/find";
import { stream } from "./state/stream";
import { meta, pickSeq } from "./state/meta";
import { SeqSelectedHow } from "../vm/signals.gen";
import { GraphDirection, RevealLevel } from "../vm/kinds";
import "./hover.css";

const LANE_W = LANES.length * 12 - 4;
const LEGEND_TITLE = "one lane per producer kind, derived from the record — spans run ToolCall→ToolResult; ⑂ child spans violet on the tool lane; sub-tracks appear only under real concurrency";
const label: React.CSSProperties = { color: "#62676f", fontSize: 10, letterSpacing: ".1em", paddingTop: 2 };
const value: React.CSSProperties = { color: "#9aa0a8" };

function Cells({ row, conn }: { row: LensRow; conn: boolean }): React.ReactElement {
  const c = conn ? row.conn : null;
  return (
    <span style={{ width: LANE_W, display: "flex", gap: 4, flex: "none", position: conn ? "relative" : undefined }}>
      {row.cells.map((bg, at) => <span key={at} style={{ width: 8, borderRadius: 2, background: bg }} />)}
      {c && <>
        <span style={{ position: "absolute", left: c.l, top: "50%", width: Math.max(c.w, 2), height: 2, background: c.c, opacity: 0.75, transform: "translateY(-1px)" }} />
        <span style={{ position: "absolute", left: c.dot, top: "50%", width: 5, height: 5, borderRadius: "50%", background: c.c, transform: "translate(-2px,-2.5px)" }} />
      </>}
    </span>
  );
}

function Inspector({ row, lens, down, times }: { row: StreamRow; lens: LensRow; down: boolean; times: ReadonlyMap<number, EventTime> }): React.ReactElement {
  const view = inspectorView(row, times);
  return (
    <div style={{ display: "flex", gap: 10, padding: "2px 16px 8px", alignItems: "stretch" }}>
      {down && <Cells row={lens} conn={false} />}
      <div data-stream-inspector={String(view.seq)} style={{ flex: 1, padding: "11px 14px", background: "#212327", borderLeft: `2px solid ${view.color}`, borderRadius: "0 6px 6px 0", lineHeight: 1.8, fontSize: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <span style={{ fontSize: 10, letterSpacing: ".14em", color: "#62676f" }}>INSPECT</span>
          <span style={{ color: view.color, border: "1px solid rgba(255,255,255,.12)", borderRadius: 5, padding: "0 8px", fontSize: 11 }}>{view.kind}</span>
          <span style={{ color: "#62676f", fontSize: 11 }}>seq {view.seq} · click the row again to close</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "78px 1fr", gap: "2px 12px", marginTop: 8, fontSize: 12 }}>
          <span style={label}>SCHEMA</span><span style={value}>{view.schema}</span>
          <span style={label}>TIME</span><span style={value}>{view.time}</span>
          <span style={label}>PRODUCER</span><span style={value}>{view.producer}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ color: "#62676f", fontSize: 10, letterSpacing: ".1em" }}>PAYLOAD</div>
          <pre style={{ margin: "4px 0 0", padding: "9px 12px", background: "#1a1c20", borderRadius: 6, fontFamily: "inherit", fontSize: 11, color: "#9aa0a8", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{view.payload}</pre>
        </div>
      </div>
    </div>
  );
}

export function StreamLens({ paneId }: { paneId: number }): React.ReactElement {
  const st = useSyncExternalStore(stream.subscribe, stream.getSnapshot);
  const fd = useSyncExternalStore(find.subscribe, find.getSnapshot);
  const mt = useSyncExternalStore(meta.subscribe, meta.getSnapshot);
  const down = mt.dir === GraphDirection.Down;
  const rows = useMemo(() => streamRows(st.envelopes), [st.envelopes]);
  const spans = useMemo(() => streamSpans(rows), [rows]);
  const times = useMemo(() => eventTimes(st.envelopes), [st.envelopes]);
  const query = fd.open && fd.scope === "stream" ? fd.q.trim().toLowerCase() : "";
  const shown = lensRows(rows, spans, times, { sel: mt.sel, app: mt.level === RevealLevel.App, query });
  const bySeq = new Map(rows.map((r) => [r.seq, r]));
  return (
    <>
      {down && (
        <div style={{ display: "flex", gap: 8, padding: "2px 16px 4px", fontSize: 10, color: "#62676f", flexWrap: "wrap", alignItems: "baseline" }}>
          <span style={{ color: "#4a4e55" }} title={LEGEND_TITLE}>lanes ·</span>
          {LANES.map((ld) => <span key={ld.kind} style={{ color: "#82a5c8" }}>{ld.label}</span>)}
        </div>
      )}
      <div style={{ fontSize: 12, lineHeight: 2.05, paddingBottom: 8 }}>
        {shown.map((r) => (
          <React.Fragment key={r.seq}>
            <div data-stream-row={String(r.seq)} className="hover-stream-row" onClick={() => pickSeq(r.seq, paneId, SeqSelectedHow.STREAM_ROW)} title="click to inspect · click again to close"
              style={{ padding: "1px 16px", display: "flex", gap: 10, alignItems: "stretch", cursor: "pointer", background: r.bg, opacity: r.opacity }}>
              {down && <Cells row={r} conn={true} />}
              <span style={{ color: "#4a4e55", width: 34, flex: "none", textAlign: "right" }}>{r.seq}</span>
              <span style={{ color: "#4a4e55", width: 50, flex: "none", fontSize: 11 }}>{r.t}</span>
              <span style={{ color: r.kindColor, width: 132, flex: "none" }}>{r.kind}</span>
              <span style={{ color: "#62676f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.line}</span>
            </div>
            {r.sel && <Inspector row={bySeq.get(r.seq)!} lens={r} down={down} times={times} />}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
