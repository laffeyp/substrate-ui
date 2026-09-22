// Refused open: stop the server, try to open a session, watch for
// SESSION_OPEN_REFUSED with a non-empty failure_class and detail.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL, ServerHandle } from "./lib/server";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

export const flow: Flow = {
  name: "refused_open",
  declared: ["SESSION_OPEN_REQUESTED", "SESSION_OPEN_REFUSED"],
  async run(ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    await ctx.server.stop();
    let refusalPayload: Record<string, unknown> | undefined;
    try {
      await controller.openSession({ driver: "deterministic" });
    } catch {
      // openSession may propagate; the refusal tag should still land in emitted.
    }
    refusalPayload = emitted.find((e) => e.tag === "SESSION_OPEN_REFUSED")?.payload;

    await ctx.server.start();
    await ctx.server.waitHealthy(5000);

    const defects: Defect[] = [];
    if (!refusalPayload) {
      defects.push({
        category: "refusal_not_emitted",
        observed: "openSession against dead server did not fire SESSION_OPEN_REFUSED",
        expected: "SESSION_OPEN_REFUSED with failure_class + detail",
        reproduces: true,
        severity: "high",
      });
    } else {
      if (!refusalPayload.failure_class || String(refusalPayload.failure_class).length === 0) {
        defects.push({
          category: "refusal_empty_failure_class",
          observed: "SESSION_OPEN_REFUSED.failure_class is missing or empty",
          expected: "non-empty string",
          reproduces: true,
          severity: "medium",
        });
      }
      if (!refusalPayload.detail || String(refusalPayload.detail).length === 0) {
        defects.push({
          category: "refusal_empty_detail",
          observed: "SESSION_OPEN_REFUSED.detail is missing or empty",
          expected: "non-empty string",
          reproduces: true,
          severity: "low",
        });
      }
    }

    controller.disconnect();
    return { emitted, defects };
  },
};
