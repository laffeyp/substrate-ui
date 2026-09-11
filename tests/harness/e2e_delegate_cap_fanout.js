// tests/harness/e2e_delegate_cap_fanout.js — Sprint 023.
//
// Two-track: (1) depth cap refusal, (2) fan-out walked list.
//
// (1) Depth cap. Plant a chain parent → childA → childB where childB
//     carries its own delegate ToolCall. Descend twice to reach depth
//     2, then alt-click childB's delegate row → the reducer refuses
//     and fires DELEGATE_DEPTH_CAP_REFUSED{depth:2}. A refused-row
//     affordance renders next to that delegate line.
//
// (2) Fan-out. Plant a session whose record carries three adjacent
//     ToolCall(delegate) envelopes at the same step. On load, the
//     reducer fires TRANSCRIPT_FANOUT_LINE_RENDERED once with
//     children_count=3. Clicking the fan-out row expands the list;
//     ↓ / ↑ / Escape fire FAN_OUT_INLINE_WALKED / _COLLAPSED.
//
// The delegate.py:436 guard line-drift check ("max_depth" still lives
// where the sprint card names it) runs here so a substrate rename
// fails the harness rather than silently drifting.

"use strict";
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  mkWorkspace, rmWorkspace, waitForFirstPane, cleanupSession,
} = require("./lib/session");

const REPO = path.resolve(__dirname, "..", "..");
const substratePython = process.env.SUBSTRATE_UI_PYTHON
  || path.join(REPO, "..", "substrate", ".venv", "bin", "python");

function assertDelegatePyGuardStillLandsAtLine436() {
  const p = path.join(REPO, "..", "substrate", "src", "substrate", "topologies", "tool_loop", "delegate.py");
  const src = fs.readFileSync(p, "utf8").split("\n");
  const guardLine = src.findIndex((l) => l.includes("if depth >= max_depth"));
  if (guardLine < 0) throw new Error("delegate.py guard 'if depth >= max_depth' not found");
  // Sprint card cites line 436. Allow ±5 lines of drift before failing.
  if (Math.abs((guardLine + 1) - 436) > 5) {
    throw new Error(`delegate.py guard at line ${guardLine + 1} — drifted from 436 by more than 5`);
  }
  return guardLine + 1;
}

// Verify substrate's own error text still contains the substring the
// shell keys on. A rename in delegate.py breaks the DEPTH_CAP_REFUSED
// terminal routing on the envelope path; better to fail loud here.
function assertDelegatePyErrorStringHolds() {
  const p = path.join(REPO, "..", "substrate", "src", "substrate", "topologies", "tool_loop", "delegate.py");
  const src = fs.readFileSync(p, "utf8");
  const br = JSON.parse(fs.readFileSync(path.join(REPO, "signals", "bridge-reasons.json"), "utf8"));
  const substr = br.delegate_error_prefixes.max_depth;
  if (!src.includes(substr)) {
    throw new Error(`delegate.py no longer contains "${substr}" — update signals/bridge-reasons.json`);
  }
  return substr;
}

