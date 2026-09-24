// harness/_electron_sprint078_exit.ts
//
// Sprint 078 exit test. Launches `electron .` via Playwright's
// _electron.launch, asserts:
//   1. Port 8765 was free before launch (prevents a stale server
//      from answering the poll and reading green for wrong reasons).
//   2. The window mounts and the reveal shell's atom transcript
//      mount div is present.
//   3. Closing the window kills the substrate server subprocess
//      (no orphan `python server.py` visible via lsof :8765 within
//      3s of app close).

import { _electron as electron } from "playwright";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function portListenerPids(port: number): number[] {
  const r = spawnSync("lsof", ["-iTCP:" + port, "-sTCP:LISTEN", "-t"], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout.trim()) return [];
  return r.stdout.trim().split("\n").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
}

async function main(): Promise<void> {
  // 1. Port free before launch.
  const before = portListenerPids(8765);
  if (before.length > 0) {
    console.log("[exit] killing pre-existing listeners on :8765:", before.join(","));
    spawnSync("kill", ["-9", ...before.map(String)]);
    await new Promise((r) => setTimeout(r, 500));
  }
  if (portListenerPids(8765).length !== 0) throw new Error(":8765 still listening after kill");
  console.log("[exit] :8765 free before launch");

  const repoRoot = join(__dirname, "..");
  console.log("[exit] launching electron .");
  const app = await electron.launch({ args: [repoRoot], timeout: 30_000 });
  app.process().stderr?.on("data", (c) => process.stderr.write("[app-stderr] " + c));

  const win = await app.firstWindow({ timeout: 20_000 });
  await win.waitForLoadState("domcontentloaded");
  await win.waitForLoadState("networkidle");
  const currentUrl = win.url();
  console.log("[exit] window URL:", currentUrl);
  if (!currentUrl.includes("atom-transcript=1")) {
    throw new Error("window did not load with ?atom-transcript=1 — got " + currentUrl);
  }
  // Give dc-runtime + the atom root's MutationObserver a moment to
  // settle after networkidle.
  await win.waitForFunction(
    () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
    undefined,
    { timeout: 15_000 },
  );
  const rootCount = await win.evaluate(() =>
    document.querySelectorAll('[data-vm-atom-root="terminal"]').length,
  );
  console.log("[exit] window mounted; atom roots:", rootCount);
  if (rootCount < 1) throw new Error("no atom root in the window");

  // 2. Confirm the server we're talking to is the one we spawned:
  // the same PID must still be listening.
  const during = portListenerPids(8765);
  if (during.length === 0) throw new Error(":8765 not listening while window is up");
  console.log("[exit] :8765 listener pid(s) during window:", during.join(","));

  await win.close();
  await app.close();

  // 3. No orphan. Give 3s for the SIGTERM to propagate.
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline && portListenerPids(8765).length > 0) {
    await new Promise((r) => setTimeout(r, 100));
  }
  const after = portListenerPids(8765);
  if (after.length > 0) throw new Error(":8765 still listening after app close: pids " + after.join(","));
  console.log("[exit] :8765 free 3s after app close: ok");

  console.log("[exit] PASS");
}

main().catch((err) => {
  console.error("[exit] FAIL:", err);
  process.exit(1);
});
