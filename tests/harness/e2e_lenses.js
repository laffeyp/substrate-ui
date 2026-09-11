// tests/harness/e2e_lenses.js — Sprint 017 three-channel harness.
// Binds a session, opens reveal, clicks each of the four lens tabs in order,
// asserts LENS_SWITCHED fires per click with matching {pane_id, from, to},
// asserts the lens body DOM changes per click, and decodes the lens anchor
// byte after the last click (byte === 192 for the scene lens per Layer 7).

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const zlib = require("node:zlib");
const os = require("node:os");
const { runTonalChecks } = require("./tonal-checks");
const { assertLayer2ShapesInTrace, assertNoInventedTags } = require("./payload-check");

const REPO = path.resolve(__dirname, "..", "..");
const AS = () => path.join(os.homedir(), "Library", "Application Support", "substrate-ui");
const harnessJsonl = () => path.join(AS(), "harness", "last.jsonl");
const SESSIONS_ROOT = path.join(os.homedir(), ".substrate", "sessions");

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

async function readJsonl() {
  return fs.existsSync(harnessJsonl())
    ? fs.readFileSync(harnessJsonl(), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))
    : [];
}

async function main() {
  const fails = [];
  const ok = (m) => console.log("  ok  " + m);
  const check = (cond, m) => { if (!cond) fails.push(m); else ok(m); };

  try { fs.mkdirSync(path.dirname(harnessJsonl()), { recursive: true }); fs.writeFileSync(harnessJsonl(), ""); } catch (_) {}
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-lenses-ws-"));

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."], cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  let sid = null;
  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
    await new Promise((r) => setTimeout(r, 300));

    const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));

    // Bind + submit a turn so the transcript has envelopes for the lenses to render.
    const picker = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await picker.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1500));
    sid = (await readJsonl()).find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id;
    check(!!sid, `session bound (session_id=${sid})`);

    const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
    await prompt.fill("hello");
    await win.keyboard.press("Meta+Enter");
    await new Promise((r) => setTimeout(r, 2500));

    // Open reveal.
    await win.locator(`[data-testid="pane-reveal-toggle-${paneId}"]`).click();
    await new Promise((r) => setTimeout(r, 200));

    const shell = win.locator(`[data-testid="reveal-shell-${paneId}"]`);
    await shell.waitFor({ state: "attached", timeout: 3000 });
    check(await shell.getAttribute("data-lens") === "stream+graph",
      `initial lens is "stream+graph"`);

    // Verify stream+graph body is present.
    check(await win.locator(`[data-testid="lens-stream+graph"]`).count() === 1,
      `stream+graph lens body renders`);

    // Click each of the other three lens tabs.
    const preClickCount = (await readJsonl()).filter((s) => s.kind === "LENS_SWITCHED").length;
    for (const lens of ["i/o", "structure", "scene"]) {
      await win.locator(`[data-testid="lens-tab-${lens}"]`).click();
      await new Promise((r) => setTimeout(r, 150));
      check(await shell.getAttribute("data-lens") === lens,
        `after click ${lens}: shell data-lens === "${lens}"`);
      check(await win.locator(`[data-testid="lens-${lens}"]`).count() === 1,
        `${lens} lens body renders`);
    }

    // Perceptual: anchor-pane-<id>-lens byte === 192 (scene ordinal).
    const anchor = win.locator(`[data-testid="anchor-pane-${paneId}-lens"]`);
    const shot = path.join(__dirname, "shot-lens.png");
    await anchor.screenshot({ path: shot });
    const byte = decodePng(fs.readFileSync(shot)).px[0];
    check(byte === 192, `anchor-pane-${paneId}-lens byte === 192 when scene (got ${byte})`);

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    // Signal check: three LENS_SWITCHED emits with correct from/to chain.
    const emits = await readJsonl();
    const switches = emits.filter((s) => s.kind === "LENS_SWITCHED");
    check(switches.length === preClickCount + 3,
      `three LENS_SWITCHED emits after three tab clicks (got ${switches.length - preClickCount})`);
    const chain = switches.slice(preClickCount);
    check(chain[0]?.payload?.from === "stream+graph" && chain[0]?.payload?.to === "i/o",
      `first switch: stream+graph → i/o (got ${chain[0]?.payload?.from} → ${chain[0]?.payload?.to})`);
    check(chain[1]?.payload?.from === "i/o" && chain[1]?.payload?.to === "structure",
      `second switch: i/o → structure`);
    check(chain[2]?.payload?.from === "structure" && chain[2]?.payload?.to === "scene",
      `third switch: structure → scene`);

    // Vocabulary + shape discipline.
    const kinds = emits.map((s) => s.kind);
    try { assertNoInventedTags(emits); ok("zero invented tag names in the trace"); }
    catch (e) { fails.push(e.message); }
    try { assertLayer2ShapesInTrace(emits); ok("Layer 2 payload shapes match required fields"); }
    catch (e) { fails.push(e.message); }

  } finally {
    if (sid) {
      try { fs.rmSync(path.join(SESSIONS_ROOT, sid), { recursive: true, force: true }); } catch (_) {}
      try {
        const byName = path.join(SESSIONS_ROOT, "by-name.json");
        if (fs.existsSync(byName)) {
          const data = JSON.parse(fs.readFileSync(byName, "utf8"));
          for (const k of Object.keys(data)) if (data[k] === sid) delete data[k];
          fs.writeFileSync(byName, JSON.stringify(data));
        }
      } catch (_) {}
    }
    try { fs.rmSync(workspace, { recursive: true, force: true }); } catch (_) {}
  }

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · four lenses cycle cleanly (session_id=${sid})`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
