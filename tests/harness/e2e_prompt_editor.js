// tests/harness/e2e_prompt_editor.js — Sprint 011 three-channel harness.
// Binds a session, types "hello world" into the prompt, asserts one
// PROMPT_CHANGED fires after the 100ms debounce, that its payload carries
// `length: 11` and NOT the raw text, and that grepping the whole JSONL for
// "hello world" returns zero — the privacy invariant.

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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-harness-prompt-ws-"));

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

    // Bind a session so the prompt editor renders.
    const input = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await input.fill(workspace);
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1500));
    sid = (await readJsonl()).find((s) => s.kind === "SESSION_CREATED")?.payload?.session_id;
    check(!!sid, `session bound (session_id=${sid})`);

    // Type into the prompt.
    const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
    await prompt.waitFor({ state: "attached", timeout: 3000 });
    ok(`prompt editor mounts after bind`);

    await prompt.focus();
    const preTypeCount = (await readJsonl()).filter((s) => s.kind === "PROMPT_CHANGED").length;
    await prompt.type("hello world", { delay: 20 });
    await new Promise((r) => setTimeout(r, 300)); // debounce settles

    const emits = await readJsonl();
    const promptChanges = emits.filter((s) => s.kind === "PROMPT_CHANGED");
    const postTypeCount = promptChanges.length - preTypeCount;
    check(postTypeCount >= 1 && postTypeCount <= 3,
      `PROMPT_CHANGED debounces to 1..3 emits for 11 keystrokes @ 20ms (got ${postTypeCount})`);

    const last = promptChanges[promptChanges.length - 1];
    check(last?.payload?.length === 11, `last PROMPT_CHANGED.length === 11 (got ${last?.payload?.length})`);
    check(last?.payload?.pane_id === paneId, `PROMPT_CHANGED.pane_id === focused pane (got ${last?.payload?.pane_id})`);

    // Privacy invariant: raw text never enters the trace.
    const rawJsonl = fs.readFileSync(harnessJsonl(), "utf8");
    check(!rawJsonl.includes("hello world"), `no raw prompt text in JSONL (privacy invariant)`);
    check(!rawJsonl.includes("\"text\":"), `no "text" field in any emitted payload`);

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    // Vocabulary + shape discipline.
    const allEmits = await readJsonl();
    const kinds = allEmits.map((s) => s.kind);
    const V0_1 = new Set(fs.readFileSync(path.join(REPO, "src/observability/vocab.ts"), "utf8")
      .match(/"[A-Z][A-Z0-9_]{3,}"/g)?.map((s) => s.slice(1, -1)) || []);
    const invented = kinds.filter((k) => !V0_1.has(k));
    check(invented.length === 0, `zero invented tag names in the trace (found ${invented.length})`);
    try { assertLayer2ShapesInTrace(allEmits); ok("Layer 2 payload shapes match required fields"); }
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
  console.log(`PASS three channels agree · prompt debounces + privacy holds (session_id=${sid})`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
