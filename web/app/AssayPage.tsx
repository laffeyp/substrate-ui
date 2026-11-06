// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The assay page as the template drew it (reveal.html assay block; sprint 334). Its arm rows came
// from a list the shell left empty until substrate exposes the projection, so the page shows its
// empty-state note; the arm table, with its tier columns, draws only when there are arms. ⌘3 and
// View ▸ Assays open it (a logged fix: before, nothing did). Sprints 247-257 had replaced this page
// with one of the agent's own design, which a refactor may not do (BLACKBOARD, 2026-11-05 failure
// entry); that page is in _deprecated/assay-page-b5/.

import * as React from "react";

interface ArmRow {
  name: string; nameColor: string; barW: string; barColor: string; overall: string;
  easy: string; med: string; hard: string; adv: string; advColor: string;
  delta: string; deltaColor: string; verdict: string; verdictColor: string;
}

// The template's list: empty until substrate exposes the assay projection.
const ARMS: readonly ArmRow[] = [];

const head: React.CSSProperties = { color: "#62676f", fontSize: 10, letterSpacing: ".1em" };

export function AssayPage(): React.ReactElement {
  if (ARMS.length === 0) {
    return (
      <div data-assays-empty="1" style={{ maxWidth: 640, padding: "18px 20px", background: "#1a1c20", borderLeft: "2px solid #665f7d", borderRadius: "0 5px 5px 0", color: "#9aa0a8", fontSize: 12.5, lineHeight: 1.65 }}>
        no assays on record. /api/assays returned an empty list. preregister a run with a `.preg.json` on disk to see the arm-by-arm delta report here.
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1.3fr .6fr .6fr .6fr .7fr 140px 120px", gap: "0 16px", fontSize: 12, alignItems: "center", marginTop: 14, maxWidth: 1060 }}>
      <div style={{ ...head, padding: "6px 0" }}>ARM</div><div style={head}>OVERALL PASS¹</div><div style={head}>EASY·8</div><div style={head}>MED·12</div><div style={head}>HARD·8</div><div style={head}>ADV·4</div><div style={head}>Δ VS CONTROL·P</div><div style={head}>VERDICT</div>
      {ARMS.map((arm) => (
        <React.Fragment key={arm.name}>
          <div style={{ padding: "10px 0", color: arm.nameColor }}>{arm.name}</div>
          <div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, height: 9, borderRadius: 2, background: "#2e3138" }}><div style={{ width: arm.barW, height: 9, borderRadius: 2, background: arm.barColor }} /></div><span style={{ color: "#d7dade", width: 28, textAlign: "right" }}>{arm.overall}</span></div></div>
          <div style={{ color: "#9aa0a8" }}>{arm.easy}</div><div style={{ color: "#9aa0a8" }}>{arm.med}</div><div style={{ color: "#9aa0a8" }}>{arm.hard}</div><div style={{ color: arm.advColor }}>{arm.adv}</div>
          <div style={{ color: arm.deltaColor }}>{arm.delta}</div><div style={{ color: arm.verdictColor, fontWeight: 600 }}>{arm.verdict}</div>
        </React.Fragment>
      ))}
    </div>
  );
}
