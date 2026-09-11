// tests/harness/e2e_inspector.js — Sprint 024.
//
// Binds a session, submits a turn so the transcript has real rows,
// clicks a row → INSPECTOR_OPENED fires with envelope_seq matching
// the clicked row; the inspector surface mounts; the anchor byte
// carries the low byte of the seq. Same-click on the same row →
// INSPECTOR_CLOSED (D22 semantics); the surface unmounts; anchor
// resets to 0. Clicking a different row → CLOSED for the prior seq
// + OPENED for the new seq (Layer 5 mutex — at most one surface open
// per pane).

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { readAnchorByte } = require("./lib/anchor");
const {
  bindWorkspaceOrFixture, submitPrompt, waitForFirstPane,
  cleanupSession, rmWorkspace,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_inspector", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "inspector"));
  check(!!sid, `session bound (session_id=${sid})`);

  if (workspace) {
    await submitPrompt(win, paneId, "hello");
  }

  const rows = win.locator(`[data-testid^="transcript-row-${paneId}-"]`);
  await rows.first().waitFor({ state: "attached", timeout: 5000 });
  const rowCount = await rows.count();
  check(rowCount >= 2, `transcript has ≥ 2 rows to inspect (got ${rowCount})`);

  // The deterministic driver emits real envelopes at non-zero seqs
  // (substrate's framework brackets consume 0..6). Query the actual
  // seqs the shell rendered so the harness doesn't hard-code them.
  const rowInfos = await rows.evaluateAll((els) => els.map((el) => ({
    seq: Number(el.getAttribute("data-testid").split("-").pop()),
    kind: el.getAttribute("data-kind"),
  })));
  const firstSeq = rowInfos[0].seq;
  const secondSeq = rowInfos[1].seq;
  console.log(`  row seqs: [${rowInfos.map((r) => r.seq).join(",")}]`);

  // Base: inspector closed, anchor byte 0.
  check(await readAnchorByte(win, `anchor-pane-${paneId}-inspect`) === 0,
    `initial anchor-inspect byte === 0 (closed)`);

  // Click the first real row.
  const preClick = readJsonl().length;
  const row0 = win.locator(`[data-testid="transcript-row-${paneId}-${firstSeq}"]`);
  await row0.click();
  await new Promise((r) => setTimeout(r, 150));

  let emits = readJsonl().slice(preClick);
  const opens1 = emits.filter((s) => s.kind === "INSPECTOR_OPENED");
  check(opens1.length === 1, `one INSPECTOR_OPENED after row-0 click (got ${opens1.length})`);
  check(opens1[0].payload.pane_id === paneId, `OPENED.pane_id matches`);
  check(opens1[0].payload.envelope_seq === firstSeq, `OPENED.envelope_seq === ${firstSeq}`);

  const inspector = win.locator(`[data-testid="inspector-${paneId}"]`);
  await inspector.waitFor({ state: "attached", timeout: 2000 });
  check(await inspector.getAttribute("data-envelope-seq") === String(firstSeq),
    `inspector surface renders for seq ${firstSeq}`);
  check(await readAnchorByte(win, `anchor-pane-${paneId}-inspect`) === (firstSeq & 0xff),
    `anchor byte === ${firstSeq & 0xff} (low byte of seq ${firstSeq})`);

  // D22 — same-click closes.
  const preSameClick = readJsonl().length;
  await row0.click();
  await new Promise((r) => setTimeout(r, 150));
  emits = readJsonl().slice(preSameClick);
  const closes = emits.filter((s) => s.kind === "INSPECTOR_CLOSED");
  check(closes.length === 1, `one INSPECTOR_CLOSED on same-click (got ${closes.length})`);
  check(closes[0].payload.envelope_seq === firstSeq, `CLOSED.envelope_seq === ${firstSeq}`);
  check(await win.locator(`[data-testid="inspector-${paneId}"]`).count() === 0,
    `inspector surface unmounts after same-click`);

  // Layer 5 mutex — open row 0, then click row 1: CLOSED(0) + OPENED(1).
  await row0.click();
  await new Promise((r) => setTimeout(r, 150));
  const preMutex = readJsonl().length;
  const row1 = win.locator(`[data-testid="transcript-row-${paneId}-${secondSeq}"]`);
  await row1.click();
  await new Promise((r) => setTimeout(r, 150));
  emits = readJsonl().slice(preMutex);
  const cSeqs = emits.filter((s) => s.kind === "INSPECTOR_CLOSED").map((s) => s.payload.envelope_seq);
  const oSeqs = emits.filter((s) => s.kind === "INSPECTOR_OPENED").map((s) => s.payload.envelope_seq);
  check(cSeqs.length === 1 && cSeqs[0] === firstSeq, `mutex fires CLOSED(${firstSeq}) (got ${cSeqs.join(",")})`);
  check(oSeqs.length === 1 && oSeqs[0] === secondSeq, `mutex fires OPENED(${secondSeq}) (got ${oSeqs.join(",")})`);
  check(await win.locator(`[data-testid="inspector-${paneId}"]`).getAttribute("data-envelope-seq") === String(secondSeq),
    `inspector now on seq ${secondSeq}`);
  check(await readAnchorByte(win, `anchor-pane-${paneId}-inspect`) === (secondSeq & 0xff),
    `anchor byte === ${secondSeq & 0xff} (low byte of seq ${secondSeq})`);

  // Layer 4 balance — OPENED count === CLOSED count over the session.
  const allEmits = readJsonl();
  const totalOpen = allEmits.filter((s) => s.kind === "INSPECTOR_OPENED").length;
  const totalClose = allEmits.filter((s) => s.kind === "INSPECTOR_CLOSED").length;
  // At session close, the runHarness scaffold closes the app while
  // inspector is still open on row 1 — that's one unbalanced open
  // that never gets its close emit. Assert |open - close| ≤ 1.
  check(Math.abs(totalOpen - totalClose) <= 1,
    `OPEN count === CLOSE count within one (open=${totalOpen}, close=${totalClose})`);
});
