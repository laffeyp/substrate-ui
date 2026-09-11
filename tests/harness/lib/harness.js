// tests/harness/lib/harness.js — the sprint-harness scaffold.
//
// Every sprint harness has the same shell: reset the JSONL, launch the
// app, drive it, grade the trace against Layer 1/2/5 discipline, run the
// standing tonal checks, write a Signal Report per Foundation 02 §"Stage
// 1", close the app, exit with the right code. That shell lives here so
// each sprint harness reduces to the body between "start" and "end" —
// its scope-specific assertions and its scope-specific setup.
//
// A sprint harness that accepts a real substrate record as fixture reads
// the SUBSTRATE_HARNESS_FIXTURE_SESSION_ID env var; when set, the shell
// symlinks ~/.substrate/sessions/<sid> into the harness's own workspace
// so the sprint's assertions run against the real record, not a fresh
// deterministic one.

"use strict";

const { launchApp } = require("./launch");
const { resetJsonl, resetBridgeLog, readJsonl } = require("./jsonl");
const { makeCheck } = require("./assert");
const { assertLayer5 } = require("./layer5");
const { assertLayer2ShapesInTrace, assertNoInventedTags } = require("../payload-check");
const { runTonalChecks } = require("../tonal-checks");
const { writeSignalReport } = require("./signal_report");

const FIXTURE_SID_ENV = "SUBSTRATE_HARNESS_FIXTURE_SESSION_ID";

function fixtureSid() {
  return process.env[FIXTURE_SID_ENV] || null;
}

// The one place a sprint harness closes. Takes a name, an async body
// that receives {app, win, check, fixtureSid} and returns nothing (the
// body throws on FAIL or accumulates via check(false, msg)). Handles:
// reset → launch → body → tonal → close → grade Layer 1/2/5 → signal
// report → exit code.
async function runHarness(name, body, { extraEnv = {}, skipTonal = false, skipLayer5 = false } = {}) {
  resetJsonl();
  resetBridgeLog();
  const check = makeCheck();
  const app = await launchApp(extraEnv);
  const win = await app.firstWindow();
  await win.waitForLoadState("domcontentloaded");

  let bodyErr = null;
  try {
    await body({ app, win, check, fixtureSid: fixtureSid() });
  } catch (e) {
    bodyErr = e;
    check(false, `harness body threw: ${e.message}`);
  }

  if (!skipTonal) {
    try { await runTonalChecks(win); check.ok("standing tonal checks pass"); }
    catch (e) { check(false, `tonal check failed: ${e.message}`); }
  }

  try { await app.close(); } catch (_) {}

  const emits = readJsonl();
  try { assertNoInventedTags(emits); check.ok("zero invented tag names"); }
  catch (e) { check(false, e.message); }
  try { assertLayer2ShapesInTrace(emits); check.ok("Layer 2 payload shapes match required fields"); }
  catch (e) { check(false, e.message); }
  if (!skipLayer5) {
    try { assertLayer5(emits); check.ok("Layer 5 pairing_ordering + forbidden_after hold"); }
    catch (e) { check(false, e.message); }
  }

  const fails = check.summary();
  const outcome = fails.length ? "FAIL" : "PASS";
  const reportPath = writeSignalReport({
    harness: name,
    outcome,
    summary: outcome === "PASS"
      ? `${name} — three-channel agreement`
      : `${name} — ${fails.length} failing checks`,
    observed: fails.length ? fails.map((s) => `FAIL: ${s}`) : ["all checks passed"],
    hypothesis: outcome === "FAIL"
      ? ["Read the trace above; localize by the first FAIL entry."]
      : undefined,
  });

  console.log("");
  console.log(`signal report → ${reportPath}`);
  if (outcome === "FAIL") {
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
  process.exit(0);
}

module.exports = { runHarness, fixtureSid, FIXTURE_SID_ENV };
