// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The inspector's changes follow the buffer (sprint 455; BLACKBOARD 2026-11-10, CHANGES with unsaved edits). A
// repository written here holds src/cart.ts, committed, then line 2 changed on disk; the deterministic driver. These
// agree:
//   opened: CHANGES one hunk; its +/− sum equals the status line's;
//   a line typed in, unsaved: two hunks, the new one "by hand · unsaved", the sums equal to the status line's;
//   ⌘S: two hunks, none unsaved, the new one "by hand"; the sums still the status line's;
//   window-1.jsonl: an EDITOR_HUNK_DRAWN author hand for the unsaved hunk.
// Screenshots of the three states go to runs/packaged/sprint-455-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const CART = ["export const a = 1;", "export const b = 2;", "export const c = 3;", "export const d = 4;", "export const e = 5;", "export const f = 6;"].join("\n") + "\n";
type Card = { at: string; plusMinus: string; author: string };
const cards = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll("[data-hunk-card]")).map(function (e) { var spans = e.querySelectorAll("span"); return { at: e.getAttribute("data-hunk-card"), plusMinus: spans[1] ? spans[1].textContent : "", author: (e.querySelector("[data-hunk-author]") || {}).textContent || "" }; })`) as Promise<Card[]>;
const statusVs = (win: Page) => win.evaluate(`(function () { var e = document.querySelector("[data-status-vs]"); return e ? e.textContent : null; })()`) as Promise<string | null>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
const sums = (cs: Card[]) => cs.reduce((t, c) => { const m = /\+(\d+) −(\d+)/.exec(c.plusMinus); return m ? [t[0] + Number(m[1]), t[1] + Number(m[2])] : t; }, [0, 0]);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
async function agree(win: Page, what: string, ok: (cs: Card[]) => boolean): Promise<Card[]> {
  const [cs, vs] = await until(win, what, async () => [await cards(win), await statusVs(win)] as const, ([c, v]) => {
    const [p, m] = sums(c as Card[]);
    return ok(c as Card[]) && v === `+${p} −${m} vs head`; // sprint 483: the branch's own last commit
  });
  void vs;
  return cs as Card[];
}
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-455-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-changes-unsaved-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), CART);
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  writeFileSync(join(repo, "src/cart.ts"), CART.replace("export const b = 2;", "export const b = 20;"));
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
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();

    const opened = await agree(win, "opened: one hunk, the status line's sum", (c) => c.length === 1);
    await win.screenshot({ path: join(shots, "opened.png") });
    await win.locator("[data-editor-code] .cm-line", { hasText: "export const e = 5;" }).first().click();
    await win.keyboard.press("Meta+ArrowRight");
    await win.keyboard.press("Enter");
    await win.keyboard.type("export const extra = 9;");
    const typed = await agree(win, "typed: two hunks, one unsaved", (c) => c.length === 2 && c.filter((x) => x.author === "by hand · unsaved").length === 1);
    await win.screenshot({ path: join(shots, "unsaved.png") });
    await menu(app, "menu-save");
    const saved = await agree(win, "saved: two hunks, none unsaved, one by hand", (c) => c.length === 2 && !c.some((x) => x.author.includes("unsaved")) && c.some((x) => x.author === "by hand"));
    await win.screenshot({ path: join(shots, "saved.png") });
    await app.close();

    const hand = windowRecords(launch).filter((r) => r.name === "EDITOR_HUNK_DRAWN" && r.payload.author === "hand").length;
    if (hand < 1) throw new Error("no EDITOR_HUNK_DRAWN author hand");
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_changes_unsaved: ok — opened ${JSON.stringify(opened.map((c) => c.author))}; typed ${JSON.stringify(typed.map((c) => c.author))}; saved ${JSON.stringify(saved.map((c) => c.author))}; each state's sums equal the status line's; EDITOR_HUNK_DRAWN hand ×${hand}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_changes_unsaved: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
