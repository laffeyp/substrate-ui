// Resuming a session that has ended more than once.
//
// Reported 2026-10-08: a session ended twice (two app restarts) and resumed showed the typed
// line beside the first `session ended` row, earlier turns below it, and a reply only after the
// next typed line, with two replies arriving at once. Each end writes a RunFinalised; the stream
// closed at the first one, and the window closed it at the first replayed SessionEnded.
//
// Steps, in the Electron app with its own SUBSTRATE_HOME, on the deterministic driver:
//   1. open a session; turn "one"; end; turn "two"; end (the record holds two RunFinalised);
//   2. reload the window; pane 1 reattaches the session from the URL;
//   3. assert: the transcript holds both turns and both ended rows, in record order;
//   4. send "three" once; assert its reply arrives with no second send, after "three".

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, waitForReattached } from "./lib/electron";

type Row = { role: string; text: string; seq: number };
type Pane = {
  snapshot(): { sessionId: string | null; transcript: Row[]; parkReason: unknown };
  openSession(o: { driver: string }): Promise<void>;
  sendTurn(t: string): Promise<void>;
  attachExisting(id: string): Promise<void>;
};
type Vm = { get(id: number): Pane | null };

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);

    // Two turns, each followed by an end, through the server's own endpoints.
    const sid = await win.evaluate(async () => {
      const pane = (window as unknown as { __vm: Vm }).__vm.get(1)!;
      await pane.openSession({ driver: "deterministic" });
      const id = pane.snapshot().sessionId!;
      // No named helper inside evaluate: tsx wraps named functions in a `__name` the page lacks.
      const headers = { "Content-Type": "application/json" };
      for (const text of ["one", "two"]) {
        await fetch(`/api/session/${id}/turn`, { method: "POST", headers, body: JSON.stringify({ text }) });
        await fetch(`/api/session/${id}/end`, { method: "POST", headers, body: JSON.stringify({ source: "user_end" }) });
      }
      return id;
    });

    await win.reload();
    await waitForApp(win);
    await waitForReattached(win, sid);  // the reload reattaches the session from the URL

    const shape = (rows: Row[]) => rows.filter((r) => r.role === "user" || r.role === "ended").map((r) => `${r.role}:${r.text}`);
    await win.waitForFunction(
      () => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.filter((r) => r.role === "ended").length === 2,
      undefined,
      { timeout: 15_000 },
    );
    const replayed = shape(await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript));
    const expected = ["user:one", "ended:session ended (user_end)", "user:two", "ended:session ended (user_end)"];
    if (JSON.stringify(replayed) !== JSON.stringify(expected)) {
      throw new Error(`replayed transcript out of order: ${JSON.stringify(replayed)}`);
    }

    // One send; the reply must arrive without a second send, below the message.
    await win.evaluate(async () => { await (window as unknown as { __vm: Vm }).__vm.get(1)!.sendTurn("three"); });
    await win.waitForFunction(() => {
      const rows = (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript;
      const at = rows.findIndex((r) => r.role === "user" && r.text === "three");
      return at >= 0 && rows.slice(at + 1).some((r) => r.role === "model");
    }, undefined, { timeout: 15_000 }).catch(() => {
      throw new Error("no reply to the one message sent after resuming");
    });
    const rows = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript);
    const seqs = rows.filter((r) => r.seq >= 0).map((r) => r.seq);
    if (seqs.some((s, i) => i > 0 && s < seqs[i - 1])) throw new Error(`transcript rows out of seq order: ${seqs.join(",")}`);
    console.log(`resume_after_two_ends: ok — ${rows.length} rows in record order; "three" answered with one send (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`resume_after_two_ends: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
