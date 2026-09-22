// Stream drop and reconnect against a real model. Opens a session on
// the daily driver, submits a prompt that asks the model to take its
// time (a long turn is what makes the flow meaningful — SIGSTOP has to
// interrupt something in flight), then freezes the server mid-stream
// and thaws it. Asserts STREAM_RECONNECTING fires and a second
// STREAM_ATTACHED fires on recovery.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import { pickRealDriver } from "./lib/driver";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

const FREEZE_MS = 3000;
const POST_THAW_MS = 8000;
const TURN_KICKOFF_WAIT_MS = 2500;
const END_TIMEOUT_MS = 30000;

export const flow: Flow = {
  name: "stream_reconnect",
  declared: ["STREAM_RECONNECTING", "STREAM_ATTACHED"],
  async run(ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    const driver = await pickRealDriver(BASE_URL);
    await controller.loadDriverRoster();
    controller.pickDriver(driver);
    await controller.openSession({ driver });

    // Kick off a turn asking for a long response, so the SSE has real
    // in-flight envelopes when SIGSTOP fires.
    void controller.sendTurn(
      "Please count from 1 to 25 slowly, one number per short line, with a brief pause between each."
    );
    // Give the model a moment to start streaming.
    await new Promise((r) => setTimeout(r, TURN_KICKOFF_WAIT_MS));

    ctx.server.freeze();
    await new Promise((r) => setTimeout(r, FREEZE_MS));
    ctx.server.thaw();
    await new Promise((r) => setTimeout(r, POST_THAW_MS));

    const defects: Defect[] = [];
    if (!emitted.some((e) => e.tag === "STREAM_RECONNECTING")) {
      defects.push({
        category: "reconnect_not_signaled",
        observed: "SIGSTOP + wait did not fire STREAM_RECONNECTING",
        expected: "controller's error handler fires STREAM_RECONNECTING while frozen",
        reproduces: true,
        severity: "high",
      });
    }
    const attaches = emitted.filter((e) => e.tag === "STREAM_ATTACHED").length;
    if (attaches < 2) {
      defects.push({
        category: "reconnect_no_reattach",
        observed: `only ${attaches} STREAM_ATTACHED fired`,
        expected: "at least two — one at open, one on recovery",
        reproduces: true,
        severity: "high",
      });
    }

    // End the session; a stuck sendTurn should not block cleanup.
    try { await controller.endSession("shakeout_reconnect_done"); }
    catch { /* endSession refuses if the turn is still queued; that's fine */ }
    const endDeadline = Date.now() + END_TIMEOUT_MS;
    while (Date.now() < endDeadline) {
      if (controller.snapshot().sessionId === null) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    controller.disconnect();
    return { emitted, defects };
  },
};
