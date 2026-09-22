// Stream drop and reconnect against a real model. Opens a session on the
// daily driver, submits a prompt that asks the model to take its time (a
// long turn is what makes the flow meaningful — the SSE has to have real
// in-flight envelopes when the server drops), then SIGTERMs the server
// mid-stream and restarts it. The socket close fires the client's onError
// handler; the controller fires STREAM_RECONNECTING; the 1s reconnect
// timer re-attaches once the server is back up; STREAM_ATTACHED fires a
// second time.
//
// Earlier revisions of this flow used SIGSTOP/SIGCONT. That leaves the
// TCP socket open with no data flowing; neither Node's http.get nor
// browser EventSource fires onError under that shape. Killing the
// process is the shape the reconnect code exists to handle.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL, ServerHandle } from "./lib/server";
import { pickRealDriver } from "./lib/driver";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

const TURN_KICKOFF_WAIT_MS = 2500;
const POST_RESTART_MS = 8000;
const END_TIMEOUT_MS = 30_000;

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

    // Kick off a turn asking for a long response so the SSE is carrying
    // real in-flight envelopes when we kill the server.
    void controller.sendTurn(
      "Please count from 1 to 25 slowly, one number per short line, with a brief pause between each."
    );
    // Give the model a moment to start streaming.
    await new Promise((r) => setTimeout(r, TURN_KICKOFF_WAIT_MS));

    // SIGKILL the server. A plain SIGTERM triggers the server's shutdown
    // handler which emits SessionEnded on the SSE — the client sees that
    // as a graceful end and forceClose fires, bypassing the reconnect
    // path. SIGKILL denies the shutdown handler its turn; the socket
    // RSTs; NodeSubstrateClient's response.on("error") fires;
    // handleStreamError emits STREAM_RECONNECTING and schedules the 1s
    // reconnect timer.
    await ctx.server.kill();
    // Restart so the reconnect can succeed.
    await ctx.server.start();
    await ctx.server.waitHealthy(5000);
    // Give the reconnect timer + re-attach a beat to complete.
    await new Promise((r) => setTimeout(r, POST_RESTART_MS));

    const defects: Defect[] = [];
    if (!emitted.some((e) => e.tag === "STREAM_RECONNECTING")) {
      defects.push({
        category: "reconnect_not_signaled",
        observed: "server restart did not fire STREAM_RECONNECTING",
        expected: "handleStreamError fires when the SSE socket closes",
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
