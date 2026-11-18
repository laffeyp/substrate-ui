// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Tool output as plain text, the Claude Code shape (sprint 517; roadmap 2026-11-17-daily-driver-fixes E3; the
// Architect, 2026-11-17: "just all text … it just goes bash and then it doesn't show what the args are … and then
// that text just goes below … if there's a streaming output there shouldn't be a regular because they're always
// the same"). The boxed card stays the default until the Architect judges the new shape in the installed build.
//
// The workspace is the large fixture set (lib/multipane.ts). One scripted deterministic turn makes five real tool
// calls through the kernel's tools: read_file of the real models.py, write_file of a TypeScript body, bash cat of
// a one-line JSON file, a bash loop printing a line a second (a stream), and `seq 1 9000` (38 KB, past the bash
// result's 8,000-byte stdout cap, tools.py _BASH_STDOUT_BYTES). These agree:
//   default — Settings opens with the `cards` chip lit;
//   text    — with the `text` chip picked: no [data-tool-card-body] element, one [data-tool-plain] block per call
//             on the inset's ground (#1a1c20, decoded); the read's output is code with its gutter, a Python
//             keyword's ink within ΔE 12 of the palette's keyword; the write's body is code, language TypeScript;
//             no [data-tool-arg] and no call_id footer; the streaming call's block is one element that grows while
//             the command runs and is the same element after the result lands; the 38 KB stream keeps its text
//             (the block holds line 9000 and the kernel's truncation note);
//   cards   — picked again, the boxes of sprints 505–512 return.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Locator, type Page } from "playwright";
import { ciede2000 } from "../pixel/ciede2000";
import { decodePng } from "../pixel/png";
import { launchArgs, settled, waitForApp } from "./lib/electron";
import { bigWorkspace } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");
const KEYWORD = "#7da3ca";
const INSET: [number, number, number] = [26, 28, 32];
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** The ink of a token: of its pixels, the ones far from the block's ground, their median colour. */
async function ink(win: Page, el: Locator, cut = 25): Promise<{ rgb: [number, number, number]; n: number }> {
  await el.scrollIntoViewIfNeeded();
  const img = decodePng(await el.screenshot());
  const px: [number, number, number][] = [];
  for (let i = 0; i < img.data.length; i += 4) {
    const c: [number, number, number] = [img.data[i], img.data[i + 1], img.data[i + 2]];
    if (ciede2000(c, INSET) > cut) px.push(c);
  }
  if (!px.length) return { rgb: [0, 0, 0], n: 0 };
  const med = (k: 0 | 1 | 2) => px.map((c) => c[k]).sort((a, b) => a - b)[Math.floor(px.length / 2)];
  return { rgb: [med(0), med(1), med(2)], n: px.length };
}

/** The average colour of a small box at an element's padding corner. */
async function groundOf(win: Page, el: Locator): Promise<[number, number, number]> {
  const box = await el.boundingBox();
  if (!box) throw new Error("no box");
  const img = decodePng(await win.screenshot());
  const scale = img.width / (await win.evaluate(() => window.innerWidth));
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = Math.ceil((box.y + 6) * scale); y < Math.floor((box.y + 9) * scale); y++) for (let x = Math.ceil((box.x + 3) * scale); x < Math.floor((box.x + 11) * scale); x++) {
    const i = (y * img.width + x) * 4; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
  }
  if (!n) throw new Error("an empty box was sampled");
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

