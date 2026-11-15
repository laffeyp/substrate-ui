// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A tool card's closed summary shows up to three lines (sprint 506; roadmap 2026-11-14-editor-features r4 E8; the
// Architect, 2026-11-14: "we really need to give like two or three lines more of that summary when it's running a bash
// command. One line isn't enough"). One scripted deterministic turn runs four real `bash` calls: a short command, a
// 200-character command, a 700-character command and a five-line command. Every card stays closed. These agree:
//   lines  — each preview box's height over its computed line height: 1; 2 or 3, not cut; 3, cut; 3, cut;
//   status — the status and caret drawn beside the preview's last line (their bottoms within 3 px), at least 4 px after
//            it, and inside the row;
//   glyph  — the summary on the same line as the row's glyph (tops within 4 px);
//   open   — a click on the long card's summary opens it, and its full command shows in the args;
//   trace  — no INVARIANT_BROKEN (lib/electron.ts fails the launch on any).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";
import { bigWorkspace } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const SHORT = "ls -la";
const MEDIUM = `echo ${words(40)}`.slice(0, 200);
const LONG = `echo ${words(130)}`;
const MULTI = "for f in alpha/*; do\n  wc -l \"$f\"\ndone\necho counted\necho done";

interface Box { glyphGap: number; statusSpace: number; lines: number; cut: boolean; statusGap: number; statusInside: boolean; text: string }

async function main(): Promise<void> {
  const ws = bigWorkspace("alpha");
  const script = [SHORT, MEDIUM, LONG, MULTI].map((c) => ["bash", [c]]);
  const launch = launchArgs();
  const shots = join(REPO, "runs", "packaged", `sprint-506-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  mkdirSync(shots, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const errs: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    const base = `http://127.0.0.1:${new URL(win.url()).port}`;
    const post = (path: string, body: unknown) => fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const { session_id: sid } = await (await post("/api/session", { driver: "deterministic", workspace: ws.root, driver_params: { script } })).json() as { session_id: string };
    await win.evaluate(`(function () { var vm = window.__vm; return (vm.get(1) || vm.spawn(1)).attachExisting(${JSON.stringify(sid)}); })()`);
    await win.waitForFunction(`window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(sid)}`, undefined, { timeout: 15_000 });
    if (!(await post(`/api/session/${sid}/turn`, { text: "run four commands" })).ok) throw new Error("the turn was refused");
    await win.waitForFunction("window.__vm.get(1).snapshot().parkReason", undefined, { timeout: 30_000 });
    await win.waitForFunction(() => document.querySelectorAll("[data-tool-summary]").length >= 4, undefined, { timeout: 15_000 });
    await settled(win);
    // Closed, as the cards land with the default toggle; close any that opened.
    for (const d of await win.locator("details:has([data-tool-summary])").all()) if (await d.evaluate((e) => (e as HTMLDetailsElement).open)) await d.locator("summary").click();
    await settled(win);
    const boxes = await win.evaluate(() => {
      const sums = Array.from(document.querySelectorAll("[data-tool-summary]"));
      return sums.map((s) => {
        const p = s.querySelector("[data-tool-preview]") as HTMLElement, st = s.querySelector("[data-tool-status]") as HTMLElement;
        const pr = p.getBoundingClientRect(), sr = st.getBoundingClientRect(), row = (s.closest("details")!.parentElement as HTMLElement).getBoundingClientRect();
        const glyph = (s.closest("details")!.previousElementSibling as HTMLElement).getBoundingClientRect();
        return { glyphGap: Math.abs(glyph.top - pr.top), statusSpace: sr.left - pr.right, lines: Math.round(pr.height / parseFloat(getComputedStyle(p).lineHeight)), cut: p.scrollHeight > p.clientHeight + 1, statusGap: Math.abs(pr.bottom - sr.bottom), statusInside: sr.width > 4 && sr.right <= row.right + 1, text: p.textContent ?? "" };
      });
    }) as Box[];
    await win.screenshot({ path: join(shots, "closed.png") });
    const want: [string, (b: Box) => boolean][] = [
      ["short: 1 line", (b) => b.lines === 1 && !b.cut],
      ["200 characters: 2 or 3 lines, whole", (b) => b.lines >= 2 && b.lines <= 3 && !b.cut],
      ["700 characters: 3 lines, cut", (b) => b.lines === 3 && b.cut],
      ["five lines: 3 lines, cut", (b) => b.lines === 3 && b.cut],
    ];
    want.forEach(([what, ok], i) => {
      const b = boxes[i];
      if (!b || !ok(b)) errs.push(`${what}: drew ${JSON.stringify(b && { lines: b.lines, cut: b.cut })}`);
      if (b && b.glyphGap > 4) errs.push(`${what}: the summary starts ${b.glyphGap.toFixed(1)} px off its glyph's line`);
      if (b && b.statusSpace < 4) errs.push(`${what}: ${b.statusSpace.toFixed(1)} px between the preview and the status`);
      if (b && (b.statusGap > 3 || !b.statusInside)) errs.push(`${what}: status ${b.statusGap.toFixed(1)} px off the last line, inside ${String(b.statusInside)}`);
    });
    const long = win.locator("details:has([data-tool-summary])").nth(2);
    await long.locator("summary").click();
    await settled(win);
    const args = (await long.locator("[data-tool-card-body]").textContent()) ?? "";
    if (!args.includes(LONG.slice(-40))) errs.push("the opened long card does not show the command's end");
    await long.screenshot({ path: join(shots, "long-open.png") });
    await app.close();
    const seen = boxes.map((b) => `${b.lines}${b.cut ? " cut" : ""}, status gap ${b.statusGap.toFixed(1)}`).join("; ");
    if (errs.length) throw new Error(`${errs.join("; ")} [${seen}]`);
    console.log(`tool_summary_lines: ok — ${seen}; the long card opened shows its whole command; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`tool_summary_lines: FAIL — ${(e as Error).message.split("\n").slice(0, 4).join(" / ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
