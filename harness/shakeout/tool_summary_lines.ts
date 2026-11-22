// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A tool card's closed summary shows up to three lines (sprint 506; roadmap 2026-11-14-editor-features r4 E8; the
// Architect, 2026-11-14: "we really need to give like two or three lines more of that summary when it's running a bash
// command. One line isn't enough"). One scripted deterministic turn runs four real `bash` calls: a short command, a
// 200-character command, a 700-character command and a five-line command; then (sprint 509, the summary formatted) a
// `grep` with a quoted pattern and a `read_file` of a fixture three folders down. Every card stays closed. These agree:
//   lines  — each preview box's height over its computed line height: 1; 2 or 3, not cut; 3, cut; 3, cut;
//   status — the status and caret drawn beside the preview's last line (their bottoms within 3 px), at least 4 px after
//            it, and inside the row;
//   glyph  — the summary on the same line as the row's glyph (tops within 4 px);
//   open   — a click on the long card's summary opens it, and its full command shows in the args;
//   colour — (sprint 509) the grep's quoted pattern drawn in the palette's string colour and its command name not, the
//            read's folders in the dim grey and its file name in the bright one, each CIEDE2000 under 12 from a
//            screenshot; no summary reads a `key=`;
//   trace  — no INVARIANT_BROKEN (lib/electron.ts fails the launch on any).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdirSync } from "node:fs";
import { ciede2000 } from "../pixel/ciede2000";
import { decodePng } from "../pixel/png";
import { join } from "node:path";
import { _electron as electron, type Locator } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";
import { bigWorkspace } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const SHORT = "ls -la";
const MEDIUM = `echo ${words(40)}`.slice(0, 200);
const LONG = `echo ${words(130)}`;
const MULTI = "for f in alpha/*; do\n  wc -l \"$f\"\ndone\necho counted\necho done";

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** A token's ink: of its pixels far from the window's ground, the median colour. */
async function ink(el: Locator): Promise<{ rgb: [number, number, number]; n: number }> {
  const img = decodePng(await el.screenshot());
  const ground = rgb("#212327");
  const px: [number, number, number][] = [];
  for (let i = 0; i < img.data.length; i += 4) {
    const c: [number, number, number] = [img.data[i], img.data[i + 1], img.data[i + 2]];
    if (ciede2000(c, ground) > 20) px.push(c);
  }
  if (!px.length) return { rgb: [0, 0, 0], n: 0 };
  const med = (k: 0 | 1 | 2) => px.map((c) => c[k]).sort((a, b) => a - b)[Math.floor(px.length / 2)];
  return { rgb: [med(0), med(1), med(2)], n: px.length };
}

interface Box { glyphGap: number; statusSpace: number; lines: number; cut: boolean; statusGap: number; statusInside: boolean; text: string }

