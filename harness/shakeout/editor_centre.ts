// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A file opens in the editor's centre (sprint 419; roadmap 2026-11-09-code-editor r8, E3; frame 24a).
// A real repository: main, and a branch `fix` checked out that changes src/cart.ts (a line replaced, two
// inserted, one removed) and adds app.py; img.bin is binary. Clicks in the tree open the files; ⌘W closes
// a tab. These agree:
//   truth  — the file on disk and `git diff -U0` against main's merge-base in the session's workspace;
//   DOM    — the tabs; CodeMirror's lines (inside its shadow root) equal the file's; the lines marked added
//            and removed equal git's;
//   pixels — in a screenshot, each added line holds teal (#7fb3b8) and each removed line red (#c26058);
//            the anchor decodes and names an EDITOR_DRAWN;
//   signals (after close) — EDITOR_FILE_OPENED how tree with tab counts 1, 2, 3; EDITOR_FILE_CLOSED 2;
//            FILE_READ per open; no session end: ⌘W in the editor closes the tab, not the session.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";
import { decodePng } from "../pixel/png";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

async function code(win: Page): Promise<{ lines: string[]; added: number; removed: number; addedBoxes: number[][]; removedBoxes: number[][] }> {
  // A string, not a function: tsx wraps named functions in a __name helper the page lacks.
  return win.evaluate(`(() => {
    var root = document.querySelector("[data-editor-code]").shadowRoot;
    if (!root) return { lines: [], added: 0, removed: 0, addedBoxes: [], removedBoxes: [] };
    var box = function (e) { var r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
    var lines = Array.from(root.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; });
    var added = Array.from(root.querySelectorAll("[data-added-line]")), removed = Array.from(root.querySelectorAll("[data-removed-line]"));
    return { lines: lines, added: added.length, removed: removed.length, addedBoxes: added.map(box), removedBoxes: removed.map(box) };
  })()`);
}

