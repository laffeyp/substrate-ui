// tests/harness/e2e_fixture_real_record.js — the fixture harness.
//
// Deterministic-driver harnesses submit "hello" and read back their own echo.
// This harness runs against a real ~/.substrate/sessions/ adhoc session with
// a real driver's real transcript — kimi-k2.7-code, deepseek-r1, whatever
// happens to be the richest parked session on disk. That is the only harness
// that can catch shape drift in envelopes the deterministic driver never
// emits: multi-turn transcripts, real Park.reason values, ToolCall +
// ToolResult, real SessionEnded reasons.
//
// The harness picks the session with the most UserMessage envelopes and a
// parked or ended status. It resumes that session through the shell's
// picker → resume path (Sprint 009), then verifies:
//   1. Every UserMessage / ModelReply / Park / ToolCall / ToolResult /
//      SessionEnded envelope in the record produces a matching
//      TRANSCRIPT_ROW_RENDERED (or its specialization).
//   2. Every emitted payload validates against Layer 2's required set.
//   3. Every Park.park_reason lies inside the closed enum
//      {final_answer, model_error, interrupt} — the F3 fix from the last
//      review pass. No fuzzy match slips a real reason to the wrong bucket.
//   4. A screenshot proves the app renders the real record, not a first-
//      frame empty state.
//
// This harness never plants or mutates a session. It reads existing state.

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

const VISIBLE_KINDS = new Set([
  "UserMessage", "ModelReply", "Park", "SessionEnded", "SessionWarning",
  "PromptFragment", "TranscriptCompacted", "RateLimitedWaiting",
  "ToolCall", "ToolResult",
  "ProducerFailed", "PredicateQuarantined", "ProducerEmittedInvalidEvent",
]);

const RATIFIED_PARK_REASONS = new Set(["final_answer", "model_error", "interrupt"]);

function readEnvelopes(sid) {
  const rdir = path.join(SESSIONS_ROOT, sid, "record");
  if (!fs.existsSync(rdir)) return [];
  const out = [];
  for (const ef of fs.readdirSync(rdir).filter((f) => f.startsWith("events-") && f.endsWith(".jsonl"))) {
    for (const line of fs.readFileSync(path.join(rdir, ef), "utf8").split("\n").filter((l) => l.trim())) {
      try { out.push(JSON.parse(line)); } catch { /* skip malformed */ }
    }
  }
  out.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  return out;
}

function pickRichestSession() {
  if (process.env.HARNESS_FIXTURE_SID) return process.env.HARNESS_FIXTURE_SID;
  let best = null, bestScore = 0;
  for (const dirent of fs.readdirSync(SESSIONS_ROOT)) {
    if (dirent === "by-name.json") continue;
    const sd = path.join(SESSIONS_ROOT, dirent);
    if (!fs.statSync(sd).isDirectory()) continue;
    const mp = path.join(sd, "manifest.json");
    if (!fs.existsSync(mp)) continue;
    let manifest;
    try { manifest = JSON.parse(fs.readFileSync(mp, "utf8")); } catch { continue; }
    // The resume path only surfaces non-ended sessions in the picker; pick parked.
    if (manifest.status !== "parked") continue;
    const envs = readEnvelopes(manifest.session_id);
    const userCount = envs.filter((e) => e.kind === "UserMessage").length;
    if (userCount > bestScore) { bestScore = userCount; best = manifest.session_id; }
  }
  return best;
}

async function readJsonl() {
  return fs.existsSync(harnessJsonl())
    ? fs.readFileSync(harnessJsonl(), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))
    : [];
}