function plantCapChain(workspace) {
  const py = `
from substrate.session_registry import SessionRegistry
from substrate.record.framing import frame
from substrate.topologies.tool_loop.tools import TOOL_NAME_DELEGATE
from pathlib import Path
import uuid, json, tempfile

reg = SessionRegistry(auto_boot=True)

def make_session(name):
    sid = uuid.uuid4().hex[:12]
    ws = tempfile.mkdtemp(prefix="substrate-harness-cap-ws-")
    m = reg.create(session_id=sid, name=name + "-" + sid[:6],
                   driver="deterministic", workspace=ws,
                   workspace_shape="flat", bundle=None, seed="")
    root = Path(m.record_root); root.mkdir(parents=True, exist_ok=True)
    return sid, ws, root

def frames(root, envs):
    with open(root / "events-000001.open.jsonl", "ab") as f:
        for e in envs: f.write(frame(e))

# A tiny hypothetical great-grandchild record so childB's delegate
# ToolResult can point somewhere real. The reducer only cares that
# childB's row carries a non-null child_record_root; the refusal
# fires before the bridge round-trip that would load it.
gg_sid, gg_ws, gg_root = make_session("cap-greatgrandchild")
frames(gg_root, [
    {"kind": "UserMessage",
     "payload": {"assembled_prompt": "leaf", "text": "leaf", "turn_index": 0},
     "producer": {"kind": "session", "instance": "H-GG", "parent": None},
     "schema": "UserMessage@1", "seq": 0, "t": 0.0},
])

# childB — carries its own delegate ToolCall (the one alt-click at
# depth 2 tries to descend into) + a ToolResult pointing at a real
# child so the row's child_record_root is non-null.
b_sid, b_ws, b_root = make_session("cap-grandchild")
frames(b_root, [
    {"kind": "ToolCall",
     "payload": {"call_id": "cB0", "tool": TOOL_NAME_DELEGATE,
                 "args": ["cannot go deeper"], "step": 0},
     "producer": {"kind": "model", "instance": "H-B", "parent": None},
     "schema": "ToolCall@1", "seq": 0, "t": 0.0},
    {"kind": "ToolResult",
     "payload": {"call_id": "cB0", "tool": TOOL_NAME_DELEGATE,
                 "output": {"child_root": str(gg_root)}, "step": 0, "ok": True},
     "producer": {"kind": "tool", "instance": "H-B", "parent": None},
     "schema": "ToolResult@1", "seq": 1, "t": 0.1},
])

a_sid, a_ws, a_root = make_session("cap-child")
frames(a_root, [
    {"kind": "ToolCall",
     "payload": {"call_id": "cA0", "tool": TOOL_NAME_DELEGATE,
                 "args": ["review"], "step": 0},
     "producer": {"kind": "model", "instance": "H-A", "parent": None},
     "schema": "ToolCall@1", "seq": 0, "t": 0.0},
    {"kind": "ToolResult",
     "payload": {"call_id": "cA0", "tool": TOOL_NAME_DELEGATE,
                 "output": {"child_root": str(b_root)}, "step": 0, "ok": True},
     "producer": {"kind": "tool", "instance": "H-A", "parent": None},
     "schema": "ToolResult@1", "seq": 1, "t": 0.1},
])

p_sid, p_ws, p_root = make_session("cap-parent")
frames(p_root, [
    {"kind": "ToolCall",
     "payload": {"call_id": "cP0", "tool": TOOL_NAME_DELEGATE,
                 "args": ["review the design"], "step": 0},
     "producer": {"kind": "model", "instance": "H-P", "parent": None},
     "schema": "ToolCall@1", "seq": 0, "t": 0.0},
    {"kind": "ToolResult",
     "payload": {"call_id": "cP0", "tool": TOOL_NAME_DELEGATE,
                 "output": {"child_root": str(a_root)}, "step": 0, "ok": True},
     "producer": {"kind": "tool", "instance": "H-P", "parent": None},
     "schema": "ToolResult@1", "seq": 1, "t": 0.5},
])

print(json.dumps({
    "p_sid": p_sid, "a_sid": a_sid, "b_sid": b_sid, "gg_sid": gg_sid,
    "a_ws": a_ws, "b_ws": b_ws, "gg_ws": gg_ws,
    "a_root": str(a_root), "b_root": str(b_root), "gg_root": str(gg_root),
    "tc_p": "cP0", "tc_a": "cA0", "tc_b": "cB0",
}))
`;
  const r = spawnSync(substratePython, ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("plant cap chain failed: " + r.stderr);
  return JSON.parse(r.stdout.trim());
}

function plantFanoutSession(workspace) {
  const py = `
from substrate.session_registry import SessionRegistry
from substrate.record.framing import frame
from substrate.topologies.tool_loop.tools import TOOL_NAME_DELEGATE
from pathlib import Path
import uuid, json

reg = SessionRegistry(auto_boot=True)
sid = uuid.uuid4().hex[:12]
m = reg.create(session_id=sid, name="fanout-" + sid[:6],
               driver="deterministic", workspace=${JSON.stringify(workspace)},
               workspace_shape="flat", bundle=None, seed="")
root = Path(m.record_root); root.mkdir(parents=True, exist_ok=True)

with open(root / "events-000001.open.jsonl", "ab") as f:
    for i, cid in enumerate(("f0", "f1", "f2")):
        f.write(frame({
            "kind": "ToolCall",
            "payload": {"call_id": cid, "tool": TOOL_NAME_DELEGATE,
                        "args": ["branch " + cid], "step": 0},
            "producer": {"kind": "model", "instance": "H-FO", "parent": None},
            "schema": "ToolCall@1", "seq": i, "t": i * 0.01,
        }))
print(json.dumps({"session_id": sid, "leader_tc": "f0",
                  "sibling_tcs": ["f0", "f1", "f2"]}))
`;
  const r = spawnSync(substratePython, ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("plant fanout failed: " + r.stderr);
  return JSON.parse(r.stdout.trim());
}

// Line-drift check first.
const guardLine = assertDelegatePyGuardStillLandsAtLine436();
console.log(`  ok  delegate.py 'if depth >= max_depth' at line ${guardLine} (sprint card cites 436)`);
const errSubstr = assertDelegatePyErrorStringHolds();
console.log(`  ok  delegate.py raise text still contains "${errSubstr}"`);

const capWorkspace = mkWorkspace("cap");
const cap = plantCapChain(capWorkspace);
const foWorkspace = mkWorkspace("fanout");
const fo = plantFanoutSession(foWorkspace);

process.on("exit", () => {
  cleanupSession(cap.p_sid); cleanupSession(cap.a_sid); cleanupSession(cap.b_sid);
  cleanupSession(cap.gg_sid);
  cleanupSession(fo.session_id);
  rmWorkspace(cap.a_ws); rmWorkspace(cap.b_ws); rmWorkspace(cap.gg_ws);
  rmWorkspace(capWorkspace); rmWorkspace(foWorkspace);
});

runHarness("e2e_delegate_cap_fanout", async ({ win, check }) => {
  await waitForFirstPane(win);
  const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute('data-pane-id'));

  // TRACK 1 — depth cap refusal.
  const capRow = win.locator(`[data-testid="resume-row-${cap.p_sid}"]`);
  await capRow.waitFor({ state: "attached", timeout: 30000 });
  await capRow.click();
  await new Promise((r) => setTimeout(r, 2000));

  // Descend to depth 1 (into childA).
  const parentDelegate = win.locator(`[data-testid="transcript-row-${paneId}-0"]`);
  await parentDelegate.waitFor({ state: "attached", timeout: 5000 });
  await parentDelegate.click({ modifiers: ["Alt"] });
  await new Promise((r) => setTimeout(r, 1500));

  // Descend to depth 2 (into childB). childA's ToolCall at seq 0 is
  // the delegate row.
  const childADelegate = win.locator(
    `[data-testid="transcript-row-${paneId}-0"][data-tool-name="delegate"]`);
  await childADelegate.waitFor({ state: "attached", timeout: 5000 });
  await childADelegate.click({ modifiers: ["Alt"] });
  await new Promise((r) => setTimeout(r, 1500));

  // At depth 2. childB's ToolCall at seq 0 is a delegate row too.
  // Alt-click it → refusal.
  const childBDelegate = win.locator(
    `[data-testid="transcript-row-${paneId}-0"][data-tool-name="delegate"]`);
  await childBDelegate.waitFor({ state: "attached", timeout: 5000 });
  const preRefuse = readJsonl().length;
  await childBDelegate.click({ modifiers: ["Alt"] });
  await new Promise((r) => setTimeout(r, 300));

  const refusals = readJsonl().slice(preRefuse).filter((s) => s.kind === "DELEGATE_DEPTH_CAP_REFUSED");
  check(refusals.length === 1, `one DELEGATE_DEPTH_CAP_REFUSED after alt-click at cap (got ${refusals.length})`);
  check(refusals[0].payload.depth === 2, `refusal.depth === 2 (got ${refusals[0].payload.depth})`);
  check(refusals[0].payload.tool_call_id === cap.tc_b,
    `refusal.tool_call_id === "${cap.tc_b}" (got ${refusals[0].payload.tool_call_id})`);
  check(refusals[0].payload.pane_id === paneId, `refusal.pane_id matches`);

  const refusedRow = win.locator(`[data-testid="transcript-delegate-refused-${paneId}-${cap.tc_b}"]`);
  await refusedRow.waitFor({ state: "attached", timeout: 2000 });
  check(true, `refused affordance renders next to the delegate row`);

  // Exit descent back to base, then split into a second pane so the
  // fanout session can be resumed alongside the (still-bound) parent.
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 150));
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 150));
  await win.keyboard.press("Meta+d");
  await new Promise((r) => setTimeout(r, 400));

  const paneIds = await win.$$eval('[data-pane-id]',
    (els) => Array.from(new Set(els.map((el) => el.getAttribute("data-pane-id")).filter(Boolean))));
  const newPaneId = paneIds.find((id) => id !== paneId);
  check(!!newPaneId, `second pane created for fanout track`);

  // TRACK 2 — fan-out row + walked list.
  const fanoutResume = win.locator(`[data-testid="resume-row-${fo.session_id}"]`);
  await fanoutResume.waitFor({ state: "attached", timeout: 30000 });
  await fanoutResume.click();
  await new Promise((r) => setTimeout(r, 2000));

  const fanoutRow = win.locator(`[data-testid="transcript-row-${newPaneId}-0"][data-fanout="true"]`);
  await fanoutRow.waitFor({ state: "attached", timeout: 5000 });
  check(await fanoutRow.getAttribute("data-children-count") === "3", `data-children-count === "3"`);
  check(await fanoutRow.getAttribute("data-tool-call-id") === fo.leader_tc,
    `fan-out leader tool_call_id === "${fo.leader_tc}"`);

  const rendered = readJsonl().filter((s) => s.kind === "TRANSCRIPT_FANOUT_LINE_RENDERED");
  check(rendered.length === 1, `one TRANSCRIPT_FANOUT_LINE_RENDERED (got ${rendered.length})`);
  check(rendered[0].payload.children_count === 3, `RENDERED.children_count === 3`);
  check(rendered[0].payload.tool_call_id === fo.leader_tc, `RENDERED.tool_call_id === leader`);

  // Expand.
  await fanoutRow.click();
  await new Promise((r) => setTimeout(r, 200));
  check(await fanoutRow.getAttribute("data-expanded") === "true", `after click: expanded`);

  const expanded = readJsonl().filter((s) => s.kind === "FAN_OUT_INLINE_EXPANDED");
  check(expanded.length === 1, `one FAN_OUT_INLINE_EXPANDED`);
  check(expanded[0].payload.tool_call_id === fo.leader_tc, `EXPANDED.tool_call_id === leader`);

  // Walk down twice, then up once.
  await fanoutRow.focus();
  await win.keyboard.press("ArrowDown");
  await new Promise((r) => setTimeout(r, 100));
  await win.keyboard.press("ArrowDown");
  await new Promise((r) => setTimeout(r, 100));
  await win.keyboard.press("ArrowUp");
  await new Promise((r) => setTimeout(r, 100));

  const walks = readJsonl().filter((s) => s.kind === "FAN_OUT_INLINE_WALKED");
  check(walks.length === 3, `three FAN_OUT_INLINE_WALKED emits (got ${walks.length})`);
  check(walks[0].payload.from_index === 0 && walks[0].payload.to_index === 1, `walk 1: 0→1`);
  check(walks[1].payload.from_index === 1 && walks[1].payload.to_index === 2, `walk 2: 1→2`);
  check(walks[2].payload.from_index === 2 && walks[2].payload.to_index === 1, `walk 3: 2→1`);
  check(await fanoutRow.getAttribute("data-walked-index") === "1", `walked cursor at index 1`);

  // Collapse via Escape (still inside fanout list; not in descent so
  // Escape hits the fanout handler on the container).
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
  const collapsed = readJsonl().filter((s) => s.kind === "FAN_OUT_INLINE_COLLAPSED");
  check(collapsed.length === 1, `one FAN_OUT_INLINE_COLLAPSED`);
  check(await fanoutRow.getAttribute("data-expanded") === "false", `after Escape: collapsed`);
});
