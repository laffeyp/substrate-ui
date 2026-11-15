// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Scenario S8 (sprint 500; SCENARIOS-2026-11-14-multi-pane.md): a session's live edits are marked in the
// pane that shows that session's editor, and in no other. Two scripted deterministic sessions (driver
// params `script`, UI sprint 182), each making one `edit_file` per turn on a large fixture; turns are
// posted over the server's API while pane 2's editor is on screen. These agree:
//   other — session A's turn writes its file on disk; pane 2 writes no EDITOR_FOLLOW_MARKED and its
//           shown buffer is unchanged;
//   own   — session B's turn marks pane 2's file: EDITOR_FOLLOW_MARKED for pane 2 naming the call's seq,
//           then its CONFIRMED; pane 2's buffer holds the edit.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { bigWorkspace, focusPane, openEditor, openFile, read as readStep, report, type Step } from "./lib/multipane";

let at = "start";
const read = (win: Page, label: string, pane: number, shots: string) => { at = label; return readStep(win, label, pane, shots); };
const MARK = "SPRINT_500_S8_MARKER";

/** A workspace whose `rel` holds one marker line, and a session whose every turn adds a line under it. */
async function scripted(base: string, root: string, rel: string, added: string, readFirst: boolean): Promise<string> {
  writeFileSync(join(root, rel), `// ${MARK}\n` + readFileSync(join(root, rel), "utf8"));
  // A reads its file first, so its calls sit at other seqs than B's and a mark names whose call it is.
  const script = [...(readFirst ? [["read_file", [rel]]] : []), ["edit_file", [rel, `// ${MARK}`, `// ${MARK}\n${added}`]]];
  const r = await fetch(`${base}/api/session`, {
    method: "POST", headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ driver: "deterministic", workspace: root, driver_params: { script } }),
  }).then((x) => x.json()) as { session_id: string };
  return r.session_id;
}

async function turn(base: string, sid: string): Promise<void> {
  const r = await fetch(`${base}/api/session/${sid}/turn`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ text: "go" }) });
  if (!r.ok) throw new Error(`turn on ${sid}: HTTP ${r.status} ${await r.text()}`);
}

async function attach(win: Page, pane: number, sid: string): Promise<void> {
  await win.evaluate(`(function () { var vm = window.__vm; return (vm.get(${pane}) || vm.spawn(${pane})).attachExisting(${JSON.stringify(sid)}); })()`);
  await win.waitForFunction(`window.__vm.get(${pane}) && window.__vm.get(${pane}).snapshot().sessionId === ${JSON.stringify(sid)}`, undefined, { timeout: 15_000 });
}

/** The seqs of a session's edit_file calls, read from its record on disk, in order. */
function editSeqs(state: string, sid: string): number[] {
  const root = join(state, "sessions", sid, "record");
  const out: number[] = [];
  for (const f of readdirSync(root).filter((n) => n.startsWith("events-")).sort()) {
    for (const line of readFileSync(join(root, f), "utf8").split("\n")) {
      if (!line.trim()) continue;
      const e = JSON.parse(line) as { seq: number; kind: string; payload?: { tool?: string } };
      if (e.kind === "ToolCall" && e.payload?.tool === "edit_file") out.push(e.seq);
    }
  }
  return out;
}

const codeText = (win: Page) => win.evaluate(`(function () { var r = document.querySelector("[data-editor-code]"); var c = r && r.shadowRoot && r.shadowRoot.querySelector(".cm-content"); return c ? c.textContent : ""; })()`) as Promise<string>;

async function main(): Promise<void> {
  const A = bigWorkspace("alpha"), B = bigWorkspace("beta");
  const fileA = A.files.find((f) => f.endsWith("tools.py"))!, fileB = B.files.find((f) => f.endsWith("strings.go"))!;
  const lineA = "// session A's edit, sprint 500", lineB = "// session B's edit, sprint 500";
  const launch = launchArgs();
  const shots = join(__dirname, "..", "..", "runs", "packaged", `sprint-500-follow-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const steps: Step[] = [];
  const errs: string[] = [];
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    const base = `http://127.0.0.1:${new URL(win.url()).port}`;
    const sidA = await scripted(base, A.root, fileA, lineA, true);
    const sidB = await scripted(base, B.root, fileB, lineB, false);
    await turn(base, sidA);
    await turn(base, sidB);
    const countA0 = readFileSync(join(A.root, fileA), "utf8").split(lineA).length - 1;

    await attach(win, 1, sidA);
    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await attach(win, 2, sidB);
    await focusPane(win, 2);
    await openEditor(win);
    await openFile(win, B.root, fileB);
    steps.push(await read(win, "S8 pane 2 shows its file", 2, shots));
    const before = await codeText(win);

    await turn(base, sidA);
    await settled(win);
    const countA1 = readFileSync(join(A.root, fileA), "utf8").split(lineA).length - 1;
    if (countA1 !== countA0 + 1) errs.push(`session A's turn: ${fileA} holds its line ${countA1} times, was ${countA0}`);
    const afterA = await codeText(win);
    if (afterA !== before) errs.push("pane 2's shown buffer changed on session A's turn");
    steps.push(await read(win, "S8 after session A's turn", 2, shots));

    await turn(base, sidB);
    await win.waitForFunction((l) => {
      const r = document.querySelector("[data-editor-code]");
      return (r?.shadowRoot?.querySelector(".cm-content")?.textContent ?? "").split(l).length - 1 >= 2;
    }, lineB, { timeout: 15_000 }).catch(() => errs.push("session B's edit did not reach pane 2's buffer"));
    steps.push(await read(win, "S8 after session B's turn", 2, shots));
    await app.close();

    const recs = windowRecords(launch);
    const marked = recs.filter((r) => r.name === "EDITOR_FOLLOW_MARKED");
    const confirmed = recs.filter((r) => r.name === "EDITOR_FOLLOW_CONFIRMED");
    const wrong = marked.filter((r) => r.pane_id !== 2);
    seen.push(`EDITOR_FOLLOW_MARKED: ${marked.map((r) => `pane ${String(r.pane_id)} seq ${String(r.payload.seq)}`).join(", ") || "none"}; CONFIRMED: ${confirmed.length}`);
    if (wrong.length) errs.push(`follow marks in another pane: ${JSON.stringify(wrong.map((r) => r.pane_id))}`);
    if (marked.length !== 1) errs.push(`${marked.length} EDITOR_FOLLOW_MARKED; one edit was made in pane 2's session while its editor was open`);
    if (confirmed.length !== marked.length) errs.push(`${confirmed.length} CONFIRMED for ${marked.length} marks`);
    const callsB = editSeqs(launch.state, sidB), callsA = editSeqs(launch.state, sidA);
    seen.push(`edit_file calls: session A seqs ${JSON.stringify(callsA)}, session B seqs ${JSON.stringify(callsB)}`);
    if (marked.length === 1 && Number(marked[0].payload.seq) !== callsB[callsB.length - 1]) errs.push(`pane 2's mark names seq ${String(marked[0].payload.seq)}; session B's last edit_file is seq ${String(callsB[callsB.length - 1])}`);
    errs.push(...report("editor_follow_per_pane", steps, recs));
    if (errs.length) throw new Error(errs.slice(0, 6).join("; "));
    console.log(`editor_follow_per_pane: ok — session A's edit written to disk, pane 2 unchanged; ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_follow_per_pane: FAIL at "${at}" — ${(e as Error).message.split("\n").slice(0, 4).join(" / ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
