// tests/harness/payload-check.js — Layer 2 schema-shape assertion for the
// harness. Reads signals/0.1.json v0.1's payload_schemas at the required-set
// level (name-only presence). Extra fields are permitted (Layer 2 does not
// close additionalProperties in v0.1); missing required fields fail.
//
// Every sprint's e2e_*.js calls assertLayer2ShapesInTrace(emits) after
// reading the JSONL to grade shape-correctness against the ratified schemas.

"use strict";
const path = require("node:path");
const fs = require("node:fs");

const REPO = path.resolve(__dirname, "..", "..");

let cachedSchemas = null;
function schemas() {
  if (cachedSchemas) return cachedSchemas;
  const data = JSON.parse(fs.readFileSync(path.join(REPO, "signals/0.1.json"), "utf8"));
  cachedSchemas = data.layer_2_payload.payload_schemas;
  // F-1 tightening — Layer 1 ⊆ Layer 2 must hold: every ratified tag
  // needs a payload schema. A Layer 1 tag with no Layer 2 entry lets
  // a malformed payload slide past the harness (assertLayer2Shapes
  // skips schema-less tags on line ~34). Fail loud at module load.
  const tagNames = data.layer_1_lexical.tags.map((t) => t.name);
  const missing = tagNames.filter((n) => !(n in cachedSchemas));
  if (missing.length) {
    throw new Error(
      `Layer 1 tags missing Layer 2 schema entries (${missing.length}): ` +
      `${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " …" : ""}`,
    );
  }
  return cachedSchemas;
}

// Tags that are event-cadence noise the harness excludes to keep failure
// output small. ANCHOR_PAINTED fires per anchor per rAF; validating shape
// on every one adds no signal.
const NOISE = new Set(["ANCHOR_PAINTED"]);

function assertLayer2ShapesInTrace(emits) {
  const s = schemas();
  const misses = [];
  for (const sig of emits) {
    if (NOISE.has(sig.kind)) continue;
    const schema = s[sig.kind];
    if (!schema) continue; // Tag name discipline is checked elsewhere.
    const required = schema.required || [];
    const payload = sig.payload || {};
    for (const field of required) {
      if (!(field in payload)) {
        misses.push({ kind: sig.kind, missing: field, payload });
      }
    }
  }
  if (misses.length) {
    const first = misses[0];
    throw new Error(
      `Layer 2 shape drift: ${misses.length} required-field misses across the trace. ` +
      `First: ${first.kind}.${first.missing} missing (payload keys: ${Object.keys(first.payload).join(",")})`
    );
  }
}

// Vocabulary-check: every emitted tag name must live in Layer 1 v0.1's
// ratified `tags[].name` list. Sourced from signals/0.1.json — the same
// authority the shell's Emitter reads. Any drift between the shell and
// this check is impossible: both read the JSON.
let cachedVocab = null;
function vocab() {
  if (cachedVocab) return cachedVocab;
  const data = JSON.parse(fs.readFileSync(path.join(REPO, "signals/0.1.json"), "utf8"));
  cachedVocab = new Set(data.layer_1_lexical.tags.map((t) => t.name));
  return cachedVocab;
}

function assertNoInventedTags(emits) {
  const v = vocab();
  const invented = emits.map((e) => e.kind).filter((k) => !v.has(k));
  if (invented.length) {
    throw new Error(`invented tag names in the trace: ${[...new Set(invented)].join(", ")}`);
  }
}

module.exports = { assertLayer2ShapesInTrace, assertNoInventedTags };
