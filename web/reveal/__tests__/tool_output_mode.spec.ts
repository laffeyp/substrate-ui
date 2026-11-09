// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// UI sprint 140: one toggle opens or closes every tool card, those drawn and those still to come.
import { test } from "node:test";
import assert from "node:assert";
import { defaultOpen, getToolOutputMode, setToolOutputMode, subscribeToolOutputMode, toggleToolOutputMode } from "../../vm/tool_output_mode";
import { clearBuffer, snapshot } from "../../vm/instrumentation/sdd";
import { Signal, ToolOutputModeSetCause } from "../../vm/signals.gen";

test("before the first flip a card opens only while its tool runs", () => {
  assert.strictEqual(getToolOutputMode().mode, "auto");
  assert.strictEqual(defaultOpen("auto", true), true);
  assert.strictEqual(defaultOpen("auto", false), false);
});

test("a flip applies to every card, running or finished, and counts a generation", () => {
  const before = getToolOutputMode().generation;
  let heard = 0;
  const off = subscribeToolOutputMode(() => { heard += 1; });
  assert.strictEqual(toggleToolOutputMode(ToolOutputModeSetCause.KEY), "expanded");
  assert.strictEqual(defaultOpen(getToolOutputMode().mode, false), true);
  assert.strictEqual(defaultOpen(getToolOutputMode().mode, true), true);
  assert.strictEqual(toggleToolOutputMode(ToolOutputModeSetCause.KEY), "collapsed");
  assert.strictEqual(defaultOpen(getToolOutputMode().mode, true), false);
  assert.strictEqual(toggleToolOutputMode(ToolOutputModeSetCause.KEY), "expanded");
  assert.strictEqual(getToolOutputMode().generation, before + 3);
  assert.strictEqual(heard, 3);
  off();
  setToolOutputMode("collapsed", ToolOutputModeSetCause.SLASH);
  assert.strictEqual(heard, 3);
});

test("two copies of the module share one setting", async () => {
  // reveal_component.ts and the transcript are separate bundles; the state lives on globalThis.
  const shared = (globalThis as unknown as Record<string, { state: { mode: string } }>).__substrateToolOutputMode;
  setToolOutputMode("expanded", ToolOutputModeSetCause.SLASH);
  assert.strictEqual(shared.state.mode, "expanded");
});

test("each application is written with its cause, the mode already set included", () => {
  clearBuffer();
  setToolOutputMode("expanded", ToolOutputModeSetCause.SLASH);
  setToolOutputMode("expanded", ToolOutputModeSetCause.SLASH);
  toggleToolOutputMode(ToolOutputModeSetCause.KEY);
  assert.deepStrictEqual(snapshot().filter((r) => r.name === Signal.TOOL_OUTPUT_MODE_SET).map((r) => r.payload), [
    { mode: "expanded", cause: "slash" }, { mode: "expanded", cause: "slash" }, { mode: "collapsed", cause: "key" },
  ]);
});
