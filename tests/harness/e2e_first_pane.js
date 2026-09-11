// tests/harness/e2e_first_pane.js — Sprint 002 three-channel harness.
// Boots Electron with SUBSTRATE_HARNESS=1, waits for one pane's eleven
// anchors + WINDOW_OPENED → PANE_CREATED → PANE_FOCUSED, screenshots the
// focus anchor + status anchor, decodes bytes via zero-dep PNG un-filter
// (Addendum A2), reads the JSONL trace, asserts three-channel agreement,
// and runs the three standing tonal-rule checks (Sprint 048 reshape).

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const zlib = require("node:zlib");
const os = require("node:os");
const { runTonalChecks } = require("./tonal-checks");
const { assertLayer2ShapesInTrace } = require("./payload-check");

const REPO = path.resolve(__dirname, "..", "..");
const AS = () => path.join(os.homedir(), "Library", "Application Support", "substrate-ui");
const harnessJsonl = () => path.join(AS(), "harness", "last.jsonl");

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

function pixelByte(png, x, y) { return png.px[y * png.width * png.ch + x * png.ch]; }

async function main() {
  const fails = [];
  const ok = (m) => console.log("  ok  " + m);
  const check = (cond, m) => { if (!cond) fails.push(m); else ok(m); };

  try { fs.mkdirSync(path.dirname(harnessJsonl()), { recursive: true }); fs.writeFileSync(harnessJsonl(), ""); } catch (_) {}

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."],
    cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  const win = await app.firstWindow();
  await win.waitForLoadState("domcontentloaded");

  const anchors = win.locator('[data-testid^="anchor-pane-"]');
  await anchors.first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 200));

  const count = await anchors.count();
  check(count === 11, `pane carries eleven anchors (got ${count})`);

  const focus = win.locator('[data-testid$="-focus"]').first();
  const status = win.locator('[data-testid$="-status"]').first();
  await focus.waitFor({ state: "attached", timeout: 5000 });
  const shotFocus = path.join(__dirname, "shot-focus.png");
  const shotStatus = path.join(__dirname, "shot-status.png");
  await focus.screenshot({ path: shotFocus });
  await status.screenshot({ path: shotStatus });
  const fb = pixelByte(decodePng(fs.readFileSync(shotFocus)), 0, 0);
  const sb = pixelByte(decodePng(fs.readFileSync(shotStatus)), 0, 0);
  check(fb === 255, `focus anchor byte === 255 (got ${fb})`);
  check(sb === 0,   `status anchor byte === 0 (unbound) (got ${sb})`);

  // Standing tonal-rule checks (Sprint 048 reshape).
  try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
  catch (e) { fails.push(`tonal check failed: ${e.message}`); }

  await app.close();

  const lines = fs.existsSync(harnessJsonl())
    ? fs.readFileSync(harnessJsonl(), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))
    : [];
  const kinds = lines.map((s) => s.kind);
  const iWO = kinds.indexOf("WINDOW_OPENED");
  const iPC = kinds.indexOf("PANE_CREATED");
  const iPF = kinds.indexOf("PANE_FOCUSED");
  check(iWO >= 0 && iPC > iWO && iPF > iPC, `JSONL sequence WINDOW_OPENED → PANE_CREATED → PANE_FOCUSED (indices ${iWO},${iPC},${iPF})`);

  const woWid = lines[iWO]?.payload?.window_id;
  const pcWid = lines[iPC]?.payload?.window_id;
  const pcPid = lines[iPC]?.payload?.pane_id;
  const pfPid = lines[iPF]?.payload?.pane_id;
  check(woWid && woWid === pcWid, `window_id agrees across WINDOW_OPENED + PANE_CREATED`);
  check(pcPid && pcPid === pfPid, `pane_id agrees across PANE_CREATED + PANE_FOCUSED`);

  // Vocabulary discipline: every emitted kind must be in v0.1.
  const V0_1 = new Set(fs.readFileSync(path.join(REPO, "src/observability/vocab.ts"), "utf8")
    .match(/"[A-Z][A-Z0-9_]{3,}"/g)?.map((s) => s.slice(1, -1)) || []);
  const invented = kinds.filter((k) => !V0_1.has(k));
  check(invented.length === 0, `zero invented tag names in the trace (found ${invented.length})`);

  // Layer 2 shape discipline: every emitted payload carries every required field.
  try { assertLayer2ShapesInTrace(lines); ok("Layer 2 payload shapes match required fields"); }
  catch (e) { fails.push(e.message); }

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · anchors=${count} · focus=${fb} · status=${sb} · sequence WINDOW_OPENED→PANE_CREATED→PANE_FOCUSED`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
