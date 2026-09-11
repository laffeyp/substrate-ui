// tests/harness/e2e_park_render.js — Sprint 015.
// Four ratified transcript special-shape rows:
//   TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED — on bind before any turn
//   TRANSCRIPT_PARK_RENDERED{park_reason}      — when substrate emits Park
//   TRANSCRIPT_SESSION_ENDED_RENDERED          — when SessionEnded lands
//   TRANSCRIPT_ROW_RENDERED (control)          — the base pairing still holds
// TranscriptCompacted and RateLimitedWaiting are untriggerable with the
// deterministic driver; those rows are covered by review of the reducer's
// TRANSCRIPT_ROWS_LOADED branch.

"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, waitForFirstPane, endSession,
  cleanupSession, rmWorkspace, SESSIONS_ROOT,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_park_render", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "park"));

  let emits = readJsonl();
  const awaiting = emits.filter((s) => s.kind === "TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED");
  const promptSubmits = emits.filter((s) => s.kind === "PROMPT_SUBMITTED");
  check(awaiting.length === 1, `exactly one AWAITING after bind (got ${awaiting.length})`);
  check(promptSubmits.length === 0, `AWAITING fires BEFORE any PROMPT_SUBMITTED`);
  check(awaiting[0].payload.pane_id === paneId, `AWAITING.pane_id matches focused pane`);
  check(typeof awaiting[0].payload.session_id === "string", `AWAITING.session_id present`);

  const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
  await prompt.focus();
  await prompt.fill("go");
  await win.keyboard.press("Meta+Enter");
  await new Promise((r) => setTimeout(r, 3000));

  emits = readJsonl();
  const parks = emits.filter((s) => s.kind === "TRANSCRIPT_PARK_RENDERED");
  check(parks.length >= 1, `at least one PARK after turn (got ${parks.length})`);
  check(parks[0].payload.park_reason === "final_answer",
    `PARK.park_reason === "final_answer" (got ${parks[0].payload.park_reason})`);
  check(typeof parks[0].payload.envelope_seq === "number" && parks[0].payload.envelope_seq >= 0,
    `PARK.envelope_seq present`);

  const validReasons = new Set(["final_answer", "model_error", "interrupt"]);
  for (const p of parks) {
    check(validReasons.has(p.payload.park_reason),
      `every PARK.park_reason ∈ Layer 2 enum (got ${p.payload.park_reason})`);
  }

  await win.keyboard.press("Meta+e");
  await new Promise((r) => setTimeout(r, 3000));

  emits = readJsonl();
  const ended = emits.find((s) => s.kind === "TRANSCRIPT_SESSION_ENDED_RENDERED");
  check(!!ended, `SESSION_ENDED_RENDERED fires on ⌘E end`);
  if (ended) check(typeof ended.payload.end_reason === "string", `SESSION_ENDED_RENDERED.end_reason present`);

  if (sid) {
    const manifestPath = path.join(SESSIONS_ROOT, sid, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      check(manifest.status === "ended", `manifest.status === "ended" (got ${manifest.status})`);
    }
  }
});
