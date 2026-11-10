// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The files changed against main, as dots in the editor's tree (sprints 412 and 413; roadmap
// 2026-11-09-code-editor r6, R5), on a real git repository, read four ways.
//
// The gate makes a repository under harness/shakeout/.scratch/: main with src/cart.ts, src/menu.ts,
// docs/guide.md, README; a branch `fix` checked out with a commit that changes src/menu.ts. Pane 1 is
// bound to it through the picker (the kernel gives the session a worktree on substrate/<name>), one
// message creates the session, ⌘⇧E opens the editor, a click opens src/. Then, as a session's tools
// would, the gate edits src/cart.ts and writes src/new.ts in the session's workspace; the server's
// watch stream tells the tree, which reads the diff again. At each step:
//   truth  — `git` in the session's workspace: the files changed since main's merge-base, plus
//            untracked files not ignored;
//   DOM    — the rows drawn with [data-tree-dot];
//   pixels — the anchor's modified_dots, and the row bands holding the accent colour (#82a5c8);
// after close, the signals: the EDITOR_DRAWN whose proc_seq the anchor carries holds those fields,
// and each DIFF_READ in server.jsonl names base main and the truth's file count.
// A plain folder, bound the same way, must give DIFF_READ base none and no dot.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels, type Pixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

function makeRepo(root: string): void {
  mkdirSync(join(root, "src"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "gate@example.invalid");
  git(root, "config", "user.name", "gate");
  for (const [f, t] of [["src/cart.ts", "a\n"], ["src/menu.ts", "m\n"], ["docs/guide.md", "g\n"], ["README", "r\n"]]) writeFileSync(join(root, f), t);
  git(root, "add", "-A"); git(root, "commit", "-q", "-m", "base");
  git(root, "checkout", "-q", "-b", "fix");
  writeFileSync(join(root, "src/menu.ts"), "m2\n");
  git(root, "add", "-A"); git(root, "commit", "-q", "-m", "fix the menu");
}

/** The files `git` says changed in `ws` since main's merge-base, plus untracked files not ignored. */
function truth(ws: string): Set<string> {
  const base = git(ws, "merge-base", "main", "HEAD").trim();
  const out = new Set(git(ws, "diff", "--name-only", "--relative", base).split("\n").filter(Boolean));
  for (const f of git(ws, "ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean)) out.add(f);
  return out;
}

async function size(app: ElectronApplication, win: Page): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
  await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
}

async function domDots(win: Page): Promise<string[]> {
  return win.evaluate(() => Array.from(document.querySelectorAll("[data-tree-dot]")).map((d) => d.parentElement!.getAttribute("data-tree-row")!).sort());
}

/** Wait until the DOM's dots and the anchor's count both equal `want` among the drawn rows; return the reading. */
async function settle(win: Page, want: string[], file: string, what: string): Promise<Pixels> {
  const deadline = Date.now() + 20_000;
  let dom = await domDots(win);
  let px = await readPixels(win, file, await win.locator("[data-tree-row]").count());
  while (Date.now() < deadline && !(JSON.stringify(dom) === JSON.stringify(want) && !("error" in px.anchor) && px.anchor.modified_dots === want.length)) {
    await settled(win);
    dom = await domDots(win);
    px = await readPixels(win, file, await win.locator("[data-tree-row]").count());
  }
  if (JSON.stringify(dom) !== JSON.stringify(want)) throw new Error(`${what}: dots drawn on ${JSON.stringify(dom)}; git says ${JSON.stringify(want)}`);
  if ("error" in px.anchor) throw new Error(`${what}: the pixel anchor does not decode: ${px.anchor.error}`);
  if (px.anchor.modified_dots !== want.length) throw new Error(`${what}: the pixels say ${px.anchor.modified_dots} dots; git says ${want.length}`);
  if (px.dotted !== want.length) throw new Error(`${what}: ${px.dotted} row bands hold the accent dot on screen; ${want.length} should`);
  return px;
}

async function run(name: string, folder: string, shots: string, act: (win: Page, ws: string) => Promise<{ readings: [string, Pixels, number][]; reads: number[] }>): Promise<string> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await size(app, win);
    await bindPaneAsUser(win, "deterministic", { folder });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string | null } } } }).__vm.get(1).snapshot().workspacePath ?? "");
    if (!ws) throw new Error(`${name}: the session has no workspace path`);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    const { readings, reads } = await act(win, ws);
    await app.close();
    const recs = windowRecords(launch);
    for (const [step, px] of readings) {
      const anchor = px.anchor;
      if ("error" in anchor) throw new Error(`${name}, ${step}: the pixel anchor does not decode`);
      const rec = recs.find((r) => r.proc_seq === anchor.seq);
      if (!rec || rec.name !== "EDITOR_DRAWN" || rec.payload.modified_dots !== anchor.modified_dots || rec.payload.tree_rows !== anchor.tree_rows) {
        throw new Error(`${name}, ${step}: the pixels carry seq ${anchor.seq} with ${anchor.modified_dots} dots; window-1.jsonl holds ${rec ? `${rec.name} ${JSON.stringify(rec.payload)}` : "nothing"}`);
      }
    }
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const lines = (f: string) => readFileSync(join(traces, boot, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const diffs = lines("server.jsonl").filter((r) => r.name === "DIFF_READ").map((r) => `${String(r.payload.base)}:${String(r.payload.files)}`);
    const booted = lines("main.jsonl").find((r) => r.name === "APP_BOOTED")!.payload;
    // Each truth the gate saw must appear among the server's reads, in order (the watch may read more than once).
    let at = 0;
    for (const n of reads) { const i = diffs.indexOf(`main:${n}`, at); if (i < 0) throw new Error(`${name}: DIFF_READ ${JSON.stringify(diffs)} lacks ${n} files after read ${at}`); at = i + 1; }
    launch.cleanup();
    return `${name} ok — ${readings.map(([s, p]) => `${s}: ${"error" in p.anchor ? "?" : p.anchor.modified_dots} dots (pixels seq ${"error" in p.anchor ? "?" : p.anchor.seq} = EDITOR_DRAWN; ${p.dotted} accent bands)`).join("; ")}; DIFF_READ ${diffs.join(" ")}; packaged=${String(booted.packaged)} vocabulary=${String(booted.vocab_version)}`;
  } catch (e) {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: true });
    throw e;
  }
}

