// Electron deep-link flow. Two paths:
//   Warm — after the window is up, emit open-url from main; the renderer receives it through
//   window.native.onDeepLink.
//   Cold — emit open-url before the window exists; main logs "flushing <N> buffered deep-link(s)"
//   once the renderer loads.
// No controller tags are declared: a deep link drives the shell, not a session.

import { _electron as electron } from "playwright";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";
import { launchArgs, waitForApp } from "./lib/electron";

const TEST_URL = "substrate://record/shakeout-deadbeef";

async function until(cond: () => boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (cond()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return cond();
}

export const flow: Flow = {
  name: "electron_deeplink",
  declared: [],
  async run(_ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const defects: Defect[] = [];

    {
      const launch = launchArgs();
      const app = await electron.launch({ ...launch.options, timeout: 30_000 });
      try {
        const win = await app.firstWindow({ timeout: 20_000 });
        await waitForApp(win);
        await win.evaluate(() => {
          (window as unknown as { __deepLinks: string[] }).__deepLinks = [];
          const nb = (window as unknown as { native?: { onDeepLink?: (cb: (u: string) => void) => void } }).native;
          if (!nb?.onDeepLink) throw new Error("window.native.onDeepLink is missing");
          nb.onDeepLink((u) => (window as unknown as { __deepLinks: string[] }).__deepLinks.push(u));
        });
        await app.evaluate((m, u) => m.app.emit("open-url", { preventDefault: Boolean }, u), TEST_URL);
        await win.waitForFunction(
          (u) => ((window as unknown as { __deepLinks: string[] }).__deepLinks || []).includes(u),
          TEST_URL,
          { timeout: 5_000 },
        ).catch(() => { throw new Error("warm: renderer did not receive deep-link " + TEST_URL); });
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

    {
      const launch = launchArgs();
      const app = await electron.launch({ ...launch.options, timeout: 30_000 });
      const stderrBuf: string[] = [];
      app.process().stderr?.on("data", (c) => stderrBuf.push(c.toString()));
      try {
        await app.evaluate((m, u) => m.app.emit("open-url", { preventDefault: Boolean }, u), TEST_URL);
        const win = await app.firstWindow({ timeout: 20_000 });
        await waitForApp(win);
        const flushed = () => {
          const m = stderrBuf.join("").match(/flushing (\d+) buffered deep-link/);
          return !!m && Number(m[1]) >= 1;
        };
        if (!(await until(flushed, 10_000))) throw new Error("cold: main-side buffered-flush log line not observed");
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

    return { emitted: [], defects };
  },
};
