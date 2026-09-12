// tests/harness/e2e_records_surface.js — Sprint 025.
//
// Cmd-R opens the Records surface as a pane-scoped view over
// ~/.substrate/sessions/. The list mounts with rows for every real
// manifest. Esc fires SURFACE_CLOSED{kind:"records"}. Enter on a
// row primes Sprint 009's resume flow. Layer 5 mutex: opening a
// second surface kind (Sprint 026's assay etc.) first fires
// CLOSED{prior} then OPENED{new, prior_kind}.
//
// Three-channel agreement:
//   Structural: [data-testid="surface-records-<paneId>"] present
//     when open, absent when closed.
//   Perceptual: anchor-pane-<id>-surface byte 0 (none) / 1 (records)
//     per Layer 7's exact encoding.
//   Signal: SURFACE_OPENED / SURFACE_CLOSED symmetric. On resume,
//     SESSION_RESUME flow fires.

"use strict";
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { readAnchorByte } = require("./lib/anchor");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession,
} = require("./lib/session");

const REPO = path.resolve(__dirname, "..", "..");
const substratePython = process.env.SUBSTRATE_UI_PYTHON
  || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

function plantSession(workspace) {
  const py = `
from substrate.session_registry import SessionRegistry
import uuid, json
reg = SessionRegistry(auto_boot=True)
sid = uuid.uuid4().hex[:12]
name = "records-harness-" + sid[:6]
m = reg.create(session_id=sid, name=name, driver="deterministic",
               workspace=${JSON.stringify(workspace)}, workspace_shape="flat",
               bundle=None, seed="")
print(json.dumps({"session_id": m.session_id, "name": m.name}))
`;
  const r = spawnSync(substratePython, ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("plant failed: " + r.stderr);
  return JSON.parse(r.stdout.trim());
}

const workspace = mkWorkspace("records");
const planted = plantSession(workspace);
process.on("exit", () => { cleanupSession(planted.session_id); rmWorkspace(workspace); });

runHarness("e2e_records_surface", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  const surfaceAnchor = `anchor-pane-${paneId}-surface`;

  // Base: surface closed, anchor byte 0.
  check(await readAnchorByte(win, surfaceAnchor) === 0,
    `initial anchor-surface byte === 0 (none)`);

  // Cmd-R → OPENED{kind:"records", prior_kind:null}.
  const preOpen = readJsonl().length;
  await win.keyboard.press("Meta+r");
  await new Promise((r) => setTimeout(r, 400));

  const opens1 = readJsonl().slice(preOpen).filter((s) => s.kind === "SURFACE_OPENED");
  check(opens1.length === 1, `one SURFACE_OPENED after Cmd-R (got ${opens1.length})`);
  check(opens1[0].payload.kind === "records", `OPENED.kind === "records"`);
  check(opens1[0].payload.prior_kind === null, `OPENED.prior_kind === null (no prior surface)`);
  check(opens1[0].payload.pane_id === paneId, `OPENED.pane_id matches`);
  check(await readAnchorByte(win, surfaceAnchor) === 1, `anchor byte === 1 (records)`);

  const surface = win.locator(`[data-testid="surface-records-${paneId}"]`);
  await surface.waitFor({ state: "attached", timeout: 3000 });

  // The planted session's row is present.
  const plantedRow = win.locator(
    `[data-testid="records-row-${paneId}-${planted.session_id}"]`,
  );
  await plantedRow.waitFor({ state: "attached", timeout: 3000 });
  check(true, `planted session row visible in the Records surface`);

  // Esc → CLOSED.
  const preClose = readJsonl().length;
  await surface.focus();
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 300));

  const closes = readJsonl().slice(preClose).filter((s) => s.kind === "SURFACE_CLOSED");
  check(closes.length === 1, `one SURFACE_CLOSED after Esc (got ${closes.length})`);
  check(closes[0].payload.kind === "records", `CLOSED.kind === "records"`);
  check(await readAnchorByte(win, surfaceAnchor) === 0, `anchor byte back to 0`);
  check(await win.locator(`[data-testid="surface-records-${paneId}"]`).count() === 0,
    `Records surface unmounts on close`);

  // Cmd-R again → OPENED; Enter on the planted row → resume path fires.
  await win.keyboard.press("Meta+r");
  await new Promise((r) => setTimeout(r, 400));
  const surface2 = win.locator(`[data-testid="surface-records-${paneId}"]`);
  await surface2.waitFor({ state: "attached", timeout: 3000 });

  // Walk cursor to the planted row (it may not be index 0 in a big
  // sessions dir). Click it once to set the cursor.
  await plantedRow.click();
  await new Promise((r) => setTimeout(r, 100));
  const preResume = readJsonl().length;
  await surface2.focus();
  await win.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 2500));

  const post = readJsonl().slice(preResume);
  const boundEmit = post.find((s) =>
    s.kind === "WORKSPACE_BOUND" && s.payload.session_id === planted.session_id);
  check(!!boundEmit, `Enter primes Sprint 009 resume; WORKSPACE_BOUND fires for planted session_id`);

  const closeAfterResume = post.find((s) => s.kind === "SURFACE_CLOSED");
  check(!!closeAfterResume, `SURFACE_CLOSED fires when resume takes over the pane`);

  // Layer 5 symmetry check on the full trace.
  const emits = readJsonl();
  const opens = emits.filter((s) => s.kind === "SURFACE_OPENED").length;
  const clsds = emits.filter((s) => s.kind === "SURFACE_CLOSED").length;
  check(opens === clsds, `SURFACE_OPENED count === SURFACE_CLOSED count (${opens} vs ${clsds})`);
});
