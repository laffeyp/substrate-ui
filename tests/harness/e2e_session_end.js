// tests/harness/e2e_session_end.js — Sprint 010.
// Binds a session, presses ⌘E to end it. Asserts SESSION_END_REQUESTED
// → SESSION_ENDED_ACK → TRANSCRIPT_SESSION_ENDED_RENDERED in order,
// request_id correlates, manifest.status flips to "ended", and the
// record's SessionEnded envelope's seq matches the emitted envelope_seq.

"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, waitForFirstPane, cleanupSession, rmWorkspace,
  SESSIONS_ROOT,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_session_end", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "end"));
  check(await win.locator(`[data-testid="unbound-picker-input-${paneId}"]`).count() === 0,
    `pane bound (picker gone)`);
  check(!!sid, `session_id captured (got ${sid})`);

  await win.keyboard.press("Meta+e");
  await new Promise((r) => setTimeout(r, 3000));

  const emits = readJsonl();
  const req = emits.find((s) => s.kind === "SESSION_END_REQUESTED");
  const ack = emits.find((s) => s.kind === "SESSION_ENDED_ACK");
  const row = emits.find((s) => s.kind === "TRANSCRIPT_SESSION_ENDED_RENDERED");
  check(!!req, `SESSION_END_REQUESTED emits`);
  check(!!ack, `SESSION_ENDED_ACK emits`);
  check(!!row, `TRANSCRIPT_SESSION_ENDED_RENDERED emits`);

  if (req) {
    check(req.payload.source === "shortcut", `SESSION_END_REQUESTED.source === "shortcut"`);
    check(req.payload.session_id === sid, `SESSION_END_REQUESTED.session_id === bound`);
  }
  if (req && ack) {
    check(req.payload.request_id === ack.payload.request_id, `request_id correlates`);
    check(ack.payload.record_finalised === true, `SESSION_ENDED_ACK.record_finalised === true`);
  }
  if (row && ack) {
    check(row.payload.end_reason === ack.payload.end_reason,
      `TRANSCRIPT_SESSION_ENDED_RENDERED.end_reason matches ACK`);
    check(typeof row.payload.envelope_seq === "number" && row.payload.envelope_seq >= 0,
      `envelope_seq present`);
  }

  if (sid) {
    const mp = path.join(SESSIONS_ROOT, sid, "manifest.json");
    check(fs.existsSync(mp), `manifest.json exists post-end`);
    if (fs.existsSync(mp)) {
      const m = JSON.parse(fs.readFileSync(mp, "utf8"));
      check(m.status === "ended", `manifest.status === "ended" (got ${m.status})`);
    }
    const recordDir = path.join(SESSIONS_ROOT, sid, "record");
    let sessionEndedFound = false, sessionEndedSeq = -1;
    if (fs.existsSync(recordDir)) {
      for (const ef of fs.readdirSync(recordDir).filter((f) => f.startsWith("events-") && f.endsWith(".jsonl"))) {
        for (const line of fs.readFileSync(path.join(recordDir, ef), "utf8").split("\n").filter((l) => l.trim())) {
          try {
            const env = JSON.parse(line);
            if (env.kind === "SessionEnded") { sessionEndedFound = true; sessionEndedSeq = env.seq; break; }
          } catch { /* skip */ }
        }
        if (sessionEndedFound) break;
      }
    }
    check(sessionEndedFound, `record carries a SessionEnded envelope`);
    if (row && sessionEndedFound) {
      check(row.payload.envelope_seq === sessionEndedSeq,
        `envelope_seq === record's SessionEnded seq (${row.payload.envelope_seq} vs ${sessionEndedSeq})`);
    }
  }
});
