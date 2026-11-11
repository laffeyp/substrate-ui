// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's text is not teal in a repository without main (sprint 450; the Architect, 2026-11-10: "The text
// shouldn't be blue inside the editor"). Two repositories written here, each opened in its own launch:
//   (a) `git init` and a file, no commit: no line is drawn added; every line's colour is the editor's text colour
//       (#d7dade), not the added teal (#7fb3b8); DIFF_READ base no_commit; the tree shows no changed dot;
//   (b) branch `trunk`, one commit, then one line changed: exactly that line is drawn added and teal, the others
//       in the text colour; DIFF_READ base head.
//   The status line's `vs` and the inspector's changes header name the base: none and "no base" for (a), "vs head" for (b).
// Screenshots go to runs/packaged/sprint-450-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const TEXT = "rgb(215, 218, 222)";
const TEAL = "rgb(127, 179, 184)";
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
type Line = { text: string; added: boolean; colour: string };
const drawn = (win: Page) => win.evaluate(`(function () { var r = document.querySelector("[data-editor-code]").shadowRoot; return r ? Array.from(r.querySelectorAll(".cm-line")).map(function (e) { return { text: e.textContent, added: e.classList.contains("cm-added"), colour: getComputedStyle(e).color }; }) : []; })()`) as Promise<Line[]>;

async function look(repo: string, file: string, shot: string, packaged: boolean): Promise<{ lines: Line[]; bases: string[]; dots: number; status: string | null; changesMeta: string | null }> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let ok = false;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator(`[data-tree-row="${file}"]`).first().click();
    const deadline = Date.now() + 15_000;
    let lines = await drawn(win);
    while (!(lines.length > 1 && lines[0].text === "line one") && Date.now() < deadline) { await settled(win); lines = await drawn(win); }
    await settled(win);
    lines = await drawn(win);
    const dots = await win.locator("[data-tree-dot]").count();
    const status = await win.evaluate(`(function () { var e = document.querySelector("[data-status-vs]"); return e ? e.textContent : null; })()`) as string | null;
    const changesMeta = await win.evaluate(`(function () { var hs = Array.from(document.querySelectorAll("[data-editor-area=right] *")).filter(function (e) { return e.children.length === 0 && /^(vs |no base)/.test(e.textContent || ""); }); return hs.length ? hs[0].textContent : null; })()`) as string | null;
    await win.screenshot({ path: shot });
    await app.close();
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const main = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const booted = main.find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    ok = true;
    return { lines, bases: [...new Set(server.filter((r) => r.name === "DIFF_READ").map((r) => String(r.payload.base)))], dots, status, changesMeta };
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: !ok });
  }
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-450-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const scratch = join(__dirname, ".scratch", "editor-base-colours-" + process.pid);
  let status = 1;
  try {
    // (a) No commit.
    const a = join(scratch, "no-commit");
    mkdirSync(a, { recursive: true });
    git(a, "init", "-q", "-b", "main");
    writeFileSync(join(a, "notes.txt"), "line one\nline two\nline three\n");
    const seenA = await look(a, "notes.txt", join(shots, "no-commit.png"), packaged);
    if (seenA.lines.some((l) => l.added) || seenA.lines.some((l) => l.text && l.colour !== TEXT)) throw new Error(`(a) the lines: ${JSON.stringify(seenA.lines)}`);
    if (!seenA.bases.length || seenA.bases.some((b) => b !== "no_commit")) throw new Error(`(a) DIFF_READ base ${JSON.stringify(seenA.bases)}`);
    if (seenA.dots !== 0) throw new Error(`(a) ${seenA.dots} changed dots in the tree`);
    if (seenA.status !== null || seenA.changesMeta !== "no base") throw new Error(`(a) the status line's vs ${JSON.stringify(seenA.status)}, the changes header ${JSON.stringify(seenA.changesMeta)}`);

    // (b) No main: one commit on trunk, then one line changed.
    const b = join(scratch, "trunk");
    mkdirSync(b, { recursive: true });
    git(b, "init", "-q", "-b", "trunk"); git(b, "config", "user.email", "gate@example.invalid"); git(b, "config", "user.name", "gate");
    writeFileSync(join(b, "notes.txt"), "line one\nline two\nline three\n");
    git(b, "add", "-A"); git(b, "commit", "-q", "-m", "base");
    writeFileSync(join(b, "notes.txt"), "line one\nline two changed\nline three\n");
    const seenB = await look(b, "notes.txt", join(shots, "trunk.png"), packaged);
    const added = seenB.lines.filter((l) => l.added).map((l) => l.text);
    if (JSON.stringify(added) !== JSON.stringify(["line two changed"])) throw new Error(`(b) the added lines: ${JSON.stringify(seenB.lines)}`);
    if (seenB.lines.some((l) => l.text && (l.added ? l.colour !== TEAL : l.colour !== TEXT))) throw new Error(`(b) the colours: ${JSON.stringify(seenB.lines)}`);
    if (!seenB.bases.length || seenB.bases.some((x) => x !== "head")) throw new Error(`(b) DIFF_READ base ${JSON.stringify(seenB.bases)}`);
    if (seenB.status !== "+1 −1 vs head" || seenB.changesMeta !== "vs head") throw new Error(`(b) the status line ${JSON.stringify(seenB.status)}, the changes header ${JSON.stringify(seenB.changesMeta)}`);
    console.log(`editor_base_colours: ok — (a) no commit: ${seenA.lines.filter((l) => l.text).length} lines in ${TEXT}, none added, DIFF_READ no_commit, no dot; (b) trunk: only "line two changed" added in ${TEAL}, the rest in ${TEXT}, DIFF_READ head; packaged=${packaged}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_base_colours: FAIL — ${(e as Error).message}`);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
