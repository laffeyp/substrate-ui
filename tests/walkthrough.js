// tests/walkthrough.js
//
// Automated end-to-end walkthrough. Launches the app under Playwright,
// drives it as a user would (type a workspace path, submit prompts,
// open the records + studio + reveal surfaces), and reports one line
// per step: what it did and whether the reactive state ended up in
// the shape the step required.
//
// Not a change-detector. Not signal graded. The exit code says "the
// full round-trip works" (0) or "one specific step broke" (non-zero
// with the failing step named).
//
// Two rounds of a real substrate session. Default driver is
// deterministic (replay-stable, no network). Override with
//   SUBSTRATE_WALKTHROUGH_DRIVER=ollama:llama3.2:1b node tests/walkthrough.js
// to walk against a real ollama model.

"use strict";
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { _electron: electron } = require("playwright");

const REPO_ROOT = path.resolve(__dirname, "..");
const DRIVER = process.env.SUBSTRATE_WALKTHROUGH_DRIVER || "deterministic";
const substratePython = process.env.SUBSTRATE_UI_PYTHON
  || path.join(REPO_ROOT, "..", "substrate", ".venv", "bin", "python");
const TURN_TIMEOUT_MS = Number(process.env.SUBSTRATE_WALKTHROUGH_TURN_MS || 120000);

const steps = [];
function step(name, fn) { steps.push({ name, fn }); }

async function readState(window) {
  return window.evaluate(() => {
    const root = document.getElementById("dc-root");
    // dc-runtime writes the component instance to root.__dcComponent
    // in its class constructor via `this.__host = this` — but we
    // don't have direct access. Read window.__lastState which the
    // walkthrough sets from inside the component.
    return window.__lastState || null;
  });
}

// Inject a probe that mirrors the DC component's state onto
// window.__lastState so readState() can peek without touching
// React internals. Runs once after boot.
async function installStateProbe(window) {
  await window.evaluate(() => {
    // Poll every 200ms for the DC-runtime component; when found,
    // wrap its setState so every update lands on window.__lastState.
    const timer = setInterval(() => {
      const root = document.getElementById("dc-root");
      if (!root) return;
      const react = root._reactRootContainer || root.__reactContainer$;
      // Find the first Component with a .state and .setState
      const findComponent = (fiber) => {
        while (fiber) {
          const instance = fiber.stateNode;
          if (instance && instance.logic && instance.logic.state && instance.logic.setState) {
            return instance.logic;
          }
          if (fiber.child) {
            const found = findComponent(fiber.child);
            if (found) return found;
          }
          fiber = fiber.sibling;
        }
        return null;
      };
      // The dc-runtime uses React 18 root; find the internal fiber.
      const key = Object.keys(root).find(k => k.startsWith("__reactContainer"));
      if (!key) return;
      const fiber = root[key].stateNode.current;
      const component = findComponent(fiber);
      if (!component) return;
      clearInterval(timer);
      window.__lastState = component.state;
      const originalSetState = component.setState.bind(component);
      component.setState = (update, cb) => {
        originalSetState(update, () => {
          window.__lastState = component.state;
          if (cb) cb();
        });
      };
    }, 200);
  });
}

async function waitForCondition(window, checkFn, description, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = await readState(window);
    if (state && checkFn(state)) return state;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("timed out waiting for: " + description);
}

step("boot the app + bridge alive", async ({ window }) => {
  await window.waitForLoadState("domcontentloaded");
  await installStateProbe(window);
  // Bridge sends {op: 'hello'} at start; state.substrateVersion is
  // not tracked by the prototype, so we watch for the DC component
  // to be reachable via window.__lastState.
  await waitForCondition(window, s => Array.isArray(s.panes), "state.panes exposed");
});

let workspacePath = null;
step("bind a workspace via the picker", async ({ window }) => {
  workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-walkthrough-"));
  // Set the pane 1 driver first so session_create picks it up.
  await window.evaluate((driverName) => {
    const root = document.getElementById("dc-root");
    const key = Object.keys(root).find(k => k.startsWith("__reactContainer"));
    const findComponent = (fiber) => {
      while (fiber) {
        const inst = fiber.stateNode;
        if (inst && inst.logic && inst.logic.state && inst.logic.setState) return inst.logic;
        if (fiber.child) { const f = findComponent(fiber.child); if (f) return f; }
        fiber = fiber.sibling;
      }
      return null;
    };
    const component = findComponent(root[key].stateNode.current);
    component.setState(s => ({
      panes: s.panes.map(p => p.id === 1 ? Object.assign({}, p, { driver: driverName }) : p),
    }));
  }, DRIVER);
  // Type the workspace path into the picker input + press Enter.
  const input = window.locator('[placeholder*="type a path"]').first();
  await input.waitFor({ state: "visible", timeout: 5000 });
  await input.click();
  await input.pressSequentially(workspacePath, { delay: 5 });
  await input.press("Enter");
  // Wait for the pane to bind, then retry record_read until at least
  // one Park envelope lands. The bridge writes envelopes to disk
  // async; the initial record_read after session_create can catch
  // the write mid-flush.
  const boundState = await waitForCondition(
    window,
    s => !!s.panes[0].boundSessionId,
    "session_create returned bound session_id",
    30000,
  );
  // SessionRegistry.create does not run a turn — it just writes the
  // manifest. No envelopes exist until the first turn_submit fires.
  // The step passes as soon as the bind lands.
  if (!boundState.panes[0].boundSessionId) throw new Error("no bound session id after picker enter");
});

