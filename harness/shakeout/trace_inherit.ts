// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A test server started from a session keeps to its own record (sprint 487). A session's `bash`
// inherits the running app's backend environment, which names that launch's trace folder, boot id
// and pid (SUBSTRATE_TRACE_DIR, SUBSTRATE_BOOT_ID, SUBSTRATE_PARENT_PID). Before this sprint the
// harness server passed them on, and a vm_smoke run from a session appended its records to the
// running app's server.jsonl under the running app's boot id (measured 2026-11-11: 6 records,
// SERVER_STARTED at proc_seq 0). These agree:
//   ran     — with the three set as a session passes them, the harness server opens a session,
//             runs one turn on the deterministic driver to its park, and ends it;
//   nothing — the folder SUBSTRATE_TRACE_DIR names holds no server.jsonl afterwards.
// SHAKEOUT_APP=<Substrate.app> runs the bundle's interpreter and server.py.

import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { scratchDir } from "./lib/scratch";

async function main(): Promise<void> {
  const traceDir = scratchDir("trace-inherit-");
  mkdirSync(traceDir, { recursive: true });
  // As the running app's backend passes them to a session's bash (electron/main.ts, the spawn env).
  process.env.SUBSTRATE_TRACE_DIR = traceDir;
  process.env.SUBSTRATE_BOOT_ID = "running-app-boot";
  process.env.SUBSTRATE_PARENT_PID = String(process.pid);
  // Imported after the environment is set, as a session's process would have it from the start.
  const srv = await import("./lib/server");
  const server = new srv.ServerHandle();
  let status = 1;
  try {
    await server.start();
    // BASE_URL is a live binding, set by start() (lib/server.ts).
    const controller = new SessionController(new NodeSubstrateClient(srv.BASE_URL));
    await controller.loadDriverRoster();
    await controller.openSession({ driver: "deterministic" });
    const sid = controller.snapshot().sessionId;
    if (!sid) throw new Error("no session opened");
    await controller.sendTurn("hello from inside a session");
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline && !controller.snapshot().parkReason) await new Promise((r) => setTimeout(r, 100));
    if (!controller.snapshot().parkReason) throw new Error("the turn did not park within 15 s");
    await controller.endSession("trace_inherit_done");
    controller.disconnect();
    await server.stop();
    const leaked = join(traceDir, "server.jsonl");
    if (existsSync(leaked)) {
      const rows = readFileSync(leaked, "utf8").split("\n").filter(Boolean);
      const boots = new Set(rows.map((r) => (JSON.parse(r) as { boot_id?: string }).boot_id));
      throw new Error(`${rows.length} records written into the inherited trace folder (boot ids ${[...boots].join(", ")})`);
    }
    console.log(`trace_inherit: ok — session ${sid} ran one turn to its park; the inherited trace folder holds no server.jsonl; packaged=${String(!!process.env.SHAKEOUT_APP)}`);
    status = 0;
  } catch (e) {
    console.error(`trace_inherit: FAIL — ${(e as Error).message}`);
  } finally {
    await server.stop().catch(() => undefined);
    rmSync(traceDir, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
