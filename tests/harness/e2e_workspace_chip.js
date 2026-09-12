// tests/harness/e2e_workspace_chip.js — Sprint 032.
//
// Binds a fixture session, clicks the WorkspaceChip, asserts one
// WORKSPACE_POPOVER_OPENED{pane_id}, verifies the popover shows the
// pane's workspace_path + shape read-only, clicks the chip again to
// close and asserts one WORKSPACE_POPOVER_CLOSED{pane_id}. Also
// greps the source for any PATCH-workspace surface — none exists on
// a bound session (D9c).

"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, waitForFirstPane,
  cleanupSession, rmWorkspace,
} = require("./lib/session");

const REPO = path.resolve(__dirname, "..", "..");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

function assertNoPatchWorkspaceSurface(check) {
  const roots = ["src", "bridge"];
  const bad = [];
  for (const root of roots) {
    walkFiles(path.join(REPO, root), (p) => {
      if (!/\.(ts|tsx|py)$/.test(p)) return;
      const body = fs.readFileSync(p, "utf8");
      // These identifiers would surface an in-shell workspace-mutate
      // path. D9c and the card forbid one. A PATCH-workspace endpoint
      // OR a set_workspace call OR an update_workspace op OR a
      // WORKSPACE_CHANGE tag family would all violate the invariant.
      const patterns = [
        /set_workspace\s*\(/,
        /update_workspace\s*\(/,
        /op_workspace_change\b/,
        /WORKSPACE_CHANGE_REQUESTED/,
        /WORKSPACE_CHANGED\b/,
        /WORKSPACE_CHANGE_FAILED/,
      ];
      for (const rx of patterns) {
        if (rx.test(body)) bad.push({ file: p, pattern: rx.toString() });
      }
    });
  }
  check(bad.length === 0,
    `no PATCH-workspace surface in src/ or bridge/ (${bad.length} hits)`);
}

function walkFiles(root, cb) {
  if (!fs.existsSync(root)) return;
  for (const name of fs.readdirSync(root)) {
    const p = path.join(root, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkFiles(p, cb);
    else cb(p);
  }
}

runHarness("e2e_workspace_chip", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "workspace_chip"));
  check(!!sid, `session bound (session_id=${sid})`);

  const chip = win.locator(`[data-testid="workspace-chip-${paneId}"]`);
  await chip.waitFor({ state: "attached", timeout: 5000 });
  const shape = await chip.getAttribute("data-workspace-shape");
  check(typeof shape === "string" && shape.length > 0,
    `chip data-workspace-shape is a non-empty string (got "${shape}")`);
  check(["flat", "worktree", "isolate"].includes(shape),
    `chip shape is one of the three ratified values (got "${shape}")`);

  // Click → OPENED.
  const preOpen = readJsonl().length;
  await chip.click();
  await new Promise((r) => setTimeout(r, 200));
  const opens = readJsonl().slice(preOpen).filter((s) => s.kind === "WORKSPACE_POPOVER_OPENED");
  check(opens.length === 1, `one WORKSPACE_POPOVER_OPENED (got ${opens.length})`);
  check(opens[0].payload.pane_id === paneId, `OPENED.pane_id matches`);

  const popover = win.locator(`[data-testid="workspace-popover-${paneId}"]`);
  await popover.waitFor({ state: "attached", timeout: 2000 });
  const popShape = await popover.getAttribute("data-workspace-shape");
  check(popShape === shape,
    `popover shape mirrors chip (both "${shape}")`);
  const pathText = await win.locator(`[data-testid="workspace-popover-path-${paneId}"]`).textContent();
  check(typeof pathText === "string" && pathText.length > 0
      && pathText !== "(none)",
    `popover shows a non-empty workspace path (got "${pathText}")`);

  // Click again → CLOSED.
  const preClose = readJsonl().length;
  await chip.click();
  await new Promise((r) => setTimeout(r, 200));
  const closes = readJsonl().slice(preClose).filter((s) => s.kind === "WORKSPACE_POPOVER_CLOSED");
  check(closes.length === 1, `one WORKSPACE_POPOVER_CLOSED (got ${closes.length})`);
  check(await win.locator(`[data-testid="workspace-popover-${paneId}"]`).count() === 0,
    `popover unmounts on close`);

  // Content assertion — no PATCH-workspace surface in the source.
  assertNoPatchWorkspaceSurface(check);

  // Symmetry.
  const emits = readJsonl();
  const opN = emits.filter((s) => s.kind === "WORKSPACE_POPOVER_OPENED").length;
  const clN = emits.filter((s) => s.kind === "WORKSPACE_POPOVER_CLOSED").length;
  check(opN === clN, `OPENED === CLOSED (${opN} vs ${clN})`);
});
