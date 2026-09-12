// tests/harness/e2e_header_popover_mutex.js — Sprint 033.
//
// Enforce mutex across the two ratified per-kind popover pairs
// {DRIVER_DROPDOWN_OPENED/CLOSED, WORKSPACE_POPOVER_OPENED/CLOSED}.
// Opening one closes the other same-step. Layer 1 v0.1 ratifies no
// generic HEADER_POPOVER_* pair; the mutex is a Layer 5 invariant
// over the ratified pairs, not a new tag.
//
// Layer 7 anchor `anchor-pane-<id>-header-popover` byte encoding
// (vocabulary wins over the sprint card):
//   0   none
//   128 driver_dropdown open
//   255 workspace_popover open

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { readAnchorByte } = require("./lib/anchor");
const {
  bindWorkspaceOrFixture, waitForFirstPane,
  cleanupSession, rmWorkspace,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_header_popover_mutex", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "header_mutex"));
  check(!!sid, `session bound (session_id=${sid})`);

  const driverChip = win.locator(`[data-testid="driver-chip-${paneId}"]`);
  const workspaceChip = win.locator(`[data-testid="workspace-chip-${paneId}"]`);
  await driverChip.waitFor({ state: "attached", timeout: 5000 });
  await workspaceChip.waitFor({ state: "attached", timeout: 5000 });

  const anchorId = `anchor-pane-${paneId}-header-popover`;
  check(await readAnchorByte(win, anchorId) === 0,
    `initial header-popover anchor byte === 0`);

  // Click driver chip → DRIVER_DROPDOWN_OPENED, no WORKSPACE_POPOVER.
  const preDriver = readJsonl().length;
  await driverChip.click();
  await new Promise((r) => setTimeout(r, 200));
  const driverStep = readJsonl().slice(preDriver);
  const dOpen = driverStep.filter((s) => s.kind === "DRIVER_DROPDOWN_OPENED");
  const wOpen = driverStep.filter((s) => s.kind === "WORKSPACE_POPOVER_OPENED");
  check(dOpen.length === 1, `one DRIVER_DROPDOWN_OPENED (got ${dOpen.length})`);
  check(wOpen.length === 0, `no WORKSPACE_POPOVER_OPENED on driver click`);
  check(await readAnchorByte(win, anchorId) === 128,
    `anchor byte === 128 with driver dropdown open`);
  check(await win.locator(`[data-testid="driver-popover-${paneId}"]`).count() === 1,
    `driver popover mounted`);
  check(await win.locator(`[data-testid="workspace-popover-${paneId}"]`).count() === 0,
    `workspace popover NOT mounted (mutex holds structurally)`);

  // Click workspace chip → mutex: same-step CLOSED{driver} + OPENED{workspace}.
  const preSwap = readJsonl().length;
  await workspaceChip.click();
  await new Promise((r) => setTimeout(r, 200));
  const swapStep = readJsonl().slice(preSwap);
  const driverCloses = swapStep.filter((s) => s.kind === "DRIVER_DROPDOWN_CLOSED");
  const workspaceOpens = swapStep.filter((s) => s.kind === "WORKSPACE_POPOVER_OPENED");
  const stray = swapStep.filter((s) =>
    s.kind !== "DRIVER_DROPDOWN_CLOSED"
    && s.kind !== "WORKSPACE_POPOVER_OPENED"
    && s.kind !== "ANCHOR_PAINTED");
  check(driverCloses.length === 1, `one DRIVER_DROPDOWN_CLOSED on swap`);
  check(workspaceOpens.length === 1, `one WORKSPACE_POPOVER_OPENED on swap`);
  check(stray.length === 0,
    `swap emits exactly the two-tag pair (extra: ${JSON.stringify(stray.map((s) => s.kind))})`);
  // Same-step ⇒ adjacent in the JSONL: CLOSED preceding OPENED (reducer
  // pushes CLOSED first, OPENED second in the swap branch).
  const closeIdx = swapStep.findIndex((s) => s.kind === "DRIVER_DROPDOWN_CLOSED");
  const openIdx = swapStep.findIndex((s) => s.kind === "WORKSPACE_POPOVER_OPENED");
  check(openIdx === closeIdx + 1,
    `swap tags adjacent in the trace (close@${closeIdx}, open@${openIdx})`);
  check(await readAnchorByte(win, anchorId) === 255,
    `anchor byte flipped to 255 (workspace open)`);
  check(await win.locator(`[data-testid="driver-popover-${paneId}"]`).count() === 0,
    `driver popover unmounted`);
  check(await win.locator(`[data-testid="workspace-popover-${paneId}"]`).count() === 1,
    `workspace popover mounted`);

  // Reverse swap — workspace open, click driver chip.
  const preReverse = readJsonl().length;
  await driverChip.click();
  await new Promise((r) => setTimeout(r, 200));
  const revStep = readJsonl().slice(preReverse);
  const wClose = revStep.filter((s) => s.kind === "WORKSPACE_POPOVER_CLOSED");
  const dOpen2 = revStep.filter((s) => s.kind === "DRIVER_DROPDOWN_OPENED");
  check(wClose.length === 1 && dOpen2.length === 1,
    `reverse swap: one CLOSED{workspace} + one OPENED{driver}`);
  check(await readAnchorByte(win, anchorId) === 128,
    `anchor byte flipped back to 128 (driver open)`);

  // Close current popover for a clean teardown.
  await driverChip.click();
  await new Promise((r) => setTimeout(r, 200));
  check(await readAnchorByte(win, anchorId) === 0,
    `anchor byte back to 0 after final close`);

  // Layer 5 symmetry across the whole trace.
  const emits = readJsonl();
  const dO = emits.filter((s) => s.kind === "DRIVER_DROPDOWN_OPENED").length;
  const dC = emits.filter((s) => s.kind === "DRIVER_DROPDOWN_CLOSED").length;
  const wO = emits.filter((s) => s.kind === "WORKSPACE_POPOVER_OPENED").length;
  const wC = emits.filter((s) => s.kind === "WORKSPACE_POPOVER_CLOSED").length;
  check(dO === dC, `driver OPENED === CLOSED (${dO} vs ${dC})`);
  check(wO === wC, `workspace OPENED === CLOSED (${wO} vs ${wC})`);
  // No invented header-popover tag was emitted (the mutex is Layer 5,
  // not a new signal).
  const invented = emits
    .map((s) => s.kind)
    .filter((k) => /^HEADER_POPOVER_/.test(k));
  check(invented.length === 0,
    `no invented HEADER_POPOVER_* tag in the trace (got ${invented.length})`);
});
