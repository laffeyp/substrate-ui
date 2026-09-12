// tests/harness/e2e_find_step.js — Sprint 029.
//
// Enter / Shift-Enter walk the match set silently. No MATCH_STEPPED
// tag exists in Layer 1 v0.1 — the walk is UI-only. The observation
// contract grades on DOM state (exactly one .find-active element at
// any time; the position walks with wraparound) and on the tag ledger
// staying clean (only FIND_OPENED / FIND_QUERY_CHANGED / FIND_CLOSED
// land during the run).

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { readAnchorByte } = require("./lib/anchor");
const {
  bindWorkspaceOrFixture, submitPrompt, waitForFirstPane,
  cleanupSession, rmWorkspace,
} = require("./lib/session");

const QUERY = "hello";

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_find_step", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "find_step"));
  check(!!sid, `session bound (session_id=${sid})`);

  // Submit three prompts containing "hello" so the transcript carries
  // at least three matches (each UserMessage's summary contains the
  // prompt text). Reply rows may or may not contain it.
  if (workspace) {
    for (let i = 0; i < 3; i += 1) {
      await submitPrompt(win, paneId, `hello turn ${i}`);
    }
  }

  const rows = win.locator(`[data-testid^="transcript-row-${paneId}-"]`);
  await rows.first().waitFor({ state: "attached", timeout: 8000 });

  // Open find, type the query, wait for debounce.
  await win.keyboard.press("Meta+f");
  await new Promise((r) => setTimeout(r, 200));
  await win.locator(`[data-testid="find-input-${paneId}"]`).fill(QUERY);
  await new Promise((r) => setTimeout(r, 250));

  const queryEmits = readJsonl().filter((s) => s.kind === "FIND_QUERY_CHANGED");
  check(queryEmits.length === 1, `one FIND_QUERY_CHANGED (got ${queryEmits.length})`);
  const count = queryEmits[queryEmits.length - 1].payload.count;
  check(count >= 3, `match count ≥ 3 (got ${count})`);

  const anchor = `anchor-pane-${paneId}-find`;
  const anchorBefore = await readAnchorByte(win, anchor);

  // The first match is highlighted from the commit onward.
  const activeSeqs = [];
  const readActiveSeq = async () => {
    const el = win.locator(`[data-testid^="transcript-row-${paneId}-"].find-active`);
    const c = await el.count();
    if (c !== 1) return { count: c, seq: null };
    const testid = await el.first().getAttribute("data-testid");
    const seq = Number(testid.split("-").pop());
    return { count: c, seq };
  };
  const initial = await readActiveSeq();
  check(initial.count === 1, `exactly one .find-active on commit (got ${initial.count})`);
  activeSeqs.push(initial.seq);

  // Enter three times → walk 0 → 1 → 2 → 0 (wrap when count === 3).
  for (let i = 0; i < count; i += 1) {
    await win.locator(`[data-testid="find-input-${paneId}"]`).focus();
    await win.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 100));
    const step = await readActiveSeq();
    check(step.count === 1,
      `exactly one .find-active after step ${i + 1} (got ${step.count})`);
    activeSeqs.push(step.seq);
  }
  check(activeSeqs[0] === activeSeqs[count],
    `after ${count} forward steps the highlight wraps to the origin`
    + ` (start=${activeSeqs[0]}, end=${activeSeqs[count]})`);

  // Anchor byte is invariant across the walk (scope + open don't change).
  check(await readAnchorByte(win, anchor) === anchorBefore,
    `find anchor byte constant through the walk`);

  // Trace stays clean of any find tag beyond the ratified three.
  const findTags = readJsonl().filter((s) => typeof s.kind === "string" && s.kind.startsWith("FIND_"));
  const uniqueKinds = new Set(findTags.map((s) => s.kind));
  const allowed = new Set(["FIND_OPENED", "FIND_QUERY_CHANGED", "FIND_CLOSED", "FIND_SCOPE_CHANGED"]);
  for (const k of uniqueKinds) {
    check(allowed.has(k), `no invented find tag ${k}`);
  }
  // No MATCH_STEPPED (the invented tag Layer 1 doesn't carry).
  check(!uniqueKinds.has("FIND_MATCH_STEPPED") && !uniqueKinds.has("MATCH_STEPPED"),
    `walk is silent (no MATCH_STEPPED emit)`);

  // Shift-Enter walks back with wraparound.
  await win.locator(`[data-testid="find-input-${paneId}"]`).focus();
  await win.keyboard.press("Shift+Enter");
  await new Promise((r) => setTimeout(r, 100));
  const back1 = await readActiveSeq();
  await win.keyboard.press("Shift+Enter");
  await new Promise((r) => setTimeout(r, 100));
  const back2 = await readActiveSeq();
  check(back1.seq !== back2.seq,
    `Shift-Enter moves the highlight (seqs ${back1.seq} vs ${back2.seq})`);

  // Teardown.
  await win.locator(`[data-testid="find-input-${paneId}"]`).focus();
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));

  const finalEmits = readJsonl();
  const opens = finalEmits.filter((s) => s.kind === "FIND_OPENED").length;
  const closes = finalEmits.filter((s) => s.kind === "FIND_CLOSED").length;
  check(opens === closes, `FIND_OPENED === FIND_CLOSED (${opens} vs ${closes})`);
});
