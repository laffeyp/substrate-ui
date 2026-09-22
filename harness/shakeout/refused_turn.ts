// Refused turn: open a session, stop the server, sendTurn. The
// controller sees a network failure and fires TURN_REFUSED. Restart
// the server on exit so downstream flows have a live one.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL, ServerHandle } from "./lib/server";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

export const flow: Flow = {
  name: "refused_turn",
  declared: ["TURN_SUBMITTED", "TURN_REFUSED"],
  async run(ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    await controller.loadDriverRoster();
    await controller.openSession({ driver: "deterministic" });

    // Kill the server while the session is still open on the client
    // side. The next sendTurn hits a dead server; the fetch fails;
    // the controller fires TURN_REFUSED with failure_class=network.
    await ctx.server.stop();
    try { await controller.sendTurn("hello — network is down"); } catch { /* refusal lands as an emit */ }

    await ctx.server.start();
    await ctx.server.waitHealthy(5000);

    const defects: Defect[] = [];
    const refused = emitted.find((e) => e.tag === "TURN_REFUSED");
    if (!refused) {
      defects.push({
        category: "refused_turn_not_emitted",
        observed: "sendTurn against dead server did not fire TURN_REFUSED",
        expected: "TURN_REFUSED with failure_class + detail",
        reproduces: true,
        severity: "high",
      });
    } else {
      if (!refused.payload.failure_class || String(refused.payload.failure_class).length === 0) {
        defects.push({
          category: "refused_turn_empty_failure_class",
          observed: "TURN_REFUSED.failure_class missing or empty",
          expected: "non-empty string, likely 'network'",
          reproduces: true,
          severity: "medium",
        });
      }
    }

    controller.disconnect();
    return { emitted, defects };
  },
};
