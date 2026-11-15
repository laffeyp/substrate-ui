// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A tool card's text, formatted (sprint 505; roadmap 2026-11-14-editor-features r4 E7; the Architect, 2026-11-14: "all
// code and all text needs to be properly formatted in there").
//
// The workspace is the large fixture set (lib/multipane.ts): twelve languages three to five folders deep. One scripted
// deterministic turn (driver params `script`) makes four real tool calls through the kernel's tools:
//   read_file  models.py (the real fixture, hundreds of lines; the kernel numbers each line `<n>\t`);
//   bash       printf with ANSI red, bold and a reset, then a carriage-return progress line;
//   bash       cat of a one-line JSON file;
//   write_file a TypeScript file with a body.
// Every card is opened by its summary, as a person opens one. These agree:
//   formats — the read's output is code, language Python, its line numbers in a gutter and none left in the code; the
//             first bash command is shell; its output is the terminal, red where the escape said red and no escape
//             byte drawn; the JSON output is laid out over lines and highlighted as JSON; the write's body is
//             TypeScript;
//   pixels  — in a screenshot, a Python keyword token's ink is the palette's keyword colour (CIEDE2000 under 12) and
//             not the old output grey #9aa0a8; the red run's ink is the failed red #c26058; a string token is the
//             string colour;
//   scheme  — switched to ghost in the settings store, the keyword's ink moves to the ghost keyword grey;
//   trace   — no INVARIANT_BROKEN (lib/electron.ts fails the launch on any).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Locator, type Page } from "playwright";
import { ciede2000 } from "../pixel/ciede2000";
import { decodePng } from "../pixel/png";
import { launchArgs, settled, waitForApp } from "./lib/electron";
import { bigWorkspace } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");
const KEYWORD = "#7da3ca", STRING = "#c7ade6", FAIL = "#c26058", GREY = "#9aa0a8", GHOST_KEYWORD = "#93969a";
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** The ink of a token: of its pixels, the ones far from the card's ground, their median colour. */
async function ink(win: Page, el: Locator): Promise<{ rgb: [number, number, number]; n: number }> {
  await el.scrollIntoViewIfNeeded();
  const img = decodePng(await el.screenshot());
  const ground = rgb("#1a1c20");
  const px: [number, number, number][] = [];
  for (let i = 0; i < img.data.length; i += 4) {
    const c: [number, number, number] = [img.data[i], img.data[i + 1], img.data[i + 2]];
    if (ciede2000(c, ground) > 25) px.push(c);
  }
  if (!px.length) return { rgb: [0, 0, 0], n: 0 };
  const med = (k: 0 | 1 | 2) => px.map((c) => c[k]).sort((a, b) => a - b)[Math.floor(px.length / 2)];
  return { rgb: [med(0), med(1), med(2)], n: px.length };
}

