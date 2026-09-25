// Electron smoke flow. Launches `electron .` via Playwright's
// _electron.launch, waits for the reveal shell's atom transcript
// mount to appear, drives one deterministic turn through the
// controller, asserts snapshot().parkReason non-null, closes.
//
// The passed FlowContext.server (from the shakeout runner) is
// unused — this flow spawns its own substrate server inside the
// Electron main process, on an ephemeral port. The shakeout's
// 8765 server keeps running alongside, harmless.

import { _electron as electron } from "playwright";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

const REPO_ROOT = join(__dirname, "..", "..");

// Each Electron launch gets its own userData dir. Electron's
// single-instance lock (electron/main.js Sprint 081) keys on the
// userData path — a fresh dir per launch means concurrent
// invocations coexist. Removes the collision when the shakeout
// runs alongside a dev-launched `npm run electron` or when several
// AXIS_C flows run back-to-back and the OS hasn't released the
// lock yet.
export function launchArgs(): { args: string[]; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "electron-shakeout-"));
  return {
    args: [REPO_ROOT, "--user-data-dir=" + dir],
    cleanup: () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) { /* best-effort */ } },
  };
}

export const flow: Flow = {
  name: "electron_smoke",
  declared: [
    "SESSION_OPEN_REQUESTED",
    "SESSION_OPEN_ACKED",
    "TURN_SUBMITTED",
    "STREAM_ENVELOPE_APPENDED",
    "TURN_PARKED",
  ],
  async run(_ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];
    const launch = launchArgs();
    const app = await electron.launch({ args: launch.args, timeout: 30_000 });
    try {
      const win = await app.firstWindow({ timeout: 20_000 });
      await win.waitForFunction(
        () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
        undefined,
        { timeout: 15_000 },
      );
      await win.evaluate(async () => {
        const vm = (window as unknown as { __vm: { get(id: number): unknown; spawn(id: number): unknown } }).__vm;
        const c = (vm.get(1) ?? vm.spawn(1)) as { loadDriverRoster: () => Promise<void>; pickDriver: (n: string) => void; openSession: (o: { driver: string }) => Promise<void>; sendTurn: (t: string) => Promise<void> };
        await c.loadDriverRoster();
        c.pickDriver("deterministic");
        await c.openSession({ driver: "deterministic" });
        await c.sendTurn("hello");
      });
      await win.waitForFunction(
        () => (window as unknown as { __vm?: { get(id: number): { snapshot(): { parkReason?: unknown } } | null } }).__vm?.get(1)?.snapshot().parkReason != null,
        undefined,
        { timeout: 30_000 },
      );
      emitted.push({ tag: "SESSION_OPEN_REQUESTED", payload: {} });
      emitted.push({ tag: "SESSION_OPEN_ACKED", payload: {} });
      emitted.push({ tag: "TURN_SUBMITTED", payload: {} });
      emitted.push({ tag: "STREAM_ENVELOPE_APPENDED", payload: {} });
      emitted.push({ tag: "TURN_PARKED", payload: {} });
    } catch (err) {
      defects.push({
        category: "electron_smoke_failed",
        observed: err instanceof Error ? err.message : String(err),
        expected: "Electron window mounts and one deterministic turn parks",
        reproduces: true,
        severity: "high",
      });
    } finally {
      await app.close().catch(() => undefined);
      launch.cleanup();
    }
    return { emitted, defects };
  },
};
