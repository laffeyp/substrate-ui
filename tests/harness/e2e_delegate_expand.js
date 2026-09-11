// tests/harness/e2e_delegate_expand.js — Sprint 021.
//
// Plants a parent + child session pair on disk. The parent's record
// carries:
//   seq 0  ToolCall(tool="delegate", call_id="c0")
//   seq 1  ToolResult(tool="delegate", call_id="c0",
//                     output={"child_root": <child record dir>})
// The child's record carries:
//   seq 0  UserMessage
//   seq 1  ModelReply
//
// Structural: click ↳ → child rows render indented under parent.
// Signal: DELEGATE_INLINE_EXPANDED fires once, then DELEGATE_INLINE_
//   COLLAPSED on second click. DELEGATE_CALL_FOLDED fires exactly once
//   (on transcript load) because the ToolResult is present.
// Layer 5: DELEGATE_CALL_RENDERED → DELEGATE_INLINE_EXPANDED is allowed.

"use strict";
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession,
} = require("./lib/session");

const REPO = path.resolve(__dirname, "..", "..");
const substratePython = process.env.SUBSTRATE_UI_PYTHON
  || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

function plantDelegatePair(workspace) {
  const py = `
from substrate.session_registry import SessionRegistry
from substrate.record.framing import frame
from substrate.topologies.tool_loop.tools import TOOL_NAME_DELEGATE
from pathlib import Path
import uuid, json, tempfile

reg = SessionRegistry(auto_boot=True)
child_sid = uuid.uuid4().hex[:12]
parent_sid = uuid.uuid4().hex[:12]
child_ws = tempfile.mkdtemp(prefix="substrate-harness-delegate-child-ws-")
child_manifest = reg.create(session_id=child_sid, name="delegate-child-" + child_sid[:6],
                            driver="deterministic", workspace=child_ws,
                            workspace_shape="flat", bundle=None, seed="")
child_root = Path(child_manifest.record_root); child_root.mkdir(parents=True, exist_ok=True)
child_hot = child_root / "events-000001.open.jsonl"
with open(child_hot, "ab") as f:
    f.write(frame({
        "kind": "UserMessage",
        "payload": {"assembled_prompt": "review the design",
                    "text": "review the design", "turn_index": 0},
        "producer": {"kind": "session", "instance": "HARNESS-0", "parent": None},
        "schema": "UserMessage@1", "seq": 0, "t": 0.0,
    }))
    f.write(frame({
        "kind": "ModelReply",
        "payload": {"text": "looks good.", "turn_index": 0,
                    "model_usage": {"prompt_tokens": 4, "completion_tokens": 3}},
        "producer": {"kind": "session", "instance": "HARNESS-0", "parent": None},
        "schema": "ModelReply@1", "seq": 1, "t": 0.1,
    }))

parent_manifest = reg.create(session_id=parent_sid,
                             name="delegate-parent-" + parent_sid[:6],
                             driver="deterministic", workspace=${JSON.stringify(workspace)},
                             workspace_shape="flat", bundle=None, seed="")
parent_root = Path(parent_manifest.record_root); parent_root.mkdir(parents=True, exist_ok=True)
parent_hot = parent_root / "events-000001.open.jsonl"
with open(parent_hot, "ab") as f:
    f.write(frame({
        "kind": "ToolCall",
        "payload": {"call_id": "c0", "tool": TOOL_NAME_DELEGATE,
                    "args": ["review this"], "step": 0},
        "producer": {"kind": "model", "instance": "HARNESS-P", "parent": None},
        "schema": "ToolCall@1", "seq": 0, "t": 0.0,
    }))
    f.write(frame({
        "kind": "ToolResult",
        "payload": {"call_id": "c0", "tool": TOOL_NAME_DELEGATE,
                    "output": {"child_root": str(child_root), "answer": "ok"},
                    "step": 0, "ok": True},
        "producer": {"kind": "tool", "instance": "HARNESS-P", "parent": None},
        "schema": "ToolResult@1", "seq": 1, "t": 0.5,
    }))

print(json.dumps({
    "parent_session_id": parent_sid,
    "child_session_id": child_sid,
    "child_workspace": child_ws,
    "child_root": str(child_root),
    "tool_call_id": "c0",
}))
`;
  const r = spawnSync(substratePython, ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("plant failed: " + r.stderr);
  return JSON.parse(r.stdout.trim());
}

const workspace = mkWorkspace("delegate-expand");
const planted = plantDelegatePair(workspace);
process.on("exit", () => {
  cleanupSession(planted.parent_session_id);
  cleanupSession(planted.child_session_id);
  rmWorkspace(planted.child_workspace);
  rmWorkspace(workspace);
});

runHarness("e2e_delegate_expand", async ({ win, check }) => {
  await waitForFirstPane(win);
  const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));

  const row = win.locator(`[data-testid="resume-row-${planted.parent_session_id}"]`);
  await row.waitFor({ state: "attached", timeout: 30000 });
  await row.click();
  await new Promise((r) => setTimeout(r, 2000));

  const delegateRow = win.locator(`[data-testid="transcript-row-${paneId}-0"]`);
  await delegateRow.waitFor({ state: "attached", timeout: 5000 });
  check(await delegateRow.getAttribute("data-expanded") === "false", `initial: data-expanded === "false"`);

  const folded = readJsonl().filter((s) => s.kind === "DELEGATE_CALL_FOLDED");
  check(folded.length === 1, `DELEGATE_CALL_FOLDED fires once on transcript load (got ${folded.length})`);
  check(folded[0].payload.tool_call_id === planted.tool_call_id, `FOLDED.tool_call_id matches`);
  check(folded[0].payload.child_record_root === planted.child_root,
    `FOLDED.child_record_root === child's record dir`);

  // Click ↳ to expand.
  const preClick = readJsonl().length;
  await delegateRow.click();
  await new Promise((r) => setTimeout(r, 1500));

  check(await delegateRow.getAttribute("data-expanded") === "true", `after click: data-expanded === "true"`);
  const expanded = win.locator(`[data-testid="delegate-expanded-${paneId}-${planted.tool_call_id}"]`);
  await expanded.waitFor({ state: "attached", timeout: 3000 });
  const childRowUser = win.locator(`[data-testid="delegate-child-row-${paneId}-${planted.tool_call_id}-0"]`);
  const childRowModel = win.locator(`[data-testid="delegate-child-row-${paneId}-${planted.tool_call_id}-1"]`);
  await childRowUser.waitFor({ state: "attached", timeout: 3000 });
  await childRowModel.waitFor({ state: "attached", timeout: 3000 });
  check(await childRowUser.getAttribute("data-kind") === "UserMessage", `child row 0: UserMessage`);
  check(await childRowModel.getAttribute("data-kind") === "ModelReply", `child row 1: ModelReply`);

  const expandEmits = readJsonl().slice(preClick).filter((s) => s.kind === "DELEGATE_INLINE_EXPANDED");
  check(expandEmits.length === 1, `one DELEGATE_INLINE_EXPANDED after click (got ${expandEmits.length})`);
  check(expandEmits[0].payload.pane_id === paneId, `EXPANDED.pane_id matches`);
  check(expandEmits[0].payload.tool_call_id === planted.tool_call_id, `EXPANDED.tool_call_id matches`);

  // Click again to collapse.
  await delegateRow.click();
  await new Promise((r) => setTimeout(r, 300));
  check(await delegateRow.getAttribute("data-expanded") === "false", `after 2nd click: collapsed`);
  check(await win.locator(`[data-testid="delegate-expanded-${paneId}-${planted.tool_call_id}"]`).count() === 0,
    `expanded block unmounted`);

  const collapseEmits = readJsonl().filter((s) => s.kind === "DELEGATE_INLINE_COLLAPSED");
  check(collapseEmits.length === 1, `one DELEGATE_INLINE_COLLAPSED after 2nd click (got ${collapseEmits.length})`);
  check(collapseEmits[0].payload.tool_call_id === planted.tool_call_id, `COLLAPSED.tool_call_id matches`);
});
