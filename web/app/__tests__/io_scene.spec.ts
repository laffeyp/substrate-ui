// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's i/o and scene lenses (web/app/derive/io.ts, scene.ts; sprints 303, 304).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { EnvelopeKind } from "../../vm/kinds";
import { ioDocs } from "../derive/io";
import { DARK, LIT, SCENE_MAX_CELLS, sceneOf } from "../derive/scene";

test("i/o: the input and output documents in seq order, a tool's output as text", () => {
  const docs = ioDocs([
    { seq: 1, kind: EnvelopeKind.SessionStarted, payload: {} },
    { seq: 2, kind: EnvelopeKind.UserMessage, payload: { text: "hello" } },
    { seq: 3, kind: EnvelopeKind.ToolResult, payload: { tool: "bash", output: { stdout: "a.txt" } } },
    { seq: 4, kind: EnvelopeKind.ToolResult, payload: { output: { code: 1 } } },
    { seq: 5, kind: EnvelopeKind.ModelReply, payload: { text: "hi" } },
    { seq: 6, kind: EnvelopeKind.FinalAnswer },
  ]);
  assert.deepStrictEqual(docs, [
    { seq: 2, title: "UserMessage · input", text: "hello" },
    { seq: 3, title: "ToolResult · bash", text: "a.txt" },
    { seq: 4, title: "ToolResult · tool", text: "{\"code\":1}" },
    { seq: 5, title: "ModelReply · output", text: "hi" },
  ]);
});

test("scene: the latest grid; ragged or non-numeric rows are no grid; one over the limit says so", () => {
  const gen = (seq: number, grid: unknown) => ({ seq, kind: "Generation", payload: { grid } });
  assert.deepStrictEqual(sceneOf([]), { kind: "none" });
  assert.deepStrictEqual(sceneOf([gen(1, [[1, 0], [0, 1]]), gen(2, [[0, 0], [1, 1]])]), { kind: "grid", rows: 2, cols: 2, cells: [DARK, DARK, LIT, LIT] });
  assert.deepStrictEqual(sceneOf([gen(1, [[1, 0], [0]])]), { kind: "none" });
  assert.deepStrictEqual(sceneOf([gen(1, [["a"]])]), { kind: "none" });
  const big = Array.from({ length: 21 }, () => Array.from({ length: 20 }, () => 1));
  assert.ok(21 * 20 > SCENE_MAX_CELLS);
  assert.deepStrictEqual(sceneOf([gen(1, big)]), { kind: "large", rows: 21, cols: 20 });
  const throwing = { seq: 1, kind: "Generation", get payload(): Record<string, unknown> { throw new Error("proxy"); } };
  assert.deepStrictEqual(sceneOf([throwing]), { kind: "none" });
});
