// tests/harness/e2e_transcript_render.js — Sprint 014 three-channel harness.
// Binds a session, submits "hello", waits for the record to grow, asserts
// the shell renders one row per user-visible envelope with matching
// TRANSCRIPT_ROW_RENDERED emits.

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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-transcript-ws-"));

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

    // Submit a turn to grow the record.
    const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
    await prompt.focus();
    await prompt.fill("hello");
    await win.keyboard.press("Meta+Enter");
    await new Promise((r) => setTimeout(r, 3000));

    // Wait for at least one transcript row to render.
    const rows = win.locator(`[data-testid^="transcript-row-${paneId}-"]`);
    await rows.first().waitFor({ state: "attached", timeout: 3000 });
    const rowCount = await rows.count();
    check(rowCount >= 2, `transcript renders ≥ 2 rows (user + model) after one turn (got ${rowCount})`);

    // Verify the rows include a UserMessage kind (grep the DOM by data-kind).
    const userRows = await win.locator(`[data-testid^="transcript-row-${paneId}-"][data-kind="UserMessage"]`).count();
    check(userRows === 1, `exactly one UserMessage row (got ${userRows})`);
    const modelRows = await win.locator(`[data-testid^="transcript-row-${paneId}-"][data-kind="ModelReply"]`).count();
    check(modelRows >= 1, `at least one ModelReply row (got ${modelRows})`);

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    // Signal check: TRANSCRIPT_ROW_RENDERED per envelope with all four required fields.
    const emits = await readJsonl();
    const trrs = emits.filter((s) => s.kind === "TRANSCRIPT_ROW_RENDERED");
    check(trrs.length >= 2, `≥ 2 TRANSCRIPT_ROW_RENDERED emits (got ${trrs.length})`);
    for (const t of trrs) {
      const p = t.payload;
      const missing = ["pane_id", "envelope_seq", "envelope_kind", "envelope_producer_kind"].filter((k) => !(k in p));
      check(missing.length === 0, `TRANSCRIPT_ROW_RENDERED payload complete (${JSON.stringify(p)}, missing=${missing})`);
    }

    // envelope_seq monotonic per pane.
    const seqs = trrs.map((t) => t.payload.envelope_seq);
    const monotonic = seqs.every((s, i) => i === 0 || s > seqs[i - 1]);
    check(monotonic, `envelope_seq monotonically increases (${JSON.stringify(seqs)})`);

    // Correlate with substrate's on-disk record: every UserMessage/ModelReply env in the record
    // matches a TRANSCRIPT_ROW_RENDERED emit.
    if (sid) {
      const recordDir = path.join(SESSIONS_ROOT, sid, "record");
      const visibleKinds = new Set(["UserMessage", "ModelReply"]);
      const visibleSeqs = [];
      if (fs.existsSync(recordDir)) {
        for (const ef of fs.readdirSync(recordDir).filter((f) => f.startsWith("events-"))) {
          for (const line of fs.readFileSync(path.join(recordDir, ef), "utf8").split("\n").filter((l) => l.trim())) {
            const env = JSON.parse(line);
            if (visibleKinds.has(env.kind)) visibleSeqs.push(env.seq);
          }
        }
      }
      const emittedSeqs = trrs.filter((t) => visibleKinds.has(t.payload.envelope_kind)).map((t) => t.payload.envelope_seq);
      check(visibleSeqs.every((s) => emittedSeqs.includes(s)),
        `every visible envelope (User/Model) has a matching TRANSCRIPT_ROW_RENDERED (record=${JSON.stringify(visibleSeqs)}, emitted=${JSON.stringify(emittedSeqs)})`);
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
  console.log(`PASS three channels agree · transcript rows match record envelopes (session_id=${sid})`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
