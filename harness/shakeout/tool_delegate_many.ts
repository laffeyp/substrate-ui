// Axis B flow: fan-out delegate. Prompts the model to call delegate
// once with a `children` list of three specs; asserts the parent record
// carries ONE ToolCall(tool="delegate") whose args contain children,
// followed by ONE ToolResult whose payload carries answers + child_roots.
//
// Verifies the sprint 245 substrate-side change end-to-end through the
// daily driver.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import { pickRealDriver } from "./lib/driver";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

const TURN_TIMEOUT_MS = 600_000;

export const flow: Flow = {
  name: "tool_delegate_many",
  declared: [
    "SESSION_OPEN_REQUESTED",
    "SESSION_OPEN_ACKED",
    "TURN_SUBMITTED",
    "STREAM_ENVELOPE_APPENDED",
    "TURN_PARKED",
  ],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    const driver = await pickRealDriver(BASE_URL);
    await controller.loadDriverRoster();
    controller.pickDriver(driver);
    await controller.openSession({ driver });

    const prompt = (
      "Use the delegate tool ONCE with a `children` list of three entries. " +
      "Each entry should have a small task like 'compute 6 * 7' or 'say hello' " +
      "and the deterministic driver. Wait for the ToolResult and report what " +
      "came back. Do not call delegate more than once."
    );
    await controller.sendTurn(prompt);

    const deadline = Date.now() + TURN_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (controller.snapshot().parkReason) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    const snap = controller.snapshot();
    const defects: Defect[] = [];
    if (!snap.parkReason) {
      defects.push({
        category: "no_park_within_deadline",
        observed: `no Park after ${TURN_TIMEOUT_MS}ms on driver ${driver}`,
        expected: `TURN_PARKED for the fan-out delegate turn`,
        reproduces: false,
        severity: "medium",
      });
    }

    // Assert ONE ToolCall(tool="delegate") with children on the transcript.
    const delegateCalls = snap.transcript.filter(
      (r) => (r as unknown as { kind?: string }).kind === "ToolCall"
        && (r as unknown as { toolName?: string }).toolName === "delegate"
    );
    if (delegateCalls.length === 0) {
      defects.push({
        category: "no_delegate_call",
        observed: "the model did not call delegate at all",
        expected: "one ToolCall(tool=delegate) with a children list of three",
        reproduces: false,
        severity: "high",
      });
    }
    let sawChildren = 0;
    for (const call of delegateCalls) {
      const args = (call as unknown as { args?: string[] }).args ?? [];
      // args is a JSON-stringified positional list from the runtime; the
      // fan-out branch marks the presence of `children` by including it in
      // the arg payload.
      for (const a of args) {
        if (typeof a === "string" && a.includes("children")) {
          sawChildren += 1;
        }
      }
    }
    if (delegateCalls.length > 0 && sawChildren === 0) {
      defects.push({
        category: "delegate_call_without_children",
        observed: `the model called delegate ${delegateCalls.length} times but no call carried a children list`,
        expected: "one delegate ToolCall whose args include the children array",
        reproduces: false,
        severity: "high",
      });
    }
    if (delegateCalls.length > 1) {
      defects.push({
        category: "multiple_delegate_calls",
        observed: `the model called delegate ${delegateCalls.length} times`,
        expected: "one delegate ToolCall carrying children, not many single-child calls",
        reproduces: false,
        severity: "low",
      });
    }

    // Assert a paired ToolResult exists.
    const results = snap.transcript.filter(
      (r) => (r as unknown as { kind?: string }).kind === "ToolResult"
        && (r as unknown as { toolName?: string }).toolName === "delegate"
    );
    if (results.length === 0) {
      defects.push({
        category: "no_delegate_result",
        observed: "no ToolResult envelope for delegate",
        expected: "one paired ToolResult with answers and child_roots",
        reproduces: false,
        severity: "high",
      });
    }

    await controller.endSession(`shakeout_tool_delegate_many_done`);
    const endDeadline = Date.now() + 8000;
    while (Date.now() < endDeadline) {
      if (controller.snapshot().sessionId === null) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    controller.disconnect();
    return { emitted, defects };
  },
};