function holds(file: string, dpr: number, boxes: number[][], rgb: [number, number, number]): number {
  const img = decodePng(readFileSync(file));
  let n = 0;
  for (const [x, y, w, h] of boxes) {
    let hit = false;
    for (let yy = Math.round(y * dpr); yy < Math.round((y + h) * dpr) && !hit; yy++) for (let xx = Math.round(x * dpr); xx < Math.round((x + w) * dpr); xx++) {
      const i = (yy * img.width + xx) * 4;
      if (Math.abs(img.data[i] - rgb[0]) < 20 && Math.abs(img.data[i + 1] - rgb[1]) < 20 && Math.abs(img.data[i + 2] - rgb[2]) < 20) { hit = true; break; }
    }
    if (hit) n++;
  }
  return n;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-419-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-centre-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  const base = Array.from({ length: 12 }, (_, i) => `export const line${i + 1} = ${i + 1}; // line ${i + 1}`);
  writeFileSync(join(repo, "src/cart.ts"), base.join("\n") + "\n");
  writeFileSync(join(repo, "img.bin"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0xff, 0x00, 0x10]));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  git(repo, "checkout", "-q", "-b", "fix");
  const changed = base.slice();
  changed[2] = "export const line3 = 300; // changed";
  changed.splice(7, 0, "export const added1 = 1;", "export const added2 = 2;");
  changed.splice(changed.indexOf(base[10]), 1);
  writeFileSync(join(repo, "src/cart.ts"), changed.join("\n") + "\n");
  writeFileSync(join(repo, "app.py"), "def total(items):\n    return sum(items)\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "fix");
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
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();

    // Truth: the file and git's hunks in the session's workspace.
    const text = readFileSync(join(ws, "src/cart.ts"), "utf8").split("\n"); // a final newline is an empty last line, as CodeMirror draws it
    const mb = git(ws, "merge-base", "main", "HEAD").trim();
    const diff = git(ws, "diff", "-U0", mb, "--", "src/cart.ts").split("\n");
    const wantAdded = diff.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
    const wantRemoved = diff.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;
    const deadline = Date.now() + 15_000;
    let got = await code(win);
    while (Date.now() < deadline && !(got.lines.length === text.length && got.added === wantAdded && got.removed === wantRemoved)) { await settled(win); got = await code(win); }
    if (JSON.stringify(got.lines) !== JSON.stringify(text)) throw new Error(`the editor's lines (${got.lines.length}) are not the file's (${text.length}): first difference at ${text.findIndex((l, i) => l !== got.lines[i])}`);
    if (got.added !== wantAdded || got.removed !== wantRemoved) throw new Error(`added ${got.added} removed ${got.removed}; git says added ${wantAdded} removed ${wantRemoved}`);
    const shot = join(shots, "cart.png");
    const px = await readPixels(win, shot, 0);
    const dpr = await win.evaluate(() => window.devicePixelRatio);
    const teal = holds(shot, dpr, got.addedBoxes, [0x7f, 0xb3, 0xb8]), red = holds(shot, dpr, got.removedBoxes, [0xc2, 0x60, 0x58]);
    if (teal !== wantAdded || red !== wantRemoved) throw new Error(`on screen ${teal} added lines hold teal and ${red} removed lines hold red; want ${wantAdded} and ${wantRemoved}`);
    if ("error" in px.anchor) throw new Error(`the pixel anchor does not decode: ${px.anchor.error}`);

    await win.locator('[data-tree-row="app.py"]').first().click();
    await win.waitForFunction(() => document.querySelectorAll("[data-editor-tab]").length === 2, undefined, { timeout: 10_000 });
    await win.locator('[data-tree-row="img.bin"]').first().click();
    // Sprint 463 (roadmap r13 E14): a file that is not text opens as its bytes, in hex, where it drew "binary file".
    await win.locator('[data-bytes-view="img.bin"] [data-bytes-row="0"]').first().waitFor({ timeout: 10_000 });
    const unreadable = await win.locator('[data-bytes-view="img.bin"] [data-bytes-row="0"]').first().textContent();
    await app.evaluate(({ Menu }) => { Menu.getApplicationMenu()?.getMenuItemById("menu-close-pane")?.click(); });
    await win.waitForFunction(() => document.querySelectorAll("[data-editor-tab]").length === 2, undefined, { timeout: 10_000 });
    await settled(win);
    const live = await win.evaluate(() => !!(window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string | null; endedReason: string | null } } } }).__vm.get(1).snapshot().sessionId);
    if (!live) throw new Error("⌘W in the editor ended the session");

    await app.close();
    const recs = windowRecords(launch);
    const files = recs.filter((r) => r.name === "EDITOR_FILE_OPENED" || r.name === "EDITOR_FILE_CLOSED").map((r) => `${r.name === "EDITOR_FILE_OPENED" ? `open ${String(r.payload.how)}` : "close"} ${String(r.payload.tab_count)}`);
    if (JSON.stringify(files) !== JSON.stringify(["open tree 1", "open tree 2", "open tree 3", "close 2"])) throw new Error(`file records: ${JSON.stringify(files)}`);
    const anchor = px.anchor;
    const rec = recs.find((r) => r.proc_seq === anchor.seq);
    if (!rec || rec.name !== "EDITOR_DRAWN" || rec.payload.tab_count !== 1) throw new Error(`the pixels name seq ${anchor.seq}; the record is ${rec ? `${rec.name} ${JSON.stringify(rec.payload)}` : "missing"}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const lines = (f: string) => readFileSync(join(traces, boot, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const reads = lines("server.jsonl").filter((r) => r.name === "FILE_READ").map((r) => String(r.payload.encoding));
    // The fourth: after ⌘W the next tab shows and its file is read again from disk.
    if (JSON.stringify(reads) !== JSON.stringify(["utf8", "utf8", "binary", "utf8"])) throw new Error(`FILE_READ encodings: ${JSON.stringify(reads)}`);
    if (lines("server.jsonl").some((r) => r.name === "SESSION_ENDED")) throw new Error("the server ended the session");
    const booted = lines("main.jsonl").find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_centre: ok — src/cart.ts ${text.length} lines = the file; ${wantAdded} added and ${wantRemoved} removed = git, painted teal and red; img.bin "${unreadable}"; ⌘W closed a tab, the session lives; ${files.join(", ")}; FILE_READ ${reads.join(" ")}; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_centre: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
