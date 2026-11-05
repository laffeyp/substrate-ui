// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the assay page says about each arm (sprint 252; plan PLAN-2026-11-04-shell-to-react-r5.md, B5).
//
// The design's rules (design D13, D18): bars carry rates and numbers are plain text; the accent goes
// only on a significant finding; an underpowered comparison reads "can't tell yet", with a hollow
// dashed bar; where the data cannot speak the page says so in plain words. The template's table had
// fixed tier columns (EASY·8, MED·12, HARD·8, ADV·4) that no report carries; these columns are the
// report's own (substrate `assay/report.py`, ArmReport).

import type { AssayArm, AssayReport, AssayRow } from "../../vm/types";

export const ACCENT = "#82a5c8";
export const PLAIN = "#9aa0a8";
export const DIM = "#62676f";
export const ALARM = "#c26058";

export interface ArmLine {
  arm: string;
  role: string;
  /** The arm ran no case: hollow dashed bar, "not run". */
  notRun: boolean;
  /** pass^k as a bar width, "0%" to "100%". */
  barW: string;
  passLabel: string;
  passAt1Label: string;
  deltaLabel: string;
  verdict: string;
  verdictColor: string;
  tokensLabel: string;
  timeLabel: string;
}

const pct = (x: number) => `${Math.round(Math.max(0, Math.min(1, x)) * 100)}%`;
const signed = (x: number) => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(2);

/** The verdict word against the margin; "inconclusive" is the design's "can't tell yet". */
export function verdictWord(arm: AssayArm, isControl: boolean): string {
  if (isControl) return "control";
  if (arm.nCases === 0) return "not run";
  if (!arm.equivalence) return "—";
  return arm.equivalence === "inconclusive" ? "can't tell yet" : arm.equivalence;
}

export function armLine(arm: AssayArm, controlArm: string | null): ArmLine {
  const isControl = arm.arm === controlArm;
  const notRun = arm.nCases === 0;
  const verdict = verdictWord(arm, isControl);
  const delta = arm.deltaPassK === null ? "—"
    : signed(arm.deltaPassK) + (arm.ciLow !== null && arm.ciHigh !== null ? ` [${signed(arm.ciLow)}, ${signed(arm.ciHigh)}]` : "");
  return {
    arm: arm.arm,
    role: arm.role,
    notRun,
    barW: notRun ? "100%" : pct(arm.passRate),
    passLabel: notRun ? "not run" : `${arm.passes}/${arm.nCases}`,
    passAt1Label: notRun ? "—" : arm.passAt1.toFixed(2),
    deltaLabel: delta,
    verdict,
    verdictColor: arm.fdrSignificant === true ? ACCENT : verdict === "not run" ? DIM : PLAIN,
    tokensLabel: notRun ? "—" : String(arm.completionTokens),
    timeLabel: notRun ? "—" : `${(arm.elapsedMs / 1000).toFixed(1)}s`,
  };
}

/** The lines the page puts above the table where the data cannot back a number. */
export function warnings(report: AssayReport): string[] {
  const out: string[] = [];
  if (report.controlCheck.state && report.controlCheck.state !== "pass") {
    out.push(`no delta: the control arm did not run on every case (${report.controlCheck.state}) — ${report.controlCheck.detail}`);
  }
  for (const row of report.unpublishable) {
    out.push(`${row.arm} is unpublishable: graded ${pct(row.gradedRate)} of cases, under the pre-registered ${pct(row.threshold)} — ${row.reason}`);
  }
  if (report.provenance && report.provenance !== "verified") {
    out.push(`the recorded config is ${report.provenance}: the margin the verdicts use may not be the one the run was registered with`);
  }
  return out;
}

/** The listing row's second line: what the cells file holds and what it was run with. */
export function assaySummary(row: AssayRow): string {
  const parts = [`${row.nCells} cells`, `${row.arms.length} arm${row.arms.length === 1 ? "" : "s"} ran`];
  if (row.trials !== null) parts.push(`${row.trials} trial${row.trials === 1 ? "" : "s"}`);
  if (row.margin !== null) parts.push(`margin ${row.margin}`);
  if (row.strongModel) parts.push(`${row.strongModel} vs ${row.weakModels.join(", ") || "—"}`);
  return parts.join(" · ");
}
