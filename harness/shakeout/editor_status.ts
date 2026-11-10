// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's status line (sprint 424; roadmap 2026-11-09-code-editor r8, E4; spec r6 §5 "Code"; frame
// 24a). A real repository: main, and a branch `fix` checked out that changes src/cart.ts. These agree:
//   DOM    — `-- NORMAL --`, `cart.ts · line:col` where vim's keys put the caret (`gg 4j 3l`: 5:4),
//            `-- INSERT --` after `i`, `-- VISUAL --` after `v`, `-- VISUAL LINE --` after `V`; the binding
//            at the right; under nano no mode field, and ⌃G shows nano's keys until the next key;
//   truth  — `+N −M vs main`, and the lines the centre marks added and removed, equal `git diff --no-index --numstat` between main's copy of the file and the
//            buffer as typed, before typing and after;
//   pixels — the anchor's third row, from a screenshot taken in insert mode, decodes to mode insert, binding
//            vim, one unsaved buffer, and names the EDITOR_DRAWN that says the same;
//   signals — EDITOR_DRAWN modes normal, insert, normal, visual in that order, binding nano after the
//            switch with mode none.
// The status line is screenshotted beside frame 24a. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, chooseBinding, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

interface Status { mode: string | null; pos: string | null; vs: string | null; binding: string | null; help: string | null }
async function status(win: Page): Promise<Status> {
  return win.evaluate(`(() => {
    var t = function (sel) { var e = document.querySelector(sel); return e ? e.textContent : null; };
    return { mode: t("[data-status-mode]"), pos: t("[data-status-pos]"), vs: t("[data-status-vs]"), binding: t("[data-status-binding]"), help: t("[data-status-help]") };
  })()`);
}
async function buffer(win: Page): Promise<string> {
  const lines: string[] = await win.evaluate(`(() => Array.from(document.querySelector("[data-editor-code]").shadowRoot.querySelectorAll(".cm-line")).map(function (e) { return e.textContent; }))()`);
  return lines.join("\n");
}
async function until(win: Page, what: string, ok: (s: Status) => boolean): Promise<Status> {
  const deadline = Date.now() + 10_000;
  let s = await status(win);
  while (!ok(s) && Date.now() < deadline) { await settled(win); s = await status(win); }
  if (!ok(s)) throw new Error(`${what}: the status line reads ${JSON.stringify(s)}`);
  return s;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-424-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-status-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  const base = Array.from({ length: 12 }, (_, i) => `export const line${i + 1} = ${i + 1};`);
  writeFileSync(join(repo, "src/cart.ts"), base.join("\n") + "\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  git(repo, "checkout", "-q", "-b", "fix");
  const changed = base.slice();
  changed[7] = "export const line8 = 800; // fixed";
  changed.splice(8, 0, "export const added = 1;");
  writeFileSync(join(repo, "src/cart.ts"), changed.join("\n") + "\n");
  git(repo, "commit", "-q", "-am", "fix");
  const scratch = join(__dirname, ".scratch", "editor-status-truth-" + process.pid);
  mkdirSync(scratch, { recursive: true });
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status1 = 1;
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
    // Truth: git's count of the buffer's lines against main's copy of the file.
    const mb = git(ws, "merge-base", "main", "HEAD").trim();
    writeFileSync(join(scratch, "base.ts"), git(ws, "show", `${mb}:src/cart.ts`));
    const vsTruth = (text: string) => {
      writeFileSync(join(scratch, "buffer.ts"), text.endsWith("\n") ? text : text + "\n");
      let out = "";
      try { out = execFileSync("git", ["diff", "--no-index", "--numstat", join(scratch, "base.ts"), join(scratch, "buffer.ts")], { encoding: "utf8" }); } catch (e) { out = String((e as { stdout?: string }).stdout ?? ""); }
      const [plus, minus] = (out.trim().split(/\s+/) as string[]).map(Number);
      return `+${plus || 0} −${minus || 0} vs main`;
    };

    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await chooseBinding(win, "vim"); // standard is the default (sprint 427); this gate reads vim's modes
    const opened = await until(win, "on opening", (s) => s.mode === "-- NORMAL --" && s.pos === "cart.ts · 1:1" && s.binding === "vim" && !!s.vs);
    const wantOpened = vsTruth(await buffer(win));
    if (opened.vs !== wantOpened) throw new Error(`on opening the status line says "${opened.vs}"; git says "${wantOpened}"`);

    // The caret where vim's keys put it.
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.type("gg4j3l");
    await until(win, "after gg 4j 3l", (s) => s.pos === "cart.ts · 5:4");
    // Insert mode, typing, the anchor's third row in insert mode.
    await win.keyboard.type("i");
    await until(win, "after i", (s) => s.mode === "-- INSERT --");
    await win.keyboard.type("zz");
    await win.keyboard.press("Enter");
    const typed = await buffer(win);
    const wantTyped = vsTruth(typed);
    // Read once, with no wait: the count follows the buffer before the next paint.
    const atOnce = (await status(win)).vs;
    if (atOnce !== wantTyped) throw new Error(`straight after typing the status line says "${atOnce}"; git says "${wantTyped}"`);
    // The inline marks follow the buffer too: as many added and removed lines as the status line counts.
    const counted = await win.evaluate(`(() => { var r = document.querySelector("[data-editor-code]").shadowRoot; return "+" + r.querySelectorAll("[data-added-line]").length + " −" + r.querySelectorAll("[data-removed-line]").length + " vs main"; })()`);
    if (counted !== wantTyped) throw new Error(`the buffer's marks count ${counted}; git says ${wantTyped}`);
    const shot = join(shots, "insert.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor3) throw new Error(`the anchor's third row does not decode: ${px.anchor3.error}`);
    const row3 = px.anchor3;
    if (row3.mode !== "insert" || row3.binding !== "vim" || row3.unsaved !== 1) throw new Error(`the third row reads ${JSON.stringify(row3)}`);
    await win.locator("[data-status-line]").first().screenshot({ path: join(shots, "status-line.png") });
    await win.keyboard.press("Escape");
    await until(win, "after Escape", (s) => s.mode === "-- NORMAL --");
    await win.keyboard.type("v");
    await until(win, "after v", (s) => s.mode === "-- VISUAL --");
    await win.keyboard.type("V");
    await until(win, "after V", (s) => s.mode === "-- VISUAL LINE --");
    await win.keyboard.press("Escape");
    await until(win, "after the second Escape", (s) => s.mode === "-- NORMAL --");

    // nano: no mode field; ⌃G shows its keys until the next key.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-binding="nano"]').first().click();
    await win.keyboard.press("Escape");
    await until(win, "under nano", (s) => s.mode === null && s.binding === "nano");
    await win.locator("[data-editor-code] .cm-line").first().click();
    await win.keyboard.press("Control+g");
    await until(win, "after ⌃G", (s) => !!s.help && s.help.includes("^X leave"));
    await win.keyboard.press("ArrowDown");
    await until(win, "after the next key", (s) => s.help === null && !!s.pos);
    const frame = join(REPO_ROOT, "runs", "design", "sheet-v11", "24a.png");
    if (existsSync(frame)) copyFileSync(frame, join(shots, "24a.png"));

    await app.close();
    const recs = windowRecords(launch);
    const drawn = recs.filter((r) => r.name === "EDITOR_DRAWN");
    const modes = drawn.map((r) => String(r.payload.mode)).filter((m, i, all) => i === 0 || m !== all[i - 1]);
    const wantModes = ["normal", "insert", "normal", "visual"];
    let at = 0;
    for (const m of modes) if (m === wantModes[at]) at++;
    if (at < wantModes.length) throw new Error(`EDITOR_DRAWN modes ${JSON.stringify(modes)} lack ${JSON.stringify(wantModes)} in order`);
    if (!drawn.some((r) => r.payload.binding === "nano" && r.payload.mode === "none")) throw new Error("no EDITOR_DRAWN with binding nano and mode none");
    const named = recs.find((r) => r.proc_seq === row3.seq);
    if (!named || named.name !== "EDITOR_DRAWN" || named.payload.mode !== "insert" || named.payload.unsaved !== 1) throw new Error(`the third row names seq ${row3.seq}: ${named ? `${named.name} ${JSON.stringify(named.payload)}` : "missing"}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_status: ok — opened "${opened.mode} ${opened.pos} ${opened.vs}" (git ${wantOpened}); caret 5:4 from gg4j3l; INSERT, typed: ${wantTyped} = git; VISUAL, VISUAL LINE; nano: no mode, ⌃G keys, gone on the next key; anchor row 3 ${JSON.stringify(row3)} = EDITOR_DRAWN seq ${named.proc_seq}; modes ${modes.join(" → ")}; packaged=${String(booted.packaged)}; screenshots ${shots}`);
    status1 = 0;
  } catch (e) {
    console.error(`editor_status: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status1 !== 0 });
    rmSync(repo, { recursive: true, force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
  process.exit(status1);
}

main();
