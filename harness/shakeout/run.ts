#!/usr/bin/env npx tsx
// Shakeout runner. Walks every flow, runs each N times, writes a
// report. Owns the server.

import { ServerHandle } from "./lib/server";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";
import { assembleFullReport, writeReport, printSummary, exitCodeFor } from "./lib/report";
import type { RunResult, FlowResult } from "./lib/report";
import { flow as coldBoot } from "./cold_boot";
import { flow as chatOneTurn } from "./chat_one_turn";
import { flow as slashRouter } from "./slash_router";
import { flow as bundlePicked } from "./bundle_picked";
import { flow as studioBuild } from "./studio_build";
import { flow as refusedOpen } from "./refused_open";
import { flow as refusedTurn } from "./refused_turn";
import { flow as attachExisting } from "./attach_existing";
import { flow as streamReconnect } from "./stream_reconnect";
import { TOOL_FLOWS } from "./tools_index";
import { join } from "node:path";

const RUNS_PER_FLOW = Number(process.env.SHAKEOUT_RUNS || "5");
const AXIS_ONLY = process.env.SHAKEOUT_AXIS || "AB"; // A, B, or AB
const AXIS_A: Flow[] = [
  coldBoot,
  chatOneTurn,
  slashRouter,
  bundlePicked,
  studioBuild,
  attachExisting,
  refusedTurn,
  refusedOpen,
  streamReconnect,
];
const AXIS_B: Flow[] = TOOL_FLOWS;
const FLOWS: Flow[] = [
  ...(AXIS_ONLY.includes("A") ? AXIS_A : []),
  ...(AXIS_ONLY.includes("B") ? AXIS_B : []),
];

const FLOW_TIMEOUT_MS = Number(process.env.SHAKEOUT_FLOW_TIMEOUT_MS || "900000");

async function runOne(flow: Flow, server: ServerHandle, runIndex: number): Promise<RunResult> {
  const start = Date.now();
  let emitted: EmittedRecord[] = [];
  let defects: Defect[] = [];
  let ok = true;
  let reason: string | undefined;
  try {
    const out = await Promise.race([
      flow.run({ server, runIndex }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`flow watchdog: ${FLOW_TIMEOUT_MS}ms`)), FLOW_TIMEOUT_MS)
      ),
    ]);
    emitted = out.emitted;
    defects = out.defects;
  } catch (err) {
    ok = false;
    reason = err instanceof Error ? err.message : String(err);
  }
  return {
    runIndex,
    ok,
    reason,
    emitted,
    defects,
    durationMs: Date.now() - start,
  };
}

async function main(): Promise<void> {
  const server = new ServerHandle();
  await server.start();
  console.log(`[shakeout] server up on http://127.0.0.1:8765`);

  const flowResults: FlowResult[] = [];
  try {
    for (const flow of FLOWS) {
      console.log(`\n[shakeout] flow: ${flow.name} × ${RUNS_PER_FLOW}`);
      const runs: RunResult[] = [];
      for (let i = 0; i < RUNS_PER_FLOW; i++) {
        const r = await runOne(flow, server, i);
        const okMark = r.ok ? "ok" : "FAIL";
        const bugs = r.defects.length ? `; ${r.defects.length} defect(s)` : "";
        const errNote = r.reason ? `  err=${r.reason}` : "";
        console.log(`  · run ${i} … ${okMark} (${r.durationMs}ms, ${r.emitted.length} emits${bugs})${errNote}`);
        runs.push(r);
      }
      flowResults.push({ flow: flow.name, declared: flow.declared, runs });
    }
  } finally {
    await server.stop();
  }

  const report = assembleFullReport(flowResults);
  const today = new Date().toISOString().slice(0, 10);
  const outDir = join(__dirname, "..", "..", "captures", `shakeout-${today}`);
  const reportPath = writeReport(report, outDir);
  printSummary(report);
  console.log(`\n[shakeout] report written to ${reportPath}`);

  process.exit(exitCodeFor(report));
}

main().catch((err) => {
  console.error("[shakeout] fatal", err);
  process.exit(2);
});
