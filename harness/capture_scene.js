/* capture_scene.js — PERCEPTUAL track for the scene panel via DETERMINISTIC PIXEL ANCHORS.
   (SDD TECHNIQUES, Visual/UI: "Visualizations include deterministic pixel colors at known
   coordinates. Screenshots can be decoded for state without manual visual inspection.")

   The scene grid already embeds deterministic colors at known coordinates: each cell at grid
   coordinate (r,c) is painted green when alive, dark when dead. This harness DECODES that — it
   screenshots the rendered .scene-grid, reads the actual pixel at each cell's center, classifies
   alive (green channel dominant) vs dead, reconstructs the grid, and ASSERTS it equals the record's
   real Generation.grid. So the rendered output is verified mechanically (a state snapshot read as a
   signal), not by eyeballing a PNG. The PNGs are still written to screenshots/ for a polish look
   (the vision-model-judge half of two-track grading); the decode is the mechanical half.

   SCOPE (review #50): this verifies the panel faithfully PAINTS STATE.scene — render fidelity. It
   catches a transpose / miscolor / missing-cell / class-not-mapping-to-green render bug. It does NOT
   independently re-check that the record's grid is itself a correct blinker (that is covered by the
   game_of_life pytest + the e2e index assertions); this is a render-fidelity track, not end-to-end
   record verification. (The blinker is mirror-symmetric, so a pure L-R/U-D mirror bug is not caught
   here — a glider fixture would; transpose IS caught since V<->H differ. Drift watchlist.)

   Run: npm run capture:scene   (backend on :8765). Exit 0 = every cell decoded matches the record. */
"use strict";
const { chromium } = require("playwright");
const zlib = require("zlib");
const fs = require("fs");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";

// minimal PNG -> {width,height,ch,px} decoder: 8-bit RGB/RGBA, non-interlaced (Playwright's shape).
// Node's built-in zlib inflates IDAT; we un-filter the scanlines ourselves. No external deps.
function decodePNG(path) {
  const buf = fs.readFileSync(path);
  let pos = 8, width = 0, height = 0, colorType = 6; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 1; // RGBA / RGB / gray (8-bit assumed)
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

// the deterministic anchor: a live cell is painted var(--green) #3fb950 (g dominant); a dead cell
// var(--bg2) #0c0f14 (all channels low). Classify by the green channel at the cell's centre.
function aliveAt(img, x, y) {
  const i = (y * img.width + x) * img.ch;
  const r = img.px[i], g = img.px[i + 1], b = img.px[i + 2];
  return g > 110 && g > r + 40 && g > b + 40 ? 1 : 0;
}
const ascii = (grid) => grid.map((row) => row.map((c) => (c ? "#" : ".")).join("")).join("\n");

(async () => {
  fs.mkdirSync("screenshots", { recursive: true });
  const b = await chromium.launch({ channel: "chrome" });
  const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(BASE + "/");
  await page.waitForSelector(".rec");
  await page.click('.rec[data-name="game_of_life"]');
  await page.waitForSelector("#gvScene");
  const tabVisible = await page.$eval("#gvScene", (e) => getComputedStyle(e).display !== "none");
  await page.click("#gvScene");
  await page.waitForSelector(".scene-grid");
  const setSeq = async (v) => {
    await page.$eval("#seq", (el, val) => { el.value = val; el.dispatchEvent(new Event("input")); }, String(v));
    await page.waitForTimeout(150);
  };

  let allMatch = true;
  // the blinker's three generations, by the seq each Generation lands on.
  for (const [seq, label] of [[3, "gen0"], [132, "gen1"], [261, "gen2"]]) {
    await setSeq(seq);
    // GROUND TRUTH: the record's actual grid the panel should be rendering at this cursor.
    const truth = await page.evaluate((s) => {
      const fr = STATE.scene.frames.filter((f) => f.seq <= s).slice(-1)[0];
      return { grid: fr.grid, rows: fr.grid.length, cols: fr.grid[0].length };
    }, seq);
    const png = `screenshots/scene_gol_${label}.png`;
    await page.locator(".scene-grid").screenshot({ path: png }); // element shot = just the grid
    const img = decodePNG(png);
    // DECODE the rendered pixels at each cell centre -> reconstruct the alive/dead grid
    const decoded = [];
    for (let r = 0; r < truth.rows; r++) {
      const row = [];
      for (let c = 0; c < truth.cols; c++) {
        const x = Math.round(((c + 0.5) / truth.cols) * img.width);
        const y = Math.round(((r + 0.5) / truth.rows) * img.height);
        row.push(aliveAt(img, x, y));
      }
      decoded.push(row);
    }
    const match = JSON.stringify(decoded) === JSON.stringify(truth.grid);
    allMatch = allMatch && match;
    console.log(`\nSCENE_DECODE ${label} seq=${seq} ${truth.rows}x${truth.cols} match=${match}`);
    console.log("  decoded from screenshot pixels:");
    console.log(ascii(decoded).split("\n").map((l) => "    " + l).join("\n"));
    if (!match) {  // assertion-with-context: on mismatch, show the divergence, not just "fail"
      console.log("  EXPECTED (record Generation.grid):");
      console.log(ascii(truth.grid).split("\n").map((l) => "    " + l).join("\n"));
    }
  }
  // shape-detection negative: a record with no 2-D numeric field hides the scene tab.
  await page.click('.rec[data-name="code_review"]');
  await page.waitForTimeout(250);
  const tabHidden = await page.$eval("#gvScene", (e) => getComputedStyle(e).display === "none");
  await b.close();

  console.log(`\nSCENE_DECODE_SUMMARY tab_visible_gol=${tabVisible} tab_hidden_code_review=${tabHidden} all_generations_match=${allMatch}`);
  if (!allMatch || !tabVisible || !tabHidden) { console.error("PIXEL-DECODE FAILED"); process.exit(1); }
  console.log("PIXEL-DECODE PASS — every cell, decoded from the rendered screenshot, matches the record grid.");
})().catch((e) => { console.error(e); process.exit(1); });
