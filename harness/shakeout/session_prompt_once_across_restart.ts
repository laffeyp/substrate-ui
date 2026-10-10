// A session's opening prompt pieces are written once, even across a quit and reopen of the app
// (kernel K265).
//
// The research for K263 took fragments seen after a session's first UserMessage for a re-emission
// on resume. K265's trace found them late, not repeated: a startup race K261 closed. This gate
// checks the user's path end to end.
//
// Steps, in the Electron app with its own SUBSTRATE_HOME, on the deterministic driver:
//   1. open a session, send "one", wait for the reply, quit the app;
//   2. reopen the app on the same SUBSTRATE_HOME, attach the session, send "two", wait for the reply;
//   3. read the session's record from disk: at least one PromptFragment, every one written before
//      the UserMessage "one", one RunStarted, and the "two" turn's prompt names the same fragments.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Row = { role: string; text: string };
type Pane = {
  snapshot(): { sessionId: string | null; transcript: Row[] };
  openSession(o: { driver: string }): Promise<void>;
  sendTurn(t: string): Promise<void>;
  attachExisting(id: string): Promise<void>;
};
type Vm = { get(id: number): Pane | null };
type Env = { seq: number; kind: string; payload: Record<string, unknown> };

async function replies(win: Page): Promise<number> {
  return win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.filter((r) => r.role === "model").length);
}

async function waitForReplies(win: Page, n: number): Promise<void> {
  await win.waitForFunction(
    (want) => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.filter((r) => r.role === "model").length >= want,
    n, { timeout: 20_000 },
  );
}

function readRecord(state: string, sid: string): Env[] {
  const dir = join(state, "sessions", sid, "record");
  const files = readdirSync(dir).filter((f) => /^events-\d+.*\.jsonl$/.test(f)).sort();
  return files.flatMap((f) => readFileSync(join(dir, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Env));
}

async function main(): Promise<void> {
  const launch = launchArgs();
  let code = 1;
  try {
    let app = await electron.launch({ ...launch.options, timeout: 60_000 });
    let win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    const sid = await win.evaluate(async () => {
      const pane = (window as unknown as { __vm: Vm }).__vm.get(1)!;
      await pane.openSession({ driver: "deterministic" });
      await pane.sendTurn("one");
      return pane.snapshot().sessionId!;
    });
    await waitForReplies(win, 1);
    await app.close();

    app = await electron.launch({ ...launch.options, timeout: 60_000 });
    try {
      win = await app.firstWindow({ timeout: 30_000 });
      await waitForApp(win);
      await win.evaluate(async (id) => { await (window as unknown as { __vm: Vm }).__vm.get(1)!.attachExisting(id); }, sid);
      const before = await replies(win);
      await win.evaluate(async () => { await (window as unknown as { __vm: Vm }).__vm.get(1)!.sendTurn("two"); });
      await waitForReplies(win, before + 1);
    } finally {
      await app.close().catch(() => undefined);
    }

    const envs = readRecord(launch.state, sid);
    const runs = envs.filter((e) => e.kind === "substrate.RunStarted").length;
    const fragments = envs.filter((e) => e.kind === "PromptFragment");
    const one = envs.find((e) => e.kind === "UserMessage" && e.payload.text === "one");
    const two = envs.find((e) => e.kind === "UserMessage" && e.payload.text === "two");
    if (!one || !two) throw new Error(`turns missing from the record: one=${!!one} two=${!!two}`);
    if (runs !== 1) throw new Error(`${runs} RunStarted on the record; expected 1`);
    if (!fragments.length) throw new Error("no PromptFragment on the record; the session named no prompt source");
    const late = fragments.filter((f) => f.seq > one.seq);
    if (late.length) throw new Error(`PromptFragment after the first message at seqs ${late.map((f) => f.seq).join(", ")}`);
    const lastPrompt = envs.filter((e) => e.kind === "PromptComposed" && e.seq > two.seq).pop();
    const used = ((lastPrompt?.payload.fragment_seqs as number[] | undefined) ?? []).slice().sort((a, b) => a - b);
    const all = fragments.map((f) => f.seq);
    if (JSON.stringify(used) !== JSON.stringify(all)) throw new Error(`turn two's prompt used fragments ${JSON.stringify(used)}; the record holds ${JSON.stringify(all)}`);
    console.log(`session_prompt_once_across_restart: ok — ${fragments.length} fragments at seqs ${JSON.stringify(all)}, all before "one" (seq ${one.seq}); "two" (seq ${two.seq}) after a restart reused them; 1 RunStarted (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`session_prompt_once_across_restart: FAIL — ${(e as Error).message}`);
  } finally {
    launch.cleanup();
  }
  process.exit(code);
}

main();
