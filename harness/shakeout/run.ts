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
import { flow as caretPin } from "./caret_pin";
import { flow as paneSplit } from "./pane_split";
import { flow as paneHeaderClip } from "./pane_header_clip";
import { flow as panePromptIsolation } from "./pane_prompt_isolation";
import { flow as revealModeDirection } from "./reveal_mode_direction";
import { flow as modelReplyRender } from "./model_reply_render";
import { flow as electronSmoke } from "./electron_smoke";
import { flow as electronMenu } from "./electron_menu";
import { flow as electronDeeplink } from "./electron_deeplink";
import { TOOL_FLOWS } from "./tools_index";
import { join } from "node:path";

const RUNS_PER_FLOW = Number(process.env.SHAKEOUT_RUNS || "5");
// Axis A: HTTP flows against the shakeout's own ServerHandle on 8765.
// Axis B: real-model tool flows against the same server.
// Axis C: Electron flows that spawn their own Electron+server pair
//   per run on an ephemeral port. Opt-in via SHAKEOUT_AXIS=ABC.
const AXIS_ONLY = process.env.SHAKEOUT_AXIS || "AB";
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
  caretPin,
  paneSplit,
  paneHeaderClip,
  panePromptIsolation,
  revealModeDirection,
  modelReplyRender,
];
const AXIS_B: Flow[] = TOOL_FLOWS;
const AXIS_C: Flow[] = [
  electronSmoke,
  electronMenu,
  electronDeeplink,
];
const FLOWS: Flow[] = [
  ...(AXIS_ONLY.includes("A") ? AXIS_A : []),
  ...(AXIS_ONLY.includes("B") ? AXIS_B : []),
  ...(AXIS_ONLY.includes("C") ? AXIS_C : []),
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
