// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The trace on disk (vocabulary v0.7; plan process/planning/2026-11-05-sdd-signals, item 2). Launches
// the app, picks a folder in a fresh pane's picker (which emits PICKER_* in the window), quits, and
// reads <logs>/traces/<boot_id>/: main.jsonl opens with APP_BOOTED and TRACE_OPENED and ends with
// APP_QUIT_COMPLETED (signals_lost 0); window-<id>.jsonl holds the window's records in proc_seq order,
// each with the boot id and window id. TRACE_PLANT=cap launches with SUBSTRATE_TRACE_CAP=1500 (the
// test seam in electron/main.js), so the window's file caps and drops lines; main.jsonl then holds a
// TRACE_LOST for the window and APP_QUIT_COMPLETED counts the loss. TRACE_PLANT=server-cap launches with
// SUBSTRATE_SERVER_TRACE_CAP=200 (the seam in server.py), which holds SERVER_STARTED only; the server
// reports the lines it drops on stdout and main.jsonl holds them as TRACE_LOST (process server), summing
// to 3 (TRACE_OPENED, STORE_SCANNED, SERVER_STOPPED). TRACE_PLANT=reject (sprint 355) has main and the
// server emit an undeclared tag (SUBSTRATE_SIGNAL_PLANT) and the window one through __vmEmit: each
// process's file holds a SIGNAL_REJECTED naming it, the picker still works, and a source run raises
// in all three while the packaged app does not. Run against a bundle with SHAKEOUT_APP=<Substrate.app>.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

type Rec = { boot_id: string; process: string; proc_seq: number; window_id: number | null; pane_id?: number | null; name: string; payload?: Record<string, unknown> };

function readJsonl(path: string): Rec[] {
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec);
}

