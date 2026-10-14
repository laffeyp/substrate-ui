// A real model makes a topology with the create-topology tools and runs it, and delegates
// (UI sprint 189; kernel K338).
//
// Live: it needs a real model (COMPOSE_LIVE_MODEL, default glm-5.2:cloud through Ollama), so it is
// not in `gates:electron`. SHAKEOUT_APP=/Applications/Substrate.app runs the installed app on its
// own state folder.
//
// Steps, in a fresh repository holding text.py:
//   1. ask the session to read the plan language, plan a draft-critique-fix topology, act on what
//      the plan tool finds, and run the plan on text.py;
//   2. the composed run's pane opens and fills with its steps;
//   3. ask it to delegate a small sum; the child's pane opens and its answer returns;
//   4. ask what the run produced: the record holds the run's end once, and the reply reads it.
// Prints every topology tool call and its result's findings, so what the model did is on the page.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";
import { scratchDir } from "./lib/scratch";

type Row = { role: string; text: string; toolName?: string; output?: string; args?: string[] };
type Run = { run_id: string; topology: string; running: boolean; outcome: string | null };
type Snap = { sessionId: string | null; transcript: Row[]; viewOnly: string | null; runs: Run[] };
type Vm = { get(id: number): { snapshot(): Snap } | null; paneIds(): number[] };

const MODEL = process.env.COMPOSE_LIVE_MODEL || "glm-5.2:cloud";

function repoWithText(): string {
  const repo = join(scratchDir("compose-live-"), "textlib");
  mkdirSync(repo);
  writeFileSync(join(repo, "text.py"), "def word_count(text):\n    return len(text.split())\n");
  const git = (...a: string[]) => execFileSync("git", ["-C", repo, "-c", "user.name=fixture", "-c", "user.email=fixture@example.com", ...a]);
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("commit", "-qm", "word_count");
  return repo;
}

async function main(): Promise<void> {
  const repo = repoWithText();
  const launch = launchArgs({ roster: "live" });
  const shot = (name: string) => process.env.COMPOSE_LIVE_SHOTS ? join(process.env.COMPOSE_LIVE_SHOTS, name) : null;
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    const sid = await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: ${JSON.stringify(MODEL)}, workspace: ${JSON.stringify(repo)} }) }).then(async (r) => { if (!r.ok) throw new Error("open " + r.status + " " + await r.text()); return (await r.json()).session_id; })`) as string;
    await win.evaluate(async (id) => { await (window as unknown as { __vm: { get(n: number): { attachExisting(i: string): Promise<void> } } }).__vm.get(1).attachExisting(id); }, sid);
    const snap = (id: number) => win.evaluate((n) => (window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot() ?? null, id);
    const send = async (text: string) => {
      const input = win.locator('[data-input-bar][placeholder^="type to input"]').first();
      await input.click();
      await input.fill(text);
      await win.keyboard.press("Enter");
    };
    const returned = (n: number) => win.waitForFunction((k) => {
      const t = (window as unknown as { __vm: Vm }).__vm.get(1)?.snapshot().transcript ?? [];
      return t.filter((r) => r.text.startsWith("· returned")).length >= k;
    }, n, { timeout: 15 * 60_000 });

    // 1. The topology.
    await send([
      "Use your topology tools. Read the plan language with topology_help first.",
      "Then plan a topology with topology_plan: one model step drafts a docstring for the function in the input,",
      "a second step lists the docstring's defects or says NONE, and a third rewrites it when the critic found defects.",
      "Act on whatever the plan tool finds. When the plan is clean, run it with topology_run, giving it the text of text.py as its input.",
      "Say what you started and stop.",
    ].join("\n"));
    await returned(1);
    const rows1 = (await snap(1))!.transcript;
    const calls = rows1.filter((r) => r.role === "tool" && (r.toolName ?? "").startsWith("topology_") && r.output !== undefined);
    for (const c of rows1.filter((r) => r.role === "tool" && r.toolName === "topology_plan" && r.output === undefined)) {
      console.log(`compose_live: topology_plan was sent ${(c.args ?? []).join(" ").slice(0, 1200)}`);
    }
    for (const c of calls) {
      let note = "";
      try { const o = JSON.parse((c.output ?? "").replace(/'/g, '"')); note = JSON.stringify(o.findings ?? o.run_id ?? "").slice(0, 300); } catch { note = (c.output ?? "").slice(0, 300); }
      console.log(`compose_live: ${c.toolName} → ${note}`);
    }
    const runs1 = (await snap(1))!.runs.filter((r) => r.topology !== "review" && r.topology !== "build");
    if (!runs1.length) throw new Error(`the session started no composed run; its last rows: ${JSON.stringify(rows1.slice(-6).map((r) => r.text.slice(0, 300)))}`);
    const run = runs1[runs1.length - 1];

    // 2. Its pane fills with its steps.
    const runPane = await win.waitForFunction(() => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      const ids = vm.paneIds().filter((id) => (vm.get(id)?.snapshot().viewOnly ?? "").startsWith("view only: the steps of"));
      return ids.length ? ids[ids.length - 1] : null;
    }, undefined, { timeout: 60_000 }).then((h) => h.jsonValue() as Promise<number>);
    await win.waitForFunction((n) => ((window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot().transcript ?? []).some((r) => r.text === "run finished" || r.text.startsWith("run failed") || r.text.startsWith("stopped")), runPane, { timeout: 15 * 60_000 });
    const paneRows = (await snap(runPane))!.transcript.map((r) => r.text.slice(0, 200));
    console.log(`compose_live: run ${run.run_id} (${run.topology}) pane: ${JSON.stringify(paneRows)}`);
    const f1 = shot("compose-run.png");
    if (f1) await win.screenshot({ path: f1 });

    // 3. Delegate.
    await win.locator('[data-pane="1"]').first().click();
    await send("Now call the delegate tool once: ask a child session to compute 17 * 23 and answer with the number. Report its answer.");
    await returned(2);
    const rows2 = (await snap(1))!.transcript;
    const delegated = rows2.filter((r) => r.toolName === "delegate" && r.output !== undefined);
    console.log(`compose_live: delegate → ${JSON.stringify(delegated.map((d) => (d.output ?? "").slice(0, 300)))}`);
    if (!delegated.length) throw new Error("the session did not delegate");
    const f2 = shot("delegate.png");
    if (f2) await win.screenshot({ path: f2 });

    // 4. The run's end, told once, and read.
    await send("What did the topology run produce? Quote its final docstring.");
    await returned(3);
    const rows3 = (await snap(1))!.transcript;
    const ends = rows3.filter((r) => r.text.startsWith(`run ${run.run_id} · `) && r.text.includes(" ended ")).map((r) => r.text.slice(0, 400));
    console.log(`compose_live: ends ${JSON.stringify(ends)}`);
    if (ends.length !== 1) throw new Error(`the run's end was told ${ends.length} times`);
    const reply = rows3.filter((r) => r.role === "model").pop()?.text ?? "";
    console.log(`compose_live: the model's reply: ${reply.slice(0, 800)}`);
    console.log(`compose_live: ok — ${MODEL} called ${calls.map((c) => c.toolName).join(", ")}; run ${run.run_id} ${ends[0]}; delegated once (${sid}, ${repo})`);
    code = 0;
  } catch (e) {
    console.error(`compose_live: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
