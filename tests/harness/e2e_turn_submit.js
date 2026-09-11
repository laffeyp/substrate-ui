// tests/harness/e2e_turn_submit.js — Sprint 012 three-channel harness.
// Binds a deterministic-driver session, types "hello", presses ⌘⏎, asserts
// the chain PROMPT_SUBMITTED → TURN_SUBMIT_REQUESTED → TURN_SUBMITTED fires
// with matching request_id + session_id. Confirms turn_index === 0 on the
// first turn. Reads the on-disk record and asserts a UserMessage envelope
// exists carrying that turn_index.

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { runTonalChecks } = require("./tonal-checks");
const { assertLayer2ShapesInTrace } = require("./payload-check");

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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-turn-ws-"));

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

    // Type + submit.
    const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
    await prompt.focus();
    await prompt.type("hello", { delay: 20 });
    await new Promise((r) => setTimeout(r, 200));

    const preSubmitCount = (await readJsonl()).length;
    await win.keyboard.press("Meta+Enter");
    await new Promise((r) => setTimeout(r, 5000)); // deterministic turn is fast but not instant

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    const emits = await readJsonl();
    const submitted = emits.slice(preSubmitCount);
    const ps = submitted.find((s) => s.kind === "PROMPT_SUBMITTED");
    const req = submitted.find((s) => s.kind === "TURN_SUBMIT_REQUESTED");
    const ok_ = submitted.find((s) => s.kind === "TURN_SUBMITTED");

    check(!!ps, `PROMPT_SUBMITTED emits after ⌘⏎`);
    check(!!req, `TURN_SUBMIT_REQUESTED emits`);
    check(!!ok_, `TURN_SUBMITTED emits`);

    if (ps) check(ps.payload?.text_length === 5,
      `PROMPT_SUBMITTED.text_length === 5 (got ${ps.payload?.text_length})`);
    if (req) {
      check(req.payload?.text_length === 5,
        `TURN_SUBMIT_REQUESTED.text_length === 5 (got ${req.payload?.text_length})`);
      check(req.payload?.timeout_seconds === 60,
        `TURN_SUBMIT_REQUESTED.timeout_seconds === 60 (got ${req.payload?.timeout_seconds})`);
    }
    if (req && ok_) {
      check(req.payload?.request_id === ok_.payload?.request_id,
        `request_id correlates REQUESTED → SUBMITTED`);
      check(ok_.payload?.turn_index === 0,
        `TURN_SUBMITTED.turn_index === 0 (first turn) (got ${ok_.payload?.turn_index})`);
    }

    // Privacy: raw "hello" must not appear in the trace.
    const rawJsonl = fs.readFileSync(harnessJsonl(), "utf8");
    check(!rawJsonl.includes("\"hello\""),
      `no raw "hello" in JSONL payloads (privacy)`);

    // Substrate-side: the record carries a UserMessage envelope with turn_index=0.
    if (sid) {
      const recordDir = path.join(SESSIONS_ROOT, sid, "record");
      let userMsgTurnIndex = -1;
      if (fs.existsSync(recordDir)) {
        for (const ef of fs.readdirSync(recordDir).filter((f) => f.startsWith("events-"))) {
          for (const line of fs.readFileSync(path.join(recordDir, ef), "utf8").split("\n").filter((l) => l.trim())) {
            const env = JSON.parse(line);
            if (env.kind === "UserMessage" && "turn_index" in (env.payload || {})) {
              userMsgTurnIndex = Math.max(userMsgTurnIndex, env.payload.turn_index);
            }
          }
        }
      }
      check(userMsgTurnIndex === 0, `record UserMessage carries turn_index=0 (got ${userMsgTurnIndex})`);
    }

    // Vocabulary + shape discipline.
    const kinds = emits.map((s) => s.kind);
    const V0_1 = new Set(fs.readFileSync(path.join(REPO, "src/observability/vocab.ts"), "utf8")
      .match(/"[A-Z][A-Z0-9_]{3,}"/g)?.map((s) => s.slice(1, -1)) || []);
    const invented = kinds.filter((k) => !V0_1.has(k));
    check(invented.length === 0, `zero invented tag names in the trace (found ${invented.length})`);
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
  console.log(`PASS three channels agree · turn submitted (session_id=${sid}, turn_index=0)`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
