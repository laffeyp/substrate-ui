// tests/harness/e2e_find_open.js — Sprint 028.
//
// Cmd-F opens the find bar scoped to the pane's focused half. Typing
// fires FIND_QUERY_CHANGED debounced 100ms with q_length + count —
// the raw q never appears in the JSONL trace. Tab flips reveal focus
// and re-scopes the bar (FIND_SCOPE_CHANGED). Esc closes.
//
// Layer 7 anchor `anchor-pane-<id>-find` byte: 0 closed · 128
// transcript-scope · 255 stream-scope.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { readAnchorByte } = require("./lib/anchor");
const { waitForFirstPane } = require("./lib/session");

const QUERY = "hello";

runHarness("e2e_find_open", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  const findAnchor = `anchor-pane-${paneId}-find`;

  check(await readAnchorByte(win, findAnchor) === 0, `initial find-anchor byte === 0`);

  // Cmd-F → FIND_OPENED.
  const preOpen = readJsonl().length;
  await win.keyboard.press("Meta+f");
  await new Promise((r) => setTimeout(r, 300));
  const opens = readJsonl().slice(preOpen).filter((s) => s.kind === "FIND_OPENED");
  check(opens.length === 1, `one FIND_OPENED after Cmd-F (got ${opens.length})`);
  check(opens[0].payload.scope === "transcript",
    `FIND_OPENED.scope === "transcript" (revealFocus default)`);
  check(await readAnchorByte(win, findAnchor) === 128,
    `anchor byte 128 for transcript-scope`);

  const bar = win.locator(`[data-testid="find-bar-${paneId}"]`);
  await bar.waitFor({ state: "attached", timeout: 3000 });

  // Type the query; wait past the 100ms debounce.
  const preType = readJsonl().length;
  await win.locator(`[data-testid="find-input-${paneId}"]`).fill(QUERY);
  await new Promise((r) => setTimeout(r, 250));
  const queryChanges = readJsonl().slice(preType).filter((s) => s.kind === "FIND_QUERY_CHANGED");
  check(queryChanges.length === 1,
    `one FIND_QUERY_CHANGED after debounce (got ${queryChanges.length})`);
  check(queryChanges[0].payload.q_length === QUERY.length,
    `FIND_QUERY_CHANGED.q_length === ${QUERY.length}`);
  check(typeof queryChanges[0].payload.count === "number"
     && queryChanges[0].payload.count >= 0,
    `FIND_QUERY_CHANGED.count is a non-negative integer`);

  // Privacy: the raw query string appears in NO emission's payload.
  const allEmits = readJsonl();
  const leaked = allEmits.filter((s) =>
    JSON.stringify(s.payload).toLowerCase().includes(QUERY.toLowerCase()));
  check(leaked.length === 0,
    `raw query "${QUERY}" absent from every emitted payload (found in ${leaked.length})`);

  // Tab → REVEAL_FOCUS_MOVED + FIND_SCOPE_CHANGED, anchor flips 128→255.
  const preTab = readJsonl().length;
  await win.locator(`[data-testid="find-input-${paneId}"]`).focus();
  await win.keyboard.press("Tab");
  await new Promise((r) => setTimeout(r, 200));
  const tabEmits = readJsonl().slice(preTab);
  const scopeChanges = tabEmits.filter((s) => s.kind === "FIND_SCOPE_CHANGED");
  const focusMoves = tabEmits.filter((s) => s.kind === "REVEAL_FOCUS_MOVED");
  check(scopeChanges.length === 1,
    `one FIND_SCOPE_CHANGED after Tab (got ${scopeChanges.length})`);
  check(scopeChanges[0].payload.from === "transcript"
     && scopeChanges[0].payload.to === "stream",
    `FIND_SCOPE_CHANGED{from:"transcript", to:"stream"}`);
  check(focusMoves.length === 1,
    `one REVEAL_FOCUS_MOVED after Tab (got ${focusMoves.length})`);
  check(await readAnchorByte(win, findAnchor) === 255,
    `anchor byte 255 for stream-scope`);

  // Esc → FIND_CLOSED.
  const preClose = readJsonl().length;
  await win.locator(`[data-testid="find-input-${paneId}"]`).focus();
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
  const closes = readJsonl().slice(preClose).filter((s) => s.kind === "FIND_CLOSED");
  check(closes.length === 1, `one FIND_CLOSED after Esc`);
  check(await readAnchorByte(win, findAnchor) === 0, `anchor byte back to 0`);
  check(await win.locator(`[data-testid="find-bar-${paneId}"]`).count() === 0,
    `find bar unmounts on close`);

  // Symmetry.
  const finalEmits = readJsonl();
  const opens_total = finalEmits.filter((s) => s.kind === "FIND_OPENED").length;
  const closes_total = finalEmits.filter((s) => s.kind === "FIND_CLOSED").length;
  check(opens_total === closes_total,
    `FIND_OPENED === FIND_CLOSED (${opens_total} vs ${closes_total})`);
});
