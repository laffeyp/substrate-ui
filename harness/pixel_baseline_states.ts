// Sprint 070 — shared state drivers for pixel_baseline.ts and pixel_diff.ts.
//
// Every state's drive function opens a session, sends a turn (or
// leaves the shell empty), and waits for the shell to settle. The
// baseline script captures a screenshot; the diff script captures a
// screenshot and compares against the on-disk baseline.
//
// Adding a state: append to STATES. Both scripts pick it up.

import type { Page } from "playwright";
import type { ServerHandle } from "./shakeout/lib/server";

export const BASE_URL = "http://127.0.0.1:8765";
export const CAPTURES_DIR = "captures/pixel-baseline-2026-09-23";

export const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "900x380", width: 900, height: 380 },
];

export interface State {
  name: string;
  drive: (page: Page) => Promise<void>;
  /**
   * Per-state pixel-diff tolerance as a fraction of total pixels.
   * Deterministic + no-model states hold at 0.001 (0.1%).
   * Real-model states carry content variance across runs (session id,
   * timestamps, delegate child_root string, transcript height jitter)
   * and get a larger fraction — tight enough to catch a layout
   * regression (typically 5–20%), loose enough to tolerate a rerun.
   * The record-replay refactor (a follow-up sprint) collapses every
   * tolerance to 0.001.
   */
  tolerance: number;
}

async function pickRealDriver(): Promise<string> {
  const res = await fetch(BASE_URL + "/api/models");
  const data = (await res.json()) as { models: string[]; default: string };
  const chosen = data.default !== "deterministic" ? data.default : data.models.find((m) => m !== "deterministic");
  if (!chosen) throw new Error("no non-deterministic driver on server");
  return chosen;
}

async function waitForVm(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as any).__vm != null, undefined, { timeout: 10_000 });
}

async function waitForPark(page: Page, timeoutMs: number): Promise<void> {
  await page.waitForFunction(
    () => {
      const s = (window as any).__vm?.get(1)?.snapshot();
      return s?.parkReason != null;
    },
    undefined,
    { timeout: timeoutMs },
  );
}

export const STATES: State[] = [
  {
    name: "empty",
    tolerance: 0.001,
    async drive(page) {
      await page.goto(BASE_URL + "/?p=empty&t=" + Date.now(), { waitUntil: "networkidle" });
      await waitForVm(page);
      await page.waitForTimeout(400);
    },
  },
  {
    name: "one_turn",
    tolerance: 0.001,
    async drive(page) {
      await page.goto(BASE_URL + "/?p=one_turn&t=" + Date.now(), { waitUntil: "networkidle" });
      await waitForVm(page);
      await page.evaluate(async () => {
        const vm = (window as any).__vm;
        const c = vm.get(1) ?? vm.spawn(1);
        await c.loadDriverRoster();
        c.pickDriver("deterministic");
        await c.openSession({ driver: "deterministic" });
        await c.sendTurn("hello");
      });
      await waitForPark(page, 30_000);
      await page.waitForTimeout(400);
    },
  },
  {
    name: "multi_tool",
    tolerance: 0.03,
    async drive(page) {
      const driver = await pickRealDriver();
      await page.goto(BASE_URL + "/?p=multi_tool&t=" + Date.now(), { waitUntil: "networkidle" });
      await waitForVm(page);
      await page.evaluate(async (drv) => {
        const vm = (window as any).__vm;
        const c = vm.get(1) ?? vm.spawn(1);
        await c.loadDriverRoster();
        c.pickDriver(drv);
        await c.openSession({ driver: drv });
        await c.sendTurn("Call the bash tool three times with `echo one`, `echo two`, `echo three`. One call per response, no summary.");
      }, driver);
      await waitForPark(page, 300_000);
      await page.evaluate(() => {
        const el = document.getElementById("vm-transcript");
        if (el) el.scrollTop = 0;
      });
      await page.waitForTimeout(400);
    },
  },
  {
    name: "mid_scroll",
    tolerance: 0.03,
    async drive(page) {
      const driver = await pickRealDriver();
      await page.goto(BASE_URL + "/?p=mid_scroll&t=" + Date.now(), { waitUntil: "networkidle" });
      await waitForVm(page);
      await page.evaluate(async (drv) => {
        const vm = (window as any).__vm;
        const c = vm.get(1) ?? vm.spawn(1);
        await c.loadDriverRoster();
        c.pickDriver(drv);
        await c.openSession({ driver: drv });
        await c.sendTurn("Call the bash tool three times with `echo one`, `echo two`, `echo three`. One call per response, no summary.");
      }, driver);
      await waitForPark(page, 300_000);
      await page.evaluate(() => {
        const el = document.getElementById("vm-transcript");
        if (el) el.scrollTop = Math.floor(el.scrollHeight / 2);
      });
      await page.waitForTimeout(400);
    },
  },
  {
    name: "descended",
    tolerance: 0.03,
    async drive(page) {
      const driver = await pickRealDriver();
      await page.goto(BASE_URL + "/?p=descended&t=" + Date.now(), { waitUntil: "networkidle" });
      await waitForVm(page);
      await page.evaluate(async (drv) => {
        const vm = (window as any).__vm;
        const c = vm.get(1) ?? vm.spawn(1);
        await c.loadDriverRoster();
        c.pickDriver(drv);
        await c.openSession({ driver: drv });
        await c.sendTurn("Use the delegate tool once with a small task like `compute 2+2` and the deterministic driver. Wait for the ToolResult, then stop.");
      }, driver);
      await waitForPark(page, 300_000);
      await page.evaluate(async () => {
        const c = (window as any).__vm.get(1);
        const snap = c.snapshot();
        const call = snap.transcript.find((r: any) => r.toolName === "delegate" && r.kind === "ToolResult");
        const childRoot = call && typeof call.output === "object" ? (call.output as any).child_root : null;
        if (childRoot && typeof c.attachRecordRoot === "function") await c.attachRecordRoot(childRoot);
      });
      await page.waitForTimeout(800);
    },
  },
  {
    name: "error",
    tolerance: 0.001,
    async drive(page) {
      const driver = await pickRealDriver();
      await page.goto(BASE_URL + "/?p=error&t=" + Date.now(), { waitUntil: "networkidle" });
      await waitForVm(page);
      await page.evaluate(async (drv) => {
        const vm = (window as any).__vm;
        const c = vm.get(1) ?? vm.spawn(1);
        await c.loadDriverRoster();
        c.pickDriver(drv);
        await c.openSession({ driver: drv });
      }, driver);
      const server = (globalThis as any).__pixelBaselineServer as ServerHandle | undefined;
      await page.evaluate(async () => {
        const c = (window as any).__vm.get(1);
        c.sendTurn("Please call bash with `sleep 30 && echo done`.").catch(() => undefined);
      });
      await page.waitForTimeout(500);
      if (server) await server.kill().catch(() => undefined);
      await page.waitForFunction(
        () => {
          const s = (window as any).__vm?.get(1)?.snapshot();
          return s?.parkReason != null || s?.lastError != null;
        },
        undefined,
        { timeout: 30_000 },
      ).catch(() => undefined);
      await page.waitForTimeout(600);
      if (server) {
        await server.start();
        await server.waitHealthy(10_000);
      }
    },
  },
];
