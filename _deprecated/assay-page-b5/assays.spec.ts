// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the assay page says about each arm (web/app/derive/assays.ts, sprint 252).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import type { AssayArm, AssayReport } from "../../vm/types";
import { ACCENT, armLine, assaySummary, DIM, PLAIN, warnings } from "../derive/assays";

const arm = (over: Partial<AssayArm>): AssayArm => ({
  arm: "full", role: "full", nCases: 4, passes: 2, passRate: 0.5, passAt1: 0.5, complete: true, deltaPassK: null, ciLow: null, ciHigh: null,
  equivalence: null, fdrSignificant: null, completionTokens: 1200, elapsedMs: 4800, modelCalls: 8, verdictCounts: {}, ...over,
});

test("the control arm reads control and has no delta", () => {
  const line = armLine(arm({ arm: "strong_ref", role: "baseline", passes: 3, passRate: 0.75 }), "strong_ref");
  assert.deepStrictEqual([line.verdict, line.deltaLabel, line.passLabel, line.barW, line.timeLabel], ["control", "—", "3/4", "75%", "4.8s"]);
});

test("an arm that ran no case is hollow and says not run", () => {
  const line = armLine(arm({ arm: "weak_single", nCases: 0, passes: 0, passRate: 0 }), "strong_ref");
  assert.deepStrictEqual([line.notRun, line.passLabel, line.verdict, line.verdictColor, line.tokensLabel], [true, "not run", "not run", DIM, "—"]);
});

test("inconclusive reads can't tell yet; only a significant finding takes the accent", () => {
  const unsure = armLine(arm({ deltaPassK: -0.25, ciLow: -0.75, ciHigh: 0.25, equivalence: "inconclusive", fdrSignificant: false }), "strong_ref");
  assert.deepStrictEqual([unsure.verdict, unsure.verdictColor, unsure.deltaLabel], ["can't tell yet", PLAIN, "−0.25 [−0.75, +0.25]"]);
  const sure = armLine(arm({ deltaPassK: 0.3, ciLow: 0.1, ciHigh: 0.5, equivalence: "superior", fdrSignificant: true }), "strong_ref");
  assert.deepStrictEqual([sure.verdict, sure.verdictColor], ["superior", ACCENT]);
});

const report = (over: Partial<AssayReport>): AssayReport => ({
  name: "x", suite: "coding-firewalled", primaryMetric: "resolved-held-out", nullRule: "", controlCheck: { state: "pass", detail: "" },
  controlArm: "strong_ref", unpublishable: [], provenance: "verified", margin: 0.1, arms: [], ...over,
});

test("the page says where the data cannot back a number", () => {
  assert.deepStrictEqual(warnings(report({})), []);
  const out = warnings(report({ controlCheck: { state: "fail", detail: "control arm has no committed record" }, provenance: "tampered", unpublishable: [{ arm: "full", gradedRate: 0.5, threshold: 0.8, reason: "graded rate below floor" }] }));
  assert.deepStrictEqual(out, [
    "no delta: the control arm did not run on every case (fail) — control arm has no committed record",
    "full is unpublishable: graded 50% of cases, under the pre-registered 80% — graded rate below floor",
    "the recorded config is tampered: the margin the verdicts use may not be the one the run was registered with",
  ]);
});

test("a listing row names its cells, arms, trials, margin and models", () => {
  assert.strictEqual(assaySummary({ name: "x", fingerprint: null, strongModel: "strong-model", weakModels: ["weak-model"], margin: 0.1, trials: 1, nCells: 8, arms: ["full", "strong_ref"] }),
    "8 cells · 2 arms ran · 1 trial · margin 0.1 · strong-model vs weak-model");
});
