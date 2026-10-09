// Lifecycle gates (UI sprint 097): the three Sprint 089 fixes no gate had ever driven.
//
//   F6  close every window, then `activate` (what a Dock click sends): a new window must load
//       against the SAME live backend (the backend outlives the window on macOS).
//   F7  a backend that cannot start: the app must show its error dialog naming the log path,
//       and leave no backend behind.
//   F5  a `substrate://record/<path>` deep link delivered to the running app must reach the
//       renderer and attach that record.
//   F8  the backend dies while the app is in use (UI sprint 102): the app must say so, naming
//       how it stopped, and exit on Quit; before, nothing listened and the window sat dead.
//
// Runs against source (`electron .`) by default; LIFECYCLE_APP=<path to Substrate.app> runs the
// same checks against a packaged bundle. Every launch gets its own temp state root.
//
//   npx tsx harness/shakeout/lifecycle_gates.ts

import { _electron as electron, type ElectronApplication } from "playwright";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { scratchDir } from "./lib/scratch";

const REPO_ROOT = resolve(__dirname, "..", "..");
const APP = process.env.LIFECYCLE_APP || "";
const fails: string[] = [];
const check = (ok: boolean, what: string) => {
  process.stdout.write(`${ok ? "ok  " : "FAIL"} ${what}\n`);
  if (!ok) fails.push(what);
};

function launch(state: string): Promise<ElectronApplication> {
  const userData = scratchDir("lifecycle-userdata-");
  const env = { ...process.env, SUBSTRATE_HOME: state } as Record<string, string>;
  return APP
    ? electron.launch({ executablePath: join(APP, "Contents", "MacOS", "Substrate"), args: ["--user-data-dir=" + userData], env })
    : electron.launch({ args: [REPO_ROOT, "--user-data-dir=" + userData], env });
}

function backendsFor(state: string): number[] {
  const out = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" }).stdout || "";
  return out.split("\n")
    .filter((l) => /server\.py --port 0/.test(l) && !/uv run/.test(l))
    .map((l) => Number(l.trim().split(/\s+/)[0]))
    .filter((pid) => (spawnSync("ps", ["eww", "-o", "command=", "-p", String(pid)], { encoding: "utf8" }).stdout || "").includes("SUBSTRATE_HOME=" + state));
}

async function healthy(port: string): Promise<boolean> {
  try { return (await fetch(`http://127.0.0.1:${port}/`)).ok; } catch { return false; }
}