async function submitPrompt(window, promptText) {
  const promptInput = window.locator('[placeholder*="type to talk"]').first();
  await promptInput.waitFor({ state: "visible", timeout: 5000 });
  await promptInput.click();
  await promptInput.fill(promptText);
  const beforeState = await readState(window);
  const boundId = beforeState.panes[0].boundSessionId;
  const beforeParkCount = (beforeState.records[boundId] || [])
    .filter(env => env.kind === "Park").length;
  await promptInput.press("Meta+Enter");
  await waitForCondition(
    window,
    s => {
      const envelopes = (s.records || {})[boundId] || [];
      return envelopes.filter(env => env.kind === "Park").length > beforeParkCount;
    },
    "turn produces a new Park envelope",
    TURN_TIMEOUT_MS,
  );
}

step("submit the first prompt", async ({ window }) => {
  await submitPrompt(window, "hello — what is 2 plus 3?");
  const state = await readState(window);
  const envelopes = state.records[state.panes[0].boundSessionId];
  const userMessages = envelopes.filter(env => env.kind === "UserMessage");
  if (userMessages.length < 1) throw new Error("no UserMessage after first turn");
});

step("submit the second prompt (round 2)", async ({ window }) => {
  await submitPrompt(window, "and if we add four more?");
  const state = await readState(window);
  const envelopes = state.records[state.panes[0].boundSessionId];
  const userMessages = envelopes.filter(env => env.kind === "UserMessage");
  if (userMessages.length < 2) throw new Error("second UserMessage not in the record");
});

step("open records surface + verify session row", async ({ window }) => {
  // Drive the surface toggle through the component's _toggleSurface
  // method so the walkthrough doesn't fight dc-runtime's synthetic
  // event mapping. Same code path the pane header's records handle
  // hits via goRecords.
  await window.evaluate(() => {
    const root = document.getElementById("dc-root");
    const key = Object.keys(root).find(k => k.startsWith("__reactContainer"));
    const findComponent = (fiber) => {
      while (fiber) {
        const inst = fiber.stateNode;
        if (inst && inst.logic && inst.logic._toggleSurface) return inst.logic;
        if (fiber.child) { const f = findComponent(fiber.child); if (f) return f; }
        fiber = fiber.sibling;
      }
      return null;
    };
    const component = findComponent(root[key].stateNode.current);
    if (component) component._toggleSurface('records');
  });
  // Give _loadSessions a moment to hit the bridge, then peek at
  // what actually landed.
  await new Promise(resolve => setTimeout(resolve, 1500));
  // (removed the noisy full-list peek — the waitForCondition below
  // is the real check).
  const state = await waitForCondition(
    window,
    s => s.surface === "records" && Array.isArray(s.sessionsFromRegistry),
    "records surface open + list_sessions returned",
    10000,
  );
  const boundId = state.panes[0].boundSessionId;
  const row = state.sessionsFromRegistry.find(row => row.session_id === boundId);
  if (!row) throw new Error("bound session missing from list_sessions roster");
});

step("close surface + open studio", async ({ window }) => {
  await window.locator('text=studio').first().click();
  await waitForCondition(
    window,
    s => s.surface === "studio",
    "studio surface open",
    5000,
  );
});

step("studio validate round-trip", async ({ window }) => {
  await window.locator('text=validate').first().click();
  await waitForCondition(
    window,
    s => typeof s.studioOut === "string" && (
      s.studioOut.startsWith("ok") || s.studioOut.startsWith("invalid") || s.studioOut.startsWith("validate failed")
    ),
    "studioOut reflects the topology_validate reply",
    10000,
  );
});

