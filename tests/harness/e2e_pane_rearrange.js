// tests/harness/e2e_pane_rearrange.js — Sprint 004.
// Drags pane A onto pane B's east edge (zone="e"); drags pane C onto A
// center (zone="c"). Each drag emits DROP_HINT_SHOWN → DROP_HINT_ZONE_
// CHANGED* → PANE_MOVED → DROP_HINT_HIDDEN.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");

async function dragHandleToZone(win, sourceId, targetId, zone) {
  const handle = win.locator(`[data-testid="pane-drag-handle-${sourceId}"]`);
  const target = win.locator(`[data-pane-id="${targetId}"]`);
  const hb = await handle.boundingBox();
  const tb = await target.boundingBox();
  if (!hb || !tb) throw new Error("bounding boxes missing");
  const zonePoint = {
    w: { x: tb.x + tb.width * 0.05, y: tb.y + tb.height * 0.5  },
    e: { x: tb.x + tb.width * 0.95, y: tb.y + tb.height * 0.5  },
    n: { x: tb.x + tb.width * 0.5,  y: tb.y + tb.height * 0.05 },
    s: { x: tb.x + tb.width * 0.5,  y: tb.y + tb.height * 0.95 },
    c: { x: tb.x + tb.width * 0.5,  y: tb.y + tb.height * 0.5  },
  }[zone];
  await win.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await win.mouse.down();
  await win.mouse.move(tb.x + tb.width * 0.5, tb.y + tb.height * 0.5, { steps: 8 });
  await win.mouse.move(zonePoint.x, zonePoint.y, { steps: 8 });
  await new Promise((r) => setTimeout(r, 80));
  await win.mouse.up();
  await new Promise((r) => setTimeout(r, 150));
}

runHarness("e2e_pane_rearrange", async ({ win, check }) => {
  await win.locator('[data-testid^="pane-"]').first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 200));

  await win.keyboard.press("Meta+d");        await new Promise((r) => setTimeout(r, 120));
  await win.keyboard.press("Meta+Shift+D");  await new Promise((r) => setTimeout(r, 120));
  const paneIds = await win.$$eval('[data-pane-id]', els =>
    Array.from(new Set(els.map(el => el.getAttribute('data-pane-id')).filter(Boolean)))
  );
  check(paneIds.length === 3, `three panes present (got ${paneIds.length})`);
  const [A, B, C] = paneIds;

  const beforeMoves = readJsonl().filter((s) => s.kind === "PANE_MOVED").length;
  await dragHandleToZone(win, A, B, "e");
  const emitsAfter1 = readJsonl();
  const moves1 = emitsAfter1.filter((s) => s.kind === "PANE_MOVED");
  check(moves1.length === beforeMoves + 1, `PANE_MOVED fires once for A→B east`);
  const move1 = moves1[moves1.length - 1];
  check(move1.payload.zone === "e", `A→B east: zone === "e" (got ${move1.payload.zone})`);

  const kinds1 = emitsAfter1.map((s) => s.kind);
  const shown = kinds1.lastIndexOf("DROP_HINT_SHOWN");
  const zones = kinds1.filter((k) => k === "DROP_HINT_ZONE_CHANGED").length;
  const moveIdx = kinds1.lastIndexOf("PANE_MOVED");
  const hidden = kinds1.lastIndexOf("DROP_HINT_HIDDEN");
  check(shown >= 0 && zones >= 1 && moveIdx > shown && hidden > moveIdx,
    `DROP_HINT_SHOWN → ZONE_CHANGED* → PANE_MOVED → DROP_HINT_HIDDEN`);
  const lastZone = [...emitsAfter1].reverse().find((s) => s.kind === "DROP_HINT_ZONE_CHANGED");
  check(lastZone.payload.to_zone === move1.payload.zone,
    `PANE_MOVED.zone matches last DROP_HINT_ZONE_CHANGED.to_zone`);

  await dragHandleToZone(win, C, A, "c");
  const move2 = [...readJsonl()].reverse().find((s) => s.kind === "PANE_MOVED");
  check(move2.payload.zone === "c", `C→A center: zone === "c" (got ${move2.payload.zone})`);
});
