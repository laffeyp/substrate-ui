// tests/harness/e2e_session_create.js — Sprint 007.
// The picker's Enter fires SESSION_CREATE_REQUESTED → SESSION_CREATED →
// WORKSPACE_BOUND → PANE_UNBOUND_BOUND, all correlated by request_id and
// session_id. The substrate side writes manifest.json at
// ~/.substrate/sessions/<sid>/ with the same workspace + shape.

"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession, SESSIONS_ROOT,
} = require("./lib/session");

let sid = null;
const workspace = mkWorkspace("create");
process.on("exit", () => { cleanupSession(sid); rmWorkspace(workspace); });

runHarness("e2e_session_create", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  const input = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
  await input.fill(workspace);
  await win.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 1500));

  const emits = readJsonl();
  const req = emits.find((s) => s.kind === "SESSION_CREATE_REQUESTED");
  const okE = emits.find((s) => s.kind === "SESSION_CREATED");
  const wsb = emits.find((s) => s.kind === "WORKSPACE_BOUND");
  const bnd = emits.find((s) => s.kind === "PANE_UNBOUND_BOUND");
  check(!!req, `SESSION_CREATE_REQUESTED emits`);
  check(!!okE, `SESSION_CREATED emits`);
  check(!!wsb, `WORKSPACE_BOUND emits`);
  check(!!bnd, `PANE_UNBOUND_BOUND emits`);

  if (req) {
    const p = req.payload;
    const required = ["request_id", "pane_id", "session_id", "name", "driver", "workspace_path", "workspace_shape", "bundle", "seed"];
    const missing = required.filter((k) => !(k in p));
    check(missing.length === 0, `SESSION_CREATE_REQUESTED carries all 9 required fields (missing: ${missing.join(",") || "none"})`);
    check(p.seed === "", `SESSION_CREATE_REQUESTED.seed === "" (got ${JSON.stringify(p.seed)})`);
    check(p.workspace_path === workspace, `workspace_path matches`);
  }
  if (req && okE) {
    check(req.payload.request_id === okE.payload.request_id, `request_id correlates REQUESTED → CREATED`);
    sid = okE.payload.session_id;
  }
  if (okE && wsb && bnd) {
    check(okE.payload.session_id === wsb.payload.session_id && wsb.payload.session_id === bnd.payload.session_id,
      `session_id correlates CREATED → WORKSPACE_BOUND → PANE_UNBOUND_BOUND`);
  }

  const stillUnbound = await win.locator(`[data-testid="unbound-picker-input-${paneId}"]`).count();
  check(stillUnbound === 0, `unbound picker unmounts after bind`);

  if (sid) {
    const mp = path.join(SESSIONS_ROOT, sid, "manifest.json");
    check(fs.existsSync(mp), `manifest.json exists at ${mp}`);
    if (fs.existsSync(mp)) {
      const m = JSON.parse(fs.readFileSync(mp, "utf8"));
      check(m.workspace === workspace, `manifest.workspace matches`);
      check(m.workspace_shape === "flat", `manifest.workspace_shape === "flat"`);
    }
  }
});
