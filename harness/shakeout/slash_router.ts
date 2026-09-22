// Slash router with a real driver session in the loop. Some slashes
// need a session (/tools, /workspace, /isolate); others don't (/help,
// /model, /clear, /ls, /list, /name, /exit). Open one session with a
// real model, then walk every slash through submitLine.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import { pickRealDriver } from "./lib/driver";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

const SLASHES = [
  "/help",
  "/model deterministic",
  "/clear",
  "/ls",
  "/list",
  "/name shakeout-slash",
  "/tools bash",
  "/workspace .",
  "/isolate",
  "/exit",
];

export const flow: Flow = {
  name: "slash_router",
  declared: ["SLASH_ROUTED", "SLASH_UNKNOWN"],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    const driver = await pickRealDriver(BASE_URL);
    await controller.loadDriverRoster();
    controller.pickDriver(driver);
    await controller.openSession({ driver });

    for (const line of SLASHES) {
      try { await controller.submitLine(line); }
      catch { /* individual slash failures land as defects below */ }
    }
    await controller.submitLine("/unknownslashfoobar");

    const defects: Defect[] = [];
    const routedCmds = new Set(
      emitted.filter((e) => e.tag === "SLASH_ROUTED").map((e) => String(e.payload.cmd))
    );
    for (const line of SLASHES) {
      const cmd = line.slice(1).split(/\s/)[0];
      if (!routedCmds.has(cmd)) {
        defects.push({
          category: "slash_not_routed",
          observed: `${line} did not fire SLASH_ROUTED`,
          expected: `SLASH_ROUTED with cmd=${cmd}`,
          reproduces: true,
          severity: "medium",
        });
      }
    }
    const unknownCmds = emitted.filter((e) => e.tag === "SLASH_UNKNOWN").map((e) => String(e.payload.cmd));
    if (!unknownCmds.includes("unknownslashfoobar")) {
      defects.push({
        category: "unknown_slash_not_flagged",
        observed: "/unknownslashfoobar did not fire SLASH_UNKNOWN",
        expected: "SLASH_UNKNOWN with cmd=unknownslashfoobar",
        reproduces: true,
        severity: "medium",
      });
    }

    // Session may have been ended by /exit; if not, end it explicitly.
    if (controller.snapshot().sessionId) {
      await controller.endSession("shakeout_slash_done");
    }
    controller.disconnect();
    return { emitted, defects };
  },
};
