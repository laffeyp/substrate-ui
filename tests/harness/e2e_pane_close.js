// tests/harness/e2e_pane_close.js — Sprint 005, close discipline.
// Split into three panes, close focused pane (walked focus fires), close
// remaining panes, last close emits WINDOW_CLOSED with a window_id.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");

runHarness("e2e_pane_close", async ({ win, check }) => {
  await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 200));

  await win.keyboard.press("Meta+d");        await new Promise((r) => setTimeout(r, 120));
  await win.keyboard.press("Meta+Shift+D");  await new Promise((r) => setTimeout(r, 120));
  const start = (await win.$$eval('[data-pane-id]', els =>
    Array.from(new Set(els.map(el => el.getAttribute('data-pane-id')).filter(Boolean)))
  )).length;
  check(start === 3, `three panes present (got ${start})`);

  const beforeClose = readJsonl().length;

  await win.keyboard.press("Meta+w");
  await new Promise((r) => setTimeout(r, 200));
  const afterOne = await win.$$eval('[data-pane-id]', els =>
    Array.from(new Set(els.map(el => el.getAttribute('data-pane-id')).filter(Boolean)))
  );
  check(afterOne.length === 2, `two panes remain after first close (got ${afterOne.length})`);

  const emitsAfterOne = readJsonl().slice(beforeClose);
  const kinds = emitsAfterOne.map((s) => s.kind);
  const iPCl = kinds.indexOf("PANE_CLOSED");
  const iPF  = kinds.indexOf("PANE_FOCUSED", iPCl);
  check(iPCl >= 0 && iPF > iPCl,
    `PANE_CLOSED → PANE_FOCUSED walked focus (${iPCl},${iPF})`);
  const walkedTo = emitsAfterOne[iPF]?.payload?.pane_id;
  check(afterOne.includes(walkedTo), `walked focus pane_id survives (walked=${walkedTo})`);

  await win.keyboard.press("Meta+w");
  await new Promise((r) => setTimeout(r, 150));
  await win.keyboard.press("Meta+w");
  await new Promise((r) => setTimeout(r, 300));

  const finalEmits = readJsonl();
  const paneClosedCount = finalEmits.filter((s) => s.kind === "PANE_CLOSED").length;
  const windowClosed = finalEmits.find((s) => s.kind === "WINDOW_CLOSED");
  check(paneClosedCount === 3, `three PANE_CLOSED emits (got ${paneClosedCount})`);
  check(!!windowClosed, `WINDOW_CLOSED fires when last pane closes`);
  check(typeof windowClosed?.payload?.window_id === "string",
    `WINDOW_CLOSED carries window_id (got ${windowClosed?.payload?.window_id})`);
}, { skipTonal: true });
