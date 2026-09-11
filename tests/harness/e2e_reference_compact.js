// tests/harness/e2e_reference_compact.js — the reference compact harness.
//
// Proves the shared library's six primitives — jsonl / assert / anchor /
// launch / session / layer5 — reduce a full sprint check to under a dozen
// lines. Bind → submit → assert three-channel agreement (anchor read-back,
// sequence, Layer 2 shapes, Layer 5 ordering).

"use strict";
const { launchApp } = require("./lib/launch");
const { resetJsonl, readJsonl } = require("./lib/jsonl");
const { makeCheck, assertSignal, assertSequence } = require("./lib/assert");
const { assertAnchorByte } = require("./lib/anchor");
const { assertLayer5 } = require("./lib/layer5");
const { assertLayer2ShapesInTrace, assertNoInventedTags } = require("./payload-check");
const { runTonalChecks } = require("./tonal-checks");
const {
  mkWorkspace, rmWorkspace, cleanupSession,
  waitForFirstPane, bindWorkspace, submitPrompt,
} = require("./lib/session");
const { writeSignalReport } = require("./lib/signal_report");

async function main() {
  const check = makeCheck();
  resetJsonl();
  const workspace = mkWorkspace("reference-compact");
  const app = await launchApp();
  let sid = null;
  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    const paneId = await waitForFirstPane(win);

    // Sprint 002's contract — first pane, anchors, boot sequence.
    await assertAnchorByte(win, `anchor-pane-${paneId}-focus`, 255);
    await assertAnchorByte(win, `anchor-pane-${paneId}-status`, 0);
    check(true, "anchors decode (focus=255, status=0)");

    // Sprint 007's contract — session create.
    sid = await bindWorkspace(win, paneId, workspace);
    check(!!sid, `session bound (session_id=${sid})`);
    await assertAnchorByte(win, `anchor-pane-${paneId}-status`, 64); // parked

    // Sprint 012's contract — real turn round-trip through substrate.
    const done = await submitPrompt(win, paneId, "hello");
    check(done.kind === "TURN_SUBMITTED", `turn submitted (kind=${done.kind})`);

    await runTonalChecks(win);
    check(true, "standing tonal checks pass");
    await app.close();

    const emits = readJsonl();

    // Structural: boot + create + turn sequence.
    assertSequence(emits, ["WINDOW_OPENED", "PANE_CREATED", "PANE_FOCUSED"]);
    assertSequence(emits, ["SESSION_CREATE_REQUESTED", "SESSION_CREATED", "PANE_UNBOUND_BOUND"]);
    assertSequence(emits, ["PROMPT_SUBMITTED", "TURN_SUBMIT_REQUESTED", "TURN_SUBMITTED"]);
    check(true, "three ratified sequences present in the trace");

    // Payload + tag + Layer 5 discipline.
    assertNoInventedTags(emits); check.ok("zero invented tag names");
    assertLayer2ShapesInTrace(emits); check.ok("Layer 2 payload shapes match required fields");
    assertLayer5(emits); check.ok("Layer 5 pairing_ordering + forbidden_after hold");

    // Real record integrity.
    const created = assertSignal(emits, "SESSION_CREATED");
    check(created.payload.workspace === workspace, `SESSION_CREATED.workspace === ${workspace}`);
  } finally {
    cleanupSession(sid);
    rmWorkspace(workspace);
  }

  const outcome = check.summary().length ? "FAIL" : "PASS";
  const summary = outcome === "PASS"
    ? `reference-compact — six primitives, three-channel agreement (session_id=${sid})`
    : `reference-compact — ${check.summary().length} fails (session_id=${sid})`;
  const reportPath = writeSignalReport({
    harness: "e2e_reference_compact",
    outcome, summary,
    observed: check.summary().length
      ? check.summary().map((s) => `FAIL: ${s}`)
      : ["all checks passed"],
    hypothesis: outcome === "FAIL"
      ? ["A dependency of the compact harness path drifted; run the sprint-specific harness for the failing axis to localize."]
      : undefined,
  });
  console.log("");
  console.log(`signal report → ${reportPath}`);
  if (outcome === "FAIL") { for (const m of check.summary()) console.error("  " + m); process.exit(1); }
  console.log(`PASS ${summary}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
