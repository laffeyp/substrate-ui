// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Tool output as a plain terminal column (sprint 538; roadmap 2026-11-17-daily-driver-fixes;
// RESEARCH-2026-11-20-tool-output-text-presentation-r2; the Architect, 2026-11-17: "just all text", then
// 2026-11-17 on sprint 517 "we didn't go minimal enough"). The `raw` presentation flows the command line
// (the summary) and its output onto the pane's ground with no box, no inset, no args/output label and no
// call_id footer — the shape a terminal draws — while reusing the ANSI model and the sprints-505–512
// language formatting unchanged. The boxed `cards` and the inset `text` presentations are untouched.
//
// The workspace is the large fixture set (lib/multipane.ts). One scripted deterministic turn makes four real
// tool calls through the kernel's tools: read_file of the real models.py, write_file of a TypeScript body, a
// bash printf with ANSI red/bold and a carriage return, and a bash loop printing three lines. These agree:
//   default — Settings opens with the `cards` chip lit, and a `raw` chip is present to pick;
//   raw     — with the `raw` chip picked: no [data-tool-card-body] and no [data-tool-plain] element; one
//             [data-tool-raw] block per call; each block is boxless (computed background transparent, no
//             maxHeight), with no [data-tool-arg] and no call_id footer; the command line (the summary)
//             sits above the output; the read's output is code with its gutter, a Python keyword's ink
//             within ΔE 12 of the palette's keyword; the write's body is code, language TypeScript; the
//             printf draws through the terminal, red kept and the carriage return applied;
//   cards   — picked again, the boxes of sprints 505–512 return.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { ciede2000 } from "../pixel/ciede2000";
import { launchArgs, settled, waitForApp } from "./lib/electron";
import { bigWorkspace } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");
const KEYWORD = "#7da3ca";
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** Parse a CSS `rgb(...)`/`rgba(...)` string into a triple. */
const parseRgb = (css: string): [number, number, number] => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(css);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
};

