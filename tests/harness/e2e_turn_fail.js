// tests/harness/e2e_turn_fail.js — Sprint 013 three-channel harness.
// Exercises queue_full: fires five concurrent turn submits so the fifth
// hits SessionRegistry.try_enqueue_turn against the cap of 4 and comes
// back as TURN_SUBMIT_FAILED{reason:"queue_full"}. The other four typed
// reasons (session_ended, fresh_session_requires_user_message,
// torn_record_on_resume, timeout) are typed paths in bridge/main.py but
// the shell's design precludes UI-triggered reproduction — see the
// Sprint 013 close entry.

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { runTonalChecks } = require("./tonal-checks");
const { assertLayer2ShapesInTrace, assertNoInventedTags } = require("./payload-check");

const REPO = path.resolve(__dirname, "..", "..");
const AS = () => path.join(os.homedir(), "Library", "Application Support", "substrate-ui");
const harnessJsonl = () => path.join(AS(), "harness", "last.jsonl");
const SESSIONS_ROOT = path.join(os.homedir(), ".substrate", "sessions");

async function readJsonl() {
  return fs.existsSync(harnessJsonl())
    ? fs.readFileSync(harnessJsonl(), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))
    : [];
}

async function main() {
  const fails = [];
  const ok = (m) => console.log("  ok  " + m);
  const check = (cond, m) => { if (!cond) fails.push(m); else ok(m); };

  try { fs.mkdirSync(path.dirname(harnessJsonl()), { recursive: true }); fs.writeFileSync(harnessJsonl(), ""); } catch (_) {}
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-fail-ws-"));

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."], cwd: REPO,
    env: {
      ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1",
      // Hold each admitted turn slot for 500ms so five concurrent submits stack
      // to depth 5, tripping the queue cap at 4 on the fifth try_enqueue.
      HARNESS_TURN_SLEEP_MS: "500",
    },
  });

  let sid = null;
  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
    await new Promise((r) => setTimeout(r, 300));

    const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));
    const picker = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await picker.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1500));
    sid = (await readJsonl()).find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id;
    check(!!sid, `session bound (session_id=${sid})`);

    // Fire five submits back-to-back. Each fills the prompt (which was cleared
    // by the previous TURN_SUBMIT_START) and immediately presses ⌘⏎. The
    // sequential UI dispatches produce five concurrent bridge round-trips
    // because bridgeRequest doesn't await between them; the fifth hits the
    // per-session queue cap of 4.
    const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
    for (let i = 0; i < 5; i++) {
      await prompt.focus();
      await prompt.fill(`turn-${i}`);
      await win.keyboard.press("Meta+Enter");
    }
    await new Promise((r) => setTimeout(r, 8000)); // deterministic turns are fast; wait for all 5 to settle

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    const emits = await readJsonl();
    const requested = emits.filter((s) => s.kind === "TURN_SUBMIT_REQUESTED");
    const submitted = emits.filter((s) => s.kind === "TURN_SUBMITTED");
    const failed = emits.filter((s) => s.kind === "TURN_SUBMIT_FAILED");

    check(requested.length === 5, `five TURN_SUBMIT_REQUESTED emits (got ${requested.length})`);
    check(failed.length >= 1, `at least one TURN_SUBMIT_FAILED emits (got ${failed.length})`);
    check(submitted.length + failed.length === 5,
      `total ack count === request count (${submitted.length} + ${failed.length} vs 5)`);

    const queueFullFailures = failed.filter((s) => s.payload?.reason === "queue_full");
    check(queueFullFailures.length >= 1,
      `at least one TURN_SUBMIT_FAILED carries reason="queue_full" (got ${queueFullFailures.length})`);

    // Every failure correlates by request_id to a requested.
    const requestedIds = new Set(requested.map((s) => s.payload.request_id));
    const allFailuresCorrelate = failed.every((s) => requestedIds.has(s.payload.request_id));
    check(allFailuresCorrelate, `every TURN_SUBMIT_FAILED.request_id matches a TURN_SUBMIT_REQUESTED`);

    // Vocabulary + shape discipline.
    const kinds = emits.map((s) => s.kind);
    try { assertNoInventedTags(emits); ok("zero invented tag names in the trace"); }
    catch (e) { fails.push(e.message); }
    try { assertLayer2ShapesInTrace(emits); ok("Layer 2 payload shapes match required fields"); }
    catch (e) { fails.push(e.message); }

  } finally {
    if (sid) {
      try { fs.rmSync(path.join(SESSIONS_ROOT, sid), { recursive: true, force: true }); } catch (_) {}
      try {
        const byName = path.join(SESSIONS_ROOT, "by-name.json");
        if (fs.existsSync(byName)) {
          const data = JSON.parse(fs.readFileSync(byName, "utf8"));
          for (const k of Object.keys(data)) if (data[k] === sid) delete data[k];
          fs.writeFileSync(byName, JSON.stringify(data));
        }
      } catch (_) {}
    }
    try { fs.rmSync(workspace, { recursive: true, force: true }); } catch (_) {}
  }

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · queue_full triggered on the 5th of 5 concurrent submits`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
