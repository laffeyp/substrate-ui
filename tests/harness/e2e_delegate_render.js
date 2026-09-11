// tests/harness/e2e_delegate_render.js — Sprint 020.
//
// Plants a session on disk that carries one ToolCall(tool="delegate")
// envelope in its record. Launches the shell, resumes the planted
// session via the picker's resume row, and asserts three-channel
// agreement on the delegate-line render:
//
//   Structural: the transcript half carries a row with data-testid
//     transcript-row-{paneId}-{seq}, data-kind="ToolCall",
//     data-tool-name="delegate", data-depth="1".
//   Perceptual: no dedicated anchor (Layer 6 E2 — delegate_flow rows
//     are distinguished by tool_call_id in the JSONL, not a per-instance
//     pixel anchor).
//   Signal: DELEGATE_CALL_RENDERED and TRANSCRIPT_DELEGATE_LINE_RENDERED
//     fire same-step (Layer 4), share tool_call_id, and carry the
//     Layer 2 required payload set.
//
// The planting bypasses substrate's session emitter — the harness
// frames the ToolCall envelope via substrate.record.framing.frame and
// writes it to the session's hot segment directly. Substrate's read_
// record path enforces CRC contiguity, so if the frame is malformed the
// resume path fails loudly.

"use strict";
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession, SESSIONS_ROOT,
} = require("./lib/session");

const REPO = path.resolve(__dirname, "..", "..");
const substratePython = process.env.SUBSTRATE_UI_PYTHON
  || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

function plantSessionWithDelegate(workspace) {
  const py = `
from substrate.session_registry import SessionRegistry
from substrate.record.framing import frame
from substrate.topologies.tool_loop.tools import TOOL_NAME_DELEGATE
from pathlib import Path
import uuid, json

reg = SessionRegistry(auto_boot=True)
sid = uuid.uuid4().hex[:12]
name = "delegate-harness-" + sid[:6]
m = reg.create(session_id=sid, name=name, driver="deterministic",
               workspace=${JSON.stringify(workspace)}, workspace_shape="flat",
               bundle=None, seed="")
root = Path(m.record_root); root.mkdir(parents=True, exist_ok=True)

env = {
    "kind": "ToolCall",
    "payload": {"call_id": "c0", "tool": TOOL_NAME_DELEGATE,
                "args": ["review this"], "step": 0},
    "producer": {"kind": "model", "instance": "HARNESS-0000", "parent": None},
    "schema": "ToolCall@1",
    "seq": 0,
    "t": 0.0,
}
hot = root / "events-000001.open.jsonl"
with open(hot, "ab") as f:
    f.write(frame(env))
print(json.dumps({"session_id": sid, "tool_call_id": "c0"}))
`;
  const r = spawnSync(substratePython, ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("plant failed: " + r.stderr);
  return JSON.parse(r.stdout.trim());
}

const workspace = mkWorkspace("delegate-render");
const planted = plantSessionWithDelegate(workspace);
process.on("exit", () => { cleanupSession(planted.session_id); rmWorkspace(workspace); });

runHarness("e2e_delegate_render", async ({ win, check }) => {
  await waitForFirstPane(win);
  const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));
  const row = win.locator(`[data-testid="resume-row-${planted.session_id}"]`);
  await row.waitFor({ state: "attached", timeout: 30000 });
  await row.click();
  await new Promise((r) => setTimeout(r, 2000));

  const delegateRow = win.locator(`[data-testid="transcript-row-${paneId}-0"]`);
  await delegateRow.waitFor({ state: "attached", timeout: 5000 });
  check(await delegateRow.getAttribute("data-kind") === "ToolCall", `row data-kind === "ToolCall"`);
  check(await delegateRow.getAttribute("data-tool-name") === "delegate", `row data-tool-name === "delegate"`);
  check(await delegateRow.getAttribute("data-tool-call-id") === planted.tool_call_id,
    `row data-tool-call-id === "${planted.tool_call_id}"`);
  check(await delegateRow.getAttribute("data-depth") === "1", `row data-depth === "1"`);

  const emits = readJsonl();
  const delegateCalls = emits.filter((s) => s.kind === "DELEGATE_CALL_RENDERED");
  const delegateLines = emits.filter((s) => s.kind === "TRANSCRIPT_DELEGATE_LINE_RENDERED");
  check(delegateCalls.length === 1, `one DELEGATE_CALL_RENDERED emit (got ${delegateCalls.length})`);
  check(delegateLines.length === 1, `one TRANSCRIPT_DELEGATE_LINE_RENDERED emit (got ${delegateLines.length})`);

  const call = delegateCalls[0];
  const line = delegateLines[0];
  check(call.payload.pane_id === paneId, `DELEGATE_CALL_RENDERED.pane_id matches`);
  check(call.payload.tool_call_id === planted.tool_call_id, `DELEGATE_CALL_RENDERED.tool_call_id matches`);
  check(call.payload.depth === 1, `DELEGATE_CALL_RENDERED.depth === 1 (got ${call.payload.depth})`);
  check(line.payload.pane_id === paneId, `TRANSCRIPT_DELEGATE_LINE_RENDERED.pane_id matches`);
  check(line.payload.tool_call_id === planted.tool_call_id, `TRANSCRIPT_DELEGATE_LINE_RENDERED.tool_call_id matches`);
  check(line.payload.envelope_seq === 0, `TRANSCRIPT_DELEGATE_LINE_RENDERED.envelope_seq === 0`);

  // Same-step: both emits share tool_call_id and fire within Layer 4's
  // 16ms same-step window.
  check(call.payload.tool_call_id === line.payload.tool_call_id,
    `both emits share tool_call_id (same-step pair)`);
  check(Math.abs(call.t - line.t) < 16, `same-step (< 16ms): Δ=${(line.t - call.t).toFixed(3)}ms`);

  // Generic TRANSCRIPT_ROW_RENDERED must NOT fire for the delegate row
  // (specialization branch owns it).
  const genericForSeq0 = emits.find((s) =>
    s.kind === "TRANSCRIPT_ROW_RENDERED" && s.payload.envelope_seq === 0);
  check(!genericForSeq0, `no generic TRANSCRIPT_ROW_RENDERED for the delegate row (specialization owns it)`);
});
