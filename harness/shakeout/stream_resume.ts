// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 533 — the stream resumes by event id.
//
// Two reconnect paths carry the resume cursor; this gate proves both, plus the server contract they
// rely on. It owns its own server.py (ServerHandle) so it can drop the SSE the way the reconnect
// code exists to handle — a SIGKILL that RSTs the socket — which CDP network emulation cannot do to a
// loopback connection.
//
//   Part A — server contract (plain HTTP). Opens the session's SSE endpoint and proves the server
//     stamps `id: <seq>` on every frame and honours a `Last-Event-ID` request header over a stale
//     `since_seq=-1` query cursor. This is the cursor a browser EventSource replays on its own
//     built-in auto-retry. These checks fail on a server that writes only `data:` or ignores the
//     header.
//   Part B — controller reconnect (SessionController through NodeSubstrateClient). A streaming turn
//     parks; the server is SIGKILLed so the socket RSTs (onError → STREAM_RECONNECTING → the 1 s
//     reconnect timer); the server restarts on the same port; the controller's fresh connection
//     resumes through the `since_seq` query parameter (a new EventSource cannot set an initial
//     Last-Event-ID). A second turn then grows the record past the pre-drop cursor. Asserts: a second
//     STREAM_ATTACHED, STREAM_RECONNECTING, a STREAM_BATCH_FOLDED whose first_seq is past the pre-drop
//     last_seq, and no duplicate transcript rows — the resume drew the new envelopes once, not a
//     replay leaning on seenSeqs.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import * as srv from "./lib/server";

const PARK_TIMEOUT_MS = 90_000;
const REATTACH_TIMEOUT_MS = 20_000;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
async function until(cond: () => boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (cond()) return true;
    await sleep(100);
  }
  return cond();
}

interface Emitted { tag: string; payload: Record<string, unknown> }

/** Read up to `maxFrames` SSE frames from `url`, parsing each frame's `id:` and `data:` seq. */
async function readSse(
  url: string, headers: Record<string, string>, maxFrames: number, timeoutMs: number,
): Promise<{ id: number | null; seq: number }[]> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const frames: { id: number | null; seq: number }[] = [];
  try {
    const resp = await fetch(url, { headers, signal: ac.signal });
    if (!resp.ok || !resp.body) throw new Error(`SSE ${url}: HTTP ${resp.status}`);
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (frames.length < maxFrames) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) >= 0 && frames.length < maxFrames) {
        const rawFrame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let id: string | null = null;
        let data: string | null = null;
        for (const line of rawFrame.split("\n")) {
          if (line.startsWith("id:")) id = line.slice(3).trim();
          else if (line.startsWith("data:")) data = line.slice(5).trim();
        }
        if (data && data !== "end") {
          const env = JSON.parse(data) as { seq?: number };
          frames.push({ id: id != null && id !== "" ? Number(id) : null, seq: typeof env.seq === "number" ? env.seq : -1 });
        }
      }
    }
    await reader.cancel().catch(() => undefined);
  } catch (e) {
    if ((e as Error).name !== "AbortError") throw e;
  } finally {
    clearTimeout(timer);
  }
  return frames;
}

