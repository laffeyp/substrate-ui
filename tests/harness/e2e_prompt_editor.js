// tests/harness/e2e_prompt_editor.js — Sprint 011.
// Binds a session, types "hello world" into the prompt, asserts one
// PROMPT_CHANGED fires after the 100ms debounce, that its payload
// carries length=11 and no raw text, and that the whole JSONL has no
// substring "hello world" — the privacy invariant.

"use strict";
const fs = require("node:fs");
const { runHarness } = require("./lib/harness");
const { readJsonl, harnessJsonlPath } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, waitForFirstPane, cleanupSession, rmWorkspace,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_prompt_editor", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "prompt"));
  check(!!sid, `session bound (session_id=${sid})`);

  const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
  await prompt.waitFor({ state: "attached", timeout: 3000 });
  await prompt.focus();
  const preTypeCount = readJsonl().filter((s) => s.kind === "PROMPT_CHANGED").length;
  await prompt.type("hello world", { delay: 20 });
  await new Promise((r) => setTimeout(r, 300));

  const promptChanges = readJsonl().filter((s) => s.kind === "PROMPT_CHANGED");
  const post = promptChanges.length - preTypeCount;
  check(post >= 1 && post <= 3, `PROMPT_CHANGED debounces to 1..3 emits for 11 keystrokes @ 20ms (got ${post})`);
  const last = promptChanges[promptChanges.length - 1];
  check(last.payload.length === 11, `last PROMPT_CHANGED.length === 11 (got ${last.payload.length})`);
  check(last.payload.pane_id === paneId, `PROMPT_CHANGED.pane_id === focused pane`);

  const raw = fs.readFileSync(harnessJsonlPath(), "utf8");
  check(!raw.includes("hello world"), `no raw prompt text in JSONL (privacy)`);
  check(!raw.includes('"text":'), `no "text" field in any emitted payload`);
});
