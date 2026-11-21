// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// harness/replay_memory.ts — measure the window while it replays a long session's record.
//
// The grey window of 2026-11-18: the page died (RENDERER_GONE, crashed, exit 5) twice while it held a
// session of 28,513 envelopes. This launches the source-mode app on a fresh state root holding a copy
// of one session folder (REPLAY_SESSION=<path to sessions/<id>>), opens the session the way a
// `substrate://session/<id>` link does, and every REPLAY_EVERY_MS prints one JSON line: seconds since
// the link, envelopes the window has taken in (STREAM_ENVELOPE_APPENDED in the window's trace file,
// which main writes, so the count never waits on the page), and the renderer's working set from
// app.getAppMetrics(). It stops when the page dies, when the window has taken in every envelope of the
// record, or after REPLAY_LIMIT_S.
//
// A measurement, not a gate: it prints numbers. The copy lives in the launch's scratch state and is
// removed at exit.
//
// Usage: REPLAY_SESSION=~/.substrate-next/sessions/s_... npx tsx harness/replay_memory.ts

import { _electron as electron } from "playwright";
import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";
import { launchArgs, waitForApp } from "./shakeout/lib/electron";
import { backendPids } from "./shakeout/lib/procs";

const SOURCE = process.env.REPLAY_SESSION || "";
const EVERY_MS = Number(process.env.REPLAY_EVERY_MS || 5000);
const LIMIT_S = Number(process.env.REPLAY_LIMIT_S || 600);
/** REPLAY_PAUSE_AT=<n>: once the window has taken in n envelopes, stop this launch's own backend (SIGSTOP, by the pid
 *  found from this launch's SUBSTRATE_HOME), so the page drains what it holds, goes idle, and answers DevTools. */
const PAUSE_AT = Number(process.env.REPLAY_PAUSE_AT || 0);
/** REPLAY_DUMP_AT_S=<s>: at s seconds, a Chromium memory-infra dump (Electron contentTracing) of the page's process,
 *  printed as its allocators' sizes. The dump providers do not wait for the page's main thread. */
const DUMP_AT_S = Number(process.env.REPLAY_DUMP_AT_S || 0);
const DUMP_FILE = process.env.REPLAY_DUMP_FILE || "";
/** REPLAY_PROFILE_DIR=<dir>: a CPU profile and a sampling heap profile from the link to the pause (REPLAY_PAUSE_AT),
 *  written there as cpu.cpuprofile and heap.heapprofile, with the page's DOM counters at the pause. */
const PROFILE_DIR = process.env.REPLAY_PROFILE_DIR || "";
/** REPLAY_HEAP_SAMPLING=0 leaves out the heap profile (building it for a heap of 3 GB killed the page). */
const HEAP_SAMPLING = process.env.REPLAY_HEAP_SAMPLING !== "0";
/** REPLAY_LAG=1: each sample also times five round trips of an empty `app.evaluate`, which main answers on its
 *  own thread — the thread that takes the menu and ⌘Q — and prints the longest as main_lag_ms. */
const LAG = process.env.REPLAY_LAG === "1";
/** REPLAY_ENVELOPES=<n>: the scratch copy keeps only the record's first n envelopes (each line is a whole frame with
 *  its own crc), so nothing is left in flight once the page has them: the page goes idle and answers DevTools. Then
 *  the heap before and after a full collection, what the page holds by count, and the DOM counters are printed. */
const ENVELOPES = Number(process.env.REPLAY_ENVELOPES || 0);
/** REPLAY_SNAPSHOT_FILE=<path>: with REPLAY_ENVELOPES, a heap snapshot after the full collection, written there. */
const SNAPSHOT_FILE = process.env.REPLAY_SNAPSHOT_FILE || "";

