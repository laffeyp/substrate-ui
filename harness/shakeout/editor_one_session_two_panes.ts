// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Scenarios S2 and S9 (sprint 500; SCENARIOS-2026-11-14-multi-pane.md). S2: two panes on one session,
// each pane's editor keeps its own tabs and shown file. S9: pane 2 rebound to another session shows that
// session's files and none of the first's. Large fixtures (lib/multipane.ts); each step read from the
// DOM, the pixel anchor and its EDITOR_DRAWN record.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, windowRecords } from "./lib/electron";
import { bigWorkspace, firstTurn, focusPane, leaveEditor, openEditor, openFile, read as readStep, report, type Step } from "./lib/multipane";

let at = "start";
const read = (win: Page, label: string, pane: number, shots: string) => { at = label; return readStep(win, label, pane, shots); };

async function attach(win: Page, pane: number, sid: string): Promise<void> {
  await win.evaluate(async ([n, id]) => {
    const vm = (window as unknown as { __vm: { get(n: number): { attachExisting(i: string): Promise<void> } | undefined; spawn(n: number): { attachExisting(i: string): Promise<void> } } }).__vm;
    await (vm.get(n as number) ?? vm.spawn(n as number)).attachExisting(id as string);
  }, [pane, sid] as const);
  await win.waitForFunction(([n, id]) => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string | null } } } }).__vm.get(n as number)?.snapshot().sessionId === id, [pane, sid] as const, { timeout: 15_000 });
}

async function main(): Promise<void> {
  const A = bigWorkspace("alpha"), B = bigWorkspace("beta");
  const pane1 = [A.files[0], A.files[4], A.files.find((f) => f.endsWith("long_one.txt"))!];
  const pane2 = [A.files[8], A.files[11]];
  const rebound = [B.files[3], B.files.find((f) => f.endsWith("long_two.txt"))!];
  const launch = launchArgs();
  const shots = join(__dirname, "..", "..", "runs", "packaged", `sprint-500-one-session-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const steps: Step[] = [];
  const errs: string[] = [];
  const expect = (s: Step, tabs: string[], active: string) => {
    if (JSON.stringify(s.tabs) !== JSON.stringify(tabs)) errs.push(`${s.label}: tabs ${JSON.stringify(s.tabs)}; want ${JSON.stringify(tabs)}`);
    if (s.active !== active) errs.push(`${s.label}: shows ${String(s.active)}; want ${active}`);
  };
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    const port = new URL(win.url()).port;
    await bindPaneAsUser(win, "deterministic", { folder: A.root });
    await firstTurn(win, 1);
    const sidA = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    await openEditor(win);
    for (const f of pane1) await openFile(win, A.root, f);
    steps.push(await read(win, "S2 pane 1 opened", 1, shots));
    await leaveEditor(win);

    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await attach(win, 2, sidA);
    await focusPane(win, 2);
    await openEditor(win);
    const fresh = await read(win, "S2 pane 2 on the same session, first open", 2, shots);
    steps.push(fresh);
    if (fresh.tabs.length) errs.push(`${fresh.label}: ${fresh.tabs.length} tabs before any was opened`);
    for (const f of pane2) await openFile(win, A.root, f);
    const p2 = await read(win, "S2 pane 2 opened", 2, shots);
    steps.push(p2);
    expect(p2, pane2, pane2[1]);
    await leaveEditor(win);

    await focusPane(win, 1);
    await openEditor(win);
    const back = await read(win, "S2 pane 1 again", 1, shots);
    steps.push(back);
    expect(back, pane1, pane1[2]);
    await leaveEditor(win);

    const created = await fetch(`http://127.0.0.1:${port}/api/session`, {
      method: "POST",
      headers: { Origin: `http://127.0.0.1:${port}`, "Content-Type": "application/json" },
      body: JSON.stringify({ driver: "deterministic", workspace: B.root }),
    }).then((r) => r.json()) as { session_id: string };
    await attach(win, 2, created.session_id);
    await focusPane(win, 2);
    // A session's editor opens once its record exists: one turn first, as a person's first message does.
    await firstTurn(win, 2);
    await openEditor(win);
    const rb = await read(win, "S9 pane 2 rebound, first open", 2, shots);
    steps.push(rb);
    const leftover = rb.tabs.filter((t) => t.startsWith("alpha/"));
    if (leftover.length) errs.push(`${rb.label}: tabs of the old session kept: ${JSON.stringify(leftover)}`);
    for (const f of rebound) await openFile(win, B.root, f);
    const rb2 = await read(win, "S9 pane 2 rebound, opened", 2, shots);
    steps.push(rb2);
    expect(rb2, rebound, rebound[1]);
    await leaveEditor(win);
    await app.close();

    errs.push(...report("editor_one_session_two_panes", steps, windowRecords(launch)));
    if (errs.length) throw new Error(errs.slice(0, 6).join("; "));
    console.log(`editor_one_session_two_panes: ok — S2 one session, pane 1 ${pane1.length} tabs and pane 2 ${pane2.length}, each its own; S9 pane 2 rebound shows only the new session's files; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_one_session_two_panes: FAIL at "${at}" — ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
