// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The sent message shows its chips (sprint 452; roadmap r13 E10.2; ADD-TO-MESSAGE-2026-11-10-r3, what you see; D94).
// A repository written here holds src/cart.ts; the deterministic driver. ⌥-click on cart.ts in the editor's tree
// adds its chip; a chip for gone.ts, a file that is not there, is put in the bar's store (the tree offers no missing
// file). "look" is sent. These agree:
//   the message's row shows two chips, cart.ts and gone.ts; cart.ts solid with its path as its hover; gone.ts dashed,
//   its hover the path and "(not found when the message was sent: gone.ts)";
//   window-1.jsonl: TRANSCRIPT_CHIPS_DRAWN chips 2 by_reference 1 with the UserMessage's seq; server.jsonl:
//   TURN_ACCEPTED attachments 2 by_reference 1.
// A screenshot of the row goes to runs/packaged/sprint-452-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
type Chip = { ref: string; dashed: boolean; title: string; label: string };
const sentChips = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll("[data-sent-chip]")).map(function (e) { return { ref: e.getAttribute("data-sent-chip"), dashed: e.getAttribute("data-by-reference") === "1", title: e.getAttribute("title"), label: e.textContent }; })`) as Promise<Chip[]>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-452-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "sent-message-chips-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), "export const total = 1;\n");
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
    await until(win, "hello's Returned", () => returned(win), (n) => n >= 1, 30_000);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click({ modifiers: ["Alt"] });
    await until(win, "cart.ts's chip", () => win.locator('[data-chip="src/cart.ts"]').count(), (n) => n >= 1);
    await win.evaluate(() => {
      const shared = (globalThis as unknown as { __substrateInputBar: { store: { set(f: (s: { panes: Record<number, { chips: unknown[] }> }) => unknown): void } } }).__substrateInputBar;
      shared.store.set((s) => ({ panes: { ...s.panes, 1: { ...s.panes[1], chips: [...s.panes[1].chips, { kind: "file", label: "gone.ts", ref: "gone.ts" }] } } }));
    });
    const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
    await box.click();
    await box.fill("look");
    await win.keyboard.press("Enter");
    await until(win, "look's Returned", () => returned(win), (n) => n >= 2, 30_000);
    const chips = await until(win, "the sent message's chips from the record", () => sentChips(win), (c) => c.length === 2 && c.some((x) => x.dashed));
    const cart = chips.find((c) => c.ref === "src/cart.ts"), gone = chips.find((c) => c.ref === "gone.ts");
    if (!cart || cart.label !== "cart.ts" || cart.dashed || cart.title !== "src/cart.ts") throw new Error(`cart.ts's sent chip: ${JSON.stringify(cart)}`);
    if (!gone || gone.label !== "gone.ts" || !gone.dashed || gone.title !== "gone.ts\n(not found when the message was sent: gone.ts)") throw new Error(`gone.ts's sent chip: ${JSON.stringify(gone)}`);
    await win.locator("[data-sent-chips]").first().scrollIntoViewIfNeeded();
    const shot = join(shots, "sent-chips.png");
    await win.screenshot({ path: shot });
    const userSeq = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string; seq: number; payload: { text?: string } }[] } } } }).__vm.get(1).snapshot().rawEnvelopes.filter((e) => e.kind === "UserMessage" && e.payload.text === "look").map((e) => e.seq)[0]);
    await app.close();

    const drawn = windowRecords(launch).filter((r) => r.name === "TRANSCRIPT_CHIPS_DRAWN").map((r) => [r.payload.seq, r.payload.chips, r.payload.by_reference]);
    if (JSON.stringify(drawn) !== JSON.stringify([[userSeq, 2, 1]])) throw new Error(`TRANSCRIPT_CHIPS_DRAWN ${JSON.stringify(drawn)}, the message at seq ${userSeq}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const accepted = server.filter((r) => r.name === "TURN_ACCEPTED").map((r) => [r.payload.attachments, r.payload.by_reference]);
    if (JSON.stringify(accepted) !== "[[0,0],[2,1]]") throw new Error(`TURN_ACCEPTED ${JSON.stringify(accepted)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`sent_message_chips: ok — "look" shows cart.ts (solid, hover src/cart.ts) and gone.ts (dashed, hover with its not-found line); TRANSCRIPT_CHIPS_DRAWN seq ${userSeq} chips 2 by_reference 1; TURN_ACCEPTED 2/1; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`sent_message_chips: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