async function main(): Promise<void> {
  const server = new srv.ServerHandle();
  await server.start();
  const base = srv.BASE_URL;

  const client = new NodeSubstrateClient(base);
  const controller = new SessionController(client);
  controller.paneId = 1;  // noteSkipped / batch-skip summaries only fire for a bound pane
  const emitted: Emitted[] = [];
  controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));
  const attaches = () => emitted.filter((e) => e.tag === "STREAM_ATTACHED").length;

  const checks: Record<string, "pass" | "fail"> = {
    id_frames: "fail",
    last_event_id_honored: "fail",
    malformed_id_full_stream: "fail",
    second_stream_attached: "fail",
    reconnecting_signalled: "fail",
    resume_past_last: "fail",
    no_duplicate_rows: "fail",
  };
  let detail = "";

  try {
    // A short streaming script the deterministic driver plays on each turn.
    const streamCmd = "seq 1 300 | awk '{ print \"line \" $1 \": \" $1*7 }'";
    const script: [string, string[]][] = [
      ["bash", ["echo start"]],
      ["bash", [streamCmd]],
      ["bash", ["echo done"]],
    ];

    await controller.loadDriverRoster();
    controller.pickDriver("deterministic");
    await controller.openSession({ driver: "deterministic", driverParams: { script } });
    const sessionId = controller.snapshot().sessionId;
    if (!sessionId) throw new Error("no session_id after openSession");

    // Turn 1 — the record the resume will pick up past.
    await controller.sendTurn("run the script");
    if (!await until(() => controller.snapshot().parkReason != null, PARK_TIMEOUT_MS)) {
      throw new Error("turn 1 never parked");
    }
    const maxSeq = (es: { seq?: number }[]) => es.reduce((m, e) => (typeof e.seq === "number" && e.seq > m ? e.seq : m), -1);
    const preDropLastSeq = maxSeq(controller.snapshot().rawEnvelopes);

    // DROP — SIGKILL the server so the socket RSTs (not a graceful SessionEnded). The client's
    // onError fires; handleStreamError emits STREAM_RECONNECTING and schedules the 1 s reconnect.
    await server.kill();
    await server.start();
    await server.waitHealthy(10_000);
    if (!await until(() => attaches() >= 2, REATTACH_TIMEOUT_MS)) {
      throw new Error(`stream did not re-attach: ${attaches()} STREAM_ATTACHED`);
    }

    // GROW — a second turn resumes the session; its envelopes carry seq past the pre-drop cursor,
    // so the controller folds a STREAM_BATCH_FOLDED with first_seq > preDropLastSeq.
    await controller.sendTurn("run the script again");
    if (!await until(() => (controller.snapshot().parkReason != null) && maxSeq(controller.snapshot().rawEnvelopes) > preDropLastSeq, PARK_TIMEOUT_MS)) {
      throw new Error(`turn 2 did not grow the record past ${preDropLastSeq}`);
    }
    await sleep(500);

    // ── Part B assertions ──────────────────────────────────────────────────────
    if (attaches() >= 2) checks.second_stream_attached = "pass";
    if (emitted.some((e) => e.tag === "STREAM_RECONNECTING")) checks.reconnecting_signalled = "pass";
    if (emitted.some((e) => e.tag === "STREAM_BATCH_FOLDED" && typeof e.payload.first_seq === "number" && (e.payload.first_seq as number) > preDropLastSeq)) {
      checks.resume_past_last = "pass";
    }
    const rowSeqs = controller.snapshot().transcript.map((r) => r.seq).filter((s): s is number => typeof s === "number");
    if (rowSeqs.length === new Set(rowSeqs).size) checks.no_duplicate_rows = "pass";
    const dupSkips = emitted
      .filter((e) => e.tag === "TRANSCRIPT_ROWS_SKIPPED")
      .reduce((n, e) => {
        const reasons = (e.payload.reasons ?? {}) as Record<string, number>;
        return n + (typeof reasons.DUPLICATE_SEQ === "number" ? reasons.DUPLICATE_SEQ : 0);
      }, 0);

    // ── Part A: server contract over plain HTTP ────────────────────────────────
    const seqs = controller.snapshot().rawEnvelopes.map((e) => e.seq).filter((s): s is number => typeof s === "number");
    const recordMin = seqs[0];
    const recordMid = seqs[Math.floor(seqs.length / 2)];
    const eventsUrl = `${base}/api/session/${sessionId}/events?since_seq=-1`;

    const full = await readSse(eventsUrl, { Origin: base }, 3, 8000);
    const everyHasId = full.length > 0 && full.every((f) => f.id != null);
    const firstIsRecordMin = full.length > 0 && full[0].seq === recordMin && full[0].id === full[0].seq;
    if (everyHasId && firstIsRecordMin) checks.id_frames = "pass";

    const resumed = await readSse(eventsUrl, { Origin: base, "Last-Event-ID": String(recordMid) }, 1, 8000);
    if (resumed.length > 0 && resumed[0].seq > recordMid) checks.last_event_id_honored = "pass";

    const malformed = await readSse(eventsUrl, { Origin: base, "Last-Event-ID": "not-a-number" }, 1, 8000);
    if (malformed.length > 0 && malformed[0].seq === recordMin) checks.malformed_id_full_stream = "pass";

    detail = `preDropLastSeq=${preDropLastSeq} recordSeqs=[${recordMin}..${maxSeq(controller.snapshot().rawEnvelopes)}] rows=${rowSeqs.length} attaches=${attaches()} dupSeqSkips=${dupSkips} sse(full first seq/id=${full[0]?.seq}/${full[0]?.id}, resumed first seq=${resumed[0]?.seq} > mid ${recordMid}, malformed first seq=${malformed[0]?.seq})`;
  } finally {
    try { controller.disconnect(); } catch { /* ok */ }
    await server.stop().catch(() => undefined);
  }

  const line = Object.entries(checks).map(([k, v]) => `${k}: ${v}`).join(", ");
  if (Object.values(checks).every((v) => v === "pass")) {
    console.log(`stream_resume: PASS — ${line}; ${detail}`);
    process.exit(0);
  }
  console.error(`stream_resume: FAIL — ${line}; ${detail}`);
  process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
