// tests/harness/lib/signal_report.js — write the per-harness Signal Report.
//
// Foundation 02 §"Stage 1 — Capture and Paste" and templates/SIGNAL_REPORT.md
// name the artifact the harness run produces for handoff — Observed /
// Expected / Delta / Hypothesis with the JSONL trace embedded. Each harness
// calls writeSignalReport() at close so PASS state is transmissible per
// PRINCIPLES commitment 6 ("originals over summaries when transmitting
// between sessions"), not just a stdout line that evaporates.

"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { readJsonl } = require("./jsonl");

const REPO = path.resolve(__dirname, "..", "..", "..");
const REPORTS_DIR = path.join(REPO, "process", "signal_reports");

function ensureDir() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function stamp() {
  const d = new Date();
  const iso = d.toISOString().replace(/[:.]/g, "-");
  return iso;
}

/**
 * Write a Signal Report for one harness run.
 *
 * @param {object} args
 * @param {string} args.harness           harness file basename (e2e_boot etc.)
 * @param {"PASS"|"FAIL"} args.outcome
 * @param {string} args.summary           one-line summary
 * @param {string[]} args.observed        each "ok" or "fail" line
 * @param {string[]} [args.hypothesis]    on FAIL: the hypothesis lines
 */
function writeSignalReport(args) {
  ensureDir();
  const stamped = `${stamp()}-${args.harness}-${args.outcome}.md`;
  const p = path.join(REPORTS_DIR, stamped);
  const emits = readJsonl();
  const lines = [
    `# Signal report — ${args.harness}`,
    ``,
    `Outcome: **${args.outcome}**`,
    `Summary: ${args.summary}`,
    ``,
    `## Observed`,
    ...args.observed.map((s) => `- ${s}`),
    ``,
    `## Expected`,
    `- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.`,
    `- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.`,
    `- Every pairing_ordering / forbidden_after rule in Layer 5 holds.`,
    `- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.`,
    ``,
    `## Delta`,
    args.outcome === "PASS" ? `- Zero — every axis agrees.` : `- Fails listed above.`,
    ``,
  ];
  if (args.hypothesis && args.hypothesis.length) {
    lines.push(`## Hypothesis`, ...args.hypothesis.map((h) => `- ${h}`), ``);
  }
  lines.push(`## Trace — ${emits.length} emits`, "", "```jsonl");
  for (const e of emits) lines.push(JSON.stringify(e));
  lines.push("```", "");
  fs.writeFileSync(p, lines.join("\n"));
  return p;
}

module.exports = { writeSignalReport, REPORTS_DIR };
