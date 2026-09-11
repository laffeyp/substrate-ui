// tests/harness/e2e_real_model.js — the real-model harness.
//
// The other harnesses use the DeterministicResponder — they submit "hello"
// and read back their own echo. That verifies the shell's plumbing but
// tells us nothing about what happens when a real local LLM runs a turn.
// This harness picks a small local model over Ollama's /api/chat, binds a
// session against that driver via SUBSTRATE_HARNESS_DRIVER, submits an
// actual prompt, and verifies the ModelReply carries text the model wrote,
// not text the shell canned.
//
// Skipped if Ollama isn't running on 127.0.0.1:11434 or if the target
// model isn't pulled locally.

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const http = require("node:http");
const { runTonalChecks } = require("./tonal-checks");
const { assertLayer2ShapesInTrace, assertNoInventedTags } = require("./payload-check");

const REPO = path.resolve(__dirname, "..", "..");
const AS = () => path.join(os.homedir(), "Library", "Application Support", "substrate-ui");
const harnessJsonl = () => path.join(AS(), "harness", "last.jsonl");
const SESSIONS_ROOT = path.join(os.homedir(), ".substrate", "sessions");

const MODEL = process.env.HARNESS_MODEL || "llama3.2:1b";
const DRIVER = `ollama:${MODEL}`;

function checkOllamaOnline() {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:11434/api/tags", { timeout: 2000 }, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          const names = new Set(data.models.map((m) => m.name));
          resolve({ up: true, hasModel: names.has(MODEL), models: [...names] });
        } catch { resolve({ up: false, hasModel: false, models: [] }); }
      });
    });
    req.on("error", () => resolve({ up: false, hasModel: false, models: [] }));
    req.on("timeout", () => { req.destroy(); resolve({ up: false, hasModel: false, models: [] }); });
  });
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

  const ollama = await checkOllamaOnline();
  if (!ollama.up) {
    console.log(`SKIP — Ollama not reachable at 127.0.0.1:11434`);
    process.exit(0);
  }
  if (!ollama.hasModel) {
    console.log(`SKIP — model "${MODEL}" not pulled locally; run \`ollama pull ${MODEL}\` first`);
    console.log(`  available models: ${ollama.models.slice(0, 5).join(", ")}...`);
    process.exit(0);
  }
  ok(`Ollama online at 127.0.0.1:11434 with ${MODEL} pulled`);

  try { fs.mkdirSync(path.dirname(harnessJsonl()), { recursive: true }); fs.writeFileSync(harnessJsonl(), ""); } catch (_) {}
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-real-model-ws-"));

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."], cwd: REPO,
    env: {
      ...process.env,
      SUBSTRATE_HARNESS: "1",
      SUBSTRATE_UI_PYTHON: substratePython,
      PYTHONUNBUFFERED: "1",
      SUBSTRATE_HARNESS_DRIVER: DRIVER,
    },
  });

  let sid = null;
  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
    await new Promise((r) => setTimeout(r, 300));

    const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));

    // Bind against the real model. The probe round-trip takes longer than
    // deterministic — the Ollama /api/show call must succeed before create.
    const picker = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await picker.fill(workspace);
    await win.keyboard.press("Enter");
    // Probe (10s budget per Layer 4) + create (5s) — wait generously.
    await new Promise((r) => setTimeout(r, 15000));
    let emits = await readJsonl();
    sid = emits.find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id;
    check(!!sid, `session bound against ${DRIVER} (session_id=${sid})`);

    // Verify the manifest actually records the ollama driver, not deterministic.
    if (sid) {
      const manifest = JSON.parse(fs.readFileSync(path.join(SESSIONS_ROOT, sid, "manifest.json"), "utf8"));
      check(manifest.driver === DRIVER,
        `manifest.driver === "${DRIVER}" (real routing, not deterministic) (got ${manifest.driver})`);
    }

    // Ask the model a specific question with a checkable answer.
    const question = "In one word, what colour is the sky on a clear day?";
    const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
    await prompt.focus();
    await prompt.fill(question);
    await win.keyboard.press("Meta+Enter");
    // A 1b local model takes seconds; give it 60s.
    await new Promise((r) => setTimeout(r, 60000));

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    emits = await readJsonl();
    const submitted = emits.find((s) => s.kind === "TURN_SUBMITTED");
    check(!!submitted, `TURN_SUBMITTED fires — real turn round-tripped`);

    // Read the record: the ModelReply.text must be the model's answer, not a
    // canned deterministic string. The 1b model is small but should produce
    // something with meaningful content — at minimum non-empty text longer
    // than a few characters.
    if (sid) {
      const recordDir = path.join(SESSIONS_ROOT, sid, "record");
      let modelReplies = [];
      if (fs.existsSync(recordDir)) {
        for (const ef of fs.readdirSync(recordDir).filter((f) => f.startsWith("events-"))) {
          for (const line of fs.readFileSync(path.join(recordDir, ef), "utf8").split("\n").filter((l) => l.trim())) {
            try {
              const env = JSON.parse(line);
              if (env.kind === "ModelReply") modelReplies.push(env);
            } catch { /* skip */ }
          }
        }
      }
      check(modelReplies.length >= 1, `record carries ≥ 1 ModelReply (got ${modelReplies.length})`);
      if (modelReplies.length) {
        const text = modelReplies[0].payload?.text ?? "";
        console.log(`  model text (first 200 chars): ${text.slice(0, 200).replace(/\n/g, " ")}`);
        check(typeof text === "string" && text.trim().length > 3,
          `ModelReply.text is non-trivial (length=${text.length})`);
        // The 1b model is unreliable on trivia; don't hard-assert the answer.
        // Real signal: text differs from the deterministic responder's canned
        // shape (DeterministicResponder returns "final answer: <seed hash>").
        check(!text.startsWith("final answer:"),
          `ModelReply.text is not the deterministic canned prefix (privacy: real-model text differs from stub)`);
      }
      // A ModelReply implies model_usage tokens per Layer 2's substrate schema.
      const usage = modelReplies[0]?.payload?.model_usage;
      check(typeof usage === "object" && usage !== null,
        `ModelReply.model_usage is present (got ${JSON.stringify(usage).slice(0, 100)})`);
    }

    // Vocabulary + shape discipline hold on a real-model trace, not just deterministic.
    try { assertNoInventedTags(emits); ok("zero invented tag names in the real-model trace"); }
    catch (e) { fails.push(e.message); }
    try { assertLayer2ShapesInTrace(emits); ok("Layer 2 payload shapes match on the real-model trace"); }
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
    console.error("FAIL — real-model channel disagrees:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS real model wrote a real reply · model=${MODEL} · session=${sid}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
