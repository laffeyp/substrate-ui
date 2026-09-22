// Report writer + coverage grader for the shakeout harness.
//
// A Flow returns a RunResult per run: which declared tags fired and
// with what payloads, plus a bug list. The grader collects five
// RunResults per flow and grades every declared tag against the
// 5/5 rule from PLAN-2026-09-21-r4-vocabulary-shakeout.md.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface EmittedRecord {
  tag: string;
  payload: Record<string, unknown>;
}

export interface Defect {
  category: string;
  observed: string;
  expected: string;
  screenshot?: string;
  reproduces: boolean;
  severity: "low" | "medium" | "high";
}

export interface RunResult {
  runIndex: number;
  ok: boolean;
  reason?: string;
  emitted: EmittedRecord[];
  defects: Defect[];
  durationMs: number;
}

export interface FlowResult {
  flow: string;
  declared: string[];         // tags this flow expects
  runs: RunResult[];
}

export interface CoverageEntry {
  tag: string;
  hits: number;   // count of runs in which the tag fired ≥ 1 time
  runs: number;
  status: "green" | "warning" | "blocker" | "dead";
}

export interface FlowReport {
  flow: string;
  runs: number;
  runOks: number;
  coverage: CoverageEntry[];
  defects: Defect[];
}

export interface FullReport {
  writtenAt: string;
  totalFlows: number;
  totalRuns: number;
  flowReports: FlowReport[];
  summary: {
    tags_at_5_of_5: number;
    tags_at_4_of_5: number;
    tags_below_4: number;
    tags_dead: number;
    total_bugs: number;
  };
}

export function gradeFlow(fr: FlowResult): FlowReport {
  const total = fr.runs.length;
  const runOks = fr.runs.filter((r) => r.ok).length;
  const coverage: CoverageEntry[] = fr.declared.map((tag) => {
    const hits = fr.runs.filter((r) => r.emitted.some((e) => e.tag === tag)).length;
    let status: CoverageEntry["status"];
    if (hits === total) status = "green";
    else if (hits === total - 1) status = "warning";
    else if (hits === 0) status = "dead";
    else status = "blocker";
    return { tag, hits, runs: total, status };
  });
  const defects: Defect[] = fr.runs.flatMap((r) => r.defects);
  return { flow: fr.flow, runs: total, runOks, coverage, defects };
}

export function assembleFullReport(flows: FlowResult[]): FullReport {
  const flowReports = flows.map(gradeFlow);
  const allCoverage = flowReports.flatMap((f) => f.coverage);
  const summary = {
    tags_at_5_of_5: allCoverage.filter((c) => c.status === "green").length,
    tags_at_4_of_5: allCoverage.filter((c) => c.status === "warning").length,
    tags_below_4: allCoverage.filter((c) => c.status === "blocker").length,
    tags_dead: allCoverage.filter((c) => c.status === "dead").length,
    total_bugs: flowReports.reduce((s, f) => s + f.defects.length, 0),
  };
  return {
    writtenAt: new Date().toISOString(),
    totalFlows: flowReports.length,
    totalRuns: flowReports.reduce((s, f) => s + f.runs, 0),
    flowReports,
    summary,
  };
}

export function writeReport(report: FullReport, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "report.json");
  writeFileSync(path, JSON.stringify(report, null, 2));
  return path;
}

export function printSummary(report: FullReport): void {
  console.log("");
  console.log(`shakeout report — ${report.writtenAt}`);
  console.log(`flows: ${report.totalFlows}, runs: ${report.totalRuns}`);
  for (const f of report.flowReports) {
    const green = f.coverage.filter((c) => c.status === "green").length;
    const warn = f.coverage.filter((c) => c.status === "warning").length;
    const block = f.coverage.filter((c) => c.status === "blocker").length;
    const dead = f.coverage.filter((c) => c.status === "dead").length;
    console.log(
      `  ${f.flow} — ok ${f.runOks}/${f.runs}, ` +
      `tags green ${green} / warn ${warn} / blocker ${block} / dead ${dead}, ` +
      `bugs ${f.defects.length}`
    );
    for (const c of f.coverage) {
      if (c.status === "green") continue;
      console.log(`    ${c.status.toUpperCase().padEnd(7)} ${c.tag}  ${c.hits}/${c.runs}`);
    }
  }
  const s = report.summary;
  console.log("");
  console.log(
    `summary — tags 5/5: ${s.tags_at_5_of_5}, 4/5: ${s.tags_at_4_of_5}, ` +
    `below: ${s.tags_below_4}, dead: ${s.tags_dead}, bugs: ${s.total_bugs}`
  );
}

export function exitCodeFor(report: FullReport): 0 | 1 {
  const s = report.summary;
  return (s.tags_at_4_of_5 === 0 && s.tags_below_4 === 0 && s.tags_dead === 0) ? 0 : 1;
}