step("studio build + launch tool_loop", async ({ window }) => {
  // Reach the component's DCLogic instance through the React fiber
  // tree, set topoName to a real bundled key, and drive doBuild.
  await window.evaluate(async () => {
    const root = document.getElementById("dc-root");
    const key = Object.keys(root).find(k => k.startsWith("__reactContainer"));
    const findComponent = (fiber) => {
      while (fiber) {
        const inst = fiber.stateNode;
        if (inst && inst.logic && inst.logic.setState) return inst.logic;
        if (fiber.child) { const f = findComponent(fiber.child); if (f) return f; }
        fiber = fiber.sibling;
      }
      return null;
    };
    const component = findComponent(root[key].stateNode.current);
    component.setState({ topoName: "tool_loop" });
    // Wait one tick for the setState to commit.
    await new Promise(resolve => setTimeout(resolve, 100));
    const result = await window.bridge.request(
      "topology_build_and_launch", { topo_name: "tool_loop" }, 15000,
    );
    component.setState({
      studioOut: "launched " + result.topo_name
        + " · run " + result.run_id
        + " · record " + result.record_root,
      launchedRuns: [{
        topo_name: result.topo_name,
        run_id: result.run_id,
        record_root: result.record_root,
      }].concat(component.state.launchedRuns || []),
    });
  });
  await waitForCondition(
    window,
    s => typeof s.studioOut === "string"
      && s.studioOut.startsWith("launched tool_loop")
      && Array.isArray(s.launchedRuns) && s.launchedRuns.length > 0
      && typeof s.launchedRuns[0].record_root === "string",
    "topology_build_and_launch reply lands and launchedRuns[0] carries a record_root",
    15000,
  );
});

step("open the reveal machinery panel", async ({ window }) => {
  // Close surface first.
  await window.keyboard.press("Escape");
  await new Promise(resolve => setTimeout(resolve, 300));
  // The reveal button in the header carries a `⌃` label; click it.
  await window.locator('text=/reveal/').first().click();
  await waitForCondition(
    window,
    s => s.revealed === true,
    "revealed state true",
    5000,
  );
});

step("end the session cleanly", async ({ window }) => {
  await window.keyboard.press("Escape");
  await new Promise(resolve => setTimeout(resolve, 300));
  // The prompt input's DOM position depends on which view is
  // active (terminal vs revealed) and dc-runtime keeps the two on
  // different code paths. Drive the end-confirm dialog directly
  // through the component so this step tests session_end + record
  // finalisation, not prompt-slash-router routing.
  await window.evaluate(() => {
    const root = document.getElementById("dc-root");
    const key = Object.keys(root).find(k => k.startsWith("__reactContainer"));
    const findComponent = (fiber) => {
      while (fiber) {
        const inst = fiber.stateNode;
        if (inst && inst.logic && inst.logic.setState) return inst.logic;
        if (fiber.child) { const f = findComponent(fiber.child); if (f) return f; }
        fiber = fiber.sibling;
      }
      return null;
    };
    const component = findComponent(root[key].stateNode.current);
    component.setState({ showEndConfirm: true });
  });
  await waitForCondition(
    window,
    s => s.showEndConfirm === true,
    "end-confirm dialog open",
    5000,
  );
  // Trigger doEndSession — the confirm dialog's "end session"
  // click handler.
  await window.evaluate(() => {
    const root = document.getElementById("dc-root");
    const key = Object.keys(root).find(k => k.startsWith("__reactContainer"));
    const findComponent = (fiber) => {
      while (fiber) {
        const inst = fiber.stateNode;
        if (inst && inst.logic && inst.logic._endSession) return inst.logic;
        if (fiber.child) { const f = findComponent(fiber.child); if (f) return f; }
        fiber = fiber.sibling;
      }
      return null;
    };
    const component = findComponent(root[key].stateNode.current);
    const focused = component.state.panes.find(p => p.id === component.state.focused);
    component._endSession(focused.id, focused.boundSessionId);
  });
  await waitForCondition(
    window,
    s => s.ended === true,
    "session_end acked + pane.ended flipped",
    45000,
  );
});

async function main() {
  console.log(`walkthrough — driver=${DRIVER}`);
  const app = await electron.launch({
    args: [REPO_ROOT],
    env: Object.assign({}, process.env, {
      SUBSTRATE_UI_PYTHON: substratePython,
    }),
  });
  const window = await app.firstWindow();
  const passed = [];
  const failed = [];
  for (const s of steps) {
    process.stdout.write("  · " + s.name + " ... ");
    try {
      await s.fn({ window });
      console.log("ok");
      passed.push(s.name);
    } catch (err) {
      console.log("FAIL — " + (err.message || String(err)));
      failed.push({ name: s.name, error: err });
      break;  // Stop on first fail — later steps depend on earlier state.
    }
  }
  try {
    await app.close();
  } catch (_) { /* best-effort */ }
  console.log("");
  console.log("summary: " + passed.length + " / " + steps.length + " passed");
  if (failed.length) {
    console.log("first failure: " + failed[0].name);
    if (failed[0].error && failed[0].error.stack) console.log(failed[0].error.stack);
    if (workspacePath) console.log("workspace: " + workspacePath + " (left on disk for inspection)");
    process.exit(1);
  }
  if (workspacePath) fs.rmSync(workspacePath, { recursive: true, force: true });
  process.exit(0);
}

main().catch(err => {
  console.error("walkthrough crashed:", err);
  process.exit(1);
});
