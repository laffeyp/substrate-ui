/* capture_terminal_v1.js — PERCEPTUAL track for terminal-v1.
   Element-shots bounded surfaces (A6), decodes deterministic pixel anchors (A2), asserts state,
   and diffs against committed fixture hashes (#38 confirmed-good captures as regression baselines).
   Zero external deps — the PNG decoder is copied verbatim from ../../../harness/capture_scene.js.

   Discipline:
   - A2 pixel-anchor decode: the tab-bar anchor strip encodes which tab is active in 8 known pixels;
     the terminal's prompt encodes its "chat-ready" state as a green pixel at a known coordinate.
   - A3 asymmetric fixtures: the tab strip is L-R asymmetric under click (slot i lights per tab i),
     so a mirror bug would fail. The prompt color check is asymmetric (green vs. dark).
   - A6 viewable-sized capture: every screenshot bounded, decode asserts ≤ 2000 px.
   - #38 fixture regression: each shot's SHA-256 is written; if a `fixtures/<name>.sha256` file
     exists, the run diffs against it. First runs record; subsequent runs regress.

   Run:
     cd substrate && uv run python ../substrate-ui/server.py &   # backend on :8765
     cd substrate-ui && npm run capture:terminal-v1
   To (re-)freeze fixtures after an intended visual change:
     REFREEZE=1 npm run capture:terminal-v1
*/
"use strict";
const { chromium } = require("playwright");
const zlib = require("zlib");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const REFREEZE = process.env.REFREEZE === "1";
const OUT = path.resolve(__dirname, "..", "screenshots");
const FIX = path.resolve(__dirname, "..", "fixtures");

function decodePNG(p) {
  const buf = fs.readFileSync(p);
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
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = width * ch;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => {
    const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  let q = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[q++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[q++];
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const u = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = (x >= ch && y > 0) ? out[(y - 1) * stride + x - ch] : 0;
      const v = f === 0 ? rb : f === 1 ? rb + a : f === 2 ? rb + u : f === 3 ? rb + ((a + u) >> 1) : rb + paeth(a, u, c);
      out[y * stride + x] = v & 0xff;
    }
  }
  return { width, height, ch, px: out };
}

// classify an anchor cell centre — "active" = --active #3fb950 (green-dominant); "inert" = --bg #0c0f14.
function isGreen(img, x, y) {
  const i = (y * img.width + x) * img.ch;
  const r = img.px[i], g = img.px[i + 1], b = img.px[i + 2];
  return g > 110 && g > r + 40 && g > b + 40;
}

// #38 fixture regression: compute SHA-256 of the PNG bytes; compare to committed hash.
// The fixture is the *hash*, not the PNG itself — small, git-friendly, byte-exact.
function fixtureCheck(shotPath, name) {
  const shot = fs.readFileSync(shotPath);
  const sha = crypto.createHash("sha256").update(shot).digest("hex");
  const fixFile = path.join(FIX, name + ".sha256");
  fs.mkdirSync(FIX, { recursive: true });
  if (REFREEZE || !fs.existsSync(fixFile)) {
    fs.writeFileSync(fixFile, sha + "\n");
    return { status: "recorded", sha };
  }
  const expected = fs.readFileSync(fixFile, "utf8").trim();
  return { status: expected === sha ? "match" : "drift", sha, expected };
}

