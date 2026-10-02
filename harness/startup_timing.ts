// harness/startup_timing.ts — Sprint 094: measure app startup, stage by stage.
//
// Launches the source-mode Electron app (`electron .`) against a state root
// given by STARTUP_STATE (default: a fresh empty dir), timestamps each stage
// from the main process's stderr and the renderer, and prints one JSON line
// per launch. Runs STARTUP_RUNS cold launches (default 2). After the first
// launch is up it starts a SECOND instance on the same user-data dir and
// counts backends, which checks the single-instance guard.
//
// Usage: STARTUP_STATE=/path/to/state-clone npx tsx harness/startup_timing.ts

import { _electron as electron, type ElectronApplication } from "playwright";
import { execSync, spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const STATE = process.env.STARTUP_STATE || mkdtempSync(path.join(tmpdir(), "startup-state-"));
const RUNS = Number(process.env.STARTUP_RUNS || 2);
const PROMPT = '[placeholder^="type to talk"], [placeholder^="type a path"]';

function backendsFor(state: string): number[] {
  // Backends whose environment points at this state root.
  const out = execSync("ps -axo pid=,command=", { encoding: "utf8" });
  const pids: number[] = [];
  for (const line of out.split("\n")) {
    if (!/server\.py --port 0/.test(line) || /uv run/.test(line)) continue;
    const pid = Number(line.trim().split(/\s+/)[0]);
    try {
      const env = execSync(`ps eww -o command= -p ${pid}`, { encoding: "utf8" });
      if (env.includes(`SUBSTRATE_HOME=${state}`)) pids.push(pid);
    } catch { /* gone */ }
  }
  return pids;
}

async function launchOnce(userDataDir: string, checkSecondInstance: boolean): Promise<Record<string, unknown>> {
  const marks: Record<string, number> = {};
  const t0 = Date.now();
  const mark = (k: string) => { if (!(k in marks)) marks[k] = Date.now() - t0; };
  // STARTUP_APP=<Substrate.app> times a packaged bundle instead of `electron .`.
  const bundle = process.env.STARTUP_APP;
  const app: ElectronApplication = await electron.launch({
    ...(bundle ? { executablePath: path.join(bundle, "Contents", "MacOS", "Substrate") } : {}),
    args: bundle ? ["--user-data-dir=" + userDataDir] : [REPO_ROOT, "--user-data-dir=" + userDataDir],
    env: { ...process.env, SUBSTRATE_HOME: STATE } as Record<string, string>,
  });
  const logLines: string[] = [];
  const onText = (b: Buffer) => {
    const s = b.toString("utf8");
    for (const l of s.split("\n")) if (l) logLines.push(`${Date.now() - t0} ${l}`);
    if (s.includes("app boot ===")) mark("log_opened");
    if (s.includes("PATH restored") || s.includes("PATH not restored")) mark("path_probe_done");
    if (s.includes("spawning server")) mark("server_spawned");
    if (s.includes("server bound port")) mark("port_readback");
    if (s.includes("server up on")) mark("health_ok");
    const m = s.match(/boot_scan: (\d+) manifest\(s\) in ([\d.]+)s/);
    if (m) { mark("boot_scan_done"); marks.boot_scan_manifests = Number(m[1]); marks.boot_scan_reported_ms = Math.round(Number(m[2]) * 1000); }
  };
  app.process().stderr?.on("data", onText);
  app.process().stdout?.on("data", onText);
  const win = await app.firstWindow({ timeout: 60_000 });
  mark("window_created");
  await win.waitForLoadState("load");
  mark("page_loaded");
  await win.locator(PROMPT).first().waitFor({ state: "visible", timeout: 60_000 });
  mark("prompt_visible");
  const deadline = Date.now() + 120_000;
  while (!("boot_scan_done" in marks) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));

  let second: Record<string, unknown> | undefined;
  if (checkSecondInstance) {
    const before = backendsFor(STATE).length;
    const electronBin = require("electron") as unknown as string;
    const t1 = Date.now();
    const child = spawn(electronBin, [REPO_ROOT, "--user-data-dir=" + userDataDir], {
      env: { ...process.env, SUBSTRATE_HOME: STATE }, stdio: "ignore",
    });
    const exitCode: number | null = await new Promise((resolve) => {
      const timer = setTimeout(() => { child.kill("SIGKILL"); resolve(null); }, 15_000);
      child.on("exit", (code) => { clearTimeout(timer); resolve(code); });
    });
    await new Promise((r) => setTimeout(r, 2_000));
    second = {
      exit_code: exitCode,
      exited_after_ms: Date.now() - t1 - 2_000,
      backends_before: before,
      backends_after: backendsFor(STATE).length,
    };
  }

  const tq = Date.now();
  await app.close();
  const pidsLeft = await (async () => {
    for (let i = 0; i < 100; i++) {
      if (backendsFor(STATE).length === 0) return 0;
      await new Promise((r) => setTimeout(r, 100));
    }
    return backendsFor(STATE).length;
  })();
  if (process.env.STARTUP_LOG) require("node:fs").writeFileSync(`${process.env.STARTUP_LOG}-${t0}.log`, logLines.join("\n"));
  return { ...marks, quit_to_no_backend_ms: Date.now() - tq, backends_left_after_quit: pidsLeft, second_instance: second };
}

(async () => {
  const userDataDir = mkdtempSync(path.join(tmpdir(), "startup-userdata-"));
  for (let i = 0; i < RUNS; i++) {
    const r = await launchOnce(userDataDir, i === 0);
    console.log(JSON.stringify({ run: i + 1, state: STATE, ...r }));
  }
})().catch((e) => { console.error(e); process.exit(1); });
