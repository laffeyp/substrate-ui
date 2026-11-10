// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// HISTORY's step back and forward (sprint 429; roadmap 2026-11-09-code-editor r10, E6; BLACKBOARD 2026-11-09,
// the undo boundary; frame 24a). A real repository; src/cart.ts at T0 is saved by hand three times (T1, T2,
// T3). With the buffer clean, Edit ▸ Undo steps HISTORY back and Redo forward. These agree:
//   truth  — the file on disk after each step is T2, T1, T0, then T1, T2, T3; the kernel record holds the
//            three saves (view "editor") and one FileWritten per step (view "history") with those texts;
//   DOM    — HISTORY keeps three rows and "opened" (a step adds no row); the lit row is the one the file's
//            text is (T3, T2, T1, then "opened" at T0); the footer reads "⌘Z steps back · ⌘⇧Z forward";
//            past the oldest and the newest a step goes nowhere and the file stays;
//   signals — UNDO_ROUTED undo→history ×3, undo→none, redo→history ×3, redo→none; no EDITOR_FILE_SAVED for a step.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const T0 = "export const a = 1;\nexport const b = 2;\n";
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);
async function until<T>(win: Page, what: string, read: () => Promise<T> | T, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
async function historyDrawn(win: Page): Promise<{ rows: string[]; lit: string | null; footer: string | null }> {
  return win.evaluate(`(() => { var rows = Array.from(document.querySelectorAll("[data-history-row]")); var lit = rows.filter(function (e) { return e.getAttribute("data-lit") === "1"; }); var f = document.querySelector("[data-history-footer]"); return { rows: rows.map(function (e) { return e.getAttribute("data-history-row"); }), lit: lit.length === 1 ? lit[0].getAttribute("data-history-row") : null, footer: f ? f.textContent : null }; })()`);
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-429-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-history-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), T0);
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
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
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    const cart = join(ws, "src/cart.ts");
    const disk = () => readFileSync(cart, "utf8");
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();

    // Three saves by hand.
    const texts = [T0];
    for (const mark of ["A ", "B ", "C "]) {
      await win.locator("[data-editor-code] .cm-line").first().click();
      await win.keyboard.press("Meta+ArrowLeft");
      await win.keyboard.type(mark);
      await menu(app, "menu-save");
      const want = mark + texts[texts.length - 1];
      texts.push(want);
      await until(win, `the disk after saving ${mark.trim()}`, disk, (t) => t === want);
    }
    const saved = await until(win, "HISTORY after three saves", () => historyDrawn(win), (h) => h.rows.length === 4 && h.lit === h.rows[0]);
    const [r3, r2, r1] = saved.rows;
    if (saved.footer !== "⌘Z steps back · ⌘⇧Z forward") throw new Error(`the footer reads ${JSON.stringify(saved.footer)}`);

    // Back three, then nowhere.
    const back: [string, string][] = [[texts[2], r2], [texts[1], r1], [texts[0], "opened"]];
    for (const [want, lit] of back) {
      await menu(app, "menu-undo");
      await until(win, "the disk after a step back", disk, (t) => t === want);
      const h = await until(win, "HISTORY after a step back", () => historyDrawn(win), (d) => d.lit === lit);
      if (h.rows.length !== 4) throw new Error(`a step added a row: ${JSON.stringify(h.rows)}`);
    }
    const shot = join(shots, "history-opened.png");
    await win.locator('[data-editor-area="right"]').first().screenshot({ path: shot });
    await menu(app, "menu-undo");
    await settled(win);
    if (disk() !== texts[0]) throw new Error("a step back past the opening text changed the file");
    // Forward three, then nowhere.
    const forward: [string, string][] = [[texts[1], r1], [texts[2], r2], [texts[3], r3]];
    for (const [want, lit] of forward) {
      await menu(app, "menu-redo");
      await until(win, "the disk after a step forward", disk, (t) => t === want);
      await until(win, "HISTORY after a step forward", () => historyDrawn(win), (d) => d.lit === lit && d.rows.length === 4);
    }
    await menu(app, "menu-redo");
    await settled(win);
    if (disk() !== texts[3]) throw new Error("a step forward past the newest changed the file");

    // The kernel record.
    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { kind: string; payload: Record<string, unknown> }));
    const written = envs.filter((e) => e.kind === "FileWritten").map((e) => [String(e.payload.view), String(e.payload.new_text)]);
    const wantWritten = [
      ...[1, 2, 3].map((i) => ["editor", texts[i]]),
      ...[2, 1, 0, 1, 2, 3].map((i) => ["history", texts[i]]),
    ];
    if (JSON.stringify(written) !== JSON.stringify(wantWritten)) throw new Error(`the record's FileWritten: ${JSON.stringify(written)}`);
    const recs = windowRecords(launch);
    const routed = recs.filter((r) => r.name === "UNDO_ROUTED").map((r) => `${String(r.payload.direction)}→${String(r.payload.to)}`);
    const wantRouted = ["undo→history", "undo→history", "undo→history", "undo→none", "redo→history", "redo→history", "redo→history", "redo→none"];
    if (JSON.stringify(routed) !== JSON.stringify(wantRouted)) throw new Error(`UNDO_ROUTED ${JSON.stringify(routed)}`);
    const saves = recs.filter((r) => r.name === "EDITOR_FILE_SAVED").length;
    if (saves !== 3) throw new Error(`EDITOR_FILE_SAVED ${saves}; a step is not a save`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_history: ok — 3 saves; ⌘Z ×3 to T2, T1, T0 (opened lit), a 4th nowhere; ⌘⇧Z ×3 to T3, a 4th nowhere; the disk each time; 3 rows throughout; record: 3 editor + 6 history FileWritten; UNDO_ROUTED ${routed.join(", ")}; EDITOR_FILE_SAVED 3; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_history: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
