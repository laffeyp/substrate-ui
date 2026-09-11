// tests/harness/e2e_workspace_picker.js — Sprint 006 three-channel harness.
// Primes ~/.substrate/recent-workspaces.json with two rows, launches the app,
// verifies the picker mounts inside the unbound pane, walks with ↑↓, asserts
// one WORKSPACE_PICKER_WALKED per keypress with the correct index + path.

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
const RECENT = path.join(os.homedir(), ".substrate", "recent-workspaces.json");

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

  // Snapshot existing recent-workspaces so we restore after.
  let priorRecent = null;
  try { priorRecent = fs.readFileSync(RECENT, "utf8"); } catch (_) {}
  fs.mkdirSync(path.dirname(RECENT), { recursive: true });
  fs.writeFileSync(RECENT, JSON.stringify([
    { path: "/tmp/substrate-harness-alpha",  shape: "flat",   last_used: Date.now() - 1000 },
    { path: "/tmp/substrate-harness-beta",   shape: "worktree", last_used: Date.now() - 2000 },
    { path: "/tmp/substrate-harness-gamma",  shape: "isolate", last_used: Date.now() - 3000 },
  ], null, 2));

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."],
    cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  try {
    const win = await app.firstWindow();
    await win.waitForLoadState("domcontentloaded");
    await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
    await new Promise((r) => setTimeout(r, 400)); // let readRecentWorkspaces round-trip

    const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));
    check(!!paneId, `unbound pane mounts on boot`);

    const pickerInput = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
    await pickerInput.waitFor({ state: "attached", timeout: 3000 });
    ok(`picker input mounts`);

    const list = win.locator(`[data-testid="unbound-picker-list-${paneId}"] > div`);
    const rowCount = await list.count();
    check(rowCount === 3, `three recent rows render (got ${rowCount})`);

    // Walk with ↓ once.
    await pickerInput.focus();
    await win.keyboard.press("ArrowDown");
    await new Promise((r) => setTimeout(r, 80));

    let emits = await readJsonl();
    let walks = emits.filter((s) => s.kind === "WORKSPACE_PICKER_WALKED");
    check(walks.length === 1, `one WORKSPACE_PICKER_WALKED after one ArrowDown (got ${walks.length})`);
    check(walks[0]?.payload?.to_index === 0 && walks[0]?.payload?.from_index === -1,
      `first walk payload: from_index=-1, to_index=0 (got from=${walks[0]?.payload?.from_index}, to=${walks[0]?.payload?.to_index})`);

    await win.keyboard.press("ArrowDown");
    await win.keyboard.press("ArrowDown");
    await new Promise((r) => setTimeout(r, 80));

    emits = await readJsonl();
    walks = emits.filter((s) => s.kind === "WORKSPACE_PICKER_WALKED");
    check(walks.length === 3, `three walks total after three arrows (got ${walks.length})`);
    check(walks[2]?.payload?.to_index === 2, `third walk to_index === 2 (got ${walks[2]?.payload?.to_index})`);

    // Wrap-around test: one more ↓ from index 2 → index 0.
    await win.keyboard.press("ArrowDown");
    await new Promise((r) => setTimeout(r, 80));
    emits = await readJsonl();
    walks = emits.filter((s) => s.kind === "WORKSPACE_PICKER_WALKED");
    check(walks[3]?.payload?.to_index === 0, `wrap-around: fourth walk to_index === 0 (got ${walks[3]?.payload?.to_index})`);

    try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
    catch (e) { fails.push(`tonal check failed: ${e.message}`); }

    await app.close();

    const allEmits = await readJsonl();
    const kinds = allEmits.map((s) => s.kind);
    const V0_1 = new Set(fs.readFileSync(path.join(REPO, "src/observability/vocab.ts"), "utf8")
      .match(/"[A-Z][A-Z0-9_]{3,}"/g)?.map((s) => s.slice(1, -1)) || []);
    const invented = kinds.filter((k) => !V0_1.has(k));
    check(invented.length === 0, `zero invented tag names in the trace (found ${invented.length})`);

    try { assertLayer2ShapesInTrace(allEmits); ok("Layer 2 payload shapes match required fields"); }
    catch (e) { fails.push(e.message); }

    // Layer 1 v0.1 discipline: picker fires ONLY WORKSPACE_PICKER_WALKED — no OPENED/COMMITTED/CLOSED.
    const forbidden = kinds.filter((k) => k.startsWith("WORKSPACE_PICKER_") && k !== "WORKSPACE_PICKER_WALKED");
    check(forbidden.length === 0, `no invented picker open/commit/close tags (found ${forbidden.length})`);

  } finally {
    // Restore prior recent-workspaces.
    if (priorRecent !== null) fs.writeFileSync(RECENT, priorRecent);
    else { try { fs.unlinkSync(RECENT); } catch (_) {} }
  }

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · picker WALKED sequence + wrap-around fires exactly N tags for N keys`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
