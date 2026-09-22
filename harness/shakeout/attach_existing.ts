// Attach existing against a real model. First controller opens the
// session and drives a real turn; second controller attaches by id
// and reads the replayed history.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import { pickRealDriver } from "./lib/driver";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

const PARK_TIMEOUT_MS = 60_000;

export const flow: Flow = {
  name: "attach_existing",
  declared: [
    "SESSION_ATTACH_STARTED",
    "STREAM_ATTACHED",
    "STREAM_ENVELOPE_APPENDED",
  ],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const driver = await pickRealDriver(BASE_URL);

    const openerClient = new NodeSubstrateClient(BASE_URL);
    const opener = new SessionController(openerClient);
    await opener.loadDriverRoster();
    await opener.openSession({ driver });
    const sessionId = opener.snapshot().sessionId;
    await opener.sendTurn("Reply with one short line — this is a replay fixture.");
    const openerDeadline = Date.now() + PARK_TIMEOUT_MS;
    while (Date.now() < openerDeadline) {
      if (opener.snapshot().parkReason) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    opener.disconnect();

    if (!sessionId) {
      return {
        emitted: [],
        defects: [{
          category: "no_session_to_attach",
          observed: "opener never got a session_id",
          expected: "openSession returns a session_id",
          reproduces: true,
          severity: "high",
        }],
      };
    }

    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    await controller.attachExisting(sessionId);
    // Let SSE replay history.
    await new Promise((r) => setTimeout(r, 2500));

    const defects: Defect[] = [];
    const appendCount = emitted.filter((e) => e.tag === "STREAM_ENVELOPE_APPENDED").length;
    if (appendCount < 3) {
      defects.push({
        category: "attach_replays_too_little",
        observed: `attachExisting appended ${appendCount} envelopes`,
        expected: "at least UserMessage + ModelReply + Park from the opener turn",
        reproduces: true,
        severity: "high",
      });
    }
    const kinds = new Set<string>();
    for (const e of emitted) {
      if (e.tag === "STREAM_ENVELOPE_APPENDED") kinds.add(String(e.payload.kind));
    }
    if (!kinds.has("UserMessage") || !kinds.has("ModelReply")) {
      defects.push({
        category: "attach_missing_kinds",
        observed: `replay kinds: ${Array.from(kinds).join(", ") || "(none)"}`,
        expected: "UserMessage and ModelReply both present in replay",
        reproduces: true,
        severity: "high",
      });
    }

    controller.disconnect();
    return { emitted, defects };
  },
};
