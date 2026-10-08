// Background-tasks gate (UI sprint 105), driven in the Electron app itself.
//
// A real model turn starts `sleep 301` with run_in_background. The activity strip must list the
// task with a stop link; clicking stop must end it: the daemon reports it stopped and no
// `sleep 301` process is left. Claude Code's /tasks is the reference.
//
// Runs against source (`electron .`) by default; TASKS_APP=<path to Substrate.app> runs the
// packaged bundle. Drives the app's default model (`default` in /api/models); TASKS_DRIVER overrides.
// Counts only `sleep 301` processes under this run's own backend (found by its SUBSTRATE_HOME).
//
//   npx tsx harness/shakeout/tasks_gate.ts

import { _electron as electron, type ElectronApplication } from "playwright";
import { join, resolve } from "node:path";
import { scratchDir } from "./lib/scratch";
import { backendPids, descendantsMatching } from "./lib/procs";

const REPO_ROOT = resolve(__dirname, "..", "..");
const APP = process.env.TASKS_APP || "";
const DRIVER_OVERRIDE = process.env.TASKS_DRIVER || "";
const fails: string[] = [];
const check = (ok: boolean, what: string) => {
  process.stdout.write(`${ok ? "ok  " : "FAIL"} ${what}\n`);
  if (!ok) fails.push(what);
};

const state = scratchDir("tasks-state-");

function launch(): Promise<ElectronApplication> {
  const userData = scratchDir("tasks-userdata-");
  const env = { ...process.env, SUBSTRATE_HOME: state } as Record<string, string>;
  return APP
    ? electron.launch({ executablePath: join(APP, "Contents", "MacOS", "Substrate"), args: ["--user-data-dir=" + userData], env })
    : electron.launch({ args: [REPO_ROOT, "--user-data-dir=" + userData], env });
}

const sleepers = (): number => descendantsMatching(backendPids(state), /^sleep 301$/).length;

(async () => {
  let app: ElectronApplication | null = null;
  try {
    app = await launch();
    const before = sleepers();
    const win = await app.firstWindow({ timeout: 30_000 });
    await win.waitForLoadState("load");
    await win.waitForFunction(() => (window as any).__vm != null, undefined, { timeout: 15_000 });
    const sid = await win.evaluate(async (override) => {
      const c = (window as any).__vm.get(1) ?? (window as any).__vm.spawn(1);
      await c.loadDriverRoster();
      const drv = override || ((await (await fetch("/api/models")).json()) as { default?: string }).default;
      if (!drv) throw new Error("no default driver in /api/models and TASKS_DRIVER unset");
      c.pickDriver(drv);
      await c.openSession({ driver: drv });
      void c.sendTurn("Call the bash tool with cmd 'sleep 301' and run_in_background true. Then reply with the word ok.");
      return c.snapshot().sessionId as string;
    }, DRIVER_OVERRIDE);
    await win.waitForSelector("[data-vm-task-stop]", { timeout: 120_000 });
    const label = await win.locator("[data-vm-tasks]").first().innerText();
    check(/sleep 301/.test(label), `the strip lists the task (${label.replace(/\s+/g, " ").trim()})`);
    check(sleepers() === before + 1, "one sleep 301 process is running");
    const taskId = await win.locator("[data-vm-task-stop]").first().getAttribute("data-vm-task-stop");
    await win.locator("[data-vm-task-stop]").first().click();
    await win.waitForSelector("[data-vm-task-stop]", { state: "detached", timeout: 15_000 });
    check(true, "the task line left the strip after stop");
    const tasks = await win.evaluate(async (s) => {
      const r = await fetch(`/api/session/${encodeURIComponent(s)}/tasks`);
      return ((await r.json()) as { tasks: { task_id: string; status: string; stopped_because: string | null }[] }).tasks;
    }, sid);
    const t = tasks.find((x) => x.task_id === taskId);
    check(!!t && t.status === "stopped" && t.stopped_because === "stopped from the app",
      `the daemon reports ${taskId} stopped from the app (${t ? t.status + ", " + t.stopped_because : "missing"})`);
    check(sleepers() === before, "no sleep 301 process is left");
  } catch (e) {
    check(false, `flow error: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await app?.close().catch(() => undefined);
  }
  process.stdout.write(fails.length ? `tasks_gate: ${fails.length} FAILED\n` : "tasks_gate: all passed\n");
  process.exit(fails.length ? 1 : 0);
})();
