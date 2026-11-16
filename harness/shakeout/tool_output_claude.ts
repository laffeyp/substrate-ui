// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Claude Code's own tool cards, formatted (sprint 511; roadmap 2026-11-14-editor-features r5 E11). Cards 505, 509 and
// 510 read Claude Code's call shapes in unit specs only; every card in a session on the `claude` driver is Claude
// Code's. One live `claude` turn (the live roster: Claude Code on this machine, a capable model) on the large fixtures,
// made a repository, is asked for eight tool calls: Read of the Python fixture, Bash `grep -n` of it, Bash `grep -rn`
// over the Go files, Read then Edit of the Go fixture, Write of a TypeScript file, Bash `git diff`, Bash `find`. Claude
// Code 2.1.325 has no Grep or Glob tool (its init event lists Bash, Read, Edit, Write and others; read 2026-11-15), so a
// search runs through Bash. The record holds the calls; the gate reads their shapes from it. Every card is opened.
// These agree:
//   shapes  — each asked tool appears in the record as a HarnessToolCall with a HarnessToolResult;
//   formats — Read output is Python code, its numbers in the gutter; both greps draw hits, the one-file grep its line
//             numbers in a gutter and its text in Python, the recursive one its paths dim and its text in Go; Edit's
//             old and new strings are Go code; Write's content is TypeScript; `git diff` is a diff in Go; every
//             closed summary is formatted and reads no `key=`;
//   pixels  — the Read's keyword ink is the palette's keyword colour (CIEDE2000 under 12), the diff's + mark teal;
//   trace   — no INVARIANT_BROKEN (lib/electron.ts fails the launch on any).
// SHAKEOUT_APP=<Substrate.app> runs the bundle. GATE_DUMP=1 prints each call's arg keys and output head.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Locator, type Page } from "playwright";
import { ciede2000 } from "../pixel/ciede2000";
import { decodePng } from "../pixel/png";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { bigWorkspace } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");
const KEYWORD = "#7da3ca", TEAL = "#7fb3b8";
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
const envs = (win: Page) => win.evaluate("window.__vm.get(1).snapshot().rawEnvelopes || []") as Promise<Env[]>;
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

