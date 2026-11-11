// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Escape in the editor interrupts the model (sprint 447; the Architect, 2026-11-10: Escape "should actually
// interrupt the model always"). The live roster's model (EDITOR_LIVE_MODEL overrides) is asked, from the editor's
// terminal, to run `sleep 30` in bash. Once the bash call is on the record, Escape is pressed with the focus in
// the editor's input bar. These agree:
//   the turn ends with Returned reason interrupted within 10 s of the Escape, long before the sleep would end;
//   the editor view stays open, and no VIEW_CHANGED is written after the Escape;
//   window-1.jsonl: KEY_ROUTED Escape → interrupt, then TURN_INTERRUPTED tier hard.
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

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const repo = join(__dirname, ".scratch", "editor-escape-interrupt-" + process.pid);
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
    if (running.some((e) => e.seq > asked.seq && e.kind === "Returned")) throw new Error("the turn ended before the Escape");
    const viewsBefore = windowRecords(launch).filter((r) => r.name === "VIEW_CHANGED").length;
    await box.click();
    const pressed = Date.now();
    await win.keyboard.press("Escape");
    const ended = await until(win, "the turn's Returned", () => envs(win), (es) => es.some((e) => e.seq > asked.seq && e.kind === "Returned"), 10_000);
    const took = Date.now() - pressed;
    const returned = ended.find((e) => e.seq > asked.seq && e.kind === "Returned")!;
    if (returned.payload.reason !== "interrupted") throw new Error(`Returned reason ${String(returned.payload.reason)}`);
    if (!(await win.locator("[data-editor-view]").first().isVisible())) throw new Error("Escape left the editor");
    await settled(win);
    await app.close();

    const recs = windowRecords(launch);
    const esc = recs.find((r) => r.name === "KEY_ROUTED" && r.payload.key === "Escape" && r.payload.action === "interrupt");
    const interrupted = recs.filter((r) => r.name === "TURN_INTERRUPTED");
    if (!esc || interrupted.length !== 1 || interrupted[0].payload.tier !== "hard" || interrupted[0].proc_seq < esc.proc_seq) throw new Error(`KEY_ROUTED ${JSON.stringify(esc?.payload)}, TURN_INTERRUPTED ${JSON.stringify(interrupted.map((r) => r.payload))}`);
    const viewsAfter = recs.filter((r) => r.name === "VIEW_CHANGED").length;
    if (viewsAfter !== viewsBefore) throw new Error(`VIEW_CHANGED after the Escape: ${viewsAfter - viewsBefore}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_escape_interrupt: ok — Escape in the editor's input bar during the bash sleep: KEY_ROUTED interrupt, TURN_INTERRUPTED hard, Returned interrupted at seq ${returned.seq} ${took} ms after the key; the editor stayed open, no VIEW_CHANGED; packaged=${String(booted.packaged)}`);
    status = 0;
  } catch (e) {
    console.error(`editor_escape_interrupt: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
