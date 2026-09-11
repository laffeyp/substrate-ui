// tests/harness/e2e_reveal_focus.js — Sprint 019.
// Reveal focus flips between the transcript half and the stream half.
// Tab press → REVEAL_FOCUS_MOVED with {pane_id, from, to} (Layer 2).
// Three-channel:
//   Structural: data-reveal-focus on the shell + focus-ring class on
//     the active half.
//   Perceptual: none — Layer 7 does not name an anchor for this focus;
//     reveal focus is a walk aid, not a load-bearing state.
//   Signal: one REVEAL_FOCUS_MOVED per Tab; from/to alternates.
// Multi-pane isolation: split into two revealed panes and confirm each
// pane holds its own focus token.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, waitForFirstPane, cleanupSession, rmWorkspace,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_reveal_focus", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "reveal-focus"));
  check(!!sid, `session bound (session_id=${sid})`);

  await win.locator(`[data-testid="pane-reveal-toggle-${paneId}"]`).click();
  await new Promise((r) => setTimeout(r, 200));
  const shell = win.locator(`[data-testid="reveal-shell-${paneId}"]`);
  await shell.waitFor({ state: "attached", timeout: 3000 });
  check((await shell.getAttribute("data-reveal-focus")) === "transcript", `initial focus === "transcript"`);
  check((await win.locator(`[data-testid="transcript-half-${paneId}"]`).getAttribute("data-focused")) === "true",
    `transcript half data-focused === "true"`);
  check((await win.locator(`[data-testid="stream-half-${paneId}"]`).getAttribute("data-focused")) === "false",
    `stream half data-focused === "false"`);

  const preTab = readJsonl().length;

  await shell.focus();
  await win.keyboard.press("Tab");
  await new Promise((r) => setTimeout(r, 150));
  check((await shell.getAttribute("data-reveal-focus")) === "stream", `after 1 Tab: focus === "stream"`);
  check((await win.locator(`[data-testid="stream-half-${paneId}"]`).getAttribute("data-focused")) === "true",
    `stream half now focused`);

  await win.keyboard.press("Tab");
  await new Promise((r) => setTimeout(r, 150));
  check((await shell.getAttribute("data-reveal-focus")) === "transcript", `after 2 Tabs: focus back to transcript`);

  await win.keyboard.press("Tab");
  await win.keyboard.press("Tab");
  await new Promise((r) => setTimeout(r, 150));
  const flips = readJsonl().slice(preTab).filter((s) => s.kind === "REVEAL_FOCUS_MOVED");
  check(flips.length === 4, `four REVEAL_FOCUS_MOVED emits after four Tabs (got ${flips.length})`);
  check(flips[0].payload.from === "transcript" && flips[0].payload.to === "stream", `1: transcript → stream`);
  check(flips[1].payload.from === "stream" && flips[1].payload.to === "transcript", `2: stream → transcript`);
  check(flips[2].payload.from === "transcript" && flips[2].payload.to === "stream", `3: transcript → stream`);
  check(flips[3].payload.from === "stream" && flips[3].payload.to === "transcript", `4: stream → transcript`);
  for (const f of flips) check(f.payload.pane_id === paneId, `${f.kind}.pane_id matches`);

  // Multi-pane isolation. Split into a second pane, bind it, reveal it,
  // move focus to stream on pane 2. Assert pane 1 still on transcript.
  await win.keyboard.press("Meta+d");
  await new Promise((r) => setTimeout(r, 300));
  const paneIds = await win.$$eval('[data-pane-id]', els =>
    Array.from(new Set(els.map(el => el.getAttribute('data-pane-id')).filter(Boolean)))
  );
  const pane2 = paneIds.find((p) => p !== paneId);
  check(!!pane2, `second pane created (pane2=${pane2})`);

  const { mkWorkspace } = require("./lib/session");
  const workspace2 = mkWorkspace("reveal-focus-ws2");
  const picker2 = win.locator(`[data-testid="unbound-picker-input-${pane2}"]`);
  await picker2.waitFor({ state: "attached", timeout: 3000 });
  await picker2.fill(workspace2);
  await picker2.press("Enter");
  // Wait for the picker on pane 2 to unmount — reliable single-pane bind
  // signal that survives when other panes already have SESSION_CREATED
  // emits in the trace.
  await picker2.waitFor({ state: "detached", timeout: 15000 });
  const emitsAfterBind = readJsonl();
  const sid2 = [...emitsAfterBind].reverse().find(
    (s) => s.kind === "SESSION_CREATED" && s.payload.session_id !== sid,
  )?.payload?.session_id;
  check(!!sid2, `second session bound (sid2=${sid2})`);
  await win.locator(`[data-testid="pane-reveal-toggle-${pane2}"]`).click();
  await new Promise((r) => setTimeout(r, 300));

  const shell2 = win.locator(`[data-testid="reveal-shell-${pane2}"]`);
  await shell2.waitFor({ state: "attached", timeout: 3000 });
  await shell2.focus();
  await win.keyboard.press("Tab");
  await new Promise((r) => setTimeout(r, 150));

  check((await shell2.getAttribute("data-reveal-focus")) === "stream", `pane 2 focus === "stream"`);
  check((await shell.getAttribute("data-reveal-focus")) === "transcript",
    `pane 1 focus still "transcript" — per-pane isolation holds`);

  require("./lib/session").cleanupSession(sid2);
  require("node:fs").rmSync(workspace2, { recursive: true, force: true });
});
