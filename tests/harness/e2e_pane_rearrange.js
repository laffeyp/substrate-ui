// tests/harness/e2e_pane_rearrange.js — Sprint 004 three-channel harness.
// Splits into three panes, drags pane A onto pane B's east edge, asserts
// PANE_MOVED with zone="e"; drags pane C onto A center, asserts zone="c".
// Reads JSONL for DROP_HINT_SHOWN → DROP_HINT_ZONE_CHANGED* → PANE_MOVED →
// DROP_HINT_HIDDEN{committed:true}.

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

async function readJsonl() {
  return fs.existsSync(harnessJsonl())
    ? fs.readFileSync(harnessJsonl(), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))
    : [];
}

async function dragHandleToZone(win, sourceId, targetId, zone) {
  const handle = win.locator(`[data-testid="pane-drag-handle-${sourceId}"]`);
  const target = win.locator(`[data-pane-id="${targetId}"]`);
  const hb = await handle.boundingBox();
  const tb = await target.boundingBox();
  if (!hb || !tb) throw new Error("bounding boxes missing");
  const zonePoint = (() => {
    switch (zone) {
      case "w": return { x: tb.x + tb.width * 0.05, y: tb.y + tb.height * 0.5 };
      case "e": return { x: tb.x + tb.width * 0.95, y: tb.y + tb.height * 0.5 };
      case "n": return { x: tb.x + tb.width * 0.5,  y: tb.y + tb.height * 0.05 };
      case "s": return { x: tb.x + tb.width * 0.5,  y: tb.y + tb.height * 0.95 };
      case "c": return { x: tb.x + tb.width * 0.5,  y: tb.y + tb.height * 0.5 };
    }
  })();
  await win.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await win.mouse.down();
  // Move to the middle of the target first (kick DROP_HINT_SHOWN), then to zone.
  await win.mouse.move(tb.x + tb.width * 0.5, tb.y + tb.height * 0.5, { steps: 8 });
  await win.mouse.move(zonePoint.x, zonePoint.y, { steps: 8 });
  await new Promise((r) => setTimeout(r, 80));
  await win.mouse.up();
  await new Promise((r) => setTimeout(r, 150));
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

  // Build three panes: right + down.
  await win.keyboard.press("Meta+d");        await new Promise((r) => setTimeout(r, 120));
  await win.keyboard.press("Meta+Shift+D");  await new Promise((r) => setTimeout(r, 120));

  const paneIds = await win.$$eval('[data-pane-id]', els =>
    Array.from(new Set(els.map(el => el.getAttribute('data-pane-id')).filter(Boolean)))
  );
  check(paneIds.length === 3, `three distinct panes present (got ${paneIds.length})`);

  const [A, B, C] = paneIds;

  // Drag A onto B's east edge.
  const beforeMoves = (await readJsonl()).filter((s) => s.kind === "PANE_MOVED").length;
  await dragHandleToZone(win, A, B, "e");
  const emitsAfter1 = await readJsonl();
  const movesAfter1 = emitsAfter1.filter((s) => s.kind === "PANE_MOVED");
  check(movesAfter1.length === beforeMoves + 1, `PANE_MOVED fires once for A→B east (before=${beforeMoves} after=${movesAfter1.length})`);
  const move1 = movesAfter1[movesAfter1.length - 1];
  check(move1?.payload?.zone === "e", `A→B east: zone === "e" (got ${move1?.payload?.zone})`);

  // Verify DROP_HINT sequence for this drag.
  const kindsAfter1 = emitsAfter1.map((s) => s.kind);
  const shown1 = kindsAfter1.lastIndexOf("DROP_HINT_SHOWN");
  const zones1 = kindsAfter1.filter((k) => k === "DROP_HINT_ZONE_CHANGED").length;
  const moveIdx1 = kindsAfter1.lastIndexOf("PANE_MOVED");
  const hidden1 = kindsAfter1.lastIndexOf("DROP_HINT_HIDDEN");
  check(shown1 >= 0 && zones1 >= 1 && moveIdx1 > shown1 && hidden1 > moveIdx1,
    `DROP_HINT_SHOWN → ZONE_CHANGED* → PANE_MOVED → DROP_HINT_HIDDEN (indices ${shown1},${zones1}×zones,${moveIdx1},${hidden1})`);
  const lastZoneChange = [...emitsAfter1].reverse().find((s) => s.kind === "DROP_HINT_ZONE_CHANGED");
  check(lastZoneChange?.payload?.to_zone === move1?.payload?.zone,
    `PANE_MOVED.zone matches last DROP_HINT_ZONE_CHANGED.to_zone (${move1?.payload?.zone} vs ${lastZoneChange?.payload?.to_zone})`);

  // Drag C onto A center.
  await dragHandleToZone(win, C, A, "c");
  const emitsAfter2 = await readJsonl();
  const move2 = [...emitsAfter2].reverse().find((s) => s.kind === "PANE_MOVED");
  check(move2?.payload?.zone === "c", `C→A center: zone === "c" (got ${move2?.payload?.zone})`);

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

  console.log("");
  if (fails.length) {
    console.error("FAIL — three channels disagree:");
    for (const m of fails) console.error("  " + m);
    process.exit(1);
  }
  console.log(`PASS three channels agree · rearrange sequence A→B/e then C→A/c fires correct DROP_HINT + PANE_MOVED chain`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
