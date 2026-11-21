// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// harness/measure_window.ts — the window measured as it is used (plan 2026-11-18-window-productionizing
// PLAN-2026-11-19-measurements-r2.md, step 2; research r2 § 7 for the measures and their sources).
//
// A measurement, not a gate: it prints numbers, one JSON line per sample and a summary line. Every session is made
// here, through the server, on the launch's scratch state; nothing on the machine is read.
//
// MEASURE_SCENARIO:
//   stream — one live turn whose bash command prints MEASURE_LINES lines (default 20,000, ~130 bytes each), so the
//            kernel posts one ToolProgress per line (tools.py `_bash`), the window following it.
//   type   — stream, with MEASURE_KEYS keystrokes (default 300) typed into the input bar, 40 ms apart, while it runs.
//   turns  — MEASURE_TURNS short turns (default 200), one `echo` each; every 20 turns a full collection, then the
//            heap, the DOM and the working set; the summary gives the growth per turn by least squares.
// Measures: long animation frames (count, total, longest, blocking, forced style and layout by script) and long tasks
// (PerformanceObserver); input delay and duration per keystroke (Event Timing, durationThreshold 16); DevTools
// Performance.getMetrics deltas (layouts, style recalcs, their durations, script and task time); the JavaScript heap
// before and after a full collection and its limit (performance.memory.jsHeapSizeLimit); DOM counters; the working
// set of every Electron process (app.getAppMetrics) and of the backend (ps); macOS footprint on the page at the end.
// SHAKEOUT_APP=<bundle> measures a packaged build.

import { _electron as electron, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { join } from "node:path";
import { launchArgs, waitForApp } from "./shakeout/lib/electron";
import { backendPids } from "./shakeout/lib/procs";

const SCENARIO = process.env.MEASURE_SCENARIO || "stream";
const LINES = Number(process.env.MEASURE_LINES || 20_000);
const KEYS = Number(process.env.MEASURE_KEYS || 300);
const TURNS = Number(process.env.MEASURE_TURNS || 200);
const LIMIT_S = Number(process.env.MEASURE_LIMIT_S || 900);
/** MEASURE_SAMPLE_DIR=<dir>: during a stream, macOS `sample` takes main's call stacks for 5 s at 10 s and at 40 s, from
 *  outside the process, so a main that does not answer still shows what it is doing; written there as main-<s>.txt. */
const SAMPLE_DIR = process.env.MEASURE_SAMPLE_DIR || "";

const within = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]).catch(() => null);
const out = (o: unknown) => console.log(JSON.stringify(o));

/** The page's own counters: long animation frames, long tasks, input events. Bounded: totals and the worst entries. */
const OBSERVE = `(() => {
  const p = window.__perf = { loaf: { n: 0, total: 0, blocking: 0, max: 0, forced: 0, byScript: {} }, longtask: { n: 0, total: 0, max: 0 }, keys: [] };
  new PerformanceObserver((list) => { for (const e of list.getEntries()) {
    p.loaf.n++; p.loaf.total += e.duration; p.loaf.blocking += e.blockingDuration || 0; p.loaf.max = Math.max(p.loaf.max, e.duration);
    for (const s of e.scripts || []) {
      p.loaf.forced += s.forcedStyleAndLayoutDuration || 0;
      const k = (s.sourceFunctionName || s.invoker || "?").slice(0, 60);
      const b = p.loaf.byScript[k] || (p.loaf.byScript[k] = { n: 0, ms: 0, forced: 0 });
      b.n++; b.ms += s.duration; b.forced += s.forcedStyleAndLayoutDuration || 0;
    }
  } }).observe({ type: "long-animation-frame", buffered: true });
  new PerformanceObserver((list) => { for (const e of list.getEntries()) { p.longtask.n++; p.longtask.total += e.duration; p.longtask.max = Math.max(p.longtask.max, e.duration); } }).observe({ type: "longtask", buffered: true });
  new PerformanceObserver((list) => { for (const e of list.getEntries()) {
    if (e.name !== "keydown") continue;
    if (p.keys.length < 5000) p.keys.push([Math.round(e.processingStart - e.startTime), Math.round(e.duration)]);
  } }).observe({ type: "event", durationThreshold: 16, buffered: true });
  return true;
})()`;

const PERF_NOW = `(() => { const p = window.__perf; if (!p) return null;
  const top = Object.entries(p.loaf.byScript).sort((a, b) => b[1].ms - a[1].ms).slice(0, 6).map(([k, v]) => ({ script: k, n: v.n, ms: Math.round(v.ms), forced_ms: Math.round(v.forced) }));
  return { loaf_n: p.loaf.n, loaf_ms: Math.round(p.loaf.total), loaf_blocking_ms: Math.round(p.loaf.blocking), loaf_max_ms: Math.round(p.loaf.max), loaf_forced_ms: Math.round(p.loaf.forced), top,
    longtask_n: p.longtask.n, longtask_ms: Math.round(p.longtask.total), longtask_max_ms: Math.round(p.longtask.max), keys: p.keys.length };
})()`;

