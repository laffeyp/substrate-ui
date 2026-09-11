// tests/harness/e2e_probe_driver.js — Sprint 008.
// The picker's Enter fires PROBE_DRIVER_REQUESTED → PROBE_DRIVER_PROBED
// BEFORE SESSION_CREATE_REQUESTED. The probe carries driver + request_id;
// the probed reply carries driver + context_tokens. Layer 5 forced_next:
// probe gates create.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession,
} = require("./lib/session");

let sid = null;
const workspace = mkWorkspace("probe");
process.on("exit", () => { cleanupSession(sid); rmWorkspace(workspace); });

runHarness("e2e_probe_driver", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  const input = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
  await input.fill(workspace);
  await win.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 1500));

  const emits = readJsonl();
  const kinds = emits.map((s) => s.kind);
  const iReq = kinds.indexOf("PROBE_DRIVER_REQUESTED");
  const iOk  = kinds.indexOf("PROBE_DRIVER_PROBED");
  const iCReq = kinds.indexOf("SESSION_CREATE_REQUESTED");
  const iCOk  = kinds.indexOf("SESSION_CREATED");
  check(iReq >= 0, `PROBE_DRIVER_REQUESTED fires`);
  check(iOk > iReq, `PROBE_DRIVER_PROBED follows request`);
  check(iCReq > iOk, `SESSION_CREATE_REQUESTED fires AFTER probe (Layer 5 forced_next)`);
  check(iCOk > iCReq, `SESSION_CREATED follows create request`);

  const probeReq = emits[iReq].payload;
  check(probeReq.driver === "deterministic", `probe carries driver="deterministic" (got ${probeReq.driver})`);
  check("request_id" in probeReq, `probe carries request_id`);
  const probeOk = emits[iOk].payload;
  check(probeOk.driver === "deterministic", `PROBE_DRIVER_PROBED.driver === "deterministic"`);
  check("context_tokens" in probeOk, `PROBE_DRIVER_PROBED carries context_tokens`);

  sid = emits.find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id ?? null;
});
