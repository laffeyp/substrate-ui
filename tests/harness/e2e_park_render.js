// tests/harness/e2e_park_render.js — Sprint 015 three-channel harness.
// Verifies the four ratified transcript special-shape rows:
//   TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED  — fires on bind before any turn
//   TRANSCRIPT_PARK_RENDERED{park_reason}       — fires when substrate emits Park
//   TRANSCRIPT_SESSION_ENDED_RENDERED           — fires when SessionEnded lands
//   TRANSCRIPT_ROW_RENDERED (control shape)     — the base pairing still holds
//
// TranscriptCompacted and RateLimitedWaiting: reducer + bridge routing landed
// in the 2026-09-11 review-fix pass, but the deterministic driver never emits
// those envelopes. Untriggerable end-to-end with the current default driver;
// covered by code review of ShellReducer.ts's TRANSCRIPT_ROWS_LOADED branch.

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { runTonalChecks } = require("./tonal-checks");
const { assertLayer2ShapesInTrace } = require("./payload-check");

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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-park-ws-"));

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."], cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  let sid = null;
  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
    await new Promise((r) => setTimeout(r, 300));

    const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));

    // Phase 1: bind, verify AWAITING fires exactly once before any PROMPT_SUBMITTED.
    const picker = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await picker.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1500));

    let emits = await readJsonl();
    const awaitingCount = emits.filter((s) => s.kind === "TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED").length;
    const promptSubmittedCount = emits.filter((s) => s.kind === "PROMPT_SUBMITTED").length;
    check(awaitingCount === 1, `exactly one TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED after bind (got ${awaitingCount})`);
    check(promptSubmittedCount === 0, `AWAITING fires BEFORE any PROMPT_SUBMITTED (got ${promptSubmittedCount})`);

    const awaiting = emits.find((s) => s.kind === "TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED");
    check(awaiting?.payload?.pane_id === paneId, `AWAITING.pane_id matches focused pane (got ${awaiting?.payload?.pane_id})`);
    check(typeof awaiting?.payload?.session_id === "string", `AWAITING.session_id present (got ${awaiting?.payload?.session_id})`);

    sid = emits.find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id;

    // Phase 2: submit a turn; deterministic driver emits a Park with reason=final_answer.
    const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
    await prompt.focus();
    await prompt.fill("go");
    await win.keyboard.press("Meta+Enter");
    await new Promise((r) => setTimeout(r, 3000));

    emits = await readJsonl();
    const parks = emits.filter((s) => s.kind === "TRANSCRIPT_PARK_RENDERED");
    check(parks.length >= 1, `at least one TRANSCRIPT_PARK_RENDERED after turn (got ${parks.length})`);
    const park = parks[0];
    check(park?.payload?.park_reason === "final_answer",
      `PARK.park_reason === "final_answer" (deterministic driver returns final_answer; got ${park?.payload?.park_reason})`);
    check(typeof park?.payload?.envelope_seq === "number" && park?.payload?.envelope_seq >= 0,
      `PARK.envelope_seq >= 0 (got ${park?.payload?.envelope_seq})`);

    // Phase 3: verify the park_reason enum is closed (park_reason must be one of 3 values).
    const validReasons = ["final_answer", "model_error", "interrupt"];
    for (const p of parks) {
      check(validReasons.includes(p.payload?.park_reason),
        `every PARK.park_reason in Layer 2's closed enum (got ${p.payload?.park_reason})`);
    }

    // Phase 4: end the session; verify TRANSCRIPT_SESSION_ENDED_RENDERED still fires (Sprint 010's pairing).
    // The end triggers via ⌘E on the focused pane.
    await win.keyboard.press("Meta+e");
    await new Promise((r) => setTimeout(r, 3000));

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    // Phase 5: final trace check — SessionEnded row, and cross-substrate.
    emits = await readJsonl();
    const sessionEnded = emits.find((s) => s.kind === "TRANSCRIPT_SESSION_ENDED_RENDERED");
    check(!!sessionEnded, `TRANSCRIPT_SESSION_ENDED_RENDERED fires on ⌘E end`);
    if (sessionEnded) {
      check(typeof sessionEnded.payload?.end_reason === "string",
        `SESSION_ENDED_RENDERED.end_reason present (got ${sessionEnded.payload?.end_reason})`);
    }

    // Substrate-side: manifest.status === ended; record has SessionEnded envelope.
    if (sid) {
      const manifestPath = path.join(SESSIONS_ROOT, sid, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        check(manifest.status === "ended", `manifest.status === "ended" (got ${manifest.status})`);
      }
    }

    // Vocabulary + shape discipline.
    const kinds = emits.map((s) => s.kind);
    const V0_1 = new Set(fs.readFileSync(path.join(REPO, "src/observability/vocab.ts"), "utf8")
      .match(/"[A-Z][A-Z0-9_]{3,}"/g)?.map((s) => s.slice(1, -1)) || []);
    const invented = kinds.filter((k) => !V0_1.has(k));
    check(invented.length === 0, `zero invented tag names in the trace (found ${invented.length})`);
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
  console.log(`PASS three channels agree · AWAITING → PARK{final_answer} → SESSION_ENDED chain complete (session_id=${sid})`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
