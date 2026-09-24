// harness/_electron_spike.ts
//
// Sprint 077 spike. Proves Phase 9's core assumption: Playwright's
// _electron.launch can drive an Electron app that spawns and manages
// its own subprocess, and clean-kill the whole process group on
// window-close.
//
// If this passes, Sprint 078 rewrites electron/main.js against the
// real substrate server on the same shape. If it fails, Phase 9 stops
// here for a re-plan — there is no SUBSTRATE_UI_SKIP_SPAWN fallback.

import { _electron as electron } from "playwright";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function psAlive(pid: number): boolean {
  const r = spawnSync("ps", ["-p", String(pid)], { encoding: "utf8" });
  return r.status === 0 && r.stdout.split("\n").length > 2;
}

async function main(): Promise<void> {
  const appDir = join(__dirname, "electron_spike");
  console.log("[spike] launching", appDir);

  const stdoutBuf: string[] = [];
  const app = await electron.launch({
    args: [appDir],
    timeout: 20_000,
  });

  // Read the app's main-process stdout so we can capture the child PID.
  app.process().stdout?.on("data", (chunk) => stdoutBuf.push(chunk.toString()));

  const win = await app.firstWindow();
  await win.waitForLoadState("domcontentloaded");
  const bodyText = (await win.locator("body").textContent()) ?? "";
  console.log("[spike] body:", bodyText.slice(0, 60));
  if (!bodyText.includes("Electron spike window")) {
    throw new Error(`body content mismatch: "${bodyText.slice(0, 100)}"`);
  }

  // Wait up to 3s for the "spike child_pid=<n>" line the app prints.
  const deadline = Date.now() + 3000;
  let childPid: number | null = null;
  while (Date.now() < deadline && childPid === null) {
    const match = stdoutBuf.join("").match(/spike child_pid=(\d+)/);
    if (match) childPid = Number(match[1]);
    else await new Promise((r) => setTimeout(r, 100));
  }
  if (childPid === null) throw new Error("did not observe child pid on stdout");
  console.log("[spike] child pid:", childPid);

  if (!psAlive(childPid)) throw new Error(`child ${childPid} not visible via ps immediately after launch`);
  console.log("[spike] child pid visible via ps: ok");

  await win.close();
  await app.close();

  // Give the SIGTERM up to 4s to bring the child down.
  const killDeadline = Date.now() + 4000;
  while (Date.now() < killDeadline && psAlive(childPid)) {
    await new Promise((r) => setTimeout(r, 100));
  }
  if (psAlive(childPid)) throw new Error(`child ${childPid} still alive 4s after app close — orphan`);
  console.log("[spike] child pid dead after app close: ok");

  console.log("[spike] PASS");
}

main().catch((err) => {
  console.error("[spike] FAIL:", err);
  process.exit(1);
});
