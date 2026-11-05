// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A driver's label and the model column (web/app/derive/driver_label.ts, sprint 280).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { chipLabel, driverLabel, modelRows, type ModelInput } from "../derive/driver_label";

const VERSIONS = {
  claude: { default_family: "sonnet", families: [
    { id: "sonnet", label: "Sonnet", default_pin: "s-5", pins: [{ id: "s-5", label: "5.5" }, { id: "s-4", label: "4.6" }] },
    { id: "opus", label: "Opus", default_pin: null, pins: [] },
  ] },
  cursor: { default_family: "auto", families: [{ id: "auto", label: "Auto", default_pin: null, pins: [] }] },
};

test("a CLI reads its family and pin; an Ollama tag reads as itself", () => {
  assert.strictEqual(driverLabel("claude", VERSIONS, {}), "claude sonnet 5.5");
  assert.strictEqual(driverLabel("claude", VERSIONS, { claude: "s-4" }), "claude sonnet 4.6");
  assert.strictEqual(driverLabel("claude", VERSIONS, { claude: "opus" }), "claude opus");
  assert.strictEqual(driverLabel("qwen3:8b", VERSIONS, {}), "qwen3:8b");
  assert.strictEqual(driverLabel(null, VERSIONS, {}), "");
});

test("on Auto the chip names the CLI only", () => {
  assert.strictEqual(chipLabel("cursor", driverLabel("cursor", VERSIONS, {})), "cursor");
  assert.strictEqual(chipLabel("claude", "claude sonnet 5.5"), "claude sonnet 5.5");
});

const base: ModelInput = {
  groups: [{ label: "cli agents", entries: ["claude"] }, { label: "ollama · local", entries: ["qwen3:8b"] }],
  roster: [], cliVersions: VERSIONS, currentDriver: "claude", expandedGroups: {}, expandedCli: null, expandedFamily: null,
};

test("groups start folded; an open group lists its drivers one level in", () => {
  assert.deepStrictEqual(modelRows(base).map((r) => [r.label, r.indent, r.expanded]), [["cli agents", 12, false], ["ollama · local", 12, false]]);
  const open = modelRows({ ...base, expandedGroups: { "cli agents": true } });
  assert.deepStrictEqual(open.map((r) => [r.label, r.indent, r.current, r.expandable]), [["cli agents", 12, false, true], ["claude", 28, true, true], ["ollama · local", 12, false, true]]);
  assert.deepStrictEqual(open[1].pick, { driver: "claude", version: null });
});

test("a CLI opens to its families and a family to its pins", () => {
  const rows = modelRows({ ...base, expandedGroups: { "cli agents": true }, expandedCli: "claude", expandedFamily: "claude:sonnet" });
  assert.deepStrictEqual(rows.slice(1, 6).map((r) => [r.label, r.indent, r.pick]), [
    ["claude", 28, { driver: "claude", version: null }],
    ["sonnet", 44, { driver: "claude", version: "sonnet" }],
    ["5.5", 60, { driver: "claude", version: "s-5" }],
    ["4.6", 60, { driver: "claude", version: "s-4" }],
    ["opus", 44, { driver: "claude", version: "opus" }],
  ]);
});

test("no groups: the roster, or deterministic alone, ungrouped", () => {
  assert.deepStrictEqual(modelRows({ ...base, groups: [], roster: [] }).map((r) => [r.label, r.indent]), [["deterministic", 12]]);
});