async function ink(el: Locator): Promise<{ rgb: [number, number, number]; n: number }> {
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
  const git = (...a: string[]) => execFileSync("git", ["-C", ws.root, ...a], { encoding: "utf8" });
  git("init", "-q", "-b", "main"); git("config", "user.email", "gate@example.invalid"); git("config", "user.name", "gate");
  git("add", "-A"); git("commit", "-q", "-m", "base");
  const abs = (rel: string) => join(ws.root, rel);
  const py = ws.files.find((f) => f.endsWith("models.py"))!, go = ws.files.find((f) => f.endsWith(".go"))!;
  const goLine = readFileSync(abs(go), "utf8").split("\n").find((l) => l.startsWith("func "))!;
  const tsPath = abs("alpha/d/e/claude_gate.ts");
  const ASK = [
    "Make exactly these eight tool calls, in this order, one call each, then reply with the word done. Use the tool each step names.",
    `1. Read tool: ${abs(py)} (the whole file).`,
    `2. Bash tool: grep -n "class " ${abs(py)}`,
    `3. Bash tool: grep -rn "return" ${abs("alpha")} --include='*.go'`,
    `4. Read tool: ${abs(go)}`,
    `5. Edit tool (not Bash): in ${abs(go)} replace the line ${JSON.stringify(goLine)} with "// edited by the gate, sprint 511" on its own line followed by that same line.`,
    `6. Write tool: ${tsPath} with this content:\nexport interface Gate {\n  name: string;\n  runs: number;\n}\n\nexport const gate: Gate = { name: "claude", runs: 1 };`,
    `7. Bash tool: cd ${ws.root} && git diff`,
    `8. Bash tool: find ${abs("alpha")} -name "*.rs"`,
  ].join("\n");
  const launch = launchArgs({ roster: "live" });
  const shots = join(REPO, "runs", "packaged", `sprint-511-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  mkdirSync(shots, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const errs: string[] = [];
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "claude", { folder: ws.root });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill(ASK);
    await win.keyboard.press("Enter");
    const t0 = Date.now();
    await win.waitForFunction("(window.__vm.get(1).snapshot().rawEnvelopes || []).some(function (e) { return e.kind === 'Returned'; })", undefined, { timeout: 480_000, polling: 1000 });
    seen.push(`turn returned after ${Math.round((Date.now() - t0) / 1000)} s`);
    await settled(win);
    const es = await envs(win);
    const calls = es.filter((e) => e.kind === "HarnessToolCall");
    const results = new Map(es.filter((e) => e.kind === "HarnessToolResult").map((e) => [String(e.payload.call_id), e.payload]));
    if (process.env.GATE_DUMP) {
      for (const c of calls) {
        const r = results.get(String(c.payload.call_id));
        const out = typeof r?.output === "string" ? r.output : JSON.stringify(r?.output);
        console.log(`DUMP ${String(c.payload.tool)} args ${JSON.stringify(Object.keys((c.payload.args ?? {}) as object))} ok ${String(r?.ok)}\n${String(out).slice(0, 500)}\n----`);
      }
    }
    const tools = calls.map((c) => String(c.payload.tool));
    seen.push(`calls ${JSON.stringify(tools)}`);
    for (const want of ["Read", "Bash", "Edit", "Write"]) if (!tools.includes(want)) errs.push(`no ${want} call in the record`);
    for (const c of calls) if (!results.has(String(c.payload.call_id))) errs.push(`${String(c.payload.tool)} has no result`);

    // Every card opened, as a person opens one.
    const cards = win.locator("details:has([data-tool-summary])");
    const n = await cards.count();
    for (let i = 0; i < n; i++) { const card = cards.nth(i); if (!(await card.evaluate((d) => (d as HTMLDetailsElement).open))) await card.locator("summary").click(); }
    await settled(win);
    await win.waitForFunction(() => {
      const langs = Array.from(document.querySelectorAll("[data-tool-lang]")).map((e) => e.getAttribute("data-tool-lang"));
      return langs.includes("Python") && langs.includes("Go") && langs.includes("TypeScript");
    }, undefined, { timeout: 30_000 }).catch(() => undefined);

    const summaries = await win.locator("[data-tool-summary]").allTextContents();
    if (summaries.some((t) => /\b(command|file_path|path|pattern)=/.test(t))) errs.push(`a summary reads a key: ${JSON.stringify(summaries)}`);
    const card = (tool: string) => cards.filter({ has: win.locator("summary", { hasText: new RegExp(`^${tool}\\b`) }) });
    const read = card("Read").first().locator('[data-tool-text="code"][data-tool-lang="Python"]');
    const gutter = await read.locator("[data-tool-gutter]").count();
    if (!gutter) errs.push("Read: its output is not Python code with a gutter");
    const bashGrep = card("Bash").filter({ hasText: "class " }).first().locator('[data-tool-text="grep"]');
    const oneLang = await bashGrep.locator("[data-tk]").count();
    const oneGutter = await bashGrep.locator("[data-tool-gutter]").count();
    if (!oneLang || !oneGutter) errs.push(`grep -n of one file: ${oneGutter} gutter numbers, ${oneLang} Python tokens`);
    const toolGrep = card("Bash").filter({ hasText: "grep -rn" }).first().locator('[data-tool-text="grep"]');
    const rnPaths = await toolGrep.locator("[data-grep-path]").count();
    if (!rnPaths || !(await toolGrep.locator('[data-tk="keyword"]').count())) errs.push(`grep -rn: ${rnPaths} paths, no Go keyword`);
    const edit = card("Edit").first().locator('[data-tool-arg] [data-tool-text="code"][data-tool-lang="Go"]');
    if ((await edit.count()) < 2) errs.push(`Edit: ${await edit.count()} args drawn as Go; want old and new`);
    const editKeys = await card("Edit").first().locator("[data-tool-arg]").evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/^\[\d+\]\s*/, "").match(/^(old_string|new_string|content)/)?.[1] ?? "?"));
    if (editKeys.indexOf("old_string") < 0 || editKeys.indexOf("old_string") > editKeys.indexOf("new_string")) errs.push(`Edit args in the order ${JSON.stringify(editKeys)}; old_string comes first`);
    seen.push(`Edit args ${JSON.stringify(editKeys)}`);
    const write = card("Write").first().locator('[data-tool-arg] [data-tool-text="code"][data-tool-lang="TypeScript"]');
    if (!(await write.count())) errs.push("Write: content not drawn as TypeScript");
    const diff = card("Bash").filter({ hasText: "git diff" }).first().locator('[data-tool-text="diff"]');
    const diffLang = await diff.locator("[data-diff-file]").first().getAttribute("data-tool-lang").catch(() => null);
    if (diffLang !== "Go") errs.push(`git diff: drawn as diff in ${String(diffLang)}`);
    const shellSummaries = await win.locator('[data-tool-summary-text="shell"][data-tool-lang="Shell"]').count();
    if (shellSummaries < 2) errs.push(`${shellSummaries} Bash summaries parsed as Shell`);
    seen.push(`read gutter ${gutter} lines; grep -n gutter ${oneGutter}, tokens ${oneLang}; grep -rn paths ${rnPaths}; edit Go args ${await edit.count()}; write TS ${await write.count()}; diff ${String(diffLang)}; shell summaries ${shellSummaries}`);

    const inks: [string, Locator, string][] = [
      ["Read keyword", read.locator('[data-tk="keyword"]').first(), KEYWORD],
      ["diff + mark", diff.locator('[data-diff-mark="+"]').first(), TEAL],
      ["grep -n keyword", bashGrep.locator('[data-tk="keyword"]').first(), KEYWORD],
    ];
    for (const [what, el, hex] of inks) {
      if (!(await el.count())) { errs.push(`${what}: not drawn`); continue; }
      const got = await ink(el);
      const d = ciede2000(got.rgb, rgb(hex));
      seen.push(`${what} ΔE ${d.toFixed(1)}`);
      if (got.n < 6 || d > 12) errs.push(`${what}: ink ${JSON.stringify(got.rgb)}, ΔE ${d.toFixed(1)} to ${hex}`);
    }
    for (const [loc, name] of [[card("Read").first(), "read"], [card("Bash").filter({ hasText: "class " }).first(), "grep-one-file"], [card("Bash").filter({ hasText: "grep -rn" }).first(), "grep-rn"], [card("Edit").first(), "edit"], [card("Bash").filter({ hasText: "git diff" }).first(), "git-diff"]] as const) {
      if (await loc.count()) { await loc.scrollIntoViewIfNeeded(); await loc.screenshot({ path: join(shots, `${name}.png`) }); }
    }
    writeFileSync(join(shots, "record.json"), JSON.stringify(calls.map((c) => ({ tool: c.payload.tool, args: Object.keys((c.payload.args ?? {}) as object) }))));
    await app.close();
    if (errs.length) throw new Error(errs.join("; "));
    console.log(`tool_output_claude: ok —\n  ${seen.join("\n  ")}\n  packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`tool_output_claude: FAIL — ${(e as Error).message.split("\n").slice(0, 8).join(" / ")}\n  ${seen.join("\n  ")}\n  screenshots ${shots}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
