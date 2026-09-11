// tests/harness/lib/anchor.js — the pixel-anchor read-back helper.
//
// The pixel-anchor mechanism is a round trip, not a one-way emit. The
// shell writes a grayscale byte to a 1×1 canvas; the harness reads that
// byte back and asserts it matches what the state's Layer 7 encoding
// says the byte SHOULD be. Trusting the ANCHOR_PAINTED tag's byte field
// is trusting the code under test to grade itself.
//
// This helper reads the actual canvas pixel via page.evaluate — a fresh
// getImageData call inside the renderer — and compares to the expected
// byte. The Layer 7 encoding table lives in signals/0.1.json § layer_7_
// evidence.evidence_constraints[pixel_anchor].

"use strict";
const fs = require("node:fs");
const path = require("node:path");

const REPO = path.resolve(__dirname, "..", "..", "..");

let cachedAnchors = null;
function loadAnchors() {
  if (cachedAnchors) return cachedAnchors;
  const data = JSON.parse(fs.readFileSync(path.join(REPO, "signals/0.1.json"), "utf8"));
  const constraints = data.layer_7_evidence.evidence_constraints;
  const pixel = constraints.find((c) => c.kind === "pixel_anchor");
  cachedAnchors = pixel?.anchors || {};
  return cachedAnchors;
}

// Read the RGB byte at (0,0) of the canvas identified by `[data-testid=<id>]`.
// Returns the byte value 0..255, or throws if the canvas is missing.
async function readAnchorByte(page, testid) {
  const byte = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!(el instanceof HTMLCanvasElement)) return null;
    const ctx = el.getContext("2d");
    if (!ctx) return null;
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return data[0]; // grayscale: R === G === B, so any channel is the byte
  }, `[data-testid="${testid}"]`);
  if (byte === null) {
    throw new Error(`readAnchorByte: no canvas at data-testid="${testid}"`);
  }
  return byte;
}

// Assert the pixel byte at the named anchor matches expected. Throws
// with the anchor id + expected + actual on mismatch.
async function assertAnchorByte(page, testid, expected) {
  const actual = await readAnchorByte(page, testid);
  if (actual !== expected) {
    throw new Error(
      `assertAnchorByte: ${testid} expected byte ${expected}, got ${actual}`,
    );
  }
}

module.exports = { loadAnchors, readAnchorByte, assertAnchorByte };