async function f6AndF5(): Promise<void> {
  const state = scratchDir("lifecycle-state-");
  const app = await launch(state);
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await win.waitForLoadState("load");
    const port = new URL(win.url()).port;
    const before = backendsFor(state);

    // F6: close every window, then activate.
    await app.evaluate(({ BrowserWindow }) => { for (const w of BrowserWindow.getAllWindows()) w.close(); });
    await new Promise((r) => setTimeout(r, 1_000));
    const windowsAfterClose = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
    check(windowsAfterClose === 0, `F6 all windows closed (${windowsAfterClose} left)`);
    check(await healthy(port), "F6 backend still serving after the last window closed");
    const reopened = app.waitForEvent("window", { timeout: 15_000 });
    await app.evaluate(({ app: a }) => { a.emit("activate"); });
    const win2 = await reopened;
    await win2.waitForLoadState("load");
    check(new URL(win2.url()).port === port, `F6 activate reopened a window on the same backend (port ${port})`);
    const after = backendsFor(state);
    check(after.length === 1 && after[0] === before[0], `F6 one backend, unchanged (before ${before}, after ${after})`);

    // F5: deep link to a real record.
    // A deterministic topology run (POST /api/topology/<name>/run; /api/launch was deleted on
    // 2026-10-08). Its record is `<run_id>.record` under runs/, attachable by path.
    const run = await fetch(`http://127.0.0.1:${port}/api/topology/best_of_n_verified/run`, {
      method: "POST",
      headers: { Origin: `http://127.0.0.1:${port}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: { task: "double 3", drafter_model: "deterministic", verify_model: "deterministic", n: 2, max_rounds: 1 } }),
    }).then((r) => r.json()) as { record_root: string };
    const recordRoot = run.record_root;
    const launched = { name: recordRoot.split("/").pop() ?? recordRoot };
    await win2.waitForFunction(() => (window as unknown as { __vm?: unknown }).__vm != null, undefined, { timeout: 15_000 });
    const url = "substrate://record/" + encodeURIComponent(recordRoot);
    await app.evaluate(({ app: a }, u) => { a.emit("open-url", { preventDefault() { /* test */ } }, u); }, url);
    const attached = await win2.waitForFunction(
      (root) => {
        const vm = (window as unknown as { __vm: { get(id: number): { snapshot(): { sessionName?: string; rawEnvelopes?: unknown[] } } } }).__vm;
        const s = vm.get(1)?.snapshot();
        return s && s.sessionName === root && (s.rawEnvelopes?.length ?? 0) > 0;
      },
      recordRoot,
      { timeout: 15_000 },
    ).then(() => true, () => false);
    check(attached, `F5 deep link attached the record and streamed its events (${launched.name})`);
  } finally {
    await app.close().catch(() => undefined);
  }
  for (let i = 0; i < 50 && backendsFor(state).length; i++) await new Promise((r) => setTimeout(r, 100));
  check(backendsFor(state).length === 0, "F6 no backend left after quit");
}

async function f7(): Promise<void> {
  // SUBSTRATE_HOME pointing at a FILE: the backend cannot create its state dirs and exits.
  const dir = scratchDir("lifecycle-badstate-");
  const state = join(dir, "not-a-dir");
  writeFileSync(state, "x");
  const app = await launch(state);
  // The app quits right after the dialog, so the stub reports through stderr, which outlives it.
  let err = "";
  app.process().stderr?.on("data", (b) => { err += b.toString("utf8"); });
  const exited = new Promise<void>((r) => app.process().once("exit", () => r()));
  await app.evaluate(({ dialog }) => {
    dialog.showErrorBox = (title: string, content: string) => {
      process.stderr.write(`ERRORBOX ${JSON.stringify([title, content])}\n`);
    };
  });
  await Promise.race([exited, new Promise((r) => setTimeout(r, 30_000))]);
  await app.close().catch(() => undefined);
  const m = err.match(/ERRORBOX (\[.*\])/);
  const box = m ? (JSON.parse(m[1]) as string[]) : null;
  check(!!box && /could not start/.test(box[0]), `F7 error dialog shown (${box ? box[0] : "none"})`);
  check(!!box && /substrate\.log/.test(box[1]) === !!APP, `F7 dialog names the log file in packaged mode`);
  check(backendsFor(state).length === 0, "F7 no backend left behind");
}

async function f8(): Promise<void> {
  const state = scratchDir("lifecycle-dies-");
  const app = await launch(state);
  let err = "";
  app.process().stderr?.on("data", (b) => { err += b.toString("utf8"); });
  const exited = new Promise<void>((r) => app.process().once("exit", () => r()));
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await win.waitForLoadState("load");
    await app.evaluate(({ dialog }) => {
      dialog.showMessageBox = (async (opts: { title?: string; detail?: string }) => {
        process.stderr.write(`MSGBOX ${JSON.stringify([opts.title, opts.detail])}\n`);
        return { response: 1, checkboxChecked: false }; // Quit
      }) as typeof dialog.showMessageBox;
    });
    const pids = backendsFor(state);
    check(pids.length === 1, `F8 one backend before the kill (${pids})`);
    if (pids.length) process.kill(pids[0], "SIGKILL");
    await Promise.race([exited, new Promise((r) => setTimeout(r, 20_000))]);
  } finally {
    await app.close().catch(() => undefined);
  }
  const m = err.match(/MSGBOX (\[.*\])/);
  const box = m ? (JSON.parse(m[1]) as string[]) : null;
  check(!!box && /backend stopped/.test(box[0]), `F8 dialog shown when the backend died (${box ? box[0] : "none"})`);
  // packaged: Electron's child is python itself (killed by SIGKILL); source: it is `uv run`,
  // which exits with a code when its python child dies
  check(!!box && /was killed \(SIGKILL\)|exited with code/.test(box[1]), `F8 dialog says how it stopped (${box ? box[1].split("\n")[0] : ""})`);
  check(backendsFor(state).length === 0, "F8 no backend left after Quit");
}

(async () => {
  await f6AndF5();
  await f7();
  await f8();
  process.stdout.write(fails.length ? `lifecycle_gates: ${fails.length} FAILED\n` : "lifecycle_gates: all passed\n");
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