function appended(state: string): number {
  const traces = join(state, "electron", "logs", "traces");
  if (!existsSync(traces)) return 0;
  let n = 0;
  for (const boot of readdirSync(traces)) {
    for (const f of readdirSync(join(traces, boot))) {
      if (!f.startsWith("window-")) continue;
      for (const line of readFileSync(join(traces, boot, f), "utf8").split("\n")) {
        // Sprint 532: the window writes one STREAM_BATCH_FOLDED per frame batch, carrying the count of
        // envelopes it folded; sum the counts for the envelope total.
        if (!line.includes('"STREAM_BATCH_FOLDED"')) continue;
        try { n += Number((JSON.parse(line) as { payload?: { count?: number } }).payload?.count) || 0; } catch { /* skip malformed */ }
      }
    }
  }
  return n;
}

async function main(): Promise<void> {
  if (!SOURCE || !existsSync(join(SOURCE, "manifest.json"))) throw new Error("REPLAY_SESSION must name a session folder");
  const sid = basename(SOURCE);
  const launch = launchArgs();
  cpSync(SOURCE, join(launch.state, "sessions", sid), { recursive: true });
  // The session's manifest names its record by absolute path; point the copy at its own record, or the server streams
  // the original (every run before 2026-11-19 10:20 did, read-only).
  {
    const manifestPath = join(launch.state, "sessions", sid, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { record_root: string };
    manifest.record_root = join(launch.state, "sessions", sid, "record");
    writeFileSync(manifestPath, JSON.stringify(manifest));
  }
  if (ENVELOPES) {
    const record = join(launch.state, "sessions", sid, "record");
    const hot = (JSON.parse(readFileSync(join(record, "manifest.json"), "utf8")) as { hot_segment: string }).hot_segment;
    const lines = readFileSync(join(record, hot), "utf8").split("\n").filter(Boolean);
    writeFileSync(join(record, hot), lines.slice(0, ENVELOPES).join("\n") + "\n");
    console.log(JSON.stringify({ kept: Math.min(ENVELOPES, lines.length), of: lines.length }));
  }
  const app = await electron.launch({ ...launch.options, timeout: 30_000 });
  let gone: string | null = null;
  try {
    const win = await app.firstWindow();
    win.on("crash", () => { gone = "crash"; });
    await waitForApp(win);
    // The JavaScript heap, beside the process's working set: live data, or memory outside V8.
    const cdp = await app.context().newCDPSession(win);
    const heap = async () => {
      const h = await Promise.race([
        cdp.send("Runtime.getHeapUsage") as Promise<{ usedSize: number; totalSize: number }>,
        new Promise<null>((r) => setTimeout(() => r(null), 3000)),
      ]).catch(() => null);
      return h ? { heap_used_mb: Math.round(h.usedSize / 2 ** 20), heap_total_mb: Math.round(h.totalSize / 2 ** 20) } : { heap_used_mb: null };
    };
    if (PROFILE_DIR) {
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.setSamplingInterval", { interval: 1000 });
      await cdp.send("Profiler.start");
      if (HEAP_SAMPLING) await cdp.send("HeapProfiler.startSampling", { samplingInterval: 65536 });
    }
    const t0 = Date.now();
    await app.evaluate((m, u) => m.app.emit("open-url", { preventDefault: Boolean }, u), `substrate://session/${sid}`);
    let last = -1;
    while ((Date.now() - t0) / 1000 < LIMIT_S) {
      await new Promise((r) => setTimeout(r, EVERY_MS));
      const metrics = await app.evaluate(({ app: a, BrowserWindow }) => {
        const pid = BrowserWindow.getAllWindows()[0]?.webContents.getOSProcessId() ?? -1;
        const m = a.getAppMetrics().find((p) => p.pid === pid);
        return { pid, working_set_kb: m?.memory.workingSetSize ?? null, peak_kb: m?.memory.peakWorkingSetSize ?? null, cpu: m?.cpu.percentCPUUsage ?? null };
      });
      let lag: { main_lag_ms?: number } = {};
      if (LAG) {
        let worst = 0;
        for (let i = 0; i < 5; i++) { const a = performance.now(); await app.evaluate(() => 0); worst = Math.max(worst, performance.now() - a); }
        lag = { main_lag_ms: Math.round(worst) };
      }
      const n = appended(launch.state);
      console.log(JSON.stringify({ s: Math.round((Date.now() - t0) / 1000), appended: n, ...metrics, ...lag, ...(gone ? {} : await heap()), gone }));
      if (gone) break;
      if (DUMP_AT_S && (Date.now() - t0) / 1000 >= DUMP_AT_S && DUMP_FILE) {
        await app.evaluate(async ({ contentTracing }, file) => {
          await contentTracing.startRecording({
            included_categories: ["disabled-by-default-memory-infra"], excluded_categories: ["*"],
            memory_dump_config: { triggers: [{ mode: "detailed", periodic_interval_ms: 3000 }] },
          } as Electron.TraceConfig);
          await new Promise((r) => setTimeout(r, 7000));
          await contentTracing.stopRecording(file);
        }, DUMP_FILE);
        console.log(JSON.stringify({ dumped: DUMP_FILE, pid: metrics.pid }));
        break;
      }
      if (ENVELOPES && n >= ENVELOPES) {
        const within = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]).catch(() => null);
        let h: Awaited<ReturnType<typeof heap>> = { heap_used_mb: null };
        const until = Date.now() + 900_000;
        while (h.heap_used_mb === null && Date.now() < until && !gone) h = await heap();
        console.log(JSON.stringify({ idle_after_s: Math.round((Date.now() - t0) / 1000), before_gc: h, gone }));
        if (gone) break;
        // Is the page idle? Its CPU and working set for 30 s, read from main without DevTools.
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          console.log(JSON.stringify({ quiet_s: (i + 1) * 5, gone, ...(await app.evaluate(({ app: a, BrowserWindow }) => { const pid = BrowserWindow.getAllWindows()[0]?.webContents.getOSProcessId() ?? -1; const m = a.getAppMetrics().find((p) => p.pid === pid); return { pid, working_set_kb: m?.memory.workingSetSize ?? null, cpu: m?.cpu.percentCPUUsage ?? null }; })) }));
        }
        // Does the page run script at all? A trivial evaluate, its error printed.
        const t1 = Date.now();
        const trivial = await Promise.race([
          (cdp.send("Runtime.evaluate", { expression: "1+1", returnByValue: true }) as Promise<{ result: { value: unknown } }>).then((r) => ({ ok: r.result.value })).catch((e: Error) => ({ error: String(e.message).slice(0, 300) })),
          new Promise((r) => setTimeout(() => r({ timeout: 30_000 }), 30_000)),
        ]);
        console.log(JSON.stringify({ trivial, ms: Date.now() - t1 }));
        // What the page holds, by count: the pane's snapshot, the DOM, the signal buffer.
        const held = await within(cdp.send("Runtime.evaluate", { returnByValue: true, expression: `(() => {
          const vm = window.__vm; const id = vm.paneIds().find((p) => vm.get(p).snapshot().sessionId);
          const s = vm.get(id).snapshot(); const prog = Object.values(s.progressByCallId);
          return { pane: id, envelopes: s.rawEnvelopes.length, rows: s.transcript.length, streams: prog.length,
            stream_chars: prog.reduce((a, p) => a + p.text.length, 0), longest_stream_chars: prog.reduce((a, p) => Math.max(a, p.text.length), 0),
            dom_elements: document.getElementsByTagName("*").length, dom_text_chars: document.body.textContent.length,
            signals: (window.__vmSignals || []).length };
        })()` }) as Promise<{ result: { value: unknown }; exceptionDetails?: { text?: string; exception?: { description?: string } } }>, 120_000);
        console.log(JSON.stringify({ held: held ? (held.exceptionDetails ? { exception: (held.exceptionDetails.exception?.description ?? held.exceptionDetails.text ?? "").slice(0, 300) } : held.result.value) : null }));
        console.log(JSON.stringify({ dom: await within(cdp.send("Memory.getDOMCounters"), 60_000) }));
        const gcStart = Date.now();
        const gc = await within(cdp.send("HeapProfiler.collectGarbage"), 600_000);
        console.log(JSON.stringify({ after_full_gc: gc !== null, gc_s: Math.round((Date.now() - gcStart) / 1000), ...(await heap()), metrics: await app.evaluate(({ app: a, BrowserWindow }) => { const pid = BrowserWindow.getAllWindows()[0]?.webContents.getOSProcessId() ?? -1; const m = a.getAppMetrics().find((p) => p.pid === pid); return { working_set_kb: m?.memory.workingSetSize ?? null }; }) }));
        // The page's memory by region outside the heap: macOS footprint on its pid, the top categories by dirty size.
        {
          const pid = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.webContents.getOSProcessId() ?? -1);
          try {
            const out = execFileSync("footprint", ["-p", String(pid)], { encoding: "utf8", timeout: 60_000 });
            const rows = out.split("\n").filter((l) => /^\s*[\d.]+ [KMG]?B\s/.test(l)).slice(0, 15).map((l) => l.trim().replace(/\s{2,}/g, " | "));
            console.log(JSON.stringify({ footprint: out.split("\n").find((l) => l.includes("Footprint:"))?.trim() ?? null, top: rows }));
          } catch (e) { console.log(JSON.stringify({ footprint_error: String(e).slice(0, 200) })); }
        }
        if (SNAPSHOT_FILE && gc !== null) {
          const chunks: string[] = [];
          cdp.on("HeapProfiler.addHeapSnapshotChunk", (e: { chunk: string }) => { chunks.push(e.chunk); });
          const took = await within(cdp.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false }), 900_000);
          if (took !== null) writeFileSync(SNAPSHOT_FILE, chunks.join(""));
          console.log(JSON.stringify({ snapshot: took !== null ? SNAPSHOT_FILE : null, bytes: chunks.reduce((a, c) => a + c.length, 0) }));
        }
        break;
      }
      if (PAUSE_AT && n >= PAUSE_AT) {
        const pids = backendPids(launch.state);
        for (const pid of pids) process.kill(pid, "SIGSTOP");
        let h: Awaited<ReturnType<typeof heap>> = { heap_used_mb: null };
        const until = Date.now() + 600_000;
        while (h.heap_used_mb === null && Date.now() < until) h = await heap();
        console.log(JSON.stringify({ paused: pids, appended: appended(launch.state), idle_after_s: Math.round((Date.now() - t0) / 1000), ...h }));
        if (PROFILE_DIR) {
          if (HEAP_SAMPLING) {
            const heapProfile = await cdp.send("HeapProfiler.stopSampling");
            writeFileSync(join(PROFILE_DIR, "heap.heapprofile"), JSON.stringify(heapProfile.profile));
          }
          // A page that dies here never answers; each call waits at most 60 s, so the run still resumes its backend.
          const within = <T,>(p: Promise<T>) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), 60_000))]).catch(() => null);
          const cpu = await within(cdp.send("Profiler.stop"));
          if (cpu) writeFileSync(join(PROFILE_DIR, "cpu.cpuprofile"), JSON.stringify(cpu.profile));
          console.log(JSON.stringify({ dom: await within(cdp.send("Memory.getDOMCounters")) }));
        }
        await Promise.race([cdp.send("HeapProfiler.collectGarbage"), new Promise((r) => setTimeout(r, 60_000))]).catch(() => undefined);
        console.log(JSON.stringify({ after_full_gc: true, ...(await heap()) }));
        for (const pid of pids) process.kill(pid, "SIGCONT");
        break;
      }
      if (n === last && n > 0 && metrics.cpu !== null && metrics.cpu < 5) break;  // replay done, page idle
      last = n;
    }
    // At the limit, a full collection: what survives it is held, not garbage the collector had not reached.
    if (!gone) {
      await Promise.race([cdp.send("HeapProfiler.collectGarbage"), new Promise((r) => setTimeout(r, 30_000))]).catch(() => undefined);
      console.log(JSON.stringify({ after_full_gc: true, appended: appended(launch.state), ...(await heap()) }));
    }
  } finally {
    // REPLAY_KEEP_TRACE=<dir>: the launch's trace files copied there before the scratch state goes.
    if (process.env.REPLAY_KEEP_TRACE) {
      const traces = join(launch.state, "electron", "logs", "traces");
      if (existsSync(traces)) cpSync(traces, process.env.REPLAY_KEEP_TRACE, { recursive: true });
    }
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: false });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
