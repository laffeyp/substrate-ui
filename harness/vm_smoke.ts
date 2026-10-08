// harness/vm_smoke.ts — drives web/vm/SessionController against a real server.
//
// Verifies the Presentation Model does what its public API says without any
// shell in the loop. Runs in Node (fetch + a tiny SSE reader over http).
// Starts its own server (lib/server.ts: ephemeral port, scratch SUBSTRATE_HOME);
// SUBSTRATE_UI_BASE points it at a running one instead.
//
// Pass path: driver roster non-empty, session opens on deterministic, the
// envelope stream carries UserMessage, ModelReply and Park, the slash commands
// act, and endSession leaves the session ended on the server.

import { SessionController } from "../web/vm/session_controller";
import { NodeSubstrateClient } from "./shakeout/lib/client";
import { BASE_URL, ServerHandle } from "./shakeout/lib/server";

async function main() {
  const own = process.env.SUBSTRATE_UI_BASE ? null : new ServerHandle();
  if (own) await own.start();
  try { await smoke(process.env.SUBSTRATE_UI_BASE || BASE_URL); }
  finally { if (own) await own.stop(); }
}

async function smoke(BASE: string) {
  const client = new NodeSubstrateClient(BASE);
  const controller = new SessionController(client);

  let steps = 0; let failed: string | null = null;
  function step(name: string, ok: boolean, detail?: string) {
    steps++;
    const mark = ok ? "ok" : "FAIL";
    console.log(`  · ${name} … ${mark}${detail ? " — " + detail : ""}`);
    if (!ok && !failed) failed = `${name}: ${detail || "assertion failed"}`;
  }

  // Subscribe to events BEFORE the first loader fires so
  // DRIVER_ROSTER_LOADED lands in the tape.
  const emittedTags: string[] = [];
  controller.onEvent((ev) => { emittedTags.push(ev.tag); });

  await controller.loadDriverRoster();
  const rosterSnap = controller.snapshot();
  step("driver roster loads", rosterSnap.driverRoster.length > 0,
    `${rosterSnap.driverRoster.length} entries, default ${rosterSnap.driverDefault}`);

  await controller.openSession({ driver: "deterministic" });
  const openSnap = controller.snapshot();
  step("session opens on deterministic", !!openSnap.sessionId && openSnap.driver === "deterministic",
    openSnap.sessionId || "no session_id");

  await controller.sendTurn("hello substrate — smoke test");

  const parkDeadline = Date.now() + 15000;
  while (Date.now() < parkDeadline) {
    if (controller.snapshot().parkReason) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const afterTurn = controller.snapshot();
  step("transcript grows past the local echo", afterTurn.transcript.length >= 2,
    `${afterTurn.transcript.length} rows`);
  const envKinds = new Set(afterTurn.rawEnvelopes.map((e) => e.kind));
  step("UserMessage, ModelReply, Park envelopes on the stream", ["UserMessage", "ModelReply", "Park"].every((k) => envKinds.has(k)),
    `saw ${Array.from(envKinds).join(", ")}`);
  step("park reason recorded", !!afterTurn.parkReason, afterTurn.parkReason || "(none)");

  // Slash commands routed through submitLine.
  await controller.submitLine("/help");
  const helpSnap = controller.snapshot();
  const helpRow = helpSnap.transcript.find(r => r.text.startsWith("slash commands:"));
  step("/help renders a slash-command listing", !!helpRow, helpRow?.text?.slice(0, 60) ?? "(no help row)");

  await controller.submitLine("/model deterministic");
  const modelSnap = controller.snapshot();
  step("/model sets driver", modelSnap.driver === "deterministic", modelSnap.driver ?? "(none)");

  await controller.submitLine("/ls");
  const lsSnap = controller.snapshot();
  const lsRow = lsSnap.transcript.find(r => r.kind === "SlashListed");
  step("/ls appends a transcript row from loadLiveSessions", !!lsRow, lsRow?.text?.slice(0, 60) ?? "(no /ls row)");

  await controller.submitLine("/unknownslash");
  const unkSnap = controller.snapshot();
  const unkRow = unkSnap.transcript.find(r => r.text.startsWith("unknown slash: /unknownslash"));
  step("unknown slash surfaces a warning row", !!unkRow, unkRow?.text?.slice(0, 60) ?? "(no warning)");

  const sid = controller.snapshot().sessionId;
  await controller.endSession("smoke_test_done");
  const endDeadline = Date.now() + 5000;
  while (Date.now() < endDeadline) {
    if (controller.snapshot().sessionId === null) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const closed = controller.snapshot();
  step("session ends cleanly (client)", closed.sessionId === null, closed.endedReason || "(no reason)");
  const server = sid ? await client.fetchJson<{ status?: string }>(`/api/session/${encodeURIComponent(sid)}`) : null;
  const serverStatus = server && server.ok ? server.data.status : "(unread)";
  step("session ended on the server", serverStatus === "ended", String(serverStatus));

  const expectedTags = [
    "DRIVER_ROSTER_LOADED",
    "SESSION_OPEN_REQUESTED",
    "SESSION_OPEN_ACKED",
    "STREAM_ATTACHED",
    "TURN_SUBMITTED",
    "TURN_ACK",
    "STREAM_ENVELOPE_APPENDED",
    "TURN_PARKED",
    "SLASH_ROUTED",
    "DRIVER_PICKED",
    "SESSION_END_REQUESTED",
    "SESSION_ENDED_LOCAL",
    "STREAM_CLOSED",
  ];
  const missingTags = expectedTags.filter((t) => !emittedTags.includes(t));
  step("controller emits every declared tag", missingTags.length === 0,
    missingTags.length ? `missing ${missingTags.join(", ")}` : `saw ${new Set(emittedTags).size} distinct`);

  controller.disconnect();
  console.log("");
  console.log(`summary: ${steps} steps, ${failed ? "FAILED at " + failed : "all pass"}`);
  process.exitCode = failed ? 1 : 0;
}

main().then(() => process.exit(process.exitCode ?? 0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
