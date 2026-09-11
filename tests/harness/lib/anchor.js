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
const zlib = require("node:zlib");

const REPO = path.resolve(__dirname, "..", "..", "..");

// Zero-dep PNG decoder (Addendum A2 — un-filter scanlines by hand). Used
// for anchor elements that don't expose a 2D-canvas context to
// `getImageData` (a plain <div> painted a solid color, an <img>, etc.):
// screenshot the element, decode the bytes, read the pixel at (0,0).
function decodePng(buf) {
  let pos = 8, width = 0, height = 0, colorType = 6;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = width * ch;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => {
    const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  let p = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[p++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[p++];
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const u = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = (x >= ch && y > 0) ? out[(y - 1) * stride + x - ch] : 0;
      const v = f === 0 ? rb : f === 1 ? rb + a : f === 2 ? rb + u : f === 3 ? rb + ((a + u) >> 1) : rb + paeth(a, u, c);
      out[y * stride + x] = v & 0xff;
    }
  }
  return { width, height, ch, px: out };
}

function pixelByte(png, x, y) {
  return png.px[y * png.width * png.ch + x * png.ch];
}

// Element-screenshot fallback for anchors that are NOT canvases (e.g. a
// solid-color div encoding a state byte). Screenshots the element to a
// tmp PNG, decodes, returns the byte at (0,0).
async function screenshotAnchorByte(page, testid, tmpPath) {
  const loc = page.locator(`[data-testid="${testid}"]`);
  const buf = await loc.screenshot({ path: tmpPath });
  const png = decodePng(buf);
  return pixelByte(png, 0, 0);
}

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

module.exports = {
  loadAnchors, readAnchorByte, assertAnchorByte,
  decodePng, pixelByte, screenshotAnchorByte,
};
