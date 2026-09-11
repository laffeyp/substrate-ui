// tests/harness/e2e_descent.js — Sprint 022.
//
// Plants a three-level session chain:
//   parent → delegate → childA → delegate → childB
//
//   parent record: ToolCall(delegate, "cP0") seq 0
//                  ToolResult(delegate, "cP0", output.child_root=childA) seq 1
//   childA record: UserMessage seq 0
//                  ToolCall(delegate, "cA0") seq 1
//                  ToolResult(delegate, "cA0", output.child_root=childB) seq 2
//   childB record: UserMessage seq 0
//                  ModelReply seq 1
//
// Harness path:
//   1. Resume parent → click delegate row with Alt → descent to childA
//      → assert DESCENT_ENTERED{depth:1, child_record_root=childA}
//   2. Descent view shows childA's rows. Alt-click the delegate row in
//      childA's ToolCall → descent to childB
//      → assert DESCENT_ENTERED{depth:2, child_record_root=childB}
//   3. Anchor byte reads 2 (Layer 7 encoding: 0/1/2)
//   4. Esc → DESCENT_EXITED{to_depth:1}
//   5. Esc → DESCENT_EXITED{to_depth:0}, anchor byte 0

"use strict";
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { readAnchorByte } = require("./lib/anchor");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession,
} = require("./lib/session");

const REPO = path.resolve(__dirname, "..", "..");
const substratePython = process.env.SUBSTRATE_UI_PYTHON
  || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

