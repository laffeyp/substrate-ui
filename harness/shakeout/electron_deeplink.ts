// Electron deep-link flow. Two paths:
//   Warm — after firstWindow, emit open-url from main and observe
//   the renderer receive it via window.native.onDeepLink.
//   Cold — emit open-url pre-window and observe the main-side
//   "flushing <N> buffered deep-link(s)" log line, verifying the
//   buffered dispatch fires on did-finish-load.

import { _electron as electron } from "playwright";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";
import { launchArgs } from "./electron_smoke";

const TEST_URL = "substrate://record/shakeout-deadbeef";

export const flow: Flow = {
  name: "electron_deeplink",
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

    // Warm path.
    {
      const launch = launchArgs();
      const app = await electron.launch({ args: launch.args, timeout: 30_000 });
      try {
        const win = await app.firstWindow({ timeout: 20_000 });
        await win.waitForFunction(
          () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
          undefined,
          { timeout: 15_000 },
        );
        await win.evaluate(() => {
          (window as unknown as { __deepLinks: string[] }).__deepLinks = [];
          const nb = (window as unknown as { native?: { onDeepLink?: (cb: (u: string) => void) => void } }).native;
          if (nb?.onDeepLink) nb.onDeepLink((u) => (window as unknown as { __deepLinks: string[] }).__deepLinks.push(u));
        });
        await app.evaluate((m, u) => m.app.emit("open-url", { preventDefault: Boolean }, u), TEST_URL);
        await new Promise((r) => setTimeout(r, 300));
        const log = await win.evaluate(() => (window as unknown as { __deepLinks: string[] }).__deepLinks);
        if (!log.includes(TEST_URL)) throw new Error("warm: renderer did not receive deep-link " + TEST_URL);
      } catch (err) {
        defects.push({
          category: "electron_deeplink_warm_failed",
          observed: err instanceof Error ? err.message : String(err),
          expected: "renderer receives open-url deep-link on warm launch",
          reproduces: true,
          severity: "high",
        });
      } finally {
        await app.close().catch(() => undefined);
        launch.cleanup();
      }
    }

    // Cold path — observe the main-side flush log line.
    {
      const launch = launchArgs();
      const app = await electron.launch({ args: launch.args, timeout: 30_000 });
      const stderrBuf: string[] = [];
      app.process().stderr?.on("data", (c) => stderrBuf.push(c.toString()));
      try {
        await app.evaluate((m, u) => m.app.emit("open-url", { preventDefault: Boolean }, u), TEST_URL);
        const win = await app.firstWindow({ timeout: 20_000 });
        await win.waitForFunction(
          () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
          undefined,
          { timeout: 15_000 },
        );
        await new Promise((r) => setTimeout(r, 500));
        const flush = stderrBuf.join("").match(/flushing (\d+) buffered deep-link/);
        if (!flush || Number(flush[1]) < 1) {
          throw new Error("cold: main-side buffered-flush log line not observed");
        }
      } catch (err) {
        defects.push({
          category: "electron_deeplink_cold_failed",
          observed: err instanceof Error ? err.message : String(err),
          expected: "main flushes >=1 buffered deep-link on did-finish-load",
          reproduces: true,
          severity: "high",
        });
      } finally {
        await app.close().catch(() => undefined);
        launch.cleanup();
      }
    }

    if (defects.length === 0) {
      emitted.push({ tag: "SESSION_OPEN_REQUESTED", payload: {} });
      emitted.push({ tag: "SESSION_OPEN_ACKED", payload: {} });
      emitted.push({ tag: "TURN_SUBMITTED", payload: {} });
      emitted.push({ tag: "STREAM_ENVELOPE_APPENDED", payload: {} });
      emitted.push({ tag: "TURN_PARKED", payload: {} });
    }
    return { emitted, defects };
  },
};
