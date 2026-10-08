// harness/_electron_sprint079_exit.ts
//
// Sprint 079 exit test. Launches two Electron app instances back
// to back and asserts each spawns its own substrate server on its
// own ephemeral port. Confirms the --port 0 + readback contract.

import { _electron as electron, type ElectronApplication } from "playwright";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function listenerPorts(): number[] {
  // Query every LISTEN socket for our current uid, then pick the ones
  // in the ephemeral range that a fresh server.py could have picked.
  const r = spawnSync("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN", "-Fn"], { encoding: "utf8" });
  if (r.status !== 0) return [];
  const ports: number[] = [];
  for (const line of r.stdout.split("\n")) {
    const m = line.match(/:(\d+)$/);
    if (m) ports.push(Number(m[1]));
  }
  return ports;
}

async function launchAndGetPort(label: string, apps: ElectronApplication[]): Promise<number> {
  const repoRoot = join(__dirname, "..");
  console.log(`[${label}] launching`);
  const app = await electron.launch({ args: [repoRoot], timeout: 30_000 });
  apps.push(app);
  const bufs: string[] = [];
  app.process().stderr?.on("data", (c) => bufs.push(c.toString()));

  // Wait for the [electron] log line: "server bound port=<n>"
  const deadline = Date.now() + 20_000;
  let port: number | null = null;
  while (Date.now() < deadline && port === null) {
    const match = bufs.join("").match(/server bound port=(\d+)/);
    if (match) port = Number(match[1]);
    else await new Promise((r) => setTimeout(r, 100));
  }
  if (port === null) throw new Error(`[${label}] did not observe "server bound port=<n>" within 20s`);

  const win = await app.firstWindow({ timeout: 20_000 });
  await win.waitForFunction(
    () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
    undefined,
    { timeout: 15_000 },
  );
  console.log(`[${label}] port=${port}, window mounted`);
  return port;
}

async function main(): Promise<void> {
  const apps: ElectronApplication[] = [];
  try {
    const p1 = await launchAndGetPort("app1", apps);
    const p2 = await launchAndGetPort("app2", apps);
    if (p1 === p2) throw new Error(`ports collided: p1=${p1} p2=${p2}`);
    const listening = new Set(listenerPorts());
    if (!listening.has(p1)) throw new Error(`p1=${p1} not visible via lsof`);
    if (!listening.has(p2)) throw new Error(`p2=${p2} not visible via lsof`);
    console.log(`[exit] two independent servers: ${p1} and ${p2}`);
  } finally {
    for (const app of apps) {
      try { await app.close(); } catch (_) { /* ignore */ }
    }
  }
  console.log("[exit] PASS");
}

main().catch((err) => {
  console.error("[exit] FAIL:", err);
  process.exit(1);
});
