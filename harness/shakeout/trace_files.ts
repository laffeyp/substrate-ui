// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The trace on disk (vocabulary v0.7; plan process/planning/2026-11-05-sdd-signals, item 2). Launches
// the app, picks a folder in a fresh pane's picker (which emits PICKER_* in the window), quits, and
// reads <logs>/traces/<boot_id>/: main.jsonl opens with APP_BOOTED and TRACE_OPENED and ends with
// APP_QUIT_COMPLETED (signals_lost 0); window-<id>.jsonl holds the window's records in proc_seq order,
// each with the boot id and window id. TRACE_PLANT=cap launches with SUBSTRATE_TRACE_CAP=1500 (the
// test seam in electron/main.js), so the window's file caps and drops lines; main.jsonl then holds a
// TRACE_LOST for the window and APP_QUIT_COMPLETED counts the loss. Run against a bundle with SHAKEOUT_APP=<Substrate.app>.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

type Rec = { boot_id: string; process: string; proc_seq: number; window_id: number | null; pane_id?: number | null; name: string; payload?: Record<string, unknown> };

function readJsonl(path: string): Rec[] {
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec);
}

async function main(): Promise<void> {
  const plant = process.env.TRACE_PLANT || "";
  const launch = launchArgs();
  if (plant === "cap") launch.options.env.SUBSTRATE_TRACE_CAP = "1500";
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
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
    await app.close();

    const main = readJsonl(join(traceDir, "main.jsonl"));
    if (main[0]?.name !== "APP_BOOTED") throw new Error(`main.jsonl does not open with APP_BOOTED: ${main[0]?.name}`);
    for (const f of ["app_version", "app_commit", "kernel_commit", "vocab_version", "packaged", "home_kind"]) {
      if (!(f in (main[0].payload ?? {}))) throw new Error(`APP_BOOTED lacks ${f}`);
    }
    if (!main.some((r) => r.name === "TRACE_OPENED")) throw new Error("main.jsonl has no TRACE_OPENED");
    const last = main[main.length - 1];
    if (last.name !== "APP_QUIT_COMPLETED") throw new Error(`main.jsonl does not end with APP_QUIT_COMPLETED: ${last.name}`);
    if (main.some((r, i) => r.proc_seq !== i || r.boot_id !== newest)) throw new Error("main.jsonl proc_seq or boot_id out of order");

    const winFiles = readdirSync(traceDir).filter((n) => n.startsWith("window-"));
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
    if (process.env.TRACE_PRINT) for (const r of [...main, ...recs]) console.log(JSON.stringify(r));
    console.log(`trace_files: ok — ${traceDir}: main ${main.length} lines (APP_BOOTED … APP_QUIT_COMPLETED), ${winFiles[0]} ${recs.length} lines, PICKER_FOLDER_ARMED present`);
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
