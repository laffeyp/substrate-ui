// tests/harness/e2e_pane_splits.js — Sprint 003 three-channel harness.
// Exercises splits, gutter drag, and the 8-pane cap. Reads JSONL for the
// same-step PANE_SPLIT → PANE_CREATED → PANE_FOCUSED sequence, and asserts
// the 9th split gesture emits zero PANE_SPLIT tags.

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

  const substratePython = process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

  const app = await electron.launch({
    args: ["."],
    cwd: REPO,
    env: { ...process.env, SUBSTRATE_HARNESS: "1", SUBSTRATE_UI_PYTHON: substratePython, PYTHONUNBUFFERED: "1" },
  });

  const win = await app.firstWindow();
  await win.waitForLoadState("domcontentloaded");
  await win.locator('[data-testid^="pane-"]').first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 200));

  const firstEmits = await readJsonl();
  const bootCount = firstEmits.length;

  async function splitRight() {
    await win.keyboard.press("Meta+d");
    await new Promise((r) => setTimeout(r, 150));
  }
  async function splitDown() {
    await win.keyboard.press("Meta+Shift+D");
    await new Promise((r) => setTimeout(r, 150));
  }

  // Split right, then split down.
  await splitRight();
  await splitDown();

  const paneCount = await win.locator('[data-pane-id]').count();
  check(paneCount === 3, `three panes after right + down (got ${paneCount})`);

  // Gutter drag: pick the row-axis gutter (horizontal drag) so a horizontal mouse
  // move produces a nonzero delta. Col-axis gutters only respond to vertical drag.
  const gutter = win.locator('[data-testid^="gutter-"][data-axis="row"]').first();
  await gutter.waitFor({ state: "attached", timeout: 3000 });
  const box = await gutter.boundingBox();
  if (box) {
    await win.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await win.mouse.down();
    await win.mouse.move(200, box.y + box.height / 2, { steps: 10 });
    await win.mouse.up();
    await new Promise((r) => setTimeout(r, 200));
  }

  // Attempt splits up to the 8-pane cap.
  for (let i = 0; i < 6; i++) await splitRight();
  await new Promise((r) => setTimeout(r, 200));
  const capCount = await win.locator('[data-pane-id]').count();
  check(capCount === 8, `pane count clamps at cap 8 after over-splitting (got ${capCount})`);

  // Attempt one more split; expect no new PANE_SPLIT emit.
  const beforeCap = (await readJsonl()).filter((s) => s.kind === "PANE_SPLIT").length;
  await splitRight();
  await new Promise((r) => setTimeout(r, 200));
  const afterCap = (await readJsonl()).filter((s) => s.kind === "PANE_SPLIT").length;
  check(afterCap === beforeCap, `9th split gesture emits zero PANE_SPLIT (before=${beforeCap} after=${afterCap})`);

  try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
  catch (e) { fails.push(`tonal check failed: ${e.message}`); }

  await app.close();

  const emits = await readJsonl();
  const kinds = emits.map((s) => s.kind);

  // Verify the same-step chain for the FIRST split: PANE_SPLIT → PANE_CREATED → PANE_FOCUSED.
  const psIdx = kinds.indexOf("PANE_SPLIT", bootCount);
  const pcIdx = kinds.indexOf("PANE_CREATED", psIdx);
  const pfIdx = kinds.indexOf("PANE_FOCUSED", pcIdx);
  check(psIdx > 0 && pcIdx > psIdx && pfIdx > pcIdx,
    `first-split chain PANE_SPLIT → PANE_CREATED → PANE_FOCUSED (${psIdx},${pcIdx},${pfIdx})`);
  const psT = emits[psIdx]?.t, pcT = emits[pcIdx]?.t, pfT = emits[pfIdx]?.t;
  check(pcT - psT < 16 && pfT - pcT < 16, `same-step (< 16ms per Layer 4): Δ=${pcT - psT}ms, ${pfT - pcT}ms`);

  // GUTTER_DRAG_STARTED → GUTTER_DRAG_STOPPED bracketing.
  const gStart = kinds.filter((k) => k === "GUTTER_DRAG_STARTED").length;
  const gStop = kinds.filter((k) => k === "GUTTER_DRAG_STOPPED").length;
  check(gStart === 1 && gStop === 1, `one GUTTER_DRAG_STARTED + one GUTTER_DRAG_STOPPED (got ${gStart}/${gStop})`);
  const gsIdx = kinds.indexOf("GUTTER_DRAG_STARTED");
  const geIdx = kinds.indexOf("GUTTER_DRAG_STOPPED");
  check(geIdx > gsIdx, `gutter stop follows gutter start (${gsIdx} → ${geIdx})`);
  const delta = emits[geIdx]?.payload?.delta;
  const kind = emits[geIdx]?.payload?.kind;
  check(typeof delta === "number" && Math.abs(delta) > 0 && Math.abs(delta) < 1,
    `GUTTER_DRAG_STOPPED carries delta in (-1,1) (got ${delta})`);
  check(kind === "row" || kind === "col",
    `GUTTER_DRAG_STOPPED carries kind ∈ {row,col} (got ${kind})`);

  // Vocabulary discipline.
  try { assertNoInventedTags(emits); ok("zero invented tag names in the trace"); }
  catch (e) { fails.push(e.message); }

  try { assertLayer2ShapesInTrace(emits); ok("Layer 2 payload shapes match required fields"); }
  catch (e) { fails.push(e.message); }

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · panes=${capCount} · gutter delta=${delta.toFixed(2)} · kind=${kind}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
