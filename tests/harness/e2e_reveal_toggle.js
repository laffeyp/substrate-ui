// tests/harness/e2e_reveal_toggle.js — Sprint 016 three-channel harness.
// Binds a session, toggles reveal from terminal → reveal → terminal via the
// header handle, asserts each click emits REVEAL_TOGGLED with matching
// {pane_id, from, to}, and confirms the DOM swaps between prompt/transcript
// and RevealShell. Ten rapid toggles verify the Layer 5 mutex (at most one
// open reveal instance per pane) via a strict alternation of from/to values.

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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-reveal-ws-"));

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
    const picker = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await picker.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1500));
    sid = (await readJsonl()).find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id;
    check(!!sid, `session bound (session_id=${sid})`);

    const toggle = win.locator(`[data-testid="pane-reveal-toggle-${paneId}"]`);
    await toggle.waitFor({ state: "attached", timeout: 3000 });

    // Initial state: terminal.
    check((await toggle.getAttribute("data-reveal")) === "terminal", `initial state === "terminal"`);
    const promptBefore = await win.locator(`[data-testid="prompt-${paneId}"]`).count();
    check(promptBefore === 1, `prompt textarea present when terminal`);

    // Phase 1: single click → reveal.
    const preClick = (await readJsonl()).length;
    await toggle.click();
    await new Promise((r) => setTimeout(r, 200));
    check((await toggle.getAttribute("data-reveal")) === "reveal", `after click 1: state === "reveal"`);
    check(await win.locator(`[data-testid="reveal-shell-${paneId}"]`).count() === 1, `RevealShell mounts`);
    check(await win.locator(`[data-testid="prompt-${paneId}"]`).count() === 0, `Prompt unmounts on reveal`);

    // Perceptual: anchor-pane-<id>-reveal byte === 128.
    const anchor = win.locator(`[data-testid="anchor-pane-${paneId}-reveal"]`);
    const shot = path.join(__dirname, "shot-reveal.png");
    await anchor.screenshot({ path: shot });
    const byte = decodePng(fs.readFileSync(shot)).px[0];
    check(byte === 128, `anchor-pane-${paneId}-reveal byte === 128 when reveal (got ${byte})`);

    let emits = (await readJsonl()).slice(preClick);
    const rt1 = emits.find((s) => s.kind === "REVEAL_TOGGLED");
    check(rt1?.payload?.pane_id === paneId, `REVEAL_TOGGLED.pane_id matches`);
    check(rt1?.payload?.from === "terminal" && rt1?.payload?.to === "reveal",
      `REVEAL_TOGGLED{from:"terminal", to:"reveal"} (got ${rt1?.payload?.from}→${rt1?.payload?.to})`);

    // Phase 2: click again → terminal.
    await toggle.click();
    await new Promise((r) => setTimeout(r, 200));
    check((await toggle.getAttribute("data-reveal")) === "terminal", `after click 2: state === "terminal"`);
    check(await win.locator(`[data-testid="prompt-${paneId}"]`).count() === 1, `Prompt remounts on terminal`);

    // Phase 3: ten rapid alternating toggles for the mutex check.
    for (let i = 0; i < 10; i++) await toggle.click();
    await new Promise((r) => setTimeout(r, 300));

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    // Signal check: every REVEAL_TOGGLED alternates from/to (Layer 5 mutex — at most one open instance per pane).
    emits = await readJsonl();
    const toggles = emits.filter((s) => s.kind === "REVEAL_TOGGLED");
    check(toggles.length === 12, `twelve REVEAL_TOGGLED emits total (2 setup + 10 rapid) (got ${toggles.length})`);
    let expectedFrom = "terminal";
    let alternates = true;
    for (const t of toggles) {
      if (t.payload.from !== expectedFrom) { alternates = false; break; }
      expectedFrom = t.payload.to;
    }
    check(alternates, `every REVEAL_TOGGLED.from equals the previous .to (Layer 5 mutex holds)`);

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
  console.log(`PASS three channels agree · reveal alternates cleanly (session_id=${sid})`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
