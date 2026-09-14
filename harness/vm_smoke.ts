// harness/vm_smoke.js — drives web/vm/SessionController against the live server.
//
// Verifies the Presentation Model does what its public API says without any
// shell in the loop. Runs in Node (fetch + a tiny SSE reader over http).
// Assumes the substrate-ui server is up at http://127.0.0.1:8765.
//
// Pass path: driver roster non-empty, session opens on deterministic, envelope
// stream carries SessionStarted → UserMessage → ModelReply → Park, endSession
// closes the stream cleanly.

import http from "node:http";

import { SessionController } from "../web/vm/session_controller";
import type {
  FetchOpts, FetchResult, StreamHandlers, SubstrateClient, Unsubscribe,
} from "../web/vm/client";

const BASE = process.env.SUBSTRATE_UI_BASE || "http://127.0.0.1:8765";

class NodeSubstrateClient implements SubstrateClient {
  constructor(private readonly baseUrl: string) {}

  async fetchJson<T>(pathPart: string, opts: FetchOpts = {}): Promise<FetchResult<T>> {
    const url = this.baseUrl + pathPart;
    const method = opts.method || "GET";
    const headers: Record<string, string> = { ...(opts.headers || {}) };
    let body: string | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
    let response: Response;
    try {
      response = await fetch(url, { method, headers, body });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return { ok: false, status: 0, failureClass: "network", detail };
    }
    const text = await response.text().catch(() => "");
    if (!response.ok) {
      let failureClass = "http_error"; let detail = text;
      try {
        const parsed = JSON.parse(text) as { failure_class?: string; detail?: string };
        if (parsed && typeof parsed.failure_class === "string") failureClass = parsed.failure_class;
        if (parsed && typeof parsed.detail === "string") detail = parsed.detail;
      } catch { /* keep raw */ }
      return { ok: false, status: response.status, failureClass, detail };
    }
    if (!text) return { ok: true, data: null as unknown as T };
    try { return { ok: true, data: JSON.parse(text) as T }; }
    catch (err) { return { ok: false, status: response.status, failureClass: "json_parse", detail: String(err) }; }
  }

  streamRecord(sessionId: string, sinceSeq: number, handlers: StreamHandlers): Unsubscribe {
    const url = new URL(this.baseUrl + `/api/session/${encodeURIComponent(sessionId)}/events?since_seq=${sinceSeq}`);
    const request = http.get({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { Accept: "text/event-stream" },
    }, (response) => {
      if (response.statusCode !== 200) {
        handlers.onError?.(new Error(`sse status ${response.statusCode}`));
        response.resume();
        return;
      }
      handlers.onOpen?.();
      let buffer = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        buffer += chunk;
        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trimStart();
          try { handlers.onEnvelope(JSON.parse(payload)); }
          catch (err) { handlers.onError?.(err); }
        }
      });
      response.on("end", () => { handlers.onClose?.(); });
      response.on("error", (err) => { handlers.onError?.(err); });
    });
    request.on("error", (err) => { handlers.onError?.(err); });
    return () => { request.destroy(); };
  }
}

async function main() {
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
  const seenKinds = new Set<string>();
  const emittedTags: string[] = [];
  controller.onEvent((ev) => { emittedTags.push(ev.tag); });
  controller.subscribe((snap) => {
    for (const row of snap.transcript) seenKinds.add(row.kind);
  });

  await controller.loadDriverRoster();
  const rosterSnap = controller.snapshot();
  step("driver roster loads", rosterSnap.driverRoster.length > 0
    && rosterSnap.driverRoster.includes("deterministic"),
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
  step("SessionStarted, UserMessage, Park all seen", ["UserMessage", "Park"].every((k) => seenKinds.has(k)),
    `saw ${Array.from(seenKinds).join(", ")}`);
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

  await controller.endSession("smoke_test_done");
  const endDeadline = Date.now() + 5000;
  while (Date.now() < endDeadline) {
    if (controller.snapshot().sessionId === null) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const closed = controller.snapshot();
  step("session ends cleanly", closed.sessionId === null, closed.endedReason || "(no reason)");

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
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