const TABS = [
  "tab-agent-terminal", "tab-records", "tab-assays", "tab-run-as-graph",
  "tab-topology-structure", "tab-event-stream-inspector", "tab-io", "tab-studio",
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });

  await p.goto(BASE + "/terminal-v1/", { waitUntil: "domcontentloaded", timeout: 10000 });
  await p.waitForSelector('[data-testid="tab-agent-terminal"]', { timeout: 5000 });
  // Clear localStorage BEFORE any capture — otherwise a previous run's last-model would show as a
  // pre-selected picker option and drift the boot fixture. Reload to apply.
  await p.evaluate(() => localStorage.removeItem("terminal-v1.lastModel"));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForSelector('[data-testid="tab-agent-terminal"]', { timeout: 5000 });
  await p.waitForFunction(() => document.querySelectorAll('#modelpicker option').length > 1, { timeout: 5000 });

  // ---- boot shot ----
  const bootPath = path.join(OUT, "00-boot.png");
  await p.screenshot({ path: bootPath, fullPage: false });
  let dec = decodePNG(bootPath);
  if (dec.width > 2000 || dec.height > 2000) { console.error(`FAIL: boot ${dec.width}x${dec.height} > 2000 px`); process.exit(1); }
  console.log(`  ok  wrote ${bootPath} (${dec.width}x${dec.height})`);

  // ---- anchor strip decode + click cycle ----
  const stripPath = path.join(OUT, "01-anchor-strip.png");
  await p.locator('[data-testid="anchor-strip"]').screenshot({ path: stripPath });
  const strip = decodePNG(stripPath);
  const initState = [];
  for (let i = 0; i < 8; i++) initState.push(isGreen(strip, 2 + i * 4, 2) ? "green" : "dark");
  if (initState.filter((s) => s === "green").length !== 1 || initState[0] !== "green") {
    console.error(`FAIL: expected only slot 0 green on boot, got ${JSON.stringify(initState)}`); process.exit(1);
  }
  console.log(`  ok  boot anchor strip: only slot 0 green (${TABS[0]})`);
  // A3 asymmetric check: strip is symmetric only if state reads the same left-right — assert it does NOT
  const reversed = [...initState].reverse();
  if (initState.join() === reversed.join()) { console.error(`FAIL A3: anchor strip is L-R symmetric — a mirror bug would slip`); process.exit(1); }
  console.log(`  ok  A3: anchor strip is L-R asymmetric (mirror bug would be caught)`);

  for (let i = 0; i < TABS.length; i++) {
    const t = TABS[i];
    await p.click(`[data-testid="${t}"]`);
    await p.waitForSelector(`[data-testid="${t}"][aria-selected="true"]`, { timeout: 2000 });
    const shot = path.join(OUT, `02-strip-after-${t}.png`);
    await p.locator('[data-testid="anchor-strip"]').screenshot({ path: shot });
    const s = decodePNG(shot);
    const st = [];
    for (let k = 0; k < 8; k++) st.push(isGreen(s, 2 + k * 4, 2) ? "green" : "dark");
    const idx = st.indexOf("green");
    if (st.filter((v) => v === "green").length !== 1 || idx !== i) {
      console.error(`FAIL: after click ${t} expected only slot ${i} green; got ${JSON.stringify(st)}`); process.exit(1);
    }
  }
  console.log(`  ok  all 8 tabs: anchor strip green tracks click`);

  // ---- Sprint 007 perceptual: model picker populated + input state ----
  // (localStorage was cleared up top before the boot shot; picker is populated with nothing selected)
  await p.click('[data-testid="tab-agent-terminal"]');
  await p.waitForSelector('[data-testid="modelpicker"]');
  const pickerShot = path.join(OUT, "05-picker-populated.png");
  await p.locator('.term-head').screenshot({ path: pickerShot });
  const pickerImg = decodePNG(pickerShot);
  if (pickerImg.width > 2000 || pickerImg.height > 2000) { console.error(`FAIL: ${pickerShot} > 2000 px`); process.exit(1); }
  console.log(`  ok  wrote ${pickerShot} (${pickerImg.width}x${pickerImg.height}) — picker populated on boot`);

  // Pick the deterministic model — same as e2e for fixture stability; captures the enabled state.
  const CAP_MODEL = "deterministic";
  await p.selectOption('[data-testid="modelpicker"]', CAP_MODEL);
  await p.waitForFunction((m) => window.__TERMINAL_V1_STATE?.term?.model === m, CAP_MODEL);
  const firstModelC = CAP_MODEL;
  const pickedShot = path.join(OUT, "06-picker-after-select.png");
  await p.locator('.term-input-row').screenshot({ path: pickedShot });
  const pickedImg = decodePNG(pickedShot);
  console.log(`  ok  wrote ${pickedShot} (${pickedImg.width}x${pickedImg.height}) — input row after picking "${firstModelC}"`);

  // ---- Sprint 006 perceptual: terminal prompt renders GREEN (not the muted inert color) ----
  // A2 + A3 asymmetric: prompt is green (#3fb950) vs. termbody bg is dark (#0c0f14). A CSS bug that
  // dropped the .term-prompt color rule would render the prompt as inherited text color (grey), and
  // this anchor would flip from green to dark. Pure symmetry / mirror bugs don't apply here — the
  // anchor is at a known coordinate and the classification is directional.
  // At this point the picker has been selected, prompt reads "deterministic ›" — still green.
  // Capture the prompt BEFORE typing (post-picker, pre-agent-turn) for the 03 anchor check.
  const preTypePromptShot = path.join(OUT, "03-term-prompt.png");
  await p.locator('[data-testid="termprompt"]').screenshot({ path: preTypePromptShot });
  // Prompt pixel-color decode (A2): sample the prompt-only screenshot; assert green glyph pixels
  const pimg = decodePNG(preTypePromptShot);
  let greenPixels = 0;
  for (let y = 0; y < pimg.height; y++) {
    for (let x = 0; x < pimg.width; x++) {
      if (isGreen(pimg, x, y)) greenPixels++;
    }
  }
  if (greenPixels < 3) { console.error(`FAIL A2: term-prompt rendered without expected green glyph (green pixels=${greenPixels})`); process.exit(1); }
  console.log(`  ok  term-prompt pixel decode: ${greenPixels} green pixels found (prompt is green)`);

  // ---- Sprint 008: fire a real deterministic-agent turn, wait for completion, capture ----
  await p.focus('[data-testid="terminput"]');
  await p.type('[data-testid="terminput"]', "compute (2+3)*4");
  await p.press('[data-testid="terminput"]', "Enter");
  // Wait on the terminal condition, not a sleep (A4).
  await p.waitForFunction(
    () => window.__TERMINAL_V1_STATE?.term?.polling === false &&
          document.querySelector('[data-testid="termbody"]')?.textContent?.includes("✓"),
    { timeout: 30000 }
  );

  // ---- terminal pane after agent turn (full pane shot) ----
  const termShot = path.join(OUT, "04-terminal-after-input.png");
  await p.locator('.pane[data-pane-for="tab-agent-terminal"]').screenshot({ path: termShot });
  const termDec = decodePNG(termShot);
  if (termDec.width > 2000 || termDec.height > 2000) { console.error(`FAIL: ${termShot} > 2000 px`); process.exit(1); }
  console.log(`  ok  wrote ${termShot} (${termDec.width}x${termDec.height})`);

  // Sprint 008 fixture: a shot of the termbody after the agent turn (multi-color assertion below)
  const termAgentShot = path.join(OUT, "07-terminal-after-agent-turn.png");
  await p.locator('[data-testid="termbody"]').screenshot({ path: termAgentShot });
  const termAgentDec = decodePNG(termAgentShot);
  console.log(`  ok  wrote ${termAgentShot} (${termAgentDec.width}x${termAgentDec.height})`);
  // A3 asymmetric: termbody after an agent turn has AT LEAST TWO distinct line-color classes
  // rendered (user echo tl-in, tool calls tl-accent, tool results tl-out, FinalAnswer tl-accent).
  // A monochrome bug that dropped .term-line color rules would render everything as one color;
  // this check catches that.
  let greenPix = 0, greyPix = 0;
  for (let y = 0; y < termAgentDec.height; y++) {
    for (let x = 0; x < termAgentDec.width; x++) {
      const i = (y * termAgentDec.width + x) * termAgentDec.ch;
      const r = termAgentDec.px[i], g = termAgentDec.px[i + 1], b = termAgentDec.px[i + 2];
      if (g > 110 && g > r + 40 && g > b + 40) greenPix++;
      else if (r > 60 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r < 220) greyPix++;  // muted text
    }
  }
  if (greenPix < 20 || greyPix < 20) {
    console.error(`FAIL A3: agent-turn termbody lacks expected color diversity (green=${greenPix}, grey=${greyPix})`); process.exit(1);
  }
  console.log(`  ok  A3: termbody has color diversity (green=${greenPix}, grey=${greyPix}) — mono-color bug would fail`);

  // ---- Sprint 009: Records rail perceptual ----
  await p.click('[data-testid="tab-records"]');
  await p.waitForFunction(() => document.querySelectorAll('[data-testid="recordsrail"] .rec').length > 0, { timeout: 5000 });
  const railShot = path.join(OUT, "08-records-rail.png");
  await p.locator('[data-testid="recordsrail"]').screenshot({ path: railShot });
  const railImg = decodePNG(railShot);
  console.log(`  ok  wrote ${railShot} (${railImg.width}x${railImg.height}) — records rail populated`);
  // A3: rail's status dots should be colored differently across records (asymmetric per record).
  // Count non-background colored pixels; a mono-color CSS bug would fail (very few colored pixels).
  let colorful = 0;
  for (let y = 0; y < railImg.height; y++) {
    for (let x = 0; x < railImg.width; x++) {
      const i = (y * railImg.width + x) * railImg.ch;
      const r = railImg.px[i], g = railImg.px[i + 1], b = railImg.px[i + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat > 60) colorful++;
    }
  }
  if (colorful < 20) { console.error(`FAIL A3: rail lacks colored status dots (colorful=${colorful})`); process.exit(1); }
  console.log(`  ok  A3: rail has ${colorful} colored pixels (status dots visible; mono-color bug would fail)`);

  // click first record, capture rail-with-selection
  const firstRecCap = await p.$$eval('[data-testid="recordsrail"] .rec', (els) => els[0]?.dataset.name);
  await p.click(`[data-testid="rec-${firstRecCap}"]`);
  await p.waitForFunction((n) => window.__TERMINAL_V1_STATE?._currentRecord === n, firstRecCap);
  const selShot = path.join(OUT, "09-records-selected.png");
  await p.locator('.pane[data-pane-for="tab-records"]').screenshot({ path: selShot });
  const selImg = decodePNG(selShot);
  console.log(`  ok  wrote ${selShot} (${selImg.width}x${selImg.height}) — records with selection + top/bottom bars`);

  // ---- Sprint 010: event stream + inspector (capture-only, records vary per run) ----
  await p.waitForFunction(() => window.__TERMINAL_V1_STATE?.events?.length > 0, { timeout: 5000 });
  await p.click('[data-testid="tab-event-stream-inspector"]');
  await p.waitForSelector('[data-testid="eventstream"] .stream-line');
  const esEmpty = path.join(OUT, "10-event-stream-populated.png");
  await p.locator('.pane[data-pane-for="tab-event-stream-inspector"]').screenshot({ path: esEmpty });
  const esImg = decodePNG(esEmpty);
  console.log(`  ok  wrote ${esEmpty} (${esImg.width}x${esImg.height}) — event stream populated`);
  const firstSeqC = await p.$eval('[data-testid="eventstream"] .stream-line:first-child', (e) => Number(e.dataset.seq));
  await p.click(`[data-testid="stream-line-${firstSeqC}"]`);
  await p.waitForFunction((s) => window.__TERMINAL_V1_STATE?.selectedEvent?.seq === s, firstSeqC);
  const inspShot = path.join(OUT, "11-event-inspector.png");
  await p.locator('.pane[data-pane-for="tab-event-stream-inspector"]').screenshot({ path: inspShot });
  const inspImg = decodePNG(inspShot);
  console.log(`  ok  wrote ${inspShot} (${inspImg.width}x${inspImg.height}) — event inspector shows selected event`);

  // ---- Sprint 011: I/O tab (capture-only) ----
  await p.click('[data-testid="tab-io"]');
  await p.waitForSelector('[data-testid="io-input"]');
  const ioShot = path.join(OUT, "12-io-tab.png");
  await p.locator('.pane[data-pane-for="tab-io"]').screenshot({ path: ioShot });
  const ioImg = decodePNG(ioShot);
  console.log(`  ok  wrote ${ioShot} (${ioImg.width}x${ioImg.height}) — I/O tab with input + artifacts`);

  // ---- Sprint 012: Topology structure (capture-only) ----
  await p.click('[data-testid="tab-topology-structure"]');
  await p.waitForFunction(() => window.__TERMINAL_V1_STATE?.topology != null, { timeout: 5000 });
  const topoShot = path.join(OUT, "13-topology-structure.png");
  await p.locator('.pane[data-pane-for="tab-topology-structure"]').screenshot({ path: topoShot });
  const topoImg = decodePNG(topoShot);
  console.log(`  ok  wrote ${topoShot} (${topoImg.width}x${topoImg.height}) — topology structure`);

  // ---- Sprint 013: Run-as-graph text summary (capture-only) ----
  await p.click('[data-testid="tab-records"]');
  const demoRecCap = await p.$$eval('[data-testid="recordsrail"] .rec', (els) => {
    const c = els.find((e) => /code_review|debate|adversarial|game_of_life/.test(e.dataset.name));
    return (c || els[0]).dataset.name;
  });
  await p.click(`[data-testid="rec-${demoRecCap}"]`);
  await p.waitForFunction((n) => window.__TERMINAL_V1_STATE?._currentRecord === n, demoRecCap);
  await p.waitForFunction(() => window.__TERMINAL_V1_STATE?.events?.length > 0);
  await p.click('[data-testid="tab-run-as-graph"]');
  await p.waitForFunction(() => window.__TERMINAL_V1_STATE?.runGraph != null);
  const graphShot = path.join(OUT, "14-run-as-graph.png");
  await p.locator('.pane[data-pane-for="tab-run-as-graph"]').screenshot({ path: graphShot });
  const graphImg = decodePNG(graphShot);
  console.log(`  ok  wrote ${graphShot} (${graphImg.width}x${graphImg.height}) — run-as-graph`);

  // ---- Sprint 014: Assays (capture-only) ----
  await p.click('[data-testid="tab-assays"]');
  await p.waitForFunction(() => document.querySelectorAll('[data-testid="assayspicker"] .assay-item').length > 0);
  const firstAssayCap = await p.$$eval('[data-testid="assayspicker"] .assay-item', (els) => els[0].dataset.name);
  await p.click(`[data-testid="assay-${firstAssayCap}"]`);
  await p.waitForSelector('[data-testid="assaysbody"] .field');
  const assayShot = path.join(OUT, "15-assays.png");
  await p.locator('.pane[data-pane-for="tab-assays"]').screenshot({ path: assayShot });
  const assayImg = decodePNG(assayShot);
  console.log(`  ok  wrote ${assayShot} (${assayImg.width}x${assayImg.height}) — assays picker + body`);

  // ---- Sprint 015: Studio (placeholder — port pending) ----
  await p.click('[data-testid="tab-studio"]');
  await p.waitForSelector('[data-testid="studiopane"]');
  const studioShot = path.join(OUT, "16-studio-placeholder.png");
  await p.locator('.pane[data-pane-for="tab-studio"]').screenshot({ path: studioShot });
  const studioImg = decodePNG(studioShot);
  console.log(`  ok  wrote ${studioShot} (${studioImg.width}x${studioImg.height}) — Studio placeholder`);

  // ---- #38 fixture regression: hash each shot against committed baseline ----
  const shots = [
    "00-boot.png",
    "01-anchor-strip.png",
    "02-strip-after-tab-agent-terminal.png",
    "03-term-prompt.png",
    "04-terminal-after-input.png",
    "05-picker-populated.png",
    "06-picker-after-select.png",
    "07-terminal-after-agent-turn.png",
    // Note: 08-records-rail.png and 09-records-selected.png are captured for human review but NOT
    // hashed as fixtures — their content varies per run (new agent runs land in the rail; timestamps
    // and per-run IDs make byte-stable comparison impossible without clearing runs/, which would
    // erase the Sprint 008 agent record whose downstream sprints will read).
  ];
  const drifts = [];
  for (const s of shots) {
    const r = fixtureCheck(path.join(OUT, s), s);
    if (r.status === "recorded") console.log(`  ok  fixture recorded: ${s} sha=${r.sha.slice(0, 12)}…`);
    else if (r.status === "match") console.log(`  ok  fixture matches: ${s}`);
    else { console.error(`FAIL fixture drift: ${s}\n    expected ${r.expected}\n    got      ${r.sha}`); drifts.push(s); }
  }
  if (drifts.length) {
    console.error("\nFAIL: fixture drift on " + drifts.length + " shot(s). If the visual change is intentional, run: REFREEZE=1 npm run capture:terminal-v1");
    process.exit(1);
  }

  await b.close();
  console.log("\nPASS: perceptual + anchor + fixture regression");
})().catch((e) => { console.error("crash:", e); process.exit(1); });