async function main(): Promise<void> {
  const ws = bigWorkspace("alpha");
  const py = ws.files.find((f) => f.endsWith("models.py"))!;
  const written = "alpha/d/e/written_by_raw_gate.ts";
  const tsBody = "export interface Gate {\n  name: string;\n  runs: number;\n}\n\nexport const gate: Gate = { name: \"tool_output_raw\", runs: 1 };\n";
  const shellCmd = "printf '\\033[31mfailed\\033[0m and \\033[1mbold\\033[0m plain\\n50%%\\r100%% done\\n'";
  const script = [
    ["read_file", [py]],
    ["write_file", [written, tsBody]],
    ["bash", [shellCmd]],
    ["bash", ["for i in 1 2 3; do echo line$i; done"]],
  ];
  const launch = launchArgs();
  const shots = join(REPO, "runs", "packaged", `sprint-538-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  mkdirSync(shots, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const errs: string[] = [];
  const seen: string[] = [];
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
    // This gate reads the raw presentation of every tool call. The transcript is windowed (sprint 529), so
    // off-screen cards are spacers, not DOM nodes; render every row for this gate (windowing is proven under
    // load by long_session_open, W1).
    await win.evaluate("window.__noTranscriptWindowing = true");

    // Raw is the default tool view (sprint 538 follow-up): the raw chip is lit without a pick.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-tool-view="raw"][data-lit="1"]').waitFor({ state: "visible", timeout: 5_000 });
    seen.push("default: raw lit");
    await win.keyboard.press("Escape");
    await settled(win);

    const r = await post(`/api/session/${sid}/turn`, { text: "read, write, run" });
    if (!r.ok) throw new Error(`turn: HTTP ${r.status}`);
    await win.waitForFunction("window.__vm.get(1).snapshot().parkReason", undefined, { timeout: 180_000 });
    await settled(win);

    // Open every card to read its output, as a person expands one. A completed tool defaults closed
    // (web/vm/tool_output_mode.ts defaultOpen), in the raw presentation as in the boxed and inset ones.
    await win.evaluate(`(function () { var s = window.__substrateToolOutputMode; if (s) { s.state = { mode: "expanded", generation: (s.state.generation || 0) + 1 }; s.listeners.forEach(function (f) { f(); }); } })()`);
    await settled(win);

    // The raw presentation is a column, not boxes: no card bodies, no inset blocks, one raw block per call,
    // no arg rows, no call_id footer.
    const counts = await win.evaluate(() => ({
      boxes: document.querySelectorAll("[data-tool-card-body]").length,
      plains: document.querySelectorAll("[data-tool-plain]").length,
      raws: document.querySelectorAll("[data-tool-raw]").length,
      args: document.querySelectorAll("[data-tool-arg]").length,
      footer: Array.from(document.querySelectorAll("[data-tool-raw]")).some((e) => (e.textContent ?? "").includes("call_id")),
    }));
    seen.push(`raw: ${counts.raws} columns, ${counts.boxes} card bodies, ${counts.plains} inset blocks, ${counts.args} arg rows`);
    if (counts.boxes !== 0) errs.push(`${counts.boxes} boxed card bodies under raw`);
    if (counts.plains !== 0) errs.push(`${counts.plains} inset text blocks under raw`);
    if (counts.raws !== 4) errs.push(`${counts.raws} raw columns, want 4`);
    if (counts.args !== 0) errs.push(`${counts.args} arg rows under raw`);
    if (counts.footer) errs.push("a raw column holds the call_id footer");

    // Each raw column is boxless: no background, no inner scroll cap, no radius or padding box.
    const box = await win.evaluate(() => Array.from(document.querySelectorAll("[data-tool-raw]")).map((el) => {
      const s = getComputedStyle(el as HTMLElement);
      return { bg: s.backgroundColor, maxHeight: s.maxHeight, radius: s.borderTopLeftRadius, padLeft: s.paddingLeft };
    }));
    const boxed = box.filter((b) => b.bg !== "rgba(0, 0, 0, 0)" && b.bg !== "transparent");
    const capped = box.filter((b) => b.maxHeight !== "none");
    if (boxed.length) errs.push(`a raw column has a background: ${JSON.stringify(boxed[0])}`);
    if (capped.length) errs.push(`a raw column caps its height: ${JSON.stringify(capped[0])}`);
    seen.push(`raw columns boxless: background ${box[0]?.bg}, maxHeight ${box[0]?.maxHeight}`);

    // The command line sits above the output: the printf call's summary carries its command.
    const summaries = await win.locator("[data-tool-preview]").allTextContents();
    if (!summaries.some((t) => t.includes("100%") || t.includes("printf"))) errs.push(`no command line above the output: ${JSON.stringify(summaries)}`);
    else seen.push("the command line sits above the output");

    // The formatting is alive without the box: the read's code, its gutter, a Python keyword's ink; the
    // write's body as TypeScript; the printf through the terminal with its carriage return and no escape text.
    const read = win.locator('[data-tool-raw] [data-tool-text="code"][data-tool-lang="Python"]').first();
    await read.waitFor({ state: "visible", timeout: 20_000 });
    const gutter = await read.locator("[data-tool-gutter]").allTextContents();
    if (gutter[0] !== "1" || gutter.length < 50) errs.push(`gutter ${JSON.stringify(gutter.slice(0, 3))} of ${gutter.length}`);
    // The syntax colour is kept: a Python keyword token resolves its `--syntax-keyword` var to the palette's
    // keyword (the raw column has no box, so a sampled-ground ink read is brittle; the computed colour is the
    // robust proof the palette is applied).
    const kwColor = await read.locator('[data-tk="keyword"]', { hasText: /^(def|class|import|return|from)$/ }).first().evaluate((el) => getComputedStyle(el as HTMLElement).color);
    const dKw = ciede2000(parseRgb(kwColor), rgb(KEYWORD));
    if (dKw > 6) errs.push(`keyword colour ${kwColor}: ΔE ${dKw.toFixed(1)} from the palette keyword`);
    const tsBodyDrawn = await win.locator('[data-tool-raw] [data-tool-text="code"][data-tool-lang="TypeScript"]', { hasText: "tool_output_raw" }).count();
    if (tsBodyDrawn !== 1) errs.push("the write's body is not code TypeScript in the raw column");
    const term = win.locator('[data-tool-raw] [data-tool-text="terminal"]').first();
    const termText = (await term.textContent()) ?? "";
    if (termText.includes("\u001b") || termText.includes("[31m")) errs.push("an escape drew as text in the raw column");
    if (!termText.includes("100% done") || termText.includes("50%")) errs.push(`the carriage return was not applied: ${JSON.stringify(termText)}`);
    seen.push(`read: ${gutter.length} gutter lines, keyword ΔE ${dKw.toFixed(1)}; terminal ${JSON.stringify(termText.trim())}`);
    await win.screenshot({ path: join(shots, "raw.png") });

    // The cards return.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-tool-view="cards"]').first().click();
    await win.keyboard.press("Escape");
    await settled(win);
    const back = await win.evaluate(() => ({
      boxes: document.querySelectorAll("[data-tool-card-body]").length,
      raws: Array.from(document.querySelectorAll("[data-tool-raw]")).filter((e) => (e as HTMLElement).offsetParent !== null).length,
    }));
    if (back.boxes !== 4 || back.raws !== 0) errs.push(`cards again: ${back.boxes} boxes, ${back.raws} raw columns visible`);
    else seen.push("cards again: 4 boxes, no raw column visible");
    await win.screenshot({ path: join(shots, "cards.png") });

    if (errs.length) throw new Error(errs.join("; "));
    console.log(`tool_output_raw: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`tool_output_raw: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
