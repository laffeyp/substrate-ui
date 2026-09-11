// tests/harness/e2e_session_resume.js — Sprint 009 three-channel harness.
// Plants a session by calling SessionRegistry.create directly via a helper
// Python invocation, launches the shell, clicks the resume row for that
// session, asserts WORKSPACE_BOUND + PANE_UNBOUND_BOUND fire with matching
// session_id and workspace fields from the manifest.

"use strict";
const { _electron: electron } = require("playwright");
const { spawnSync } = require("node:child_process");
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

function plantSession(pythonBin, workspace) {
  const py = `
import substrate
from substrate.session_registry import SessionRegistry
import uuid, json
sid = uuid.uuid4().hex[:12]
name = "resume-harness-" + sid[:6]
reg = SessionRegistry(auto_boot=True)
m = reg.create(session_id=sid, name=name, driver="deterministic",
               workspace=${JSON.stringify(workspace)}, workspace_shape="flat",
               bundle=None, seed="")
print(json.dumps({"session_id": m.session_id, "name": m.name,
                  "workspace": m.workspace, "workspace_shape": m.workspace_shape,
                  "record_root": m.record_root}))
`;
  const r = spawnSync(pythonBin, ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("plant failed: " + r.stderr);
  return JSON.parse(r.stdout.trim());
}

async function main() {
  const fails = [];
  const ok = (m) => console.log("  ok  " + m);
  const check = (cond, m) => { if (!cond) fails.push(m); else ok(m); };

  try { fs.mkdirSync(path.dirname(harnessJsonl()), { recursive: true }); fs.writeFileSync(harnessJsonl(), ""); } catch (_) {}
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-resume-ws-"));

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const planted = plantSession(substratePython, workspace);
  ok(`planted session ${planted.session_id} at ${workspace}`);

  const app = await electron.launch({
    args: ["."],
    cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  try {
    const win = await app.firstWindow();
    win.on("console", (msg) => {
      const text = msg.text();
      if (text.startsWith("[shell]") || text.includes("resume")) console.log("  RENDERER:", text);
    });
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
    // Wait for listSessions round-trip to populate the resume list.
    const row = win.locator(`[data-testid="resume-row-${planted.session_id}"]`);
    await row.waitFor({ state: "attached", timeout: 5000 });
    ok(`resume row for planted session renders`);

    await row.click();
    await new Promise((r) => setTimeout(r, 1500));

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    const emits = await readJsonl();
    const wsb = emits.find((s) => s.kind === "WORKSPACE_BOUND");
    const bnd = emits.find((s) => s.kind === "PANE_UNBOUND_BOUND");
    check(!!wsb, `WORKSPACE_BOUND fires after resume`);
    check(!!bnd, `PANE_UNBOUND_BOUND fires after resume`);
    check(wsb?.payload?.session_id === planted.session_id,
      `WORKSPACE_BOUND.session_id === planted (${wsb?.payload?.session_id} vs ${planted.session_id})`);
    check(wsb?.payload?.workspace_path === workspace,
      `WORKSPACE_BOUND.workspace_path matches (got ${wsb?.payload?.workspace_path})`);
    check(bnd?.payload?.session_id === planted.session_id,
      `PANE_UNBOUND_BOUND.session_id === planted`);

    // Verify NO fresh SESSION_CREATE_REQUESTED fired (this is a resume, not a create).
    const created = emits.filter((s) => s.kind === "SESSION_CREATE_REQUESTED");
    check(created.length === 0, `no SESSION_CREATE_REQUESTED fired (resume path is distinct — Layer 1 v0.1 discipline)`);

    const kinds = emits.map((s) => s.kind);
    try { assertNoInventedTags(emits); ok("zero invented tag names in the trace"); }
    catch (e) { fails.push(e.message); }

  try { assertLayer2ShapesInTrace(emits); ok("Layer 2 payload shapes match required fields"); }
  catch (e) { fails.push(e.message); }

  } finally {
    try { fs.rmSync(path.join(SESSIONS_ROOT, planted.session_id), { recursive: true, force: true }); } catch (_) {}
    try {
      const byName = path.join(SESSIONS_ROOT, "by-name.json");
      if (fs.existsSync(byName)) {
        const data = JSON.parse(fs.readFileSync(byName, "utf8"));
        for (const k of Object.keys(data)) if (data[k] === planted.session_id) delete data[k];
        fs.writeFileSync(byName, JSON.stringify(data));
      }
    } catch (_) {}
    try { fs.rmSync(workspace, { recursive: true, force: true }); } catch (_) {}
  }

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · resume attaches planted session_id=${planted.session_id}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