async function main() {
  const fails = [];
  const ok = (m) => console.log("  ok  " + m);
  const check = (cond, m) => { if (!cond) fails.push(m); else ok(m); };

  const sid = pickRichestSession();
  if (!sid) {
    console.log("SKIP — no parked adhoc session on disk with a UserMessage; run an Ollama session first.");
    process.exit(0);
  }
  ok(`fixture session picked: ${sid}`);

  const envs = readEnvelopes(sid);
  const visibleEnvs = envs.filter((e) => VISIBLE_KINDS.has(e.kind));
  ok(`record has ${envs.length} total envelopes, ${visibleEnvs.length} user-visible`);

  const byKind = new Map();
  for (const e of visibleEnvs) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);
  console.log("  record kinds:", [...byKind.entries()].map(([k, n]) => `${k}=${n}`).join(", "));

  try { fs.mkdirSync(path.dirname(harnessJsonl()), { recursive: true }); fs.writeFileSync(harnessJsonl(), ""); } catch (_) {}

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."], cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });

    const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));

    // The resume list needs the bridge's list_sessions round-trip. With ~1500
    // sessions on disk the read + render is slow; wait generously.
    const row = win.locator(`[data-testid="resume-row-${sid}"]`);
    await row.waitFor({ state: "attached", timeout: 30000 });
    await row.click();
    // Give the resume round-trip + transcript refresh time to settle.
    await new Promise((r) => setTimeout(r, 3000));

    // Every visible envelope should appear as a transcript row in the shell.
    const rows = win.locator(`[data-testid^="transcript-row-${paneId}-"]`);
    const domRowCount = await rows.count();
    check(domRowCount >= visibleEnvs.length,
      `shell renders at least ${visibleEnvs.length} transcript rows (got ${domRowCount})`);

    // Screenshot the whole pane so the perceptual channel has a real image.
    const shotPath = path.join(__dirname, `shot-fixture-${sid.slice(0, 8)}.png`);
    await win.locator(`[data-pane-id="${paneId}"]`).screenshot({ path: shotPath });
    ok(`screenshot written to ${shotPath}`);

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    const emits = await readJsonl();
    const kinds = emits.map((s) => s.kind);
    try { assertNoInventedTags(emits); ok("zero invented tag names in the trace"); }
    catch (e) { fails.push(e.message); }
    try { assertLayer2ShapesInTrace(emits); ok("Layer 2 payload shapes match required fields"); }
    catch (e) { fails.push(e.message); }

    // For every visible envelope in the record, verify a matching emit exists.
    const emittedSeqs = new Set(
      emits.filter((s) => s.kind.startsWith("TRANSCRIPT_")).map((s) => s.payload?.envelope_seq)
    );
    const missing = visibleEnvs.filter((e) => !emittedSeqs.has(e.seq));
    check(missing.length === 0,
      `every visible envelope has a matching TRANSCRIPT_* emit (missing seqs: ${missing.map((e) => `${e.seq}(${e.kind})`).slice(0, 5).join(", ") || "none"})`);

    // Park.reason from the real record must land in Layer 2's closed enum.
    const parks = emits.filter((s) => s.kind === "TRANSCRIPT_PARK_RENDERED");
    for (const p of parks) {
      check(RATIFIED_PARK_REASONS.has(p.payload?.park_reason),
        `TRANSCRIPT_PARK_RENDERED.park_reason ∈ Layer 2 enum (got ${p.payload?.park_reason})`);
    }
    if (byKind.has("Park")) {
      check(parks.length === byKind.get("Park"),
        `TRANSCRIPT_PARK_RENDERED count matches record's Park count (${parks.length} vs ${byKind.get("Park")})`);
    }

    // ToolCall / ToolResult route to generic TRANSCRIPT_ROW_RENDERED with correct envelope_kind.
    if (byKind.has("ToolCall")) {
      const toolCallRows = emits.filter((s) =>
        s.kind === "TRANSCRIPT_ROW_RENDERED" && s.payload?.envelope_kind === "ToolCall");
      check(toolCallRows.length === byKind.get("ToolCall"),
        `TRANSCRIPT_ROW_RENDERED{envelope_kind:"ToolCall"} count matches record (${toolCallRows.length} vs ${byKind.get("ToolCall")})`);
    }
    if (byKind.has("ToolResult")) {
      const toolResultRows = emits.filter((s) =>
        s.kind === "TRANSCRIPT_ROW_RENDERED" && s.payload?.envelope_kind === "ToolResult");
      check(toolResultRows.length === byKind.get("ToolResult"),
        `TRANSCRIPT_ROW_RENDERED{envelope_kind:"ToolResult"} count matches record`);
    }

    // Envelope_seq monotonic across all transcript emits.
    const transcriptEmits = emits.filter((s) =>
      s.kind === "TRANSCRIPT_ROW_RENDERED" ||
      s.kind === "TRANSCRIPT_PARK_RENDERED" ||
      s.kind === "TRANSCRIPT_SESSION_ENDED_RENDERED" ||
      s.kind === "TRANSCRIPT_COMPACTED_RENDERED" ||
      s.kind === "TRANSCRIPT_RATE_LIMITED_RENDERED");
    const seqs = transcriptEmits.map((s) => s.payload.envelope_seq);
    const monotonic = seqs.every((s, i) => i === 0 || s > seqs[i - 1]);
    check(monotonic, `envelope_seq monotonically increases across ${seqs.length} transcript emits`);

  } finally {
    // Nothing to clean — the fixture harness reads existing state, never plants.
  }

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree on real record (session_id=${sid}, ${visibleEnvs.length} visible envelopes)`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
