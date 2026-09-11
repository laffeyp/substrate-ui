// tests/harness/e2e_turn_submit.js — Sprint 012.
// Binds a deterministic-driver session, types "hello", presses ⌘⏎.
// Asserts PROMPT_SUBMITTED → TURN_SUBMIT_REQUESTED → TURN_SUBMITTED with
// matching request_id, turn_index=0 on first turn, and the on-disk
// record carrying a UserMessage envelope at turn_index 0.

"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl, harnessJsonlPath } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, waitForFirstPane, cleanupSession, rmWorkspace,
  SESSIONS_ROOT,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_turn_submit", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "turn"));
  check(!!sid, `session bound (session_id=${sid})`);

  const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
  await prompt.focus();
  await prompt.type("hello", { delay: 20 });
  await new Promise((r) => setTimeout(r, 200));

  const preSubmit = readJsonl().length;
  await win.keyboard.press("Meta+Enter");
  await new Promise((r) => setTimeout(r, 5000));

  const submitted = readJsonl().slice(preSubmit);
  const ps  = submitted.find((s) => s.kind === "PROMPT_SUBMITTED");
  const req = submitted.find((s) => s.kind === "TURN_SUBMIT_REQUESTED");
  const okE = submitted.find((s) => s.kind === "TURN_SUBMITTED");
  check(!!ps, `PROMPT_SUBMITTED emits`);
  check(!!req, `TURN_SUBMIT_REQUESTED emits`);
  check(!!okE, `TURN_SUBMITTED emits`);
  if (ps) check(ps.payload.text_length === 5, `PROMPT_SUBMITTED.text_length === 5`);
  if (req) {
    check(req.payload.text_length === 5, `TURN_SUBMIT_REQUESTED.text_length === 5`);
    check(req.payload.timeout_seconds === 60, `TURN_SUBMIT_REQUESTED.timeout_seconds === 60`);
  }
  if (req && okE) {
    check(req.payload.request_id === okE.payload.request_id, `request_id correlates`);
    check(okE.payload.turn_index === 0, `TURN_SUBMITTED.turn_index === 0`);
  }

  const rawJsonl = fs.readFileSync(harnessJsonlPath(), "utf8");
  check(!rawJsonl.includes('"hello"'), `no raw "hello" in JSONL (privacy)`);

  if (sid) {
    const recordDir = path.join(SESSIONS_ROOT, sid, "record");
    let seen = -1;
    if (fs.existsSync(recordDir)) {
      for (const ef of fs.readdirSync(recordDir).filter((f) => f.startsWith("events-"))) {
        for (const line of fs.readFileSync(path.join(recordDir, ef), "utf8").split("\n").filter((l) => l.trim())) {
          try {
            const env = JSON.parse(line);
            if (env.kind === "UserMessage" && "turn_index" in (env.payload || {})) {
              seen = Math.max(seen, env.payload.turn_index);
            }
          } catch { /* skip */ }
        }
      }
    }
    check(seen === 0, `record UserMessage carries turn_index=0 (got ${seen})`);
  }
});