function stats(xs: number[]): { n: number; median: number | null; p95: number | null; max: number | null } {
  if (!xs.length) return { n: 0, median: null, p95: null, max: null };
  const s = [...xs].sort((a, b) => a - b);
  return { n: s.length, median: s[Math.floor(s.length / 2)], p95: s[Math.min(s.length - 1, Math.floor(s.length * 0.95))], max: s[s.length - 1] };
}

function slope(points: [number, number][]): number | null {
  if (points.length < 2) return null;
  const n = points.length, mx = points.reduce((a, p) => a + p[0], 0) / n, my = points.reduce((a, p) => a + p[1], 0) / n;
  const den = points.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  return den ? points.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / den : null;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const ws = join(launch.state, "ws");
  mkdirSync(ws, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let gone: string | null = null;
  try {
    const win: Page = await app.firstWindow({ timeout: 30_000 });
    win.on("crash", () => { gone = "crash"; });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    const cdp = await app.context().newCDPSession(win);
    await cdp.send("Performance.enable");
    const base = `http://127.0.0.1:${new URL(win.url()).port}`;
    const post = (path: string, body: unknown, ms = 900_000) => within(fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) })), ms);

    const metrics = async () => {
      const m = await within(cdp.send("Performance.getMetrics") as Promise<{ metrics: { name: string; value: number }[] }>, 5_000);
      return m ? Object.fromEntries(m.metrics.map((x) => [x.name, x.value])) : null;
    };
    const procs = async () => {
      const em = (await within(app.evaluate(({ app: a, BrowserWindow }) => {
        const pagePid = BrowserWindow.getAllWindows()[0]?.webContents.getOSProcessId() ?? -1;
        return a.getAppMetrics().map((p) => ({ type: p.pid === pagePid ? "page" : p.type, ws_mb: Math.round(p.memory.workingSetSize / 1024), cpu: Math.round(p.cpu.percentCPUUsage * 10) / 10 }));
      }), 5_000)) ?? [];
      let backend_mb: number | null = null;
      try { backend_mb = backendPids(launch.state).reduce((acc, pid) => acc + Number(execFileSync("ps", ["-o", "rss=", "-p", String(pid)], { encoding: "utf8" }).trim() || 0), 0) / 1024; } catch { /* gone */ }
      return { procs: em, backend_mb: backend_mb === null ? null : Math.round(backend_mb) };
    };
    const heap = async () => {
      const h = await within(cdp.send("Runtime.getHeapUsage") as Promise<{ usedSize: number }>, 3_000);
      return h ? Math.round(h.usedSize / 2 ** 20) : null;
    };
    const gcHeap = async () => {
      const ok = await within(cdp.send("HeapProfiler.collectGarbage"), 120_000);
      return ok === null ? null : await heap();
    };
    const page = async (expr: string, ms = 5_000) => {
      const r = await within(cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true }) as Promise<{ result: { value: unknown } }>, ms);
      return r ? r.result.value : null;
    };

    await page(OBSERVE);
    const limitMb = await page("Math.round(performance.memory.jsHeapSizeLimit / 1048576)");
    const m0 = await metrics();
    out({ scenario: SCENARIO, heap_limit_mb: limitMb, heap_mb: await heap(), ...(await procs()) });

    const script = SCENARIO === "turns"
      ? [["bash", ["echo turn"]]]
      : [["bash", [`for i in $(seq 1 ${LINES}); do printf 'line %06d %s\\n' $i 'the quick brown fox jumps over the lazy dog while the build prints its long log of every step it took'; done`]]];
    const made = await post("/api/session", { driver: "deterministic", workspace: ws, make_repository: false, driver_params: { script } }, 30_000);
    const sid = (made?.body as { session_id?: string } | null)?.session_id;
    if (!sid) throw new Error(`session: ${JSON.stringify(made)}`);
    await win.evaluate(`(function () { var vm = window.__vm; return (vm.get(1) || vm.spawn(1)).attachExisting(${JSON.stringify(sid)}); })()`);
    await win.waitForFunction(`window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(sid)}`, undefined, { timeout: 15_000 });
    const t0 = Date.now();

    if (SCENARIO === "turns") {
      const points: { turn: number; heap_mb: number | null; dom_nodes: number | null; page_ws_mb: number | null }[] = [];
      for (let t = 1; t <= TURNS && !gone; t++) {
        const r = await post(`/api/session/${sid}/turn`, { text: `turn ${t}` }, 120_000);
        if (!r || r.status !== 200) { out({ turn: t, refused: r }); break; }
        if (t % 20 === 0 || t === 1) {
          const h = await gcHeap();
          const dom = await within(cdp.send("Memory.getDOMCounters") as Promise<{ nodes: number }>, 5_000);
          const pr = await procs();
          const p = { turn: t, heap_mb: h, dom_nodes: dom ? dom.nodes : null, page_ws_mb: pr.procs.find((x) => x.type === "page")?.ws_mb ?? null };
          points.push(p);
          out({ s: Math.round((Date.now() - t0) / 1000), ...p, backend_mb: pr.backend_mb });
        }
      }
      const fit = (k: "heap_mb" | "dom_nodes" | "page_ws_mb") => {
        const pts = points.filter((p, i) => i > 0 && p[k] !== null).map((p) => [p.turn, p[k] as number] as [number, number]);
        const s = slope(pts);
        return s === null ? null : Math.round(s * 1000) / 1000;
      };
      out({ summary: "turns", turns: points.length ? points[points.length - 1].turn : 0, gone,
        heap_mb_per_turn: fit("heap_mb"), dom_nodes_per_turn: fit("dom_nodes"), page_ws_mb_per_turn: fit("page_ws_mb"),
        perf: await page(PERF_NOW), wall_s: Math.round((Date.now() - t0) / 1000) });
    } else {
      let done = false;
      const turn = post(`/api/session/${sid}/turn`, { text: "print the long log" }, LIMIT_S * 1000).then((r) => { done = true; return r; });
      let typed = 0;
      let typing: Promise<void> | null = null;
      if (SAMPLE_DIR) {
        const mainPid = app.process().pid;
        for (const at of [10, 40]) setTimeout(() => { spawn("sample", [String(mainPid), "5", "-file", join(SAMPLE_DIR, `main-${at}.txt`)], { stdio: "ignore" }); out({ sampled_main_at_s: at, pid: mainPid }); }, at * 1000);
      }
      while (!done && !gone && (Date.now() - t0) / 1000 < LIMIT_S) {
        await new Promise((r) => setTimeout(r, 2_000));
        if (SCENARIO === "type" && !typing) {
          const streaming = await page(`(() => { const s = window.__vm.get(1).snapshot(); return Object.values(s.progressByCallId).some((p) => p.text.length > 0); })()`, 2_000);
          if (streaming) {
            typing = (async () => {
              const bar = win.locator("textarea[data-input-bar]").filter({ visible: true }).first();
              await within(bar.focus(), 10_000);
              for (let k = 0; k < KEYS && !done && !gone; k++) {
                const ok = await within(win.keyboard.press(k % 10 === 9 ? "Backspace" : "a"), 30_000);
                if (ok === null) { out({ key_stuck_at: k }); break; }
                typed++;
                await new Promise((r) => setTimeout(r, 40));
              }
            })();
          }
        }
        // Each step timed, so a stall names its step; the server's own answer time beside the page's.
        const ta = Date.now(); const pr = await procs(); const procs_ms = Date.now() - ta;
        const tb = Date.now(); const progress = await page(`(() => { const s = window.__vm.get(1).snapshot(); return { envelopes: s.rawEnvelopes.length, longest: Object.values(s.progressByCallId).reduce((a, p) => Math.max(a, p.text.length), 0) }; })()`, 2_000); const page_ms = Date.now() - tb;
        const tc = Date.now(); const srv = await within(fetch(`${base}/api/session/${sid}`).then((r) => r.json() as Promise<{ status?: string }>), 10_000); const server_ms = Date.now() - tc;
        out({ s: Math.round((Date.now() - t0) / 1000), ...pr, heap_mb: await heap(), page_now: progress, server_status: srv?.status ?? null, procs_ms, page_ms, server_ms, typed, gone });
      }
      const result = await turn;
      if (typing) await within(typing, 60_000);
      await new Promise((r) => setTimeout(r, 3_000));
      const m1 = await metrics();
      const delta = m0 && m1 ? Object.fromEntries(["LayoutCount", "RecalcStyleCount", "LayoutDuration", "RecalcStyleDuration", "ScriptDuration", "TaskDuration", "Nodes", "JSEventListeners"].map((k) => [k, Math.round(((m1[k] ?? 0) - (k === "Nodes" || k === "JSEventListeners" ? 0 : (m0[k] ?? 0))) * 1000) / 1000])) : null;
      const keys = (await page("window.__perf ? window.__perf.keys : []", 10_000)) as [number, number][] | null;
      const heapBefore = await heap();
      const heapAfter = await gcHeap();
      const dom = await within(cdp.send("Memory.getDOMCounters"), 10_000);
      let footprint: string | null = null;
      try {
        const pid = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.webContents.getOSProcessId() ?? -1);
        footprint = execFileSync("footprint", ["-p", String(pid)], { encoding: "utf8", timeout: 60_000 }).split("\n").find((l) => l.includes("Footprint:"))?.trim() ?? null;
      } catch { /* the page is gone */ }
      out({ summary: SCENARIO, lines: LINES, turn_status: result?.status ?? null, gone, wall_s: Math.round((Date.now() - t0) / 1000),
        metrics_delta: delta, perf: await page(PERF_NOW, 10_000),
        keys_typed: typed, key_input_delay_ms: stats((keys ?? []).map((k) => k[0])), key_duration_ms: stats((keys ?? []).map((k) => k[1])),
        heap_before_gc_mb: heapBefore, heap_after_gc_mb: heapAfter, dom, footprint, ...(await procs()) });
    }
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: false });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
