// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Every common language and format is highlighted (sprint 472; roadmap r13 E15; the Architect, 2026-11-11: "everything
// from JSON to Rust"). A repository written here holds main.rs, main.go, config.yaml, Cargo.toml, query.sql, Dockerfile
// and App.kt, each with a comment and a string, and notes.zz. The deterministic driver; in the editor, for each:
//   once its language loads, the comment draws dim and italic and the string grey (the editor's HighlightStyle); INFO's
//   type and the status line name the language: Rust, Go, YAML, TOML, SQL, Dockerfile, Kotlin;
//   notes.zz is plain text: no italic span, type ".zz file", no language in the status line.
// Screenshots go to runs/packaged/sprint-472-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
/** Each file: its text, its language's name, and whether its mode marks the string. */
const FILES: [string, string, string, boolean][] = [
  ["main.rs", '// a comment\nfn main() { let s = "text"; }\n', "Rust", true],
  ["main.go", '// a comment\npackage main\n\nvar s = "text"\n', "Go", true],
  ["config.yaml", '# a comment\nkey: "text"\n', "YAML", true],
  ["Cargo.toml", '# a comment\nname = "text"\n', "TOML", true],
  ["query.sql", "-- a comment\nSELECT 'text' FROM t;\n", "SQL", true],
  ["Dockerfile", '# a comment\nFROM alpine\nRUN echo "text"\n', "Dockerfile", true],
  ["App.kt", '// a comment\nval s = "text"\n', "Kotlin", true],
];
/** The code's spans: their text, colour and style. */
const spans = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; if (!r) return []; return Array.from(r.querySelectorAll(".cm-line span")).map(function (e) { var s = getComputedStyle(e); return { text: e.textContent, color: s.color, italic: s.fontStyle === "italic" }; }); })()`) as Promise<{ text: string; color: string; italic: boolean }[]>;
const firstLine = (win: Page) => win.evaluate(`(function () { var h = document.querySelector("[data-editor-code]"); var r = h && h.shadowRoot; var l = r && r.querySelector(".cm-line"); return l ? l.textContent : null; })()`) as Promise<string | null>;
const infoType = (win: Page) => win.evaluate(`(function () { var row = Array.from(document.querySelectorAll("[data-info-row]")).find(function (e) { return e.textContent.indexOf("type") === 0; }); return row ? row.textContent.replace(/^type/, "").trim() : null; })()`) as Promise<string | null>;
const statusLanguage = (win: Page) => win.evaluate(`(function () { var e = document.querySelector("[data-status-language]"); return e ? e.textContent : null; })()`) as Promise<string | null>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
const DIM = "rgb(98, 103, 111)", GREY = "rgb(154, 160, 168)";
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 20_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-472-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-highlight-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  for (const [name, text] of FILES) writeFileSync(join(repo, name), text);
  writeFileSync(join(repo, "notes.zz"), '# not a comment here\n"text"\n');
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await until(win, "hello's Returned", () => returned(win), (n) => n >= 1, 30_000);
    await win.keyboard.press("Meta+Shift+E");

    const seen: string[] = [];
    for (const [name, text, language, stringMarked] of FILES) {
      await win.locator(`[data-tree-row="${name}"]`).first().click();
      await until(win, `${name} placed`, () => firstLine(win), (l) => l === text.split("\n")[0]);
      const marks = await until(win, `${name} highlighted`, () => spans(win), (s) => s.some((x) => x.italic && x.color === DIM && x.text.includes("a comment")) && (!stringMarked || s.some((x) => x.color === GREY && x.text.includes("text"))));
      await until(win, `${name}'s type in INFO`, () => infoType(win), (t) => t === language);
      await until(win, `${name}'s language in the status line`, () => statusLanguage(win), (t) => t === language);
      seen.push(`${name}=${language}(${marks.length} spans)`);
      if (name === "main.rs" || name === "query.sql") await win.screenshot({ path: join(shots, `${name}.png`) });
    }
    await win.locator('[data-tree-row="notes.zz"]').first().click();
    await until(win, "notes.zz placed", () => firstLine(win), (l) => l === "# not a comment here");
    await until(win, "notes.zz's type", () => infoType(win), (t) => t === ".zz file");
    if (await statusLanguage(win)) throw new Error(`notes.zz names a language: ${String(await statusLanguage(win))}`);
    const plain = await spans(win);
    if (plain.some((x) => x.italic)) throw new Error(`notes.zz has an italic span: ${JSON.stringify(plain)}`);
    await app.close();

    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_highlight: ok — ${seen.join(", ")}: each comment dim and italic, each string grey, its language in INFO and the status line; notes.zz plain, ".zz file"; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_highlight: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
