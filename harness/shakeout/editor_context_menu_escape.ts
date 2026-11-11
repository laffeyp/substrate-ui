// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Escape on an open right-click menu closes the menu and nothing else (sprint 457; roadmap r13 E10.4; sprint 447:
// Escape in the editor interrupts the model). The live roster's model (EDITOR_LIVE_MODEL overrides) is asked, from
// the editor's terminal, to run `sleep 30` in bash; the deterministic driver answers at once, so no turn of it is
// running when a key is pressed. Once the bash call is on the record, cart.ts's code is right-clicked and Escape
// pressed. These agree:
//   the menu closes, the focus is back in the code, and the turn goes on: no Returned and no TURN_INTERRUPTED 2 s on;
//   a second Escape, from the code, interrupts it: Returned reason interrupted within 10 s;
//   window-1.jsonl: CONTEXT_MENU_OPENED code, KEY_ROUTED Escape close-menu, CONTEXT_MENU_CLOSED escape, then
//   KEY_ROUTED Escape interrupt and TURN_INTERRUPTED hard, in that order; no EDITOR_CHIP_ADDED.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const MODEL = process.env.EDITOR_LIVE_MODEL || undefined;
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
const envs = (win: Page) => win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: Env[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []) as Promise<Env[]>;
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms: number): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v).slice(0, 400)}`);
  return v;
}
const menuSource = (win: Page) => win.evaluate(`(function () { var m = document.querySelector("[data-context-menu]"); return m ? m.getAttribute("data-context-menu") : null; })()`) as Promise<string | null>;

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const repo = join(__dirname, ".scratch", "editor-context-menu-escape-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), "export const total = 1;\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, MODEL, { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("Reply with the single word ready. Use no tools.");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 300_000 });

    await win.keyboard.press("Meta+Shift+E");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    const ask = "Call the bash tool once with the command `sleep 30`. Then reply done.";
    const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
    await box.click();
    await box.fill(ask);
    await win.keyboard.press("Enter");
    const running = await until(win, "the bash call on the record", () => envs(win), (es) => {
      const at = es.find((e) => e.kind === "UserMessage" && e.payload.text === ask);
      return !!at && es.some((e) => e.seq > at.seq && e.kind === "ToolCall" && e.payload.tool === "bash");
    }, 300_000);
    const asked = running.find((e) => e.kind === "UserMessage" && e.payload.text === ask)!;
    if (running.some((e) => e.seq > asked.seq && e.kind === "Returned")) throw new Error("the turn ended before the menu");

    // The menu over the code, then Escape: the menu closes, the turn goes on.
    await win.locator("[data-editor-code] .cm-line", { hasText: "export const total = 1;" }).first().click({ button: "right", position: { x: 30, y: 6 } });
    await until(win, "the code's menu", () => menuSource(win), (m) => m === "code", 10_000);
    await win.keyboard.press("Escape");
    await until(win, "the menu closed", () => menuSource(win), (m) => m === null, 10_000);
    const inCode = await win.evaluate(`document.activeElement === document.querySelector("[data-editor-code]")`);
    if (!inCode) throw new Error("the focus did not go back to the code after Escape");
    const t0 = Date.now();
    while (Date.now() - t0 < 2_000) await settled(win);
    if ((await envs(win)).some((e) => e.seq > asked.seq && e.kind === "Returned")) throw new Error("the turn ended after the menu's Escape");
    if (windowRecords(launch).some((r) => r.name === "TURN_INTERRUPTED")) throw new Error("the menu's Escape interrupted the turn");

    // The second Escape, from the code: the interrupt.
    const pressed = Date.now();
    await win.keyboard.press("Escape");
    const ended = await until(win, "the turn's Returned", () => envs(win), (es) => es.some((e) => e.seq > asked.seq && e.kind === "Returned"), 10_000);
    const took = Date.now() - pressed;
    const returned = ended.find((e) => e.seq > asked.seq && e.kind === "Returned")!;
    if (returned.payload.reason !== "interrupted") throw new Error(`Returned reason ${String(returned.payload.reason)}`);
    await settled(win);
    await app.close();

    const recs = windowRecords(launch);
    const order = recs
      .filter((r) => ["CONTEXT_MENU_OPENED", "CONTEXT_MENU_CLOSED", "TURN_INTERRUPTED"].includes(r.name) || (r.name === "KEY_ROUTED" && r.payload.key === "Escape"))
      .map((r) => (r.name === "KEY_ROUTED" ? `Escape:${String(r.payload.action)}` : r.name === "CONTEXT_MENU_OPENED" ? `opened:${String(r.payload.source)}` : r.name === "CONTEXT_MENU_CLOSED" ? `closed:${String(r.payload.outcome)}` : `interrupted:${String(r.payload.tier)}`));
    if (JSON.stringify(order) !== JSON.stringify(["opened:code", "Escape:close-menu", "closed:escape", "Escape:interrupt", "interrupted:hard"])) throw new Error(`the order ${JSON.stringify(order)}`);
    if (recs.some((r) => r.name === "EDITOR_CHIP_ADDED")) throw new Error("a chip was added");
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_context_menu_escape: ok — with the bash sleep running, Escape on the code's menu closed the menu only (the focus back in the code, the turn still running 2 s on); the second Escape interrupted it, Returned interrupted at seq ${returned.seq} ${took} ms after the key; in order: ${order.join(", ")}; packaged=${String(booted.packaged)}`);
    status = 0;
  } catch (e) {
    console.error(`editor_context_menu_escape: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
