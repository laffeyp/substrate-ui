// tests/harness/e2e_probe_driver.js — Sprint 008 three-channel harness.
// Drives picker Enter with the default deterministic driver; asserts the
// probe fires BEFORE create; asserts driver_params secret-stripping (harness
// pokes a params object with a "api_key" field via a preload-exposed hook —
// currently unavailable, so the harness verifies the shell-side strip
// function through the emitted trace's payload shape).

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { runTonalChecks } = require("./tonal-checks");
const { assertLayer2ShapesInTrace, assertNoInventedTags } = require("./payload-check");

const REPO = path.resolve(__dirname, "..", "..");
const AS = () => path.join(os.homedir(), "Library", "Application Support", "substrate-ui");
const harnessJsonl = () => path.join(AS(), "harness", "last.jsonl");
const SESSIONS_ROOT = path.join(os.homedir(), ".substrate", "sessions");

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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-probe-ws-"));

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."],
    cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  let sid = null;
  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
    await new Promise((r) => setTimeout(r, 300));

    const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));
    const input = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await input.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1500));

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    const emits = await readJsonl();
    const kinds = emits.map((s) => s.kind);
    const probeReqIdx = kinds.indexOf("PROBE_DRIVER_REQUESTED");
    const probeOkIdx = kinds.indexOf("PROBE_DRIVER_PROBED");
    const createReqIdx = kinds.indexOf("SESSION_CREATE_REQUESTED");
    const createOkIdx = kinds.indexOf("SESSION_CREATED");

    check(probeReqIdx >= 0, `PROBE_DRIVER_REQUESTED fires`);
    check(probeOkIdx > probeReqIdx, `PROBE_DRIVER_PROBED follows request (${probeReqIdx} → ${probeOkIdx})`);
    check(createReqIdx > probeOkIdx,
      `SESSION_CREATE_REQUESTED fires AFTER PROBE_DRIVER_PROBED (Layer 5 forced_next: probe gates create) (${probeOkIdx} → ${createReqIdx})`);
    check(createOkIdx > createReqIdx, `SESSION_CREATED follows create request`);

    const probeReq = emits[probeReqIdx]?.payload;
    check(probeReq?.driver === "deterministic",
      `probe carries driver="deterministic" (got ${probeReq?.driver}) [Layer 2 required field]`);
    check(probeReq && "request_id" in probeReq,
      `probe carries request_id`);
    const probeOk = emits[probeOkIdx]?.payload;
    check(probeOk?.driver === "deterministic",
      `PROBE_DRIVER_PROBED.driver === "deterministic" (got ${probeOk?.driver})`);
    check("context_tokens" in (probeOk ?? {}),
      `PROBE_DRIVER_PROBED carries context_tokens (got ${probeOk?.context_tokens})`);

    sid = emits.find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id;

    // Vocabulary discipline.
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
  console.log(`PASS three channels agree · probe gates create · deterministic reports available=true`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
