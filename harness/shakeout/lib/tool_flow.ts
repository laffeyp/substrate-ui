// Shared factory for Axis B tool-coverage flows. Each tool flow opens
// a real-model session on the full toolset, prompts the model to
// demonstrate one specific tool, waits for the paired ToolCall +
// ToolResult envelopes to land, verifies them, ends the session.
//
// Substrate is self-describing: the model sees every tool's schema at
// boot, so a one-line prompt is enough to induce the call.

import { SessionController } from "../../../web/vm/session_controller";
import { NodeSubstrateClient } from "./client";
import { BASE_URL } from "./server";
import { pickRealDriver } from "./driver";
import type { Flow, EmittedRecord, Defect } from "./flow";

interface ToolFlowConfig {
  tool: string;
  prompt: string;
  turnTimeoutMs?: number;
}

const DEFAULT_TURN_TIMEOUT_MS = 300_000;

export function makeToolFlow(cfg: ToolFlowConfig): Flow {
  const timeout = cfg.turnTimeoutMs ?? DEFAULT_TURN_TIMEOUT_MS;
  return {
    name: `tool_${cfg.tool}`,
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

      await controller.sendTurn(cfg.prompt);
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (controller.snapshot().parkReason) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      const snap = controller.snapshot();

      const defects: Defect[] = [];
      if (!snap.parkReason) {
        defects.push({
          category: "no_park_within_deadline",
          observed: `no Park after ${timeout}ms on driver ${driver}`,
          expected: `TURN_PARKED for tool demonstration`,
          reproduces: false,
          severity: "medium",
        });
      }

      // Verify the ToolCall + ToolResult envelope pair landed in the
      // transcript. Every envelope also lands in emitted as
      // STREAM_ENVELOPE_APPENDED, so we walk that list.
      const toolCalls = snap.transcript.filter((r) => r.kind === "ToolCall");
      const toolResults = snap.transcript.filter((r) => r.kind === "ToolResult");
      const calledOurTool = toolCalls.some((r) => {
        const name = (r as unknown as { toolName?: string }).toolName;
        return name === cfg.tool;
      });
      if (!calledOurTool) {
        const called = toolCalls
          .map((r) => (r as unknown as { toolName?: string }).toolName || "?")
          .join(", ") || "(none)";
        defects.push({
          category: "wrong_tool_called",
          observed: `model called: ${called}`,
          expected: `at least one ToolCall with tool_name=${cfg.tool}`,
          reproduces: false,
          severity: "high",
        });
      }
      if (toolResults.length === 0) {
        defects.push({
          category: "no_tool_result",
          observed: "no ToolResult envelope",
          expected: "paired ToolResult follows every ToolCall",
          reproduces: false,
          severity: "high",
        });
      }
      // The `[object Object]` render defect (finding 40) surfaces on
      // dict-shaped tool outputs. Guard for it explicitly here.
      for (const row of snap.transcript) {
        const s = typeof (row as unknown as { text?: unknown }).text === "string" ? (row as { text: string }).text : "";
        if (s.includes("[object Object]")) {
          defects.push({
            category: "object_object_tool_row",
            observed: `tool row rendered "[object Object]"`,
            expected: "the tool's structured output rendered as text",
            reproduces: false,
            severity: "high",
          });
        }
      }

      await controller.endSession(`shakeout_tool_${cfg.tool}_done`);
      const endDeadline = Date.now() + 8000;
      while (Date.now() < endDeadline) {
        if (controller.snapshot().sessionId === null) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      controller.disconnect();
      return { emitted, defects };
    },
  };
}
