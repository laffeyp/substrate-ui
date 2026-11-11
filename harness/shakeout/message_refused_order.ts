// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A refused message stays where it was and its draft comes back (sprint 451; roadmap r13 E10.2;
// ADD-TO-MESSAGE-2026-11-10-r3, the prototype's faults: the Architect saw "what is that", refused, refused, "what is
// this", "what is this"). The deterministic driver. "hello" is sent; then "what is this" with a chip naming a path
// outside the workspace (put in the bar's store: the tree offers no such path), which the server refuses (400).
// These agree:
//   the bar holds "what is this" and the chip again; INPUT_DRAFT_RESTORED chips 1;
//   the chip removed with its ×, the message sent again: the transcript reads the refused echo, its warning, then
//   "what is this" from the record (a seq ≥ 0), and the reply after it;
//   TURN_REFUSED once; TURN_SUBMITTED turn_index 0, 1, 1 (the refused turn is not counted); server.jsonl
//   TURN_ACCEPTED for turns 0 and 1 only.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const ASK = "what is this";
const OUTSIDE = "../outside.txt";
type Row = { seq: number; role: string; text: string };
const transcript = (win: Page) => win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { transcript: Row[] } } } }).__vm.get(1).snapshot().transcript.map((r) => ({ seq: r.seq, role: r.role, text: r.text }))) as Promise<Row[]>;
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
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    const box = win.locator("textarea[data-input-bar]").filter({ visible: true }).first();
    await box.fill("hello");
    await win.keyboard.press("Enter");
    await until(win, "hello's Returned", () => returned(win), (n) => n >= 1, 30_000);

    // The refused message: a chip outside the workspace.
    await win.evaluate(([ref]) => {
      const shared = (globalThis as unknown as { __substrateInputBar: { store: { set(f: (s: { panes: Record<number, Record<string, unknown>> }) => unknown): void } } }).__substrateInputBar;
      shared.store.set((s) => ({ panes: { ...s.panes, 1: { ...s.panes[1], chips: [{ kind: "file", label: "outside.txt", ref }] } } }));
    }, [OUTSIDE] as const);
    await box.click();
    await box.fill(ASK);
    await win.keyboard.press("Enter");
    await until(win, "TURN_REFUSED", () => win.evaluate(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).filter((s) => s.name === "TURN_REFUSED").length), (n) => n === 1);
    await until(win, "the draft back in the bar", async () => [await box.inputValue(), await win.locator(`[data-chip="${OUTSIDE}"]`).count()], ([t, c]) => t === ASK && c === 1);

    // The chip removed, the message sent again.
    await win.locator(`[data-chip-x="${OUTSIDE}"]`).first().click();
    await box.click();
    await win.keyboard.press("Enter");
    await until(win, "the second message's Returned", () => returned(win), (n) => n >= 2, 30_000);
    const rows = await until(win, "the record's message drawn", () => transcript(win), (r) => r.some((x) => x.role === "user" && x.text === ASK && x.seq >= 0));
    const at = rows.findIndex((r) => r.role === "user" && r.text === ASK);
    const shape = rows.slice(at, at + 3).map((r) => `${r.role}:${r.seq >= 0 ? "record" : "echo"}`);
    if (JSON.stringify(shape.slice(0, 3)) !== JSON.stringify(["user:echo", "warning:echo", "user:record"]) || !rows[at + 1].text.startsWith("turn refused:") || !rows.slice(at + 3).some((r) => r.role === "model" && r.seq >= 0)) {
      throw new Error(`the transcript from the refused message: ${JSON.stringify(rows.slice(at))}`);
    }
    await app.close();

    const recs = windowRecords(launch);
    const restored = recs.filter((r) => r.name === "INPUT_DRAFT_RESTORED").map((r) => r.payload.chips);
    if (JSON.stringify(restored) !== "[1]") throw new Error(`INPUT_DRAFT_RESTORED ${JSON.stringify(restored)}`);
    const indexes = recs.filter((r) => r.name === "TURN_SUBMITTED").map((r) => r.payload.turn_index);
    if (JSON.stringify(indexes) !== "[0,1,1]") throw new Error(`TURN_SUBMITTED turn_index ${JSON.stringify(indexes)}: a refused turn is not counted`);
    const refusedN = recs.filter((r) => r.name === "TURN_REFUSED").length;
    if (refusedN !== 1) throw new Error(`TURN_REFUSED ×${refusedN}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const accepted = server.filter((r) => r.name === "TURN_ACCEPTED").map((r) => r.payload.turn_index);
    if (JSON.stringify(accepted) !== "[0,1]") throw new Error(`TURN_ACCEPTED turns ${JSON.stringify(accepted)}`);
    // E1: no message text in any payload (TURN_REFUSED.detail is the server's error text, which names the path).
    if (readFileSync(join(traces, boot, "window-1.jsonl"), "utf8").includes(ASK)) throw new Error("the message's text reached the window's trace (E1)");
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`message_refused_order: ok — the refused "${ASK}" came back to the bar with its chip (INPUT_DRAFT_RESTORED 1); sent again without it: echo, warning, the record's message in that order, the reply after; TURN_REFUSED 1; TURN_ACCEPTED turns 0, 1; packaged=${String(booted.packaged)}`);
    status = 0;
  } catch (e) {
    console.error(`message_refused_order: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
  }
  process.exit(status);
}

main();
