// Chat one turn against a real model. Opens a session on the server's
// declared default driver, submits a prompt, waits for Park, ends.
// Watches for transcript misrender, [object Object] tool cards,
// empty replies.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import { pickRealDriver } from "./lib/driver";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

const PARK_TIMEOUT_MS = 60_000;

export const flow: Flow = {
  name: "chat_one_turn",
  declared: [
    "DRIVER_ROSTER_LOADED",
    "DRIVER_PICKED",
    "SESSION_OPEN_REQUESTED",
    "SESSION_OPEN_ACKED",
    "STREAM_ATTACHED",
    "TURN_SUBMITTED",
    "TURN_ACK",
    "STREAM_ENVELOPE_APPENDED",
    "TURN_PARKED",
    "SESSION_END_REQUESTED",
    "SESSION_ENDED_LOCAL",
    "STREAM_CLOSED",
  ],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    const driver = await pickRealDriver(BASE_URL);
    await controller.loadDriverRoster();
    controller.pickDriver(driver);

    await controller.openSession({ driver });
    await controller.sendTurn("Say hello in one short sentence, please.");

    const deadline = Date.now() + PARK_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (controller.snapshot().parkReason) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    const afterTurn = controller.snapshot();
    const defects: Defect[] = [];
    if (!afterTurn.parkReason) {
      defects.push({
        category: "no_park_within_deadline",
        observed: `no Park envelope after ${PARK_TIMEOUT_MS}ms on driver ${driver}`,
        expected: `TURN_PARKED fires with a park_reason`,
        reproduces: true,
        severity: "medium",
      });
    }
    const modelRow = afterTurn.transcript.find((r) => r.kind === "ModelReply");
    if (!modelRow || !modelRow.text || modelRow.text.length === 0) {
      defects.push({
        category: "empty_model_reply",
        observed: modelRow ? "ModelReply row has empty text" : "no ModelReply row",
        expected: "a non-empty reply row from the model",
        reproduces: false,
        severity: "medium",
      });
    }
    // Any transcript row that stringifies as "[object Object]" is the
    // classic UI-side render defect from finding 40.
    for (const row of afterTurn.transcript) {
      const s = typeof (row as unknown as { text?: unknown }).text === "string" ? (row as { text: string }).text : "";
      if (s.includes("[object Object]")) {
        defects.push({
          category: "object_object_transcript",
          observed: `transcript row rendered "[object Object]"`,
          expected: "the row's structured output rendered as text",
          reproduces: false,
          severity: "high",
        });
      }
    }

    await controller.endSession("shakeout_done");
    const endDeadline = Date.now() + 5000;
    while (Date.now() < endDeadline) {
      if (controller.snapshot().sessionId === null) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    controller.disconnect();
    return { emitted, defects };
  },
};