async function main(): Promise<void> {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-413-${stamp}-${process.env.SHAKEOUT_APP ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const base = join(__dirname, ".scratch", "editor-dots-" + process.pid);
  // The plain folder lives outside every repository (a folder under this repository is inside its work tree).
  const repo = join(base, "repo"), plain = mkdtempSync(join(tmpdir(), "editor-dots-plain-"));
  mkdirSync(repo, { recursive: true });
  makeRepo(repo);
  writeFileSync(join(plain, "a.txt"), "a\n");
  let code = 1;
  try {
    console.log("editor_dots: " + await run("repo", repo, shots, async (win, ws) => {
      const readings: [string, Pixels, number][] = [];
      const reads: number[] = [];
      await win.locator('[data-tree-row="src"]').first().click();
      let want = Array.from(truth(ws)).sort();
      reads.push(want.length);
      readings.push(["src/ open", await settle(win, want, join(shots, "repo-0.png"), "src/ open"), want.length]);
      // As the session's tools would: an edit and a new file in the workspace.
      writeFileSync(join(ws, "src", "cart.ts"), "a, edited\n");
      writeFileSync(join(ws, "src", "new.ts"), "new\n");
      want = Array.from(truth(ws)).sort();
      reads.push(want.length);
      readings.push(["after an edit and a new file", await settle(win, want, join(shots, "repo-1.png"), "after an edit and a new file"), want.length]);
      return { readings, reads };
    }));
    // The kernel makes a plain folder a repository with one commit of what it holds (ensure_repository,
    // K315), on git's default branch, main here: nothing has changed, so no dot.
    console.log("editor_dots: " + await run("plain", plain, shots, async (win, ws) => {
      await win.locator('[data-tree-row="a.txt"]').first().waitFor({ timeout: 10_000 });
      if (git(ws, "rev-parse", "--abbrev-ref", "HEAD").trim() !== "main") throw new Error("plain: the kernel's repository is not on main");
      const want = Array.from(truth(ws)).sort();
      return { readings: [["a plain folder", await settle(win, want, join(shots, "plain-0.png"), "a plain folder"), want.length]], reads: [want.length] };
    }));
    console.log(`editor_dots: ok — screenshots in ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_dots: FAIL — ${(e as Error).message}`);
  } finally {
    rmSync(base, { recursive: true, force: true });
    rmSync(plain, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