async function main(): Promise<void> {
  const ws = bigWorkspace("alpha");
  const py = ws.files.find((f) => f.endsWith("models.py"))!;
  writeFileSync(join(ws.root, "alpha", "result.json"), JSON.stringify({ ok: true, files: ws.files.slice(0, 6), counts: { py: 1, ts: 2 }, note: "one line, as tools return it" }));
  const written = "alpha/d/e/written_by_gate.ts";
  const tsBody = "export interface Gate {\n  name: string;\n  runs: number;\n}\n\nexport const gate: Gate = { name: \"tool_output_formatted\", runs: 1 };\n";
  const shellCmd = "printf '\\033[31mfailed\\033[0m and \\033[1mbold\\033[0m plain\\n50%%\\r100%% done\\n'";
  const script = [
    ["read_file", [py]],
    ["bash", [shellCmd]],
    ["bash", ["cat alpha/result.json"]],
    ["write_file", [written, tsBody]],
  ];
  const launch = launchArgs();
  const shots = join(REPO, "runs", "packaged", `sprint-505-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
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
    const r = await post(`/api/session/${sid}/turn`, { text: "read, run, write" });
    if (!r.ok) throw new Error(`turn: HTTP ${r.status}`);
    await win.waitForFunction("window.__vm.get(1).snapshot().parkReason", undefined, { timeout: 30_000 });
    await settled(win);
    const cards = win.locator("details:has([data-tool-card-body])");
    await win.waitForFunction(() => document.querySelectorAll("details [data-tool-card-body]").length >= 4, undefined, { timeout: 15_000 });
    const n = await cards.count();
    for (let i = 0; i < n; i++) {
      const card = cards.nth(i);
      if (!(await card.evaluate((d) => (d as HTMLDetailsElement).open))) await card.locator("summary").click();
    }
    await settled(win);
    // Each parse lands after its language loads.
    await win.waitForFunction(() => {
      const langs = Array.from(document.querySelectorAll("[data-tool-text]")).map((e) => e.getAttribute("data-tool-lang"));
      return langs.includes("Python") && langs.includes("JSON") && langs.includes("TypeScript") && langs.includes("Shell");
    }, undefined, { timeout: 20_000 }).catch(() => undefined);

    const kinds = await win.evaluate(() => Array.from(document.querySelectorAll("[data-tool-text]")).map((e) => `${e.getAttribute("data-tool-text")}:${e.getAttribute("data-tool-lang") ?? ""}`));
    seen.push(`formats ${JSON.stringify(kinds)}`);
    for (const want of ["code:Python", "shell:Shell", "terminal:", "json:JSON", "code:TypeScript"]) if (!kinds.includes(want)) errs.push(`no ${want} drawn`);

    const read = win.locator('[data-tool-text="code"][data-tool-lang="Python"]').first();
    const gutter = await read.locator("[data-tool-gutter]").allTextContents();
    const readText = await read.evaluate((e) => Array.from(e.querySelectorAll("[data-tool-gutter] + span")).map((s) => s.textContent).join("\n"));
    if (gutter[0] !== "1" || gutter.length < 50) errs.push(`gutter ${JSON.stringify(gutter.slice(0, 3))} of ${gutter.length}`);
    if (/^\d+\t/m.test(readText)) errs.push("a line number was left in the read's code");
    seen.push(`read: ${gutter.length} lines numbered in the gutter`);

    const term = win.locator('[data-tool-text="terminal"]').first();
    const termText = (await term.textContent()) ?? "";
    if (termText.includes("\u001b") || termText.includes("[31m")) errs.push("an escape drew as text");
    if (!termText.includes("100% done") || termText.includes("50%")) errs.push(`the carriage return was not applied: ${JSON.stringify(termText)}`);
    const json = await win.locator('[data-tool-text="json"]').first().evaluate((e) => e.querySelectorAll(":scope > div").length);
    if (json < 5) errs.push(`the JSON drew on ${json} lines`);
    seen.push(`terminal ${JSON.stringify(termText.trim())}; JSON on ${json} lines`);

    const keyword = read.locator('[data-tk="keyword"]', { hasText: /^(def|class|import|return|from)$/ }).first();
    const kw = await ink(win, keyword);
    const str = await ink(win, read.locator('[data-tk="string"]').first());
    const red = await ink(win, term.locator("span", { hasText: "failed" }).first());
    const shStr = await ink(win, win.locator('[data-tool-text="shell"] [data-tk="string"]').first());
    // The stream block, while and after the command ran, draws through the terminal too: no escape left as text.
    const streams = await win.evaluate(() => Array.from(document.querySelectorAll("[data-tool-card-body] [data-tool-text]")).length);
    // The command\'s own text holds "\\033[31m", so only the terminal blocks (the stream and the output) are read.
    const terminals = await win.evaluate(() => Array.from(document.querySelectorAll('[data-tool-text="terminal"]')).map((e) => e.textContent ?? ""));
    const rawEscape = terminals.length < 2 || terminals.some((t) => /\u001b|\[(31|0|1)m/.test(t));
    if (rawEscape) errs.push(`terminal blocks ${JSON.stringify(terminals)}: two wanted, no escape drawn as text`);
    const dSh = ciede2000(shStr.rgb, rgb(STRING));
    seen.push(`shell string ΔE ${dSh.toFixed(1)}; ${streams} formatted blocks; no escape drawn as text: ${String(!rawEscape)}`);
    if (shStr.n < 10 || dSh > 12) errs.push(`shell string ink ${JSON.stringify(shStr.rgb)}: ΔE ${dSh.toFixed(1)}`);
    await win.screenshot({ path: join(shots, "cards.png") });
    for (const [sel, name] of [['[data-tool-text="json"]', "json"], ['[data-tool-text="code"][data-tool-lang="TypeScript"]', "write-body"], ['[data-tool-text="terminal"]', "stream"]] as const) {
      const el = win.locator(sel).first();
      await el.scrollIntoViewIfNeeded();
      await el.screenshot({ path: join(shots, `${name}.png`) });
    }
    const dKw = ciede2000(kw.rgb, rgb(KEYWORD)), dKwGrey = ciede2000(kw.rgb, rgb(GREY)), dStr = ciede2000(str.rgb, rgb(STRING)), dRed = ciede2000(red.rgb, rgb(FAIL));
    seen.push(`ΔE: keyword ${dKw.toFixed(1)} (grey ${dKwGrey.toFixed(1)}), string ${dStr.toFixed(1)}, red ${dRed.toFixed(1)}; ink pixels ${kw.n}, ${str.n}, ${red.n}`);
    if (kw.n < 10 || dKw > 12 || dKwGrey < dKw) errs.push(`keyword ink ${JSON.stringify(kw.rgb)}: ΔE ${dKw.toFixed(1)} to the keyword colour, ${dKwGrey.toFixed(1)} to the grey`);
    if (str.n < 10 || dStr > 12) errs.push(`string ink ${JSON.stringify(str.rgb)}: ΔE ${dStr.toFixed(1)}`);
    if (red.n < 10 || dRed > 12) errs.push(`red ink ${JSON.stringify(red.rgb)}: ΔE ${dRed.toFixed(1)}`);

    await win.evaluate(() => { const s = (globalThis as unknown as Record<string, { set(p: object): void }>).__substrateSettings; s?.set({ scheme: "ghost" }); });
    await settled(win);
    const ghost = await ink(win, keyword);
    const dGhost = ciede2000(ghost.rgb, rgb(GHOST_KEYWORD));
    await win.screenshot({ path: join(shots, "cards-ghost.png") });
    seen.push(`ghost keyword ΔE ${dGhost.toFixed(1)}`);
    if (dGhost > 12) errs.push(`ghost: keyword ink ${JSON.stringify(ghost.rgb)}, ΔE ${dGhost.toFixed(1)} to ${GHOST_KEYWORD}`);
    await app.close();
    if (errs.length) throw new Error(errs.join("; "));
    console.log(`tool_output_formatted: ok —\n  ${seen.join("\n  ")}\n  packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`tool_output_formatted: FAIL — ${(e as Error).message.split("\n").slice(0, 6).join(" / ")}\n  ${seen.join("\n  ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