async function main(): Promise<void> {
  const ws = bigWorkspace("alpha");
  const deep = ws.files.find((f) => f.endsWith("models.py"))!;
  const GREP = `grep -rn "class Cart" ${deep.split("/")[0]}`;
  const script = [...[SHORT, MEDIUM, LONG, MULTI, GREP].map((c) => ["bash", [c]]), ["read_file", [deep]]];
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
    // This gate reads every tool summary at once. The transcript is windowed (sprint 529), so off-screen
    // rows are spacers, not DOM nodes; render every row for this gate (windowing is proven under load by
    // long_session_open, W1).
    await win.evaluate("window.__noTranscriptWindowing = true");
    // Raw is the default tool view (sprint 538 follow-up); this gate tests the boxed cards summaries, so pick cards.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-tool-view="cards"]').first().click();
    await win.keyboard.press("Escape");
    await settled(win);
    if (!(await post(`/api/session/${sid}/turn`, { text: "run four commands" })).ok) throw new Error("the turn was refused");
    await win.waitForFunction("window.__vm.get(1).snapshot().parkReason", undefined, { timeout: 30_000 });
    await win.waitForFunction(() => document.querySelectorAll("[data-tool-summary]").length >= 6, undefined, { timeout: 15_000 });
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
      ["grep: 1 line", (b) => b.lines === 1 && !b.cut],
      ["read_file: 1 line", (b) => b.lines === 1 && !b.cut],
    ];
    want.forEach(([what, ok], i) => {
      const b = boxes[i];
      if (!b || !ok(b)) errs.push(`${what}: drew ${JSON.stringify(b && { lines: b.lines, cut: b.cut })}`);
      if (b && b.glyphGap > 4) errs.push(`${what}: the summary starts ${b.glyphGap.toFixed(1)} px off its glyph's line`);
      if (b && b.statusSpace < 4) errs.push(`${what}: ${b.statusSpace.toFixed(1)} px between the preview and the status`);
      if (b && (b.statusGap > 3 || !b.statusInside)) errs.push(`${what}: status ${b.statusGap.toFixed(1)} px off the last line, inside ${String(b.statusInside)}`);
    });
    // Sprint 509: the summaries in their formats.
    await win.waitForFunction(() => document.querySelector('[data-tool-summary-text="shell"][data-tool-lang="Shell"]') !== null, undefined, { timeout: 20_000 }).catch(() => undefined);
    await settled(win);
    const summaries = win.locator("[data-tool-summary]");
    const texts = await summaries.allTextContents();
    if (texts.some((t) => /\b(command|file_path|path)=/.test(t))) errs.push(`a summary reads a key: ${JSON.stringify(texts)}`);
    const grep = summaries.nth(4), read = summaries.nth(5);
    const formats = await summaries.evaluateAll((els) => els.map((e) => { const t = e.querySelector("[data-tool-summary-text]"); return `${t?.getAttribute("data-tool-summary-text") ?? "none"}:${t?.getAttribute("data-tool-lang") ?? ""}`; }));
    if (JSON.stringify(formats) !== JSON.stringify([...Array(5).fill("shell:Shell"), "path:"])) errs.push(`formats ${JSON.stringify(formats)}`);
    const checks: [string, Locator, string, number][] = [
      ["the grep pattern", grep.locator('[data-tk="string"]').first(), "#c7ade6", 12],
      ["the read's folders", read.locator('[data-tk="dir"]'), "#62676f", 12],
      ["the read's file name", read.locator('[data-tk="file"]'), "#e2e5e9", 12],
    ];
    const deltas: string[] = [];
    for (const [what, el, hex, bar] of checks) {
      if (!(await el.count())) { errs.push(`${what}: no such token drawn (the summary is one colour)`); continue; }
      const got = await ink(el);
      const d = ciede2000(got.rgb, rgb(hex));
      deltas.push(`${what} ΔE ${d.toFixed(1)}`);
      if (got.n < 8 || d > bar) errs.push(`${what}: ink ${JSON.stringify(got.rgb)} over ${got.n} px, ΔE ${d.toFixed(1)} to ${hex}`);
    }
    // The command name is not the string colour: the summary is not one colour.
    const cmdEl = grep.locator("[data-tool-summary-text] span").first();
    if (!(await cmdEl.count())) throw new Error(`${errs.join("; ")}; the grep summary draws no tokens`);
    const cmd = await ink(cmdEl);
    const dCmd = ciede2000(cmd.rgb, rgb("#c7ade6"));
    deltas.push(`grep's command ΔE ${dCmd.toFixed(1)} from the string colour`);
    if (dCmd < 12) errs.push(`the grep summary's command draws in the string colour (ΔE ${dCmd.toFixed(1)})`);
    await grep.screenshot({ path: join(shots, "grep-closed.png") });
    await read.screenshot({ path: join(shots, "read-closed.png") });
    const long = win.locator("details:has([data-tool-summary])").nth(2);
    await long.locator("summary").click();
    await settled(win);
    const args = (await long.locator("[data-tool-card-body]").textContent()) ?? "";
    if (!args.includes(LONG.slice(-40))) errs.push("the opened long card does not show the command's end");
    await long.screenshot({ path: join(shots, "long-open.png") });
    await app.close();
    const seen = boxes.map((b) => `${b.lines}${b.cut ? " cut" : ""}, status gap ${b.statusGap.toFixed(1)}`).join("; ");
    if (errs.length) throw new Error(`${errs.join("; ")} [${seen}]`);
    console.log(`tool_summary_lines: ok — ${seen}; ${deltas.join("; ")}; the long card opened shows its whole command; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
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
