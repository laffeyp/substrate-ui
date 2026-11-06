// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The assay page (sprint 253; plan PLAN-2026-11-04-shell-to-react-r5.md, B5, F352): the machine's
// assays, and for the one picked its arms against the control. Opened by ⌘3 or View ▸ Assays (D86).
// Its host div in reveal.html is the page's scroll container, with the template's padding.
//
// The template showed a fixed table (tier columns no report has) and an empty state that said
// /api/assays had returned nothing, though nothing called it. This page reads /api/assays and
// /api/assay/<name> (web/app/state/assays.ts) and draws what the report holds (derive/assays.ts).

import * as React from "react";
import { useEffect, useSyncExternalStore } from "react";
import { ALARM, armLine, assaySummary, DIM, warnings } from "./derive/assays";
import { assays, pickAssay, refreshAssays } from "./state/assays";
import "./hover.css";

const heading: React.CSSProperties = { color: "#62676f", fontSize: 10, letterSpacing: ".1em", padding: "6px 0" };
const box: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", borderRadius: 6, background: "#1a1c20", padding: "6px 0" };
const note: React.CSSProperties = { maxWidth: 640, padding: "18px 20px", background: "#1a1c20", borderLeft: "2px solid #665f7d", borderRadius: "0 5px 5px 0", color: "#9aa0a8", fontSize: 12.5, lineHeight: 1.65 };
const COLUMNS = "180px 80px 1.3fr .5fr 1.2fr 120px .6fr .6fr";

function Report({ name }: { name: string }): React.ReactElement {
  const st = useSyncExternalStore(assays.subscribe, assays.getSnapshot, assays.getSnapshot);
  if (!(name in st.reports)) return <div style={{ color: DIM, fontSize: 12, marginTop: 18 }}>reading {name}…</div>;
  const report = st.reports[name];
  if (!report) return <div style={{ color: ALARM, fontSize: 12, marginTop: 18 }}>the server has no assay named {name}</div>;
  const lines = report.arms.map((a) => armLine(a, report.controlArm));
  return (
    <div data-assay-report={name} style={{ marginTop: 22, maxWidth: 1060 }}>
      <div style={{ color: "#62676f", fontSize: 11 }}>{report.suite} · {report.primaryMetric} · config {report.provenance ?? "unverified"}{report.margin !== null ? ` · margin ${report.margin}` : ""}</div>
      {warnings(report).map((line) => (
        <div key={line} data-assay-warning="1" style={{ ...note, maxWidth: 1060, borderLeft: `2px solid ${ALARM}`, color: ALARM, marginTop: 10, padding: "10px 14px", fontSize: 12 }}>{line}</div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: COLUMNS, gap: "0 16px", fontSize: 12, alignItems: "center", marginTop: 14 }}>
        <div style={heading}>ARM</div><div style={heading}>ROLE</div><div style={heading}>PASS^K</div><div style={heading}>PASS@1</div>
        <div style={heading}>Δ VS CONTROL [CI]</div><div style={heading}>VERDICT</div><div style={heading}>TOKENS</div><div style={heading}>TIME</div>
        {lines.map((l) => (
          <React.Fragment key={l.arm}>
            <div data-assay-arm={l.arm} style={{ padding: "10px 0", color: l.notRun ? DIM : "#d7dade" }}>{l.arm}</div>
            <div style={{ color: DIM }}>{l.role}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 9, borderRadius: 2, background: l.notRun ? "transparent" : "#2e3138", border: l.notRun ? "1px dashed #4a4e55" : "none", boxSizing: "border-box" }}>
                {l.notRun ? null : <div style={{ width: l.barW, height: 9, borderRadius: 2, background: "#62676f" }} />}
              </div>
              <span style={{ color: l.notRun ? DIM : "#d7dade", minWidth: 48, textAlign: "right" }}>{l.passLabel}</span>
            </div>
            <div style={{ color: "#9aa0a8" }}>{l.passAt1Label}</div>
            <div style={{ color: "#9aa0a8" }}>{l.deltaLabel}</div>
            <div data-assay-verdict={l.arm} style={{ color: l.verdictColor, fontWeight: 600 }}>{l.verdict}</div>
            <div style={{ color: "#9aa0a8" }}>{l.tokensLabel}</div>
            <div style={{ color: "#9aa0a8" }}>{l.timeLabel}</div>
          </React.Fragment>
        ))}
      </div>
      {report.nullRule ? <div style={{ color: DIM, fontSize: 11, marginTop: 14, maxWidth: 760, lineHeight: 1.6 }}>{report.nullRule}</div> : null}
    </div>
  );
}

export function AssayPage(): React.ReactElement {
  const st = useSyncExternalStore(assays.subscribe, assays.getSnapshot, assays.getSnapshot);
  useEffect(() => { refreshAssays(); }, []);
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: ".14em", color: "#62676f", marginBottom: 10 }}>ASSAYS</div>
      {st.rows === null ? <div style={{ color: DIM, fontSize: 12 }}>reading /api/assays…</div> : null}
      {st.rows !== null && st.rows.length === 0 ? (
        <div data-assays-empty="1" style={note}>no assays on record: the bench results folder ($BENCH_RESULTS, else ~/.substrate/bench_results) holds no cells files. A run writes its cells there, and its arm-by-arm report shows here.</div>
      ) : null}
      {st.rows && st.rows.length ? (
        <div data-assays-list="1" style={{ ...box, maxWidth: 1060 }}>
          {st.rows.map((row) => (
            <div key={row.name} data-assay-row={row.name} className="hover-assay-row" onClick={() => pickAssay(row.name)} style={{ padding: "6px 14px", cursor: "pointer", display: "flex", gap: 14, alignItems: "baseline", background: st.selected === row.name ? "#2e3138" : "transparent" }}>
              <span style={{ color: "#d7dade", fontSize: 13 }}>{row.name}</span>
              <span style={{ color: "#62676f", fontSize: 11 }}>{assaySummary(row)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {st.selected ? <Report name={st.selected} /> : null}
    </div>
  );
}
