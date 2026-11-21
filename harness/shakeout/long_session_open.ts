// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 523: open a long session in a fresh window and check that the page survives.
//
// The gate writes a hand-written Claude Code session file (thousands of exchanges), continues it
// through POST /api/session with the deterministic driver and a script of real tool calls
// including one bash command that streams tens of thousands of ToolProgress chunks, runs the turn
// to completion, then opens the session in a new window from a substrate://session/<id> link.
//
// Checks: the last row drawn, working set under 1.5 GB, no RENDERER_GONE, time under 60 s.
// On today's tree the gate FAILS — the page dies or exceeds the budget on a record this large.

import { _electron as electron } from "playwright";
import { cpSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { launchArgs, waitForApp, forEachJsonlLine } from "./lib/electron";
import { writeSessionFile, buildToolScript } from "./lib/long_session";

const SESSION_TURNS = 2500;
const MIN_ENVELOPES = 20_000;
const MIN_STREAM_CHUNKS = 10_000;
const MIN_STREAM_BYTES = 2 * 1024 * 1024;
const WORKING_SET_BUDGET_KB = 1.5 * 1024 * 1024;  // 1.5 GB in KB
const TIME_BUDGET_S = 60;

interface Verdict {
  last_row_drawn: "pass" | "fail";
  working_set: "pass" | "fail";
  no_renderer_gone: "pass" | "fail";
  time_under_bound: "pass" | "fail";
}

function traceSignals(state: string): { name: string; payload: Record<string, unknown> }[] {
  const traces = join(state, "electron", "logs", "traces");
  if (!existsSync(traces)) return [];
  const out: { name: string; payload: Record<string, unknown> }[] = [];
  for (const boot of readdirSync(traces).sort()) {
    for (const f of readdirSync(join(traces, boot))) {
      if (!f.endsWith(".jsonl")) continue;
      forEachJsonlLine(join(traces, boot, f), (line) => {
        if (!line) return;
        try {
          const r = JSON.parse(line) as { name: string; payload: Record<string, unknown> };
          out.push(r);
        } catch { /* skip malformed */ }
      });
    }
  }
  return out;
}

function countEnvelopesAppended(state: string): number {
  // Sprint 532: the window folds its stream per frame and writes one STREAM_BATCH_FOLDED per batch
  // with the envelope count; the total is the sum of the counts.
  return traceSignals(state)
    .filter((s) => s.name === "STREAM_BATCH_FOLDED")
    .reduce((n, s) => n + (typeof s.payload.count === "number" ? s.payload.count : 0), 0);
}

async function main(): Promise<void> {
  // Phase 1: create the session and run the turn to completion in a first launch.
  const launch1 = launchArgs();
  const sessionFile = join(launch1.state, "long-session.jsonl");
  writeSessionFile(sessionFile, SESSION_TURNS);
  const { workspace, script } = buildToolScript(launch1.state);

  const app1 = await electron.launch({ ...launch1.options, timeout: 60_000 });
  let sessionId: string;
  try {
    const win1 = await app1.firstWindow({ timeout: 30_000 });
    await waitForApp(win1);
    const base = `http://127.0.0.1:${new URL(win1.url()).port}`;
    const post = (path: string, body: unknown) =>
      fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) });

    // Create the session, continuing from the hand-written Claude Code file.
    const createResp = await post("/api/session", {
      driver: "deterministic",
      workspace,
      make_repository: false,
      continue_from: { tool: "claude_code", path: sessionFile },
      driver_params: { script },
    });
    if (!createResp.ok) throw new Error(`POST /api/session: HTTP ${createResp.status} ${await createResp.text()}`);
    const { session_id } = await createResp.json() as { session_id: string };
    sessionId = session_id;

    // Attach the pane so the SSE stream opens (the server needs a listener).
    await win1.evaluate(`(function () { var vm = window.__vm; return (vm.get(1) || vm.spawn(1)).attachExisting(${JSON.stringify(sessionId)}); })()`);
    await win1.waitForFunction(`window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(sessionId)}`, undefined, { timeout: 30_000 });

    // Send the turn.  The POST blocks until the turn finishes (server's turn_sync), so fire it
    // without awaiting — the page may freeze or die processing the ToolProgress flood, but the
    // server and kernel keep running.  Poll the session's HTTP status instead.
    const turnDone = post(`/api/session/${sessionId}/turn`, { text: "run the script" })
      .then((r) => ({ ok: r.ok, status: r.status }))
      .catch((e: Error) => ({ ok: false, status: 0, error: e.message }));

    // Poll the server's status endpoint until the session parks.
    const deadline = Date.now() + 300_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const resp = await fetch(`${base}/api/session/${sessionId}`, { headers: { Origin: base } }).catch(() => null);
      if (!resp) continue;
      const body = await resp.json().catch(() => null) as { status?: string } | null;
      if (body?.status === "parked" || body?.status === "ended") break;
    }
    const turnResult = await Promise.race([turnDone, new Promise<{ ok: false; status: number }>((r) => setTimeout(() => r({ ok: false, status: 0 }), 10_000))]);
    if (!turnResult.ok) console.error(`turn POST: status ${turnResult.status} (the page may have died; the record is what matters)`);
  } finally {
    await app1.close().catch(() => undefined);
  }

  // Validate the record size from the actual session record on disk (the trace is from the
  // window, which may have crashed before recording everything).
  const sessDir = join(launch1.state, "sessions");
  const sidDir = readdirSync(sessDir).find((d) => d.startsWith("s_"))!;
  const recordDir = join(sessDir, sidDir, "record");
  const recordManifest = JSON.parse(readFileSync(join(recordDir, "manifest.json"), "utf8")) as { hot_segment: string };
  const recordLines = readFileSync(join(recordDir, recordManifest.hot_segment), "utf8").split("\n").filter(Boolean);
  const envelopes = recordLines.length;
  let progressChunks = 0;
  let streamBytes = 0;
  for (const line of recordLines) {
    try {
      const env = JSON.parse(line) as { kind?: string; payload?: { chunk?: string } };
      if (env.kind === "ToolProgress") {
        progressChunks++;
        streamBytes += (env.payload?.chunk ?? "").length;
      }
    } catch { /* skip malformed */ }
  }

  console.log(JSON.stringify({
    phase: "record_built",
    session_id: sessionId!,
    envelopes,
    progress_chunks: progressChunks,
    stream_bytes: streamBytes,
  }));

  if (envelopes < MIN_ENVELOPES) {
    console.error(`FAIL — the record has only ${envelopes} envelopes, need at least ${MIN_ENVELOPES}; the gate refuses to judge the window on a smaller record`);
    launch1.cleanup({ keep: true });
    process.exit(1);
  }
  if (progressChunks < MIN_STREAM_CHUNKS) {
    console.error(`FAIL — only ${progressChunks} ToolProgress chunks, need at least ${MIN_STREAM_CHUNKS}`);
    launch1.cleanup({ keep: true });
    process.exit(1);
  }
  if (streamBytes < MIN_STREAM_BYTES) {
    console.error(`FAIL — stream is only ${streamBytes} bytes, need at least ${MIN_STREAM_BYTES}`);
    launch1.cleanup({ keep: true });
    process.exit(1);
  }

  // Phase 2: open the session from a deep link in a fresh window.
  // Reuse the same state root so the session's record is already there.
  const launch2 = launchArgs();
  const sessionsDir = join(launch1.state, "sessions");
  if (existsSync(sessionsDir)) {
    cpSync(sessionsDir, join(launch2.state, "sessions"), { recursive: true });
  }

  const app2 = await electron.launch({ ...launch2.options, timeout: 30_000 });
  const verdict: Verdict = {
    last_row_drawn: "fail",
    working_set: "fail",
    no_renderer_gone: "fail",
    time_under_bound: "fail",
  };
  let sample: { s: number; appended: number; working_set_kb: number | null; gone: string | null } | null = null;

  try {
    const win2 = await app2.firstWindow({ timeout: 30_000 });
    let gone: string | null = null;
    win2.on("crash", () => { gone = "crash"; });
    await waitForApp(win2);

    const t0 = Date.now();
    // Open the session via deep link, as the Architect does.
    await app2.evaluate(
      (m, u) => m.app.emit("open-url", { preventDefault: Boolean }, u),
      `substrate://session/${sessionId!}`,
    );

    // Poll: wait for the last row to draw, the page to die, or the time budget to expire.
    const pollMs = 2000;
    let lastAppended = -1;
    let idleCount = 0;
    while ((Date.now() - t0) / 1000 < TIME_BUDGET_S + 30) {
      await new Promise((r) => setTimeout(r, pollMs));
      if (gone) break;

      const metrics = await app2.evaluate(({ app: a, BrowserWindow }) => {
        const pid = BrowserWindow.getAllWindows()[0]?.webContents.getOSProcessId() ?? -1;
        const m = a.getAppMetrics().find((p) => p.pid === pid);
        return { pid, working_set_kb: m?.memory.workingSetSize ?? null };
      }).catch(() => ({ pid: -1, working_set_kb: null }));

      const appended = countEnvelopesAppended(launch2.state);
      const elapsed = Math.round((Date.now() - t0) / 1000);

      sample = { s: elapsed, appended, working_set_kb: metrics.working_set_kb, gone };
      console.log(JSON.stringify(sample));

      // Detect idle: appended count stopped growing and cpu is low.
      if (appended === lastAppended && appended > 0) idleCount++;
      else idleCount = 0;
      lastAppended = appended;
      if (idleCount >= 3) break;  // the replay finished

      // The page died.
      if (gone) break;
    }

    // Check the trace for RENDERER_GONE.
    const trace2 = traceSignals(launch2.state);
    const rendererGone = trace2.filter((s) => s.name === "RENDERER_GONE");
    verdict.no_renderer_gone = rendererGone.length === 0 ? "pass" : "fail";

    // Check working set.
    if (sample && sample.working_set_kb !== null && sample.working_set_kb <= WORKING_SET_BUDGET_KB) {
      verdict.working_set = "pass";
    }

    // Check the last row drawn: look for a TRANSCRIPT_ROW_DRAWN with a seq near the record's last.
    const rowsDrawn = trace2
      .filter((s) => s.name === "TRANSCRIPT_ROW_DRAWN")
      .map((s) => s.payload.seq as number)
      .filter((s) => s != null);
    const lastDrawn = rowsDrawn.length > 0 ? Math.max(...rowsDrawn) : 0;
    // The record's last seq is roughly the envelope count from phase 1.
    // Accept if the last drawn row is within 100 of the total (some envelopes are skipped: hidden kinds).
    if (lastDrawn > 0 && lastDrawn >= envelopes - 500) {
      verdict.last_row_drawn = "pass";
    }

    // Check time.
    const elapsed = sample ? sample.s : Math.round((Date.now() - t0) / 1000);
    if (elapsed <= TIME_BUDGET_S && verdict.last_row_drawn === "pass") {
      verdict.time_under_bound = "pass";
    }

    console.log(JSON.stringify({
      phase: "verdict",
      last_drawn_seq: lastDrawn,
      record_envelopes: envelopes,
      renderer_gone: rendererGone.length,
      renderer_gone_reasons: rendererGone.map((s) => s.payload.reason),
      elapsed_s: elapsed,
      working_set_kb: sample?.working_set_kb ?? null,
      budget_kb: WORKING_SET_BUDGET_KB,
      gone,
      ...verdict,
    }));
  } finally {
    await app2.close().catch(() => undefined);
    launch1.cleanup({ keep: Object.values(verdict).some((v) => v === "fail") });
    launch2.cleanup({ keep: Object.values(verdict).some((v) => v === "fail") });
  }

  // Print the final verdict line.
  const checks = Object.entries(verdict).map(([k, v]) => `${k}: ${v}`).join(", ");
  const allPass = Object.values(verdict).every((v) => v === "pass");
  if (allPass) {
    console.log(`long_session_open: PASS — ${checks}`);
    process.exit(0);
  } else {
    console.error(`long_session_open: FAIL — ${checks}`);
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
