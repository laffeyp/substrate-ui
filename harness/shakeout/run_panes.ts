// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A run a session starts opens its own pane (UI sprint 182; research r9 § 4).
//
// Steps, on a deterministic session whose one turn calls `build` twice (driver_params.script):
//   1. bind pane 1 as a user; open a session with its script and attach pane 1; send one message;
//   2. two panes open on their own, one per run, each bound to its run's record and view-only;
//   3. each build ends done: its pane shows its task and its report, and stays open after the end;
//   4. typing into a build's pane is refused, and the pane says why.
// Stopping a run from the caller is tested on a run held open by a sleeping model
// (tests/test_run_routes_182.py): a deterministic build here ends in about a second.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { scratchDir } from "./lib/scratch";

type Row = { role: string; text: string };
type Snap = { sessionId: string | null; transcript: Row[]; viewOnly: string | null; runs: { run_id: string; running: boolean; outcome: string | null }[] };
type Vm = { get(id: number): { snapshot(): Snap } | null; paneIds(): number[] };

const FIRST = { task: "look at a.txt" };
const SECOND = { task: "look again", files: ["a.txt"] };

async function main(): Promise<void> {
  const launch = launchArgs();
  const folder = scratchDir("run-panes-");
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic", { folder });
    const snap = (id: number) => win.evaluate((n) => (window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot() ?? null, id);
    const script = [["build", [FIRST]], ["build", [SECOND]]];
    const sid = await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, driver_params: { script: ${JSON.stringify(script)} } }) }).then(async (r) => { if (!r.ok) throw new Error("open " + r.status + " " + await r.text()); return (await r.json()).session_id; })`) as string;
    await win.evaluate(async (id) => { await (window as unknown as { __vm: { get(n: number): { attachExisting(i: string): Promise<void> } } }).__vm.get(1).attachExisting(id); }, sid);
    const input1 = win.locator('[data-input-bar][placeholder^="type to input"]').first();
    await input1.click();
    await input1.fill("build both");
    await win.keyboard.press("Enter");

    // 2. Two run panes, each bound to a run record and view-only.
    const runPanes = await win.waitForFunction(() => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      const ids = vm.paneIds().filter((id) => (vm.get(id)?.snapshot().viewOnly ?? null) !== null);
      return ids.length === 2 ? ids : null;
    }, undefined, { timeout: 30_000 }).then((h) => h.jsonValue() as Promise<number[]>)
      .catch(async () => { throw new Error(`no two view-only panes; tape: ${JSON.stringify(await win.evaluate(() => ((window as unknown as { __vmTape: { tag: string; paneId: number; payload: unknown }[] }).__vmTape).filter((e) => e.tag.startsWith("RUN"))))}; panes ${JSON.stringify(await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.paneIds()))}; pane 1: ${JSON.stringify((await snap(1))?.transcript.map((r) => r.text))}`); });
    const runs = await win.waitForFunction(() => {
      const r = (window as unknown as { __vm: Vm }).__vm.get(1)?.snapshot().runs ?? [];
      return r.length === 2 ? r : null;
    }, undefined, { timeout: 15_000 }).then((h) => h.jsonValue() as Promise<Snap["runs"]>)
      .catch(async () => { throw new Error(`pane 1 lists ${JSON.stringify((await snap(1))?.runs)}`); });
    const [doneRun, otherRun] = runs;
    const caller = (await snap(1))!;
    if (!caller.transcript.some((r) => r.text.startsWith(`run ${doneRun.run_id} · build started`))) {
      throw new Error(`pane 1 has no row for ${doneRun.run_id}: ${JSON.stringify(caller.transcript.map((r) => r.text))}`);
    }

    // 3. The finished build's pane shows its card, checks and report, and stays.
    const paneOf = async (needle: string) => {
      for (const id of runPanes) {
        const s = (await snap(id))!;
        if (s.transcript.some((r) => r.text.includes(needle))) return id;
      }
      return null;
    };
    let donePane: number | null = null;
    for (const deadline = Date.now() + 30_000; donePane === null && Date.now() < deadline; await settled(win)) {
      donePane = await paneOf("report · done");
    }
    if (donePane === null) throw new Error("no run pane shows `report · done`");
    const doneRows = (await snap(donePane))!.transcript.map((r) => r.text);
    for (const want of ["look at a.txt", "report · done"]) {
      if (!doneRows.some((t) => t.includes(want))) throw new Error(`the done pane lacks "${want}": ${JSON.stringify(doneRows)}`);
    }
    if (!(await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.paneIds())).includes(donePane)) throw new Error("the done pane closed");

    // 4. Typing into the running build's pane is refused.
    const longPane = runPanes.find((id) => id !== donePane)!;
    const viewOnly = win.locator('[data-input-bar][placeholder^="view only"]');
    if ((await viewOnly.count()) !== 2) throw new Error(`expected 2 view-only input bars; saw ${await viewOnly.count()}`);
    const before = (await snap(longPane))!.transcript.length;
    const longInput = viewOnly.nth(runPanes.indexOf(longPane));
    await longInput.click();
    await longInput.fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction((n) => {
      const t = (window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot().transcript ?? [];
      return t.some((r) => r.role === "warning" && r.text.startsWith("view only: the build writes"));
    }, longPane, { timeout: 5_000 }).catch(async () => { throw new Error(`typing was not refused: ${JSON.stringify((await snap(longPane))!.transcript.slice(before).map((r) => r.text))}`); });
    if ((await snap(longPane))!.transcript.some((r) => r.role === "user" && r.text === "hello")) throw new Error("the typed line reached the run");

    // RUN_PANES_SHOT=<file.png> saves the window as it stands here, for a person to look at.
    if (process.env.RUN_PANES_SHOT) await win.screenshot({ path: process.env.RUN_PANES_SHOT });

    // The second build's pane also ends with its report and stays.
    await win.waitForFunction((n) => ((window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot().transcript ?? []).some((r) => r.text.startsWith("report · done")), longPane, { timeout: 30_000 })
      .catch(async () => { throw new Error(`the second pane has no report: ${JSON.stringify((await snap(longPane))!.transcript.map((r) => r.text))}`); });
    console.log(`run_panes: ok — two runs opened two view-only panes; ${doneRun.run_id} and ${otherRun.run_id} ended done and their panes stayed; typing was refused (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`run_panes: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
