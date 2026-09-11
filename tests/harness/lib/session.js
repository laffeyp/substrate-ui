// tests/harness/lib/session.js — session lifecycle helpers shared across
// every sprint harness that binds a real substrate session.

"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { readJsonl, waitForEmit } = require("./jsonl");

const SESSIONS_ROOT = path.join(os.homedir(), ".substrate", "sessions");

function mkWorkspace(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `substrate-harness-${tag}-ws-`));
}

function rmWorkspace(workspace) {
  try { fs.rmSync(workspace, { recursive: true, force: true }); } catch (_) {}
}

// Remove a session's directory and unlink it from by-name.json. Called in
// a finally block after each sprint's harness so the ~/.substrate/sessions
// tree stays clean between runs.
function cleanupSession(sid) {
  if (!sid) return;
  try { fs.rmSync(path.join(SESSIONS_ROOT, sid), { recursive: true, force: true }); } catch (_) {}
  try {
    const byName = path.join(SESSIONS_ROOT, "by-name.json");
    if (fs.existsSync(byName)) {
      const data = JSON.parse(fs.readFileSync(byName, "utf8"));
      let touched = false;
      for (const k of Object.keys(data)) if (data[k] === sid) { delete data[k]; touched = true; }
      if (touched) fs.writeFileSync(byName, JSON.stringify(data));
    }
  } catch (_) {}
}

// Wait for the first pane to render.
async function waitForFirstPane(win) {
  await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 300));
  return win.$eval('[data-pane-id]', (el) => el.getAttribute("data-pane-id"));
}

// Type a workspace into the picker + Enter; wait for SESSION_CREATED.
// Returns the created session_id.
async function bindWorkspace(win, paneId, workspace) {
  const picker = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
  await picker.fill(workspace);
  await win.keyboard.press("Enter");
  const created = await waitForEmit("SESSION_CREATED", { timeoutMs: 15000 });
  return created.payload.session_id;
}

// Bind to a real fixture session if the env asks for one, else bind a
// fresh workspace. The fixture-real-record harness proves that the
// resume path can pick up any parked session on disk; this helper wires
// each sprint harness into the same override so it can grade against a
// real transcript rather than the deterministic driver's canned echo.
// Env var: SUBSTRATE_HARNESS_FIXTURE_SESSION_ID (or HARNESS_FIXTURE_SID).
// Returns { sid, workspace } — workspace is null when resumed from fixture.
async function bindWorkspaceOrFixture(win, paneId, tag) {
  const fixtureSid = process.env.SUBSTRATE_HARNESS_FIXTURE_SESSION_ID
                  || process.env.HARNESS_FIXTURE_SID
                  || null;
  if (fixtureSid) {
    const row = win.locator(`[data-testid="resume-row-${fixtureSid}"]`);
    await row.waitFor({ state: "attached", timeout: 30000 });
    await row.click();
    const resumed = await waitForEmit("SESSION_RESUMED", { timeoutMs: 30000 });
    return { sid: resumed.payload.session_id, workspace: null };
  }
  const workspace = mkWorkspace(tag);
  const sid = await bindWorkspace(win, paneId, workspace);
  return { sid, workspace };
}

// Type text into the pane's prompt + ⌘⏎; wait for TURN_SUBMITTED or TURN_SUBMIT_FAILED.
async function submitPrompt(win, paneId, text, { timeoutMs = 65000 } = {}) {
  const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
  await prompt.focus();
  await prompt.fill(text);
  await win.keyboard.press("Meta+Enter");
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const emits = readJsonl();
    const done = emits.find((s) =>
      (s.kind === "TURN_SUBMITTED" || s.kind === "TURN_SUBMIT_FAILED")
    );
    if (done) return done;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`submitPrompt: neither TURN_SUBMITTED nor TURN_SUBMIT_FAILED in ${timeoutMs}ms`);
}

// Ctrl+E to end via the pane's reveal handle keyboard shortcut.
async function endSession(win) {
  await win.keyboard.press("Meta+e");
  return waitForEmit("SESSION_ENDED_ACK", { timeoutMs: 35000 });
}

module.exports = {
  SESSIONS_ROOT,
  mkWorkspace, rmWorkspace, cleanupSession,
  waitForFirstPane, bindWorkspace, bindWorkspaceOrFixture, submitPrompt, endSession,
};
