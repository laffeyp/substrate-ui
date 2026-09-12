// tests/harness/e2e_assay_surface.js — Sprint 026.
//
// Cmd-A opens the Assay surface. The grid mounts with the "no assays
// yet" empty state (v0.1 defers drill-in per Layer 1 review §6).
// Esc fires SURFACE_CLOSED{kind:"assay"}. Anchor byte encodes the
// assay ordinal (3 per Layer 7). Layer 5 mutex: opening Assay while
// Records is already open fires CLOSED{records} + OPENED{assay,
// prior_kind:"records"} same-step.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { readAnchorByte } = require("./lib/anchor");
const { waitForFirstPane } = require("./lib/session");

runHarness("e2e_assay_surface", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  const surfaceAnchor = `anchor-pane-${paneId}-surface`;

  check(await readAnchorByte(win, surfaceAnchor) === 0,
    `initial anchor-surface byte === 0 (no surface open)`);

  // Cmd-A → OPENED{kind:"assay"}.
  const preOpen = readJsonl().length;
  await win.keyboard.press("Meta+a");
  await new Promise((r) => setTimeout(r, 400));

  const opens = readJsonl().slice(preOpen).filter((s) => s.kind === "SURFACE_OPENED");
  check(opens.length === 1, `one SURFACE_OPENED after Cmd-A (got ${opens.length})`);
  check(opens[0].payload.kind === "assay", `OPENED.kind === "assay"`);
  check(opens[0].payload.prior_kind === null, `OPENED.prior_kind === null`);
  check(await readAnchorByte(win, surfaceAnchor) === 3, `anchor byte === 3 (assay ordinal per Layer 7)`);

  const surface = win.locator(`[data-testid="surface-assay-${paneId}"]`);
  await surface.waitFor({ state: "attached", timeout: 3000 });
  check(await surface.getAttribute("data-rows") === "0",
    `Assay surface mounts with 0 rows (v0.1 defer of drill-in)`);

  // Esc → CLOSED{kind:"assay"}.
  const preClose = readJsonl().length;
  await surface.focus();
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 300));

  const closes = readJsonl().slice(preClose).filter((s) => s.kind === "SURFACE_CLOSED");
  check(closes.length === 1, `one SURFACE_CLOSED after Esc`);
  check(closes[0].payload.kind === "assay", `CLOSED.kind === "assay"`);
  check(await readAnchorByte(win, surfaceAnchor) === 0, `anchor byte back to 0`);
  check(await win.locator(`[data-testid="surface-assay-${paneId}"]`).count() === 0,
    `Assay surface unmounts on close`);

  // Layer 5 mutex test — open Records first, then Assay: expect
  // CLOSED{records} + OPENED{assay, prior_kind:"records"} same-step.
  await win.keyboard.press("Meta+r");
  await new Promise((r) => setTimeout(r, 300));
  const preMutex = readJsonl().length;
  await win.keyboard.press("Meta+a");
  await new Promise((r) => setTimeout(r, 400));

  const mutexEmits = readJsonl().slice(preMutex);
  const cList = mutexEmits.filter((s) => s.kind === "SURFACE_CLOSED");
  const oList = mutexEmits.filter((s) => s.kind === "SURFACE_OPENED");
  check(cList.length === 1 && cList[0].payload.kind === "records",
    `mutex fires CLOSED{records} (got ${cList.length} closes)`);
  check(oList.length === 1 && oList[0].payload.kind === "assay",
    `mutex fires OPENED{assay}`);
  check(oList[0].payload.prior_kind === "records",
    `mutex OPENED.prior_kind === "records" (got ${oList[0].payload.prior_kind})`);
  check(await readAnchorByte(win, surfaceAnchor) === 3, `anchor byte 3 after mutex switch`);

  // Symmetry over the whole trace.
  const emits = readJsonl();
  const opens_total = emits.filter((s) => s.kind === "SURFACE_OPENED").length;
  const closes_total = emits.filter((s) => s.kind === "SURFACE_CLOSED").length;
  // The last-opened surface is still open at teardown; close it so
  // the trace balances (F-5 discipline).
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
  const finalEmits = readJsonl();
  const final_opens = finalEmits.filter((s) => s.kind === "SURFACE_OPENED").length;
  const final_closes = finalEmits.filter((s) => s.kind === "SURFACE_CLOSED").length;
  check(final_opens === final_closes,
    `SURFACE_OPENED count === SURFACE_CLOSED count after teardown close (${final_opens} vs ${final_closes})`);
  void opens_total; void closes_total;
});
