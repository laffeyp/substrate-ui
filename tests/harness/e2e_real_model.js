// tests/harness/e2e_real_model.js — real-model integration harness.
//
// The deterministic driver echoes "hello" — good enough for wiring but
// tells us nothing about what happens on real tokens. This harness picks
// a small local model over Ollama, binds a session via
// SUBSTRATE_HARNESS_DRIVER, submits a real prompt, and grades the
// ModelReply on the record. Skips cleanly if Ollama is offline or the
// target model is not pulled.

"use strict";
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession, SESSIONS_ROOT,
} = require("./lib/session");

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

(async () => {
  const ollama = await checkOllamaOnline();
  if (!ollama.up) {
    console.log(`SKIP — Ollama not reachable at 127.0.0.1:11434`);
    process.exit(0);
  }
  if (!ollama.hasModel) {
    console.log(`SKIP — model "${MODEL}" not pulled locally; \`ollama pull ${MODEL}\``);
    process.exit(0);
  }
  console.log(`  ok  Ollama online with ${MODEL} pulled`);

  let sid = null;
  const workspace = mkWorkspace("real-model");
  process.on("exit", () => { cleanupSession(sid); rmWorkspace(workspace); });

  runHarness("e2e_real_model", async ({ win, check }) => {
    const paneId = await waitForFirstPane(win);
    const picker = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await picker.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 15000));
    sid = readJsonl().find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id ?? null;
    check(!!sid, `session bound against ${DRIVER} (session_id=${sid})`);

    if (sid) {
      const manifest = JSON.parse(fs.readFileSync(path.join(SESSIONS_ROOT, sid, "manifest.json"), "utf8"));
      check(manifest.driver === DRIVER, `manifest.driver === "${DRIVER}" (got ${manifest.driver})`);
    }

    const question = "In one word, what colour is the sky on a clear day?";
    const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
    await prompt.focus();
    await prompt.fill(question);
    await win.keyboard.press("Meta+Enter");
    await new Promise((r) => setTimeout(r, 60000));

    const submitted = readJsonl().find((s) => s.kind === "TURN_SUBMITTED");
    check(!!submitted, `TURN_SUBMITTED fires — real turn round-tripped`);

    if (sid) {
      const recordDir = path.join(SESSIONS_ROOT, sid, "record");
      const modelReplies = [];
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
        check(!text.startsWith("final answer:"),
          `ModelReply.text is not the deterministic canned prefix`);
        const usage = modelReplies[0].payload?.model_usage;
        check(typeof usage === "object" && usage !== null,
          `ModelReply.model_usage is present`);
      }
    }
  }, { extraEnv: { SUBSTRATE_HARNESS_DRIVER: DRIVER } });
})().catch((e) => { console.error(e); process.exit(1); });
