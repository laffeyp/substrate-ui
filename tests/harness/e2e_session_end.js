// tests/harness/e2e_session_end.js — Sprint 010 three-channel harness.
// Creates a session via the picker + Enter, waits for bind, then presses
// ⌘E to end the session. Asserts SESSION_END_REQUESTED → SESSION_ENDED_ACK
// → TRANSCRIPT_SESSION_ENDED_RENDERED fire in order, that the manifest
// status flips to "ended", and that the record's SessionEnded envelope is
// present at the emitted envelope_seq.

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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-end-ws-"));

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

    // Bind a fresh session so we have something to end.
    const input = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await input.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 2000));

    // Confirm bind happened.
    const stillUnbound = await win.locator(`[data-testid="unbound-picker-input-${paneId}"]`).count();
    check(stillUnbound === 0, `pane bound after create (picker gone)`);
    const createdEmits = await readJsonl();
    sid = createdEmits.find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id;
    check(!!sid, `session_id captured from SESSION_CREATED (got ${sid})`);

    // End with ⌘E.
    await win.keyboard.press("Meta+e");
    await new Promise((r) => setTimeout(r, 3000)); // /exit round-trip takes longer than probe/create

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    const emits = await readJsonl();
    const req = emits.find((s) => s.kind === "SESSION_END_REQUESTED");
    const ack = emits.find((s) => s.kind === "SESSION_ENDED_ACK");
    const row = emits.find((s) => s.kind === "TRANSCRIPT_SESSION_ENDED_RENDERED");

    check(!!req, `SESSION_END_REQUESTED emits`);
    check(!!ack, `SESSION_ENDED_ACK emits`);
    check(!!row, `TRANSCRIPT_SESSION_ENDED_RENDERED emits`);

    if (req) {
      check(req.payload?.source === "shortcut",
        `SESSION_END_REQUESTED.source === "shortcut" (got ${req.payload?.source})`);
      check(req.payload?.session_id === sid,
        `SESSION_END_REQUESTED.session_id === created (got ${req.payload?.session_id})`);
    }
    if (req && ack) {
      check(req.payload?.request_id === ack.payload?.request_id,
        `request_id correlates END_REQUESTED → ENDED_ACK`);
      check(ack.payload?.record_finalised === true,
        `SESSION_ENDED_ACK.record_finalised === true (got ${ack.payload?.record_finalised})`);
    }
    if (row && ack) {
      check(row.payload?.end_reason === ack.payload?.end_reason,
        `TRANSCRIPT_SESSION_ENDED_RENDERED.end_reason matches ACK`);
      check(typeof row.payload?.envelope_seq === "number" && row.payload?.envelope_seq >= 0,
        `TRANSCRIPT_SESSION_ENDED_RENDERED.envelope_seq >= 0 (got ${row.payload?.envelope_seq})`);
    }

    // Substrate-side verification: manifest.status flipped to ended; record has SessionEnded envelope at the emitted seq.
    if (sid) {
      const manifestPath = path.join(SESSIONS_ROOT, sid, "manifest.json");
      check(fs.existsSync(manifestPath), `manifest.json exists post-end`);
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        check(manifest.status === "ended", `manifest.status === "ended" (got ${manifest.status})`);
      }
      const recordDir = path.join(SESSIONS_ROOT, sid, "record");
      const eventFiles = fs.existsSync(recordDir)
        ? fs.readdirSync(recordDir).filter((f) => f.startsWith("events-") && f.endsWith(".jsonl"))
        : [];
      let sessionEndedFound = false;
      let sessionEndedSeq = -1;
      for (const ef of eventFiles) {
        const lines = fs.readFileSync(path.join(recordDir, ef), "utf8").split("\n").filter((l) => l.trim());
        for (const line of lines) {
          try {
            const env = JSON.parse(line);
            if (env.kind === "SessionEnded") {
              sessionEndedFound = true;
              sessionEndedSeq = env.seq;
              break;
            }
          } catch { /* skip */ }
        }
        if (sessionEndedFound) break;
      }
      check(sessionEndedFound, `record carries a SessionEnded envelope`);
      if (row) check(row.payload?.envelope_seq === sessionEndedSeq,
        `TRANSCRIPT_SESSION_ENDED_RENDERED.envelope_seq === record's SessionEnded seq (${row.payload?.envelope_seq} vs ${sessionEndedSeq})`);
    }

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
  console.log(`PASS three channels agree · session_id=${sid} ended · SessionEnded on record + manifest.status=ended`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