function plantThreeLevelChain(workspace) {
  const py = `
from substrate.session_registry import SessionRegistry
from substrate.record.framing import frame
from substrate.topologies.tool_loop.tools import TOOL_NAME_DELEGATE
from pathlib import Path
import uuid, json, tempfile

reg = SessionRegistry(auto_boot=True)

def make_session(name_prefix):
    sid = uuid.uuid4().hex[:12]
    ws = tempfile.mkdtemp(prefix="substrate-harness-descent-ws-")
    m = reg.create(session_id=sid, name=name_prefix + "-" + sid[:6],
                   driver="deterministic", workspace=ws,
                   workspace_shape="flat", bundle=None, seed="")
    root = Path(m.record_root); root.mkdir(parents=True, exist_ok=True)
    return sid, ws, root

def write_frames(root, envs):
    hot = root / "events-000001.open.jsonl"
    with open(hot, "ab") as f:
        for env in envs:
            f.write(frame(env))

childB_sid, childB_ws, childB_root = make_session("descent-grandchild")
write_frames(childB_root, [
    {"kind": "UserMessage",
     "payload": {"assembled_prompt": "verify feasibility",
                 "text": "verify feasibility", "turn_index": 0},
     "producer": {"kind": "session", "instance": "HARNESS-B", "parent": None},
     "schema": "UserMessage@1", "seq": 0, "t": 0.0},
    {"kind": "ModelReply",
     "payload": {"text": "feasible.", "turn_index": 0,
                 "model_usage": {"prompt_tokens": 3, "completion_tokens": 1}},
     "producer": {"kind": "session", "instance": "HARNESS-B", "parent": None},
     "schema": "ModelReply@1", "seq": 1, "t": 0.1},
])

childA_sid, childA_ws, childA_root = make_session("descent-child")
write_frames(childA_root, [
    {"kind": "UserMessage",
     "payload": {"assembled_prompt": "review the design",
                 "text": "review the design", "turn_index": 0},
     "producer": {"kind": "session", "instance": "HARNESS-A", "parent": None},
     "schema": "UserMessage@1", "seq": 0, "t": 0.0},
    {"kind": "ToolCall",
     "payload": {"call_id": "cA0", "tool": TOOL_NAME_DELEGATE,
                 "args": ["verify feasibility"], "step": 0},
     "producer": {"kind": "model", "instance": "HARNESS-A", "parent": None},
     "schema": "ToolCall@1", "seq": 1, "t": 0.1},
    {"kind": "ToolResult",
     "payload": {"call_id": "cA0", "tool": TOOL_NAME_DELEGATE,
                 "output": {"child_root": str(childB_root), "answer": "feasible."},
                 "step": 0, "ok": True},
     "producer": {"kind": "tool", "instance": "HARNESS-A", "parent": None},
     "schema": "ToolResult@1", "seq": 2, "t": 0.5},
])

parent_sid, parent_ws, parent_root = make_session("descent-parent")
if parent_ws != ${JSON.stringify(workspace)}:
    # override to the harness's chosen workspace
    parent_ws = ${JSON.stringify(workspace)}
write_frames(parent_root, [
    {"kind": "ToolCall",
     "payload": {"call_id": "cP0", "tool": TOOL_NAME_DELEGATE,
                 "args": ["review the design"], "step": 0},
     "producer": {"kind": "model", "instance": "HARNESS-P", "parent": None},
     "schema": "ToolCall@1", "seq": 0, "t": 0.0},
    {"kind": "ToolResult",
     "payload": {"call_id": "cP0", "tool": TOOL_NAME_DELEGATE,
                 "output": {"child_root": str(childA_root), "answer": "reviewed."},
                 "step": 0, "ok": True},
     "producer": {"kind": "tool", "instance": "HARNESS-P", "parent": None},
     "schema": "ToolResult@1", "seq": 1, "t": 0.5},
])

print(json.dumps({
    "parent_session_id": parent_sid,
    "childA_session_id": childA_sid,
    "childB_session_id": childB_sid,
    "childA_root": str(childA_root),
    "childB_root": str(childB_root),
    "childA_ws": childA_ws,
    "childB_ws": childB_ws,
    "tool_call_id_parent": "cP0",
    "tool_call_id_childA": "cA0",
}))
`;
  const r = spawnSync(substratePython, ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("plant failed: " + r.stderr);
  return JSON.parse(r.stdout.trim());
}

const workspace = mkWorkspace("descent");
const planted = plantThreeLevelChain(workspace);
process.on("exit", () => {
  cleanupSession(planted.parent_session_id);
  cleanupSession(planted.childA_session_id);
  cleanupSession(planted.childB_session_id);
  rmWorkspace(planted.childA_ws);
  rmWorkspace(planted.childB_ws);
  rmWorkspace(workspace);
});

runHarness("e2e_descent", async ({ win, check }) => {
  await waitForFirstPane(win);
  const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));

  const row = win.locator(`[data-testid="resume-row-${planted.parent_session_id}"]`);
  await row.waitFor({ state: "attached", timeout: 30000 });
  await row.click();
  await new Promise((r) => setTimeout(r, 2000));

  // Base state: depth 0, anchor byte 0.
  check(await readAnchorByte(win, `anchor-pane-${paneId}-descent`) === 0,
    `anchor-pane-${paneId}-descent byte === 0 (base session)`);
  const crumb = win.locator(`[data-testid="pane-header-crumb-${paneId}"]`);
  check(await crumb.getAttribute("data-descent-depth") === "0", `header depth === 0`);

  // Confirm the parent delegate row carries child_record_root
  // (attached by the bridge from the ToolResult's output.child_root).
  const parentDelegateRow = win.locator(`[data-testid="transcript-row-${paneId}-0"]`);
  await parentDelegateRow.waitFor({ state: "attached", timeout: 5000 });
  check(await parentDelegateRow.getAttribute("data-tool-name") === "delegate",
    `parent delegate row: data-tool-name === "delegate"`);

  // Alt-click the delegate row → descend to childA (depth 1).
  const preDescent = readJsonl().length;
  await parentDelegateRow.click({ modifiers: ["Alt"] });
  await new Promise((r) => setTimeout(r, 2500));

  const enters1 = readJsonl().slice(preDescent).filter((s) => s.kind === "DESCENT_ENTERED");
  check(enters1.length === 1, `one DESCENT_ENTERED after alt-click (got ${enters1.length})`);
  check(enters1[0].payload.depth === 1, `DESCENT_ENTERED.depth === 1`);
  check(enters1[0].payload.child_record_root === planted.childA_root,
    `DESCENT_ENTERED.child_record_root === childA_root`);
  check(await readAnchorByte(win, `anchor-pane-${paneId}-descent`) === 1,
    `anchor byte === 1 at depth 1`);
  check(await crumb.getAttribute("data-descent-depth") === "1", `header depth === 1`);

  // Descent view shows childA's rows. childA's delegate row at seq 1
  // renders as a delegate-specialized row (data-kind="ToolCall",
  // data-tool-name="delegate"). Alt-click seq 1 to descend to childB.
  // Wait for descent rows to load (bridgeRequest round-trip on
  // childA_root). The row appears with data-tool-name set once the
  // descent load lands and the delegate specialization branch fires.
  const childADelegateRow = win.locator(
    `[data-testid="transcript-row-${paneId}-1"][data-tool-name="delegate"]`,
  );
  await childADelegateRow.waitFor({ state: "attached", timeout: 5000 });
  check(await childADelegateRow.getAttribute("data-tool-call-id") === planted.tool_call_id_childA,
    `childA seq 1 carries tool_call_id === "${planted.tool_call_id_childA}"`);

  await childADelegateRow.click({ modifiers: ["Alt"] });
  await new Promise((r) => setTimeout(r, 1500));

  const enters2 = readJsonl().filter((s) => s.kind === "DESCENT_ENTERED");
  check(enters2.length === 2, `two DESCENT_ENTERED total (got ${enters2.length})`);
  check(enters2[1].payload.depth === 2, `second DESCENT_ENTERED.depth === 2`);
  check(enters2[1].payload.child_record_root === planted.childB_root,
    `second DESCENT_ENTERED.child_record_root === childB_root`);
  check(await readAnchorByte(win, `anchor-pane-${paneId}-descent`) === 2,
    `anchor byte === 2 at depth 2`);
  check(await crumb.getAttribute("data-descent-depth") === "2", `header depth === 2`);

  // Esc twice to exit all descent.
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
  check(await crumb.getAttribute("data-descent-depth") === "1", `after Esc: depth === 1`);
  check(await readAnchorByte(win, `anchor-pane-${paneId}-descent`) === 1,
    `anchor byte === 1 after first Esc`);
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
  check(await crumb.getAttribute("data-descent-depth") === "0", `after 2nd Esc: depth === 0`);
  check(await readAnchorByte(win, `anchor-pane-${paneId}-descent`) === 0,
    `anchor byte === 0 back at base`);

  const exits = readJsonl().filter((s) => s.kind === "DESCENT_EXITED");
  check(exits.length === 2, `two DESCENT_EXITED emits (got ${exits.length})`);
  check(exits[0].payload.to_depth === 1 && exits[1].payload.to_depth === 0,
    `EXITED to_depth 1 then 0`);

  // Enter count === Exit count (Layer 5 balance).
  check(enters2.length === exits.length, `ENTER count === EXIT count`);
});
