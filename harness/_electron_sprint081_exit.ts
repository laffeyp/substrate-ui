// harness/_electron_sprint081_exit.ts
//
// Sprint 081 exit test. Two paths:
//   1. Warm launch — fire open-url after the window is up; assert
//      the renderer receives the deep-link event.
//   2. Cold launch → deep-link before did-finish-load — fire
//      open-url immediately after the app becomes ready; assert
//      the buffered-pending dispatch flushes on renderer load
//      (matches the pattern reused from
//      _deprecated/electron-bridge-2026-09-12/main.js:51-72).

import { _electron as electron } from "playwright";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function freePort(port: number): void {
  const r = spawnSync("lsof", ["-iTCP:" + port, "-sTCP:LISTEN", "-t"], { encoding: "utf8" });
  const pids = r.status === 0 && r.stdout.trim()
    ? r.stdout.trim().split("\n").map((s) => Number(s.trim())).filter(Number.isFinite)
    : [];
  if (pids.length > 0) spawnSync("kill", ["-9", ...pids.map(String)]);
}

const TEST_URL = "substrate://record/deadbeefcafe";

async function main(): Promise<void> {
  freePort(8765);
  const repoRoot = join(__dirname, "..");

  console.log("[exit] launching electron .");
  const app = await electron.launch({ args: [repoRoot], timeout: 30_000 });
  const stderr: string[] = [];
  app.process().stderr?.on("data", (c) => stderr.push(c.toString()));

  const win = await app.firstWindow({ timeout: 20_000 });
  await win.waitForFunction(
    () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
    undefined,
    { timeout: 15_000 },
  );

  // Install a deep-link recorder in the renderer.
  await win.evaluate(() => {
    (window as unknown as { __deepLinks: string[] }).__deepLinks = [];
    const nb = (window as unknown as { native?: { onDeepLink?: (cb: (u: string) => void) => void } }).native;
    if (nb?.onDeepLink) nb.onDeepLink((u) => (window as unknown as { __deepLinks: string[] }).__deepLinks.push(u));
  });

  // Warm path — emit open-url from main. Written as a plain arrow
  // without destructuring or TS-only syntax so tsx does not inject
  // a __name helper that fails inside Electron's utility script.
  await app.evaluate((m, u) => m.app.emit("open-url", { preventDefault: Boolean }, u), TEST_URL);
  await new Promise((r) => setTimeout(r, 300));

  const warmLog = await win.evaluate(() => (window as unknown as { __deepLinks: string[] }).__deepLinks);
  console.log("[exit] warm deep-link log:", warmLog);
  if (!warmLog.includes(TEST_URL)) throw new Error("warm path: renderer did not receive deep-link " + TEST_URL);

  await app.close();

  // Cold path — launch again and emit open-url before the first
  // window fires did-finish-load. The buffered-pending dispatch
  // in electron/main.js should flush the URL to the renderer on
  // did-finish-load.
  console.log("[exit] cold launch — emit open-url pre-ready");
  const app2 = await electron.launch({ args: [repoRoot], timeout: 30_000 });
  const stderr2: string[] = [];
  app2.process().stderr?.on("data", (c) => stderr2.push(c.toString()));

  // Fire open-url as soon as the app is ready, before firstWindow
  // returns. The main handler queues it into pendingDeepLinks.
  await app2.evaluate((m, u) => m.app.emit("open-url", { preventDefault: Boolean }, u), TEST_URL);

  const win2 = await app2.firstWindow({ timeout: 20_000 });
  await win2.waitForFunction(
    () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
    undefined,
    { timeout: 15_000 },
  );
  // The renderer's __deepLinks recorder can't be installed before
  // did-finish-load fires — the app's own listener flushes the
  // buffered URL to the renderer at that moment. Assert instead
  // on the main-side log line the flush emits. It appears in
  // stderr as "[electron] flushing <N> buffered deep-link(s)".
  await new Promise((r) => setTimeout(r, 500));

  const flushLine = stderr2.join("").match(/flushing (\d+) buffered deep-link/);
  console.log("[exit] flush log line:", flushLine ? flushLine[0] : "(not found)");
  if (!flushLine || Number(flushLine[1]) < 1) {
    throw new Error("cold path: did not observe main-side buffered-flush log line");
  }

  await app2.close();
  console.log("[exit] PASS");
}

main().catch((err) => {
  console.error("[exit] FAIL:", err);
  process.exit(1);
});
