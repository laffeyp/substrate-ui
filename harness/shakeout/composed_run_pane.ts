// A composed run opens its own pane, with a row per step (UI sprint 187; kernel K338).
//
// Steps:
//   1. a deterministic session whose turn calls `topology_run` with the shipped plan
//      `draft_and_critique` (driver_params.script); one message;
//   2. a view-only pane opens on the run's record: a row per step event in order, then
//      "run finished"; the meta view's structure lists the plan's steps;
//   3. from the app, the session checks a plan with a sleeping command and runs it
//      (POST /topology/plan, /topology/run): its pane opens; `/run stop <id>` stops it, and the
//      pane says "stopped (caller_stop)".

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { scratchDir } from "./lib/scratch";

type Row = { role: string; text: string };
type Graph = { producers: { kind: string }[]; baseline: Record<string, unknown> };
type Snap = { sessionId: string | null; transcript: Row[]; viewOnly: string | null; topologyGraph: Graph | null; runs: { run_id: string; running: boolean; outcome: string | null }[] };
type Ctl = {
  snapshot(): Snap;
  planTopology(b: Record<string, unknown>): Promise<{ ok: boolean; data?: Record<string, unknown>; detail?: string }>;
  runTopology(b: Record<string, unknown>): Promise<{ ok: boolean; data?: Record<string, unknown>; detail?: string }>;
};
type Vm = { get(id: number): Ctl | null; paneIds(): number[] };

async function main(): Promise<void> {
  const launch = launchArgs();
  const folder = scratchDir("composed-run-");
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic", { folder });
    const snap = (id: number) => win.evaluate((n) => (window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot() ?? null, id);
    const viewOnlyPanes = () => win.evaluate(() => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      return vm.paneIds().filter((id) => (vm.get(id)?.snapshot().viewOnly ?? null) !== null);
    });
    const script = [["topology_run", [{ name: "draft_and_critique", input: "write add(a, b)" }]]];
    const sid = await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, driver_params: { script: ${JSON.stringify(script)} } }) }).then(async (r) => { if (!r.ok) throw new Error("open " + r.status + " " + await r.text()); return (await r.json()).session_id; })`) as string;
    await win.evaluate(async (id) => { await (window as unknown as { __vm: { get(n: number): { attachExisting(i: string): Promise<void> } } }).__vm.get(1).attachExisting(id); }, sid);
    const input1 = win.locator('[data-input-bar][placeholder^="type to input"]').first();
    await input1.click();
    await input1.fill("run the plan");
    await win.keyboard.press("Enter");

    // 2. The run's pane: a row per step, then the end.
    const runPane = await win.waitForFunction(() => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      const ids = vm.paneIds().filter((id) => (vm.get(id)?.snapshot().viewOnly ?? "").startsWith("view only: the steps of draft_and_critique"));
      return ids.length === 1 ? ids[0] : null;
    }, undefined, { timeout: 30_000 }).then((h) => h.jsonValue() as Promise<number>)
      .catch(async () => { throw new Error(`no composed run pane; panes ${JSON.stringify(await viewOnlyPanes())}; pane 1: ${JSON.stringify((await snap(1))?.transcript.map((r) => r.text))}`); });
    let rows: string[] = [];
    for (const deadline = Date.now() + 30_000; Date.now() < deadline; await settled(win)) {
      rows = (await snap(runPane))!.transcript.map((r) => r.text);
      if (rows.includes("run finished")) break;
    }
    const steps = rows.filter((t) => /^\*\*(draft|critic|fix)\*\* · /.test(t)).map((t) => t.slice(2, t.indexOf("**", 2)));
    if (steps[0] !== "draft" || steps[1] !== "critic" || rows[rows.length - 1] !== "run finished") {
      throw new Error(`the run pane reads ${JSON.stringify(rows)}`);
    }
    const graph = (await snap(runPane))!.topologyGraph;
    const kinds = (graph?.producers ?? []).map((p) => p.kind).sort();
    if (JSON.stringify(kinds) !== JSON.stringify(["critic", "draft", "fix"])) throw new Error(`the run's graph lists ${JSON.stringify(kinds)}`);
    await win.locator(`[data-pane="${runPane}"]`).first().click();
    await win.keyboard.press("Meta+m");
    await win.getByText("structure", { exact: true }).first().click();
    await win.getByText("draft (model) → critic (model) → fix (model)").first().waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => { throw new Error("the structure view does not show the plan's steps"); });
    await win.keyboard.press("Meta+m");

    // 3. From the app: check a plan, run it, stop it.
    const planned = await win.evaluate(async () => (window as unknown as { __vm: Vm }).__vm.get(1)!.planTopology({ lines: 'wait: command "sleep 30"' }));
    if (!planned.ok || !planned.data?.plan_id) throw new Error(`plan refused: ${JSON.stringify(planned)}`);
    const findings = planned.data.findings as string[];
    if (findings.length) throw new Error(`the plan has findings: ${JSON.stringify(findings)}`);
    const started = await win.evaluate(async (id) => (window as unknown as { __vm: Vm }).__vm.get(1)!.runTopology({ plan_id: id }), String(planned.data.plan_id));
    if (!started.ok) throw new Error(`run refused: ${JSON.stringify(started)}`);
    const runId = String(started.data!.run_id);
    const waitPane = await win.waitForFunction((prev) => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      const ids = vm.paneIds().filter((id) => id !== prev && (vm.get(id)?.snapshot().viewOnly ?? "").startsWith("view only: the steps of plan"));
      return ids.length === 1 ? ids[0] : null;
    }, runPane, { timeout: 15_000 }).then((h) => h.jsonValue() as Promise<number>)
      .catch(async () => { throw new Error(`no pane for the app's run; view-only panes ${JSON.stringify(await viewOnlyPanes())}`); });
    await win.locator('[data-pane="1"]').first().click();
    const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
    await bar.click();
    await bar.fill(`/run stop ${runId}`);
    await win.keyboard.press("Enter");
    await win.waitForFunction((n) => ((window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot().transcript ?? []).some((r) => r.text === "stopped (caller_stop)"), waitPane, { timeout: 15_000 })
      .catch(async () => { throw new Error(`the stopped run's pane reads ${JSON.stringify((await snap(waitPane))!.transcript.map((r) => r.text))}`); });
    const outcome = await win.waitForFunction((id) => {
      const r = ((window as unknown as { __vm: Vm }).__vm.get(1)?.snapshot().runs ?? []).find((x) => x.run_id === id);
      return r && !r.running ? r.outcome : null;
    }, runId, { timeout: 15_000 }).then((h) => h.jsonValue());
    if (outcome !== "stopped") throw new Error(`the stopped run's outcome is ${JSON.stringify(outcome)}`);
    console.log(`composed_run_pane: ok — the model's run opened pane ${runPane}: ${JSON.stringify(steps)} then "run finished", structure lists the steps; the app's run ${runId} opened pane ${waitPane} and /run stop ended it stopped (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`composed_run_pane: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
