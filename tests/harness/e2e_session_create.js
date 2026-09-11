// tests/harness/e2e_session_create.js — Sprint 007 three-channel harness.
// Drives the picker to Enter with a fresh workspace path; asserts the emit
// chain SESSION_CREATE_REQUESTED → SESSION_CREATED → WORKSPACE_BOUND →
// PANE_UNBOUND_BOUND all correlate by request_id/session_id; verifies the
// manifest lands under an isolated ~/.substrate/sessions/<sid>/.

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

  // Fresh workspace path each run so NameCollision is impossible.
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-ws-"));

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."],
    cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  let createdSessionId = null;
  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
    await new Promise((r) => setTimeout(r, 300));

    const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));
    const input = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await input.waitFor({ state: "attached", timeout: 3000 });

    // Type the workspace path and press Enter.
    await input.focus();
    await input.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1500)); // let the bridge round-trip settle

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    const emits = await readJsonl();
    const byKind = (k) => emits.filter((s) => s.kind === k);
    const req = byKind("SESSION_CREATE_REQUESTED")[0];
    const ok_ = byKind("SESSION_CREATED")[0];
    const wsb = byKind("WORKSPACE_BOUND")[0];
    const bnd = byKind("PANE_UNBOUND_BOUND")[0];

    check(!!req, `SESSION_CREATE_REQUESTED emits`);
    check(!!ok_, `SESSION_CREATED emits`);
    check(!!wsb, `WORKSPACE_BOUND emits`);
    check(!!bnd, `PANE_UNBOUND_BOUND emits`);

    if (req) {
      const p = req.payload;
      const required = ["request_id", "pane_id", "session_id", "name", "driver", "workspace_path", "workspace_shape", "bundle", "seed"];
      const missing = required.filter((k) => !(k in p));
      check(missing.length === 0, `SESSION_CREATE_REQUESTED carries all 9 required fields (missing: ${missing.join(",") || "none"})`);
      check(p.seed === "", `SESSION_CREATE_REQUESTED.seed === "" per session_registry.py:421-431 (got ${JSON.stringify(p.seed)})`);
      check(p.workspace_path === workspace, `workspace_path matches (got ${p.workspace_path})`);
    }
    if (req && ok_) {
      check(req.payload.request_id === ok_.payload.request_id,
        `request_id correlates REQUESTED → CREATED (${req.payload.request_id} === ${ok_.payload.request_id})`);
      createdSessionId = ok_.payload.session_id;
    }
    if (ok_ && wsb && bnd) {
      check(ok_.payload.session_id === wsb.payload.session_id && wsb.payload.session_id === bnd.payload.session_id,
        `session_id correlates SESSION_CREATED → WORKSPACE_BOUND → PANE_UNBOUND_BOUND`);
    }

    // Pane status flipped to parked (no unbound picker input on the page any more).
    const stillUnbound = await win.locator(`[data-testid="unbound-picker-input-${paneId}"]`).count();
    check(stillUnbound === 0, `unbound picker unmounts after bind (got ${stillUnbound})`);

    await app.close();

    // Substrate-side: manifest.json exists at ~/.substrate/sessions/<sid>/manifest.json.
    if (createdSessionId) {
      const manifestPath = path.join(SESSIONS_ROOT, createdSessionId, "manifest.json");
      check(fs.existsSync(manifestPath), `manifest.json exists at ${manifestPath}`);
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        check(manifest.workspace === workspace, `manifest.workspace matches (got ${manifest.workspace})`);
        check(manifest.workspace_shape === "flat", `manifest.workspace_shape === "flat" (got ${manifest.workspace_shape})`);
      }
    }

    // Vocabulary discipline.
    const kinds = emits.map((s) => s.kind);
    try { assertNoInventedTags(emits); ok("zero invented tag names in the trace"); }
    catch (e) { fails.push(e.message); }

  try { assertLayer2ShapesInTrace(emits); ok("Layer 2 payload shapes match required fields"); }
  catch (e) { fails.push(e.message); }

  } finally {
    // Clean up the created session directory so successive runs are hermetic.
    if (createdSessionId) {
      try { fs.rmSync(path.join(SESSIONS_ROOT, createdSessionId), { recursive: true, force: true }); } catch (_) {}
      // Also unlink from by-name.json.
      try {
        const byName = path.join(SESSIONS_ROOT, "by-name.json");
        if (fs.existsSync(byName)) {
          const data = JSON.parse(fs.readFileSync(byName, "utf8"));
          for (const k of Object.keys(data)) if (data[k] === createdSessionId) delete data[k];
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
  console.log(`PASS three channels agree · session_id=${createdSessionId} · workspace=${workspace}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