async function main(): Promise<void> {
  const ws = bigWorkspace("alpha");
  const py = ws.files.find((f) => f.endsWith("models.py"))!;
  writeFileSync(join(ws.root, "alpha", "result.json"), JSON.stringify({ ok: true, files: ws.files.slice(0, 6), counts: { py: 1, ts: 2 }, note: "one line, as tools return it" }));
  const written = "alpha/d/e/written_by_gate.ts";
  const tsBody = "export interface Gate {\n  name: string;\n  runs: number;\n}\n\nexport const gate: Gate = { name: \"tool_output_text\", runs: 1 };\n";
  const script = [
    ["read_file", [py]],
    ["write_file", [written, tsBody]],
    ["bash", ["cat alpha/result.json"]],
    ["bash", ["for i in 1 2 3; do echo line$i; sleep 1; done"]],
    ["bash", ["seq 1 9000"]],
  ];
  const launch = launchArgs();
  const shots = join(REPO, "runs", "packaged", `sprint-517-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
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

    // The default: the cards chip is lit.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-tool-view="cards"][data-lit="1"]').waitFor({ state: "visible", timeout: 5_000 });
    seen.push("default: cards lit");
    await win.locator('[data-setting-tool-view="text"]').first().click();
    await win.keyboard.press("Escape");
    await settled(win);

    const r = await post(`/api/session/${sid}/turn`, { text: "read, write, run" });
    if (!r.ok) throw new Error(`turn: HTTP ${r.status}`);
    // The streaming call's block, while the loop runs: one element, growing.
    await win.waitForFunction(() => Array.from(document.querySelectorAll("[data-tool-plain]")).some((e) => (e.textContent ?? "").includes("line1")), undefined, { timeout: 60_000 });
    await win.evaluate(() => {
      const el = Array.from(document.querySelectorAll("[data-tool-plain]")).find((e) => (e.textContent ?? "").includes("line1"));
      (window as unknown as { __probe?: Element }).__probe = el;
    });
    await win.waitForFunction(() => {
      const el = (window as unknown as { __probe?: HTMLElement }).__probe;
      return !!el && el.isConnected && (el.textContent ?? "").includes("line3");
    }, undefined, { timeout: 60_000 });
    seen.push("the streaming block grew in one element while the command ran");
    await win.waitForFunction("window.__vm.get(1).snapshot().parkReason", undefined, { timeout: 180_000 });
    await settled(win);

    const held = await win.evaluate(() => {
      const el = (window as unknown as { __probe?: HTMLElement }).__probe;
      return el ? { connected: el.isConnected, text: el.textContent ?? "" } : null;
    });
    if (!held?.connected || !held.text.includes("line1") || !held.text.includes("line3")) errs.push("the streaming block did not hold its text across the result");
    else seen.push("one element across the result boundary");

    const counts = await win.evaluate(() => ({
      boxes: document.querySelectorAll("[data-tool-card-body]").length,
      plains: document.querySelectorAll("[data-tool-plain]").length,
      args: document.querySelectorAll("[data-tool-arg]").length,
      footer: Array.from(document.querySelectorAll("[data-tool-plain]")).some((e) => (e.textContent ?? "").includes("call_id")),
    }));
    seen.push(`text: ${counts.plains} blocks, ${counts.boxes} boxes, ${counts.args} arg rows`);
    if (counts.boxes !== 0) errs.push(`${counts.boxes} boxed bodies under text`);
    if (counts.plains !== 5) errs.push(`${counts.plains} plain blocks, want 5`);
    if (counts.args !== 0) errs.push(`${counts.args} arg rows under text`);
    if (counts.footer) errs.push("a plain block holds the call_id footer");

    // The 38 KB stream keeps its text past the result's cap.
    const big = await win.evaluate(() => {
      const el = Array.from(document.querySelectorAll("[data-tool-plain]")).find((e) => ((e.textContent ?? "").match(/\n/g) ?? []).length > 8000);
      const t = el?.textContent ?? "";
      return { lines: (t.match(/\n/g) ?? []).length, end: t.includes("9000"), note: t.includes("[bash: stdout cut") };
    });
    if (!(big.lines > 8000 && big.end && big.note)) errs.push(`the long stream: ${big.lines} lines, ends at 9000: ${big.end}, the note: ${big.note}`);
    else seen.push("the 38 KB stream kept its text, with the truncation note");

    // The formatting is alive without the box: the read's code, its gutter, a keyword's ink; the write's body.
    const read = win.locator('[data-tool-plain] [data-tool-text="code"][data-tool-lang="Python"]').first();
    await read.waitFor({ state: "visible", timeout: 20_000 });
    const gutter = await read.locator("[data-tool-gutter]").allTextContents();
    if (gutter[0] !== "1" || gutter.length < 50) errs.push(`gutter ${JSON.stringify(gutter.slice(0, 3))} of ${gutter.length}`);
    const kw = await ink(win, read.locator('[data-tk="keyword"]', { hasText: /^(def|class|import|return|from)$/ }).first());
    const dKw = ciede2000(kw.rgb, rgb(KEYWORD));
    if (kw.n < 10 || dKw > 12) errs.push(`keyword ink ${JSON.stringify(kw.rgb)}: ΔE ${dKw.toFixed(1)}`);
    const tsBodyDrawn = await win.locator('[data-tool-plain] [data-tool-text="code"][data-tool-lang="TypeScript"]', { hasText: "tool_output_text" }).count();
    if (tsBodyDrawn !== 1) errs.push("the write's body is not code TypeScript in the block");
    const ground = await groundOf(win, win.locator("[data-tool-plain]").first());
    const dGround = Math.hypot(ground[0] - INSET[0], ground[1] - INSET[1], ground[2] - INSET[2]);
    if (dGround >= 6) errs.push(`the block's ground decodes rgb(${ground.join(",")})`);
    seen.push(`read: ${gutter.length} gutter lines, keyword ΔE ${dKw.toFixed(1)}; the block's ground rgb(${ground.join(",")})`);
    await win.screenshot({ path: join(shots, "text.png") });

    // The cards return.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-tool-view="cards"]').first().click();
    await win.keyboard.press("Escape");
    await settled(win);
    const back = await win.evaluate(() => ({
      boxes: document.querySelectorAll("[data-tool-card-body]").length,
      plains: Array.from(document.querySelectorAll("[data-tool-plain]")).filter((e) => (e as HTMLElement).offsetParent !== null).length,
    }));
    if (back.boxes !== 5 || back.plains !== 0) errs.push(`cards again: ${back.boxes} boxes, ${back.plains} plain blocks visible`);
    else seen.push("cards again: 5 boxes, no plain block visible");
    await win.screenshot({ path: join(shots, "cards.png") });

    if (errs.length) throw new Error(errs.join("; "));
    console.log(`tool_output_text: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`tool_output_text: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
