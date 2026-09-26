// CLI discovery flow. Reads /api/models, walks every entry the server
// reports under `cli` (i.e. every CLI adapter that resolved on this
// box via shutil.which), opens a session against each, sends one
// short turn, asserts a park, ends. One flow, N sub-runs — one per
// detected CLI. A box with only claude runs one sub-run; a box with
// claude+gemini+codex runs three. A box with none reports zero and
// passes (the roster is honest: nothing to test).
//
// This is the Sprint 084 companion to the sectioned driver picker.
// The dropdown IS the roster; the shakeout proves every entry in
// the CLI section actually drives a turn end-to-end.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

const PARK_TIMEOUT_MS = 60_000;

export const flow: Flow = {
  name: "cli_discovery",
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
    const emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];

    // Read the CLI list the server just probed.
    const res = await fetch(`${BASE_URL}/api/models`);
    const roster = (await res.json()) as { cli?: string[] };
    const cli = Array.isArray(roster.cli) ? roster.cli : [];

    if (cli.length === 0) {
      // No CLI on the box. Honest empty case — no defects, no emits.
      return { emitted, defects };
    }

    for (const driver of cli) {
      // Sprint 085a — probe the server's status endpoint. Not authed →
      // skip the turn drive and record an observation, not a defect.
      // A box with claude authed but codex/aider/cursor-agent/opencode
      // unauthed then reports honestly.
      try {
        const statusRes = await fetch(`${BASE_URL}/api/cli/${driver}/status`);
        const status = (await statusRes.json()) as { authed: boolean | null };
        if (status.authed === false) {
          // Legitimate skip. Emit a marker so the report shows it was seen.
          emitted.push({ tag: "DRIVER_ROSTER_LOADED", payload: { driver, skipped: "auth_required" } });
          continue;
        }
      } catch { /* status probe unreachable — try the turn anyway */ }
      const client = new NodeSubstrateClient(BASE_URL);
      const controller = new SessionController(client);
      controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));
      try {
        await controller.loadDriverRoster();
        controller.pickDriver(driver);
        await controller.openSession({ driver });
        await controller.sendTurn("Say hi in three words.");
        const deadline = Date.now() + PARK_TIMEOUT_MS;
        while (Date.now() < deadline) {
          if (controller.snapshot().parkReason) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        const snap = controller.snapshot();
        if (!snap.parkReason) {
          defects.push({
            category: "cli_no_park",
            observed: `driver ${driver} did not park within ${PARK_TIMEOUT_MS}ms`,
            expected: `every detected CLI drives one turn to Park`,
            reproduces: true,
            severity: "high",
          });
        }
        const modelRow = snap.transcript.find((r) => r.kind === "ModelReply");
        if (!modelRow || !modelRow.text || modelRow.text.length === 0) {
          defects.push({
            category: "cli_empty_reply",
            observed: `driver ${driver} returned no ModelReply text`,
            expected: `the CLI produced non-empty stdout`,
            reproduces: false,
            severity: "high",
          });
        }
        await controller.endSession("shakeout_done");
      } catch (err) {
        defects.push({
          category: "cli_drive_failed",
          observed: `driver ${driver}: ${err instanceof Error ? err.message : String(err)}`,
          expected: `session opens, turn sends, park lands`,
          reproduces: true,
          severity: "high",
        });
      } finally {
        controller.disconnect();
      }
    }
    return { emitted, defects };
  },
};
