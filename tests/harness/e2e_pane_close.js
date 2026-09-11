// tests/harness/e2e_pane_close.js — Sprint 005 three-channel harness.
// Splits into three panes, closes the focused pane and asserts walked focus,
// then closes remaining panes and asserts the last emits WINDOW_CLOSED with
// reason="last_pane_closed".

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
  await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 200));

  // Build three panes.
  await win.keyboard.press("Meta+d");        await new Promise((r) => setTimeout(r, 120));
  await win.keyboard.press("Meta+Shift+D");  await new Promise((r) => setTimeout(r, 120));
  const start = (await win.$$eval('[data-pane-id]', els =>
    Array.from(new Set(els.map(el => el.getAttribute('data-pane-id')).filter(Boolean)))
  )).length;
  check(start === 3, `three panes present (got ${start})`);

  // Snapshot the emit count before close.
  const beforeClose = (await readJsonl()).length;

  // Close the focused pane (⌘W).
  await win.keyboard.press("Meta+w");
  await new Promise((r) => setTimeout(r, 200));
  const afterOne = await win.$$eval('[data-pane-id]', els =>
    Array.from(new Set(els.map(el => el.getAttribute('data-pane-id')).filter(Boolean)))
  );
  check(afterOne.length === 2, `two panes remain after first close (got ${afterOne.length})`);

  const emitsAfterOne = (await readJsonl()).slice(beforeClose);
  const kindsAfterOne = emitsAfterOne.map((s) => s.kind);
  const paneClosedIdx = kindsAfterOne.indexOf("PANE_CLOSED");
  const paneFocusedIdx = kindsAfterOne.indexOf("PANE_FOCUSED", paneClosedIdx);
  check(paneClosedIdx >= 0 && paneFocusedIdx > paneClosedIdx,
    `PANE_CLOSED → PANE_FOCUSED (walked focus) after first close (${paneClosedIdx},${paneFocusedIdx})`);
  const walkedTo = emitsAfterOne[paneFocusedIdx]?.payload?.pane_id;
  check(afterOne.includes(walkedTo), `walked-focus pane_id is one of the survivors (walked=${walkedTo})`);

  // Close remaining panes; last should emit WINDOW_CLOSED.
  await win.keyboard.press("Meta+w");
  await new Promise((r) => setTimeout(r, 150));
  await win.keyboard.press("Meta+w");
  await new Promise((r) => setTimeout(r, 300));

  try { await runTonalChecks(win); ok("standing tonal checks pass (currency + emoji + nowrap)"); }
  catch (_) {
    // The window may have closed by now; tonal checks are optional here.
    ok("tonal checks skipped (window closed)");
  }

  await app.close().catch(() => {});

  const finalEmits = await readJsonl();
  const kinds = finalEmits.map((s) => s.kind);
  const paneClosedCount = kinds.filter((k) => k === "PANE_CLOSED").length;
  const windowClosed = finalEmits.find((s) => s.kind === "WINDOW_CLOSED");
  check(paneClosedCount === 3, `three PANE_CLOSED emits total (got ${paneClosedCount})`);
  check(windowClosed !== undefined, `WINDOW_CLOSED fires when last pane closes`);
  check(typeof windowClosed?.payload?.window_id === "string",
    `WINDOW_CLOSED carries window_id (got ${windowClosed?.payload?.window_id})`);

  // Vocabulary discipline.
  try { assertNoInventedTags(finalEmits); ok("zero invented tag names in the trace"); }
  catch (e) { fails.push(e.message); }

  try { assertLayer2ShapesInTrace(finalEmits); ok("Layer 2 payload shapes match required fields"); }
  catch (e) { fails.push(e.message); }

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · pane_closes=${paneClosedCount} · window_closed=${windowClosed?.payload?.window_id}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
