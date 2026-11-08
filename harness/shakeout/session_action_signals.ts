// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A pane's session actions, written as they are decided (sprint 369): CONTROLS_PICKED,
// WORKSPACE_ADDED, SESSION_RENAMED, TASK_STOP_REQUESTED. Steps:
//   1. pane 1's picker: a repo-local folder, deterministic, guidance auto, length terse, tone blunt.
//      The tone pick records the controls and adds the folder to the recents (added);
//   2. one message, which opens the session; /name view-renamed (renamed); a second session named taken-name over the API, then
//      /name taken-name, which the server refuses as a name collision, 409 (refused);
//   3. ⌘D, and pane 2's picker the same way, with POST /api/workspaces answered 400 by the gate:
//      a planted server refusal, the only way the app reaches it (the server refuses only an empty
//      path, which the app never sends) (refused);
//   4. pane 1's task list answered by the gate with one running task (no turn here starts one;
//      tasks_gate.ts drives a real one with a real model), and its stop link clicked.
// window-1.jsonl then holds exactly these records, in order, each in its pane's context.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();

async function pickPane(win: Page, folder: string): Promise<void> {
  const input = visible(win, "input[data-ws-input]");
  await input.click();
  await input.fill(folder);
  await win.keyboard.press("Enter");
  await visible(win, '[data-model-half][data-armed="1"]').waitFor({ timeout: 15_000 });
  await visible(win, '[data-model-row="deterministic"] > span').click();
  await visible(win, '[data-guidance-row="auto"][data-lit="1"]').waitFor({ timeout: 15_000 });
  await visible(win, '[data-guidance-row="auto"]').click();
  await visible(win, '[data-length-row="normal"][data-lit="1"]').waitFor({ timeout: 15_000 });
  await visible(win, '[data-length-row="terse"]').click();
  await visible(win, '[data-tone-row="neutral"][data-lit="1"]').waitFor({ timeout: 15_000 });
  await visible(win, '[data-tone-row="blunt"]').click();
  await visible(win, "[data-input-bar]").waitFor({ timeout: 15_000 });
}

async function say(win: Page, text: string): Promise<void> {
  await visible(win, "textarea[data-input-bar]").fill(text);
  await win.keyboard.press("Enter");
  await settled(win);
}

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "session-actions-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const sessionOf = (pane: number) => win.evaluate((p) => (window as any).__vm.get(p)?.snapshot().sessionId as string | null, pane);

    await pickPane(win, folder);
    // The session opens with the pane's first message.
    await say(win, "hello");
    await win.waitForFunction(() => !!(window as any).__vm.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const sid1 = (await sessionOf(1))!;

    await say(win, "/name view-renamed");
    await win.waitForFunction(() => (window as any).__vm.get(1).snapshot().sessionName === "view-renamed", undefined, { timeout: 10_000 });
    await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, name: "taken-name" }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    await say(win, "/name taken-name");
    await win.waitForFunction(() => ((window as any).__vmSignals ?? []).some((s: { name: string; payload: { outcome?: string } }) => s.name === "SESSION_RENAMED" && s.payload.outcome === "refused"), undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("/name taken-name wrote no SESSION_RENAMED refused"); });

    await win.route("**/api/workspaces", (route) => route.request().method() === "POST"
      ? route.fulfill({ status: 400, json: { error: "planted refusal (session_action_signals)" } })
      : route.continue());
    await win.keyboard.press("Meta+d");
    await settled(win);
    await pickPane(win, folder);
    await win.waitForFunction(() => ((window as any).__vmSignals ?? []).some((s: { name: string; payload: { outcome?: string } }) => s.name === "WORKSPACE_ADDED" && s.payload.outcome === "refused"), undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("pane 2's refused folder wrote no WORKSPACE_ADDED refused"); });
    await win.unroute("**/api/workspaces");

    await win.route(`**/api/session/${sid1}/tasks`, (route) => route.fulfill({ json: { tasks: [{ task_id: "bg_fixture", command: "sleep 301", status: "running", exit: null, runtime_s: 3, stopped_because: null }] } }));
    await win.evaluate(() => (window as any).__vm.get(1).refreshTasks());
    await win.locator('[data-vm-task-stop="bg_fixture"]').first().waitFor({ timeout: 10_000 });
    await win.locator('[data-vm-task-stop="bg_fixture"]').first().click();
    await win.waitForFunction(() => ((window as any).__vmSignals ?? []).some((s: { name: string }) => s.name === "TASK_STOP_REQUESTED"), undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("the stop link wrote no TASK_STOP_REQUESTED"); });
    await win.unroute(`**/api/session/${sid1}/tasks`);

    // The trace, read once the app has closed and its files are complete.
    await app.close();
    const names = new Set(["CONTROLS_PICKED", "WORKSPACE_ADDED", "SESSION_RENAMED", "TASK_STOP_REQUESTED"]);
    const got = windowRecords(launch).filter((r) => names.has(r.name));
    const line = (r: { name: string; pane_id: number | null; payload: Record<string, unknown> }) =>
      `${r.name} pane=${String(r.pane_id)} ${Object.entries(r.payload).map(([k, v]) => `${k}=${String(v)}`).join(" ")}`;
    const want = [
      `CONTROLS_PICKED pane=1 pane_id=1 length=terse tone=blunt`,
      `WORKSPACE_ADDED pane=1 pane_id=1 outcome=added`,
      `SESSION_RENAMED pane=1 pane_id=1 session_id=${sid1} outcome=renamed`,
      `SESSION_RENAMED pane=1 pane_id=1 session_id=${sid1} outcome=refused`,
      `CONTROLS_PICKED pane=2 pane_id=2 length=terse tone=blunt`,
      `WORKSPACE_ADDED pane=2 pane_id=2 outcome=refused`,
      `TASK_STOP_REQUESTED pane=1 session_id=${sid1} task_id=bg_fixture`,
    ];
    const lines = got.map(line);
    if (lines.join("\n") !== want.join("\n")) throw new Error(`records in window-1.jsonl:\n  ${lines.join("\n  ") || "none"}\nwant:\n  ${want.join("\n  ")}`);
    console.log(`session_action_signals: ok — ${want.length} records in order: controls and an added folder for pane 1, a rename and a refused rename, pane 2's controls and its refused folder, a task stop`);
    code = 0;
  } catch (e) {
    console.error(`session_action_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
