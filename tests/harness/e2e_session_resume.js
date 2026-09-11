// tests/harness/e2e_session_resume.js — Sprint 009.
// Plants a session by calling SessionRegistry.create directly via a
// short Python invocation, launches the shell, clicks the resume row
// for that session_id, and asserts WORKSPACE_BOUND + PANE_UNBOUND_BOUND
// fire with matching session_id and workspace_path. No fresh
// SESSION_CREATE_REQUESTED fires — the resume path is distinct.

"use strict";
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession, SESSIONS_ROOT,
} = require("./lib/session");

const REPO = path.resolve(__dirname, "..", "..");
const substratePython = process.env.SUBSTRATE_UI_PYTHON
  || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

function plantSession(workspace) {
  const py = `
import substrate
from substrate.session_registry import SessionRegistry
import uuid, json
sid = uuid.uuid4().hex[:12]
name = "resume-harness-" + sid[:6]
reg = SessionRegistry(auto_boot=True)
m = reg.create(session_id=sid, name=name, driver="deterministic",
               workspace=${JSON.stringify(workspace)}, workspace_shape="flat",
               bundle=None, seed="")
print(json.dumps({"session_id": m.session_id, "workspace": m.workspace}))
`;
  const r = spawnSync(substratePython, ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("plant failed: " + r.stderr);
  return JSON.parse(r.stdout.trim());
}

const workspace = mkWorkspace("resume");
const planted = plantSession(workspace);
process.on("exit", () => { cleanupSession(planted.session_id); rmWorkspace(workspace); });

runHarness("e2e_session_resume", async ({ win, check }) => {
  await waitForFirstPane(win);
  const row = win.locator(`[data-testid="resume-row-${planted.session_id}"]`);
  await row.waitFor({ state: "attached", timeout: 5000 });
  await row.click();
  await new Promise((r) => setTimeout(r, 1500));

  const emits = readJsonl();
  const wsb = emits.find((s) => s.kind === "WORKSPACE_BOUND");
  const bnd = emits.find((s) => s.kind === "PANE_UNBOUND_BOUND");
  check(!!wsb, `WORKSPACE_BOUND fires after resume`);
  check(!!bnd, `PANE_UNBOUND_BOUND fires after resume`);
  check(wsb?.payload?.session_id === planted.session_id, `WORKSPACE_BOUND.session_id === planted`);
  check(wsb?.payload?.workspace_path === workspace, `WORKSPACE_BOUND.workspace_path matches`);
  check(bnd?.payload?.session_id === planted.session_id, `PANE_UNBOUND_BOUND.session_id === planted`);

  const created = emits.filter((s) => s.kind === "SESSION_CREATE_REQUESTED");
  check(created.length === 0, `no SESSION_CREATE_REQUESTED fires on resume path`);
});
