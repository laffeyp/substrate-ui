// tests/harness/e2e_fixture_real_record.js — fixture harness.
//
// Grades the shell against a real parked ~/.substrate/sessions/ record
// on disk — a session written by a real driver (kimi-k2, deepseek-r1,
// whatever) rather than by the deterministic responder. The only path
// that catches shape drift in envelopes the deterministic driver never
// emits: multi-turn transcripts, real Park.reason values, ToolCall +
// ToolResult, real SessionEnded reasons.
//
// Session pick: the parked session with the most UserMessage envelopes,
// or the one named by HARNESS_FIXTURE_SID / SUBSTRATE_HARNESS_FIXTURE_
// SESSION_ID. This harness never plants or mutates state; it reads.

"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");

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
  const forced = process.env.SUBSTRATE_HARNESS_FIXTURE_SESSION_ID
              || process.env.HARNESS_FIXTURE_SID;
  if (forced) return forced;
  let best = null, bestScore = 0;
  for (const dirent of fs.readdirSync(SESSIONS_ROOT)) {
    if (dirent === "by-name.json") continue;
    const sd = path.join(SESSIONS_ROOT, dirent);
    if (!fs.statSync(sd).isDirectory()) continue;
    const mp = path.join(sd, "manifest.json");
    if (!fs.existsSync(mp)) continue;
    let manifest;
    try { manifest = JSON.parse(fs.readFileSync(mp, "utf8")); } catch { continue; }
    if (manifest.status !== "parked") continue;
    const envs = readEnvelopes(manifest.session_id);
    const userCount = envs.filter((e) => e.kind === "UserMessage").length;
    if (userCount > bestScore) { bestScore = userCount; best = manifest.session_id; }
  }
  return best;
}

const sid = pickRichestSession();
if (!sid) {
  console.log("SKIP — no parked adhoc session on disk with a UserMessage; run an Ollama session first.");
  process.exit(0);
}
console.log(`  ok  fixture session picked: ${sid}`);
const envs = readEnvelopes(sid);
const visibleEnvs = envs.filter((e) => VISIBLE_KINDS.has(e.kind));
console.log(`  ok  record has ${envs.length} total envelopes, ${visibleEnvs.length} user-visible`);
const byKind = new Map();
for (const e of visibleEnvs) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);
console.log("  record kinds:", [...byKind.entries()].map(([k, n]) => `${k}=${n}`).join(", "));

runHarness("e2e_fixture_real_record", async ({ win, check }) => {
  await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
  const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));

  const row = win.locator(`[data-testid="resume-row-${sid}"]`);
  await row.waitFor({ state: "attached", timeout: 30000 });
  await row.click();
  await new Promise((r) => setTimeout(r, 3000));

  const rows = win.locator(`[data-testid^="transcript-row-${paneId}-"]`);
  const domRowCount = await rows.count();
  check(domRowCount >= visibleEnvs.length,
    `shell renders ≥ ${visibleEnvs.length} transcript rows (got ${domRowCount})`);

  const shotPath = path.join(__dirname, `shot-fixture-${sid.slice(0, 8)}.png`);
  await win.locator(`[data-pane-id="${paneId}"]`).screenshot({ path: shotPath });
  console.log(`  ok  screenshot → ${shotPath}`);

  const emits = readJsonl();
  const emittedSeqs = new Set(
    emits.filter((s) => s.kind.startsWith("TRANSCRIPT_")).map((s) => s.payload?.envelope_seq)
  );
  const missing = visibleEnvs.filter((e) => !emittedSeqs.has(e.seq));
  check(missing.length === 0,
    `every visible envelope has a matching TRANSCRIPT_* emit (missing: ${missing.map((e) => `${e.seq}(${e.kind})`).slice(0, 5).join(", ") || "none"})`);

  const parks = emits.filter((s) => s.kind === "TRANSCRIPT_PARK_RENDERED");
  for (const p of parks) {
    check(RATIFIED_PARK_REASONS.has(p.payload?.park_reason),
      `TRANSCRIPT_PARK_RENDERED.park_reason ∈ Layer 2 enum (got ${p.payload?.park_reason})`);
  }
  if (byKind.has("Park")) {
    check(parks.length === byKind.get("Park"),
      `PARK emit count matches record's Park count (${parks.length} vs ${byKind.get("Park")})`);
  }
  if (byKind.has("ToolCall")) {
    const toolCallRows = emits.filter((s) =>
      s.kind === "TRANSCRIPT_ROW_RENDERED" && s.payload?.envelope_kind === "ToolCall");
    check(toolCallRows.length === byKind.get("ToolCall"),
      `ToolCall row count matches record`);
  }
  if (byKind.has("ToolResult")) {
    const toolResultRows = emits.filter((s) =>
      s.kind === "TRANSCRIPT_ROW_RENDERED" && s.payload?.envelope_kind === "ToolResult");
    check(toolResultRows.length === byKind.get("ToolResult"),
      `ToolResult row count matches record`);
  }

  const transcriptEmits = emits.filter((s) =>
    s.kind === "TRANSCRIPT_ROW_RENDERED" ||
    s.kind === "TRANSCRIPT_PARK_RENDERED" ||
    s.kind === "TRANSCRIPT_SESSION_ENDED_RENDERED" ||
    s.kind === "TRANSCRIPT_COMPACTED_RENDERED" ||
    s.kind === "TRANSCRIPT_RATE_LIMITED_RENDERED");
  const seqs = transcriptEmits.map((s) => s.payload.envelope_seq);
  check(seqs.every((s, i) => i === 0 || s > seqs[i - 1]),
    `envelope_seq monotonic across ${seqs.length} transcript emits`);
});