async function main(): Promise<void> {
  const plant = process.env.TRACE_PLANT || "";
  const launch = launchArgs({ rejections: plant === "reject" ? "expected" : "fail" });
  if (plant === "cap") launch.options.env.SUBSTRATE_TRACE_CAP = "1500";
  if (plant === "server-cap") launch.options.env.SUBSTRATE_SERVER_TRACE_CAP = "200";
  if (plant === "reject") launch.options.env.SUBSTRATE_SIGNAL_PLANT = "main,server";
  let windowRaised = "";
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let mainErr = "";
  app.process().stderr?.on("data", (c: Buffer) => { mainErr += c.toString("utf8"); });
  let code = 1;
  let traceDir = "";
  try {
    const logs = await app.evaluate(({ app: a }) => a.getPath("logs"));
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const root = join(logs, "traces");
    const newest = readdirSync(root).filter((n) => statSync(join(root, n)).isDirectory()).sort().pop();
    if (!newest) throw new Error(`no launch folder under ${root}`);
    traceDir = join(root, newest);
    if (plant === "reject") {
      windowRaised = await win.evaluate(() => {
        try { (window as unknown as { __vmEmit: (n: string, p: object) => unknown }).__vmEmit("PLANTED_UNDECLARED", {}); return ""; }
        catch (e) { return String((e as Error).message); }
      });
    }
    const row = win.locator("[data-ws-lit] .hover-picker-row").first();
    await row.waitFor({ state: "visible", timeout: 15_000 });
    await row.click();
    await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 5_000 });
    if (plant === "cap") {
      // More window records than the cap holds: the model, guidance, length and tone picks.
      await win.locator('[data-model-row="deterministic"] > span').first().click();
      for (const [line, pos] of [["guidance", "auto"], ["length", "normal"], ["tone", "neutral"]]) {
        const r = win.locator(`[data-${line}-half] [data-${line}-row="${pos}"]`).first();
        await r.waitFor({ state: "visible", timeout: 10_000 });
        await r.click();
      }
      await win.locator("[data-input-bar]").first().waitFor({ state: "visible", timeout: 15_000 });
    }
    // The boot scan runs in the background (STORE_SCANNED); quit only after it has ended. The server's
    // stdout, which main copies to its stderr, prints the scan's line in every run, capped or not.
    const scanDeadline = Date.now() + 30_000;
    while (!/\[server\] boot_scan: /.test(mainErr)) {
      if (Date.now() > scanDeadline) throw new Error("the server's boot scan did not end within 30 s");
      await win.waitForTimeout(50);
    }
    await app.close();

    const main = readJsonl(join(traceDir, "main.jsonl"));
    if (main[0]?.name !== "APP_BOOTED") throw new Error(`main.jsonl does not open with APP_BOOTED: ${main[0]?.name}`);
    for (const f of ["app_version", "app_commit", "kernel_commit", "vocab_version", "packaged", "home_kind"]) {
      if (!(f in (main[0].payload ?? {}))) throw new Error(`APP_BOOTED lacks ${f}`);
    }
    // Sprint 354: the vocabulary the launch speaks is the one in the tree it was built from.
    const vocab = (JSON.parse(readFileSync(join(__dirname, "..", "..", "web", "vm", "signals", "versions", "current.json"), "utf8")) as { vocabulary_version: string }).vocabulary_version;
    if (main[0].payload?.vocab_version !== vocab) throw new Error(`APP_BOOTED.vocab_version ${String(main[0].payload?.vocab_version)}; current.json is ${vocab}`);
    // Sprint 354: the commit names the code that ran; "+dirty" when the tree had uncommitted changes.
    const appCommit = String(main[0].payload?.app_commit);
    if (!/^[0-9a-f]{12,40}(\+dirty)?$/.test(appCommit)) throw new Error(`APP_BOOTED.app_commit is ${appCommit}`);
    if (main[0].payload?.packaged === false) {
      const repo = join(__dirname, "..", "..");
      const head = execFileSync("git", ["-C", repo, "rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
      const dirty = execFileSync("git", ["-C", repo, "status", "--porcelain", "--", ".", ":!runs/packaged", ":!captures"], { encoding: "utf8" }).trim() !== "";
      if (appCommit !== head + (dirty ? "+dirty" : "")) throw new Error(`APP_BOOTED.app_commit ${appCommit}; the tree is ${head}${dirty ? "+dirty" : ""}`);
    } else {
      // The packaged app reports what its Info.plist recorded at build time, read here with
      // PlistBuddy: the UI commit as built, the kernel commit with "+dirty" when the build marked the
      // kernel not releasable (built from uncommitted changes).
      const plistPath = join(process.env.SHAKEOUT_APP ?? "", "Contents", "Info.plist");
      const key = (k: string) => execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print ${k}`, plistPath], { encoding: "utf8" }).trim();
      const wantApp = key("SubstrateUICommit");
      const wantKernel = key("SubstrateKernelCommit") + (key("SubstrateKernelReleasable") === "false" ? "+dirty" : "");
      if (appCommit !== wantApp) throw new Error(`APP_BOOTED.app_commit ${appCommit}; Info.plist records ${wantApp}`);
      if (main[0].payload?.kernel_commit !== wantKernel) throw new Error(`APP_BOOTED.kernel_commit ${String(main[0].payload?.kernel_commit)}; Info.plist records ${wantKernel}`);
    }
    if (!main.some((r) => r.name === "TRACE_OPENED")) throw new Error("main.jsonl has no TRACE_OPENED");
    const last = main[main.length - 1];
    if (last.name !== "APP_QUIT_COMPLETED") throw new Error(`main.jsonl does not end with APP_QUIT_COMPLETED: ${last.name}`);
    if (main.some((r, i) => r.proc_seq !== i || r.boot_id !== newest)) throw new Error("main.jsonl proc_seq or boot_id out of order");

    // The server's file. v0.8: SERVER_STARTED, written at the port bind before the server serves, opens
    // it (S1); STORE_SCANNED follows when the boot scan ends; SERVER_STOPPED, at its SIGTERM shutdown,
    // closes it.
    const server = existsSync(join(traceDir, "server.jsonl")) ? readJsonl(join(traceDir, "server.jsonl")) : [];
    if (server[0]?.name !== "SERVER_STARTED") throw new Error(`server.jsonl does not open with SERVER_STARTED: ${server[0]?.name}`);
    if (typeof server[0].payload?.port !== "number" || Object.keys(server[0].payload ?? {}).length !== 1) throw new Error(`SERVER_STARTED payload is not {port}: ${JSON.stringify(server[0].payload)}`);
    if (plant === "server-cap") {
      const lost = main.filter((r) => r.name === "TRACE_LOST" && r.payload?.process === "server");
      const sum = lost.reduce((n, r) => n + Number(r.payload?.count ?? 0), 0);
      if (server.length !== 1) throw new Error(`the capped server.jsonl holds ${server.length} lines, expected SERVER_STARTED only`);
      if (sum !== 3) throw new Error(`main.jsonl's TRACE_LOST (server) counts sum to ${sum}, expected 3: ${JSON.stringify(lost.map((r) => r.payload))}`);
      if (Number(last.payload?.signals_lost) !== sum) throw new Error(`APP_QUIT_COMPLETED.signals_lost ${String(last.payload?.signals_lost)}, expected ${sum}`);
      console.log(`trace_files: ok (planted server cap) — server.jsonl holds SERVER_STARTED only; main.jsonl has ${lost.length} TRACE_LOST (server) summing to ${sum}; signals_lost ${sum}`);
      code = 0;
      return;
    }
    const scanned = server.filter((r) => r.name === "STORE_SCANNED");
    if (scanned.length !== 1) throw new Error(`server.jsonl holds ${scanned.length} STORE_SCANNED, expected 1`);
    for (const f of ["sessions_found", "parked", "interrupted", "ended", "skipped", "duration_ms"]) {
      if (typeof scanned[0].payload?.[f] !== "number") throw new Error(`STORE_SCANNED lacks ${f}`);
    }
    if (main.some((r) => r.name === "TRACE_LOST") || server.some((r) => r.name === "TRACE_LOST")) {
      if (plant !== "cap") throw new Error("a TRACE_LOST in a run with no plant");
    }
    if (!server.some((r) => r.name === "TRACE_OPENED" && r.payload?.process === "server")) throw new Error("server.jsonl has no TRACE_OPENED");
    if (server[server.length - 1].name !== "SERVER_STOPPED") throw new Error(`server.jsonl does not end with SERVER_STOPPED: ${server[server.length - 1].name}`);
    if (server.some((r, i) => r.proc_seq !== i || r.boot_id !== newest || r.process !== "server")) throw new Error("server.jsonl context or order wrong");
    const winFiles = readdirSync(traceDir).filter((n) => n.startsWith("window-"));
    if (plant === "reject") {
      const packagedRun = main[0].payload?.packaged === true;
      const recs = readJsonl(join(traceDir, winFiles[0]));
      for (const [who, file] of [["main", main], ["server", server], ["window", recs]] as const) {
        const r = file.find((x) => x.name === "SIGNAL_REJECTED" && x.payload?.tag === "PLANTED_UNDECLARED");
        if (!r) throw new Error(`no SIGNAL_REJECTED for the planted tag in ${who}'s file`);
        if (r.payload?.process !== who || r.payload?.problem !== "unknown_tag" || !String(r.payload?.call_site ?? "")) throw new Error(`${who}'s SIGNAL_REJECTED is ${JSON.stringify(r.payload)}`);
      }
      if (!recs.some((x) => x.name === "PICKER_FOLDER_ARMED")) throw new Error("the picker did not go on after the rejections");
      const raised = {
        window: /PLANTED_UNDECLARED" rejected: unknown_tag/.test(windowRaised),
        main: /\[electron\] signal "PLANTED_UNDECLARED" rejected: unknown_tag/.test(mainErr),
        server: /ValueError: signal "PLANTED_UNDECLARED" rejected: unknown_tag/.test(mainErr),
      };
      for (const [who, did] of Object.entries(raised)) {
        if (did === packagedRun) throw new Error(`${who} ${did ? "raised" : "did not raise"} in a ${packagedRun ? "packaged" : "source"} run`);
      }
      if (process.env.TRACE_PRINT) for (const r of [...main, ...server, ...recs]) console.log(JSON.stringify(r));
      console.log(`trace_files: ok (planted rejections) — SIGNAL_REJECTED in main, server and window files; ${packagedRun ? "the packaged app went on in all three" : "all three raised in the source run"}; the picker went on`);
      code = 0;
      return;
    }
    if (plant === "cap") {
      const lost = main.filter((r) => r.name === "TRACE_LOST" && r.payload?.process === "window");
      const lastLost = Number(last.payload?.signals_lost ?? 0);
      if (lost.length !== 1) throw new Error(`expected one TRACE_LOST for the window, found ${lost.length}`);
      if (lastLost === 0) throw new Error("APP_QUIT_COMPLETED counts no loss");
      console.log(`trace_files: ok (planted cap) — one TRACE_LOST for the window, signals_lost ${lastLost}`);
      code = 0;
      return;
    }
    if (Number(last.payload?.signals_lost) !== 0) throw new Error(`signals_lost ${String(last.payload?.signals_lost)}`);
    if (winFiles.length !== 1) throw new Error(`expected one window file, found ${winFiles.join(", ") || "none"}`);
    const recs = readJsonl(join(traceDir, winFiles[0]));
    if (!recs.length) throw new Error("the window file is empty");
    if (recs.some((r, i) => r.proc_seq !== i)) throw new Error("window records out of proc_seq order");
    if (recs.some((r) => r.boot_id !== newest || r.process !== "window" || typeof r.window_id !== "number")) throw new Error("a window record lacks its context");
    if (!recs.some((r) => r.name === "PICKER_FOLDER_ARMED")) throw new Error("the picker's PICKER_FOLDER_ARMED is not in the window file");
    // Sprint 352: the pane controller stamps its pane; window-level code (the picker) leaves it null and
    // names the pane in its payload.
    const fromController = recs.filter((r) => ["SESSIONS_LOADED", "WORKSPACES_LOADED", "BUNDLE_ROSTER_LOADED", "DRIVER_ROSTER_LOADED"].includes(r.name));
    if (!fromController.length) throw new Error("no controller record in the window file");
    if (fromController.some((r) => r.pane_id !== 1)) throw new Error(`a controller record lacks pane_id 1: ${JSON.stringify(fromController.map((r) => [r.name, r.pane_id]))}`);
    const armed = recs.find((r) => r.name === "PICKER_FOLDER_ARMED");
    if (armed && (armed.pane_id !== null || armed.payload?.pane_id !== 1)) throw new Error("PICKER_FOLDER_ARMED should carry pane_id null in context and 1 in payload");
    // The gate picks the first row, the default sandbox: no path, so workspace is null (sprint 355).
    if (armed && (armed.payload?.is_default !== true || armed.payload?.workspace !== null)) throw new Error(`PICKER_FOLDER_ARMED for the default row: ${JSON.stringify(armed.payload)}`);
    if (process.env.TRACE_PRINT) for (const r of [...main, ...server, ...recs]) console.log(JSON.stringify(r));
    console.log(`trace_files: ok — ${traceDir}: main ${main.length} lines (APP_BOOTED … APP_QUIT_COMPLETED), server ${server.length} (SERVER_STARTED … SERVER_STOPPED), ${winFiles[0]} ${recs.length} lines, PICKER_FOLDER_ARMED present`);
    code = 0;
  } catch (e) {
    console.error(`trace_files: FAIL — ${(e as Error).message}${traceDir ? ` (${traceDir})` : ""}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
