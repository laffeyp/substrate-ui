// tests/harness/e2e_transcript_render.js — Sprint 014.
// Binds a session, submits "hello", asserts one transcript row per
// user-visible envelope with matching TRANSCRIPT_ROW_RENDERED emits;
// envelope_seq monotonic; every UserMessage/ModelReply seq on disk
// appears in the emitted rows.

"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, submitPrompt, waitForFirstPane,
  cleanupSession, rmWorkspace, SESSIONS_ROOT,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_transcript_render", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "transcript"));
  check(!!sid, `session bound (session_id=${sid})`);

  if (workspace) {
    await submitPrompt(win, paneId, "hello");
  }

  const rows = win.locator(`[data-testid^="transcript-row-${paneId}-"]`);
  await rows.first().waitFor({ state: "attached", timeout: 3000 });
  check(await rows.count() >= 2, `≥ 2 transcript rows (user + model) after one turn`);
  check(await win.locator(`[data-testid^="transcript-row-${paneId}-"][data-kind="UserMessage"]`).count() >= 1,
    `at least one UserMessage row`);
  check(await win.locator(`[data-testid^="transcript-row-${paneId}-"][data-kind="ModelReply"]`).count() >= 1,
    `at least one ModelReply row`);

  const trrs = readJsonl().filter((s) => s.kind === "TRANSCRIPT_ROW_RENDERED");
  check(trrs.length >= 2, `≥ 2 TRANSCRIPT_ROW_RENDERED emits (got ${trrs.length})`);
  for (const t of trrs) {
    const missing = ["pane_id", "envelope_seq", "envelope_kind", "envelope_producer_kind"]
      .filter((k) => !(k in t.payload));
    check(missing.length === 0, `TRANSCRIPT_ROW_RENDERED payload complete (missing=${missing.join(",")})`);
  }
  const seqs = trrs.map((t) => t.payload.envelope_seq);
  check(seqs.every((s, i) => i === 0 || s > seqs[i - 1]), `envelope_seq monotonic`);

  if (sid) {
    const recordDir = path.join(SESSIONS_ROOT, sid, "record");
    const visible = new Set(["UserMessage", "ModelReply"]);
    const visibleSeqs = [];
    if (fs.existsSync(recordDir)) {
      for (const ef of fs.readdirSync(recordDir).filter((f) => f.startsWith("events-"))) {
        for (const line of fs.readFileSync(path.join(recordDir, ef), "utf8").split("\n").filter((l) => l.trim())) {
          try {
            const env = JSON.parse(line);
            if (visible.has(env.kind)) visibleSeqs.push(env.seq);
          } catch { /* skip */ }
        }
      }
    }
    const emittedSeqs = trrs.filter((t) => visible.has(t.payload.envelope_kind)).map((t) => t.payload.envelope_seq);
    check(visibleSeqs.every((s) => emittedSeqs.includes(s)),
      `every visible envelope seq has a matching emit`);
  }
});
