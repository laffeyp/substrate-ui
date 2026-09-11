// tests/harness/e2e_boot.js
// Sprint 001 — the three-channel observability harness.
//
// Launches the Electron app with SUBSTRATE_HARNESS=1, waits for the
// anchor-bridge canvas to paint byte 128 (the alive-bridge state),
// screenshots the anchor, decodes the byte via zero-dep PNG un-filter
// (Addendum A2), reads the JSONL trace at <userData>/harness/last.jsonl
// for the BRIDGE_HELLO_RECEIVED line, reads <logs>/bridge.log for the
// substrate version string, and asserts three-channel agreement.
//
// Exit 0 on all three channels agreeing; exit 1 on any disagreement.

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const zlib = require("node:zlib");
const os = require("node:os");
const { runTonalChecks } = require("./tonal-checks");
const { assertLayer2ShapesInTrace } = require("./payload-check");

const REPO = path.resolve(__dirname, "..", "..");

// Resolve the macOS Electron userData + logs paths for the "substrate-ui" app.
function macAppSupport() { return path.join(os.homedir(), "Library", "Application Support", "substrate-ui"); }
function macLogs()       { return path.join(os.homedir(), "Library", "Logs", "substrate-ui"); }
function harnessJsonl()  { return path.join(macAppSupport(), "harness", "last.jsonl"); }
function bridgeLog()     { return path.join(macLogs(), "bridge.log"); }

// Zero-dep PNG decoder (Addendum A2 — un-filter scanlines by hand).
// Returns {width, height, ch, px}.
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

async function main() {
  const fails = [];
  const ok = (msg) => console.log("  ok  " + msg);
  const check = (cond, msg) => { if (!cond) fails.push(msg); else ok(msg); };

  // Fresh state: overwrite the harness JSONL and truncate the bridge.log
  // BEFORE Electron launches. Electron truncates them itself; this is belt+braces.
  try { fs.mkdirSync(path.dirname(harnessJsonl()), { recursive: true }); fs.writeFileSync(harnessJsonl(), ""); } catch (_) {}
  try { fs.mkdirSync(path.dirname(bridgeLog()), { recursive: true }); fs.writeFileSync(bridgeLog(), ""); } catch (_) {}

  const substrateVenvPython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."],
    cwd: REPO,
    env: {
      ...process.env,
      SUBSTRATE_HARNESS: "1",
      SUBSTRATE_UI_PYTHON: substrateVenvPython,
      PYTHONUNBUFFERED: "1",
    },
  });

  const win = await app.firstWindow();
  await win.waitForLoadState("domcontentloaded");

  // Wait ≤3s for the anchor to paint byte 128 (Layer 4 pairing:
  // BRIDGE_HELLO_RECEIVED within 3s of subprocess spawn).
  const t0 = Date.now();
  const anchor = win.locator('[data-testid="anchor-bridge"]');
  await anchor.waitFor({ state: "attached", timeout: 3000 });

  // Poll the status text as the ready signal (byte flip happens right before).
  const status = win.locator("#status");
  await status.waitFor({ state: "attached", timeout: 3000 });
  let statusText = "";
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    statusText = (await status.textContent()) || "";
    if (statusText.includes("alive")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  const elapsed = Date.now() - t0;
  check(statusText.includes("alive"), `renderer status shows alive (elapsed ${elapsed}ms, within 3s)`);

  // Channel 1 — Structural: DOM has the anchor testid.
  check(await anchor.count() === 1, `DOM has [data-testid="anchor-bridge"] (structural)`);

  // Channel 2 — Perceptual: screenshot the anchor, decode the byte.
  const shotPath = path.join(__dirname, "anchor-bridge.png");
  await anchor.screenshot({ path: shotPath });
  const png = decodePng(fs.readFileSync(shotPath));
  const byte = pixelByte(png, 0, 0);
  check(byte === 128, `decoded anchor-bridge byte == 128 (got ${byte}) (perceptual)`);

  // Standing tonal-rule checks (Sprint 048 reshape).
  try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
  catch (e) { fails.push(`tonal check failed: ${e.message}`); }

  await app.close();

  // Channel 3a — Signal: JSONL contains one BRIDGE_HELLO_RECEIVED with a substrate_version.
  const jsonl = fs.existsSync(harnessJsonl()) ? fs.readFileSync(harnessJsonl(), "utf8") : "";
  const helloLines = jsonl.split("\n").filter((L) => L.trim()).map((L) => JSON.parse(L))
    .filter((sig) => sig.kind === "BRIDGE_HELLO_RECEIVED");
  check(helloLines.length === 1, `JSONL has exactly one BRIDGE_HELLO_RECEIVED (got ${helloLines.length})`);
  const helloSig = helloLines[0];
  const substrateVersion = helloSig ? helloSig.payload.substrate_version : "";
  check(!!substrateVersion, `BRIDGE_HELLO_RECEIVED carries a substrate_version (got '${substrateVersion}')`);
  check(helloSig && helloSig.payload.protocol === 1, `BRIDGE_HELLO_RECEIVED.protocol === 1`);

  // Channel 3b — Log: bridge.log carries the same substrate version.
  const log = fs.existsSync(bridgeLog()) ? fs.readFileSync(bridgeLog(), "utf8") : "";
  check(log.includes(`substrate=${substrateVersion}`),
    `bridge.log carries 'substrate=${substrateVersion}' (log length ${log.length})`);

  // Layer 2 shape discipline: every emitted payload carries every required field.
  const allEmits = jsonl.split("\n").filter((L) => L.trim()).map((L) => JSON.parse(L));
  try { assertLayer2ShapesInTrace(allEmits); ok("Layer 2 payload shapes match required fields"); }
  catch (e) { fails.push(e.message); }

  // Three-channel agreement.
  console.log("");
  if (fails.length) {
    console.error("FAIL — channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · substrate=${substrateVersion} · anchor byte=${byte} · elapsed=${elapsed}ms`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
