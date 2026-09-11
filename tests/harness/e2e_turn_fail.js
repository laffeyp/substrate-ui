// tests/harness/e2e_turn_fail.js — Sprint 013.
// Five back-to-back ⌘⏎ submits with HARNESS_TURN_SLEEP_MS=500 stack the
// queue past the per-session cap of 4; the fifth returns
// TURN_SUBMIT_FAILED{reason:"queue_full"}. Total ack count === request
// count; every failure correlates by request_id.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, waitForFirstPane, cleanupSession, rmWorkspace,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_turn_fail", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "fail"));
  check(!!sid, `session bound (session_id=${sid})`);

  const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
  for (let i = 0; i < 5; i++) {
    await prompt.focus();
    await prompt.fill(`turn-${i}`);
    await win.keyboard.press("Meta+Enter");
  }
  await new Promise((r) => setTimeout(r, 8000));

  const emits = readJsonl();
  const requested = emits.filter((s) => s.kind === "TURN_SUBMIT_REQUESTED");
  const submitted = emits.filter((s) => s.kind === "TURN_SUBMITTED");
  const failed    = emits.filter((s) => s.kind === "TURN_SUBMIT_FAILED");
  check(requested.length === 5, `five TURN_SUBMIT_REQUESTED emits (got ${requested.length})`);
  check(failed.length >= 1, `at least one TURN_SUBMIT_FAILED`);
  check(submitted.length + failed.length === 5, `ack count === request count`);
  const queueFull = failed.filter((s) => s.payload.reason === "queue_full");
  check(queueFull.length >= 1, `at least one reason="queue_full" (got ${queueFull.length})`);

  const requestedIds = new Set(requested.map((s) => s.payload.request_id));
  check(failed.every((s) => requestedIds.has(s.payload.request_id)),
    `every TURN_SUBMIT_FAILED.request_id matches a TURN_SUBMIT_REQUESTED`);
}, { extraEnv: { HARNESS_TURN_SLEEP_MS: "500" } });
