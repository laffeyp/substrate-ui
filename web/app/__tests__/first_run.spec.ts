// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// First run's driver rows (web/app/derive/first_run.ts, sprint 219).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { cliAgents, firstRunRows } from "../derive/first_run";

test("rows group local, cloud, CLI, then deterministic last", () => {
  const rows = firstRunRows(["claude", "qwen3:8b", "glm-5.2:cloud", "deterministic"], "glm-5.2:cloud", ["claude"]);
  assert.deepStrictEqual(rows.map((r) => r.name), ["ollama · qwen3:8b", "ollama·cloud · glm-5.2:cloud", "claude (cli)", "deterministic"]);
  assert.deepStrictEqual(rows.map((r) => r.preselected), [false, true, false, false]);
  assert.strictEqual(rows[1].meta, "default · cloud model");
});

test("a name is a CLI only when the server found that CLI", () => {
  const rows = firstRunRows(["gemini"], null, []);
  assert.strictEqual(rows[0].name, "ollama · gemini");
});

test("an empty roster still offers deterministic", () => {
  assert.deepStrictEqual(firstRunRows([], null, []).map((r) => r.driver), ["deterministic"]);
});

test("a preselected local model says so", () => {
  assert.strictEqual(firstRunRows(["qwen3:8b"], "qwen3:8b", [])[0].meta, "localhost:11434 · installed · preselected");
});

test("the CLIs are the cli agents group", () => {
  assert.deepStrictEqual(cliAgents([{ label: "ollama · cloud", entries: ["glm-5.2:cloud"] }, { label: "cli agents", entries: ["claude"] }]), ["claude"]);
  assert.deepStrictEqual(cliAgents([]), []);
});
