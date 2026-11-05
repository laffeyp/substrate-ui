// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The assay loads (SessionController.loadAssays, loadAssayReport; sprint 248). The bodies are the
// server's, from a two-arm coding fixture read through substrate's report_from_cells.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { SessionController } from "../../vm/session_controller";
import type { FetchResult, SubstrateClient } from "../../vm/client";

const LISTING = [{ name: "coding-fixture", fingerprint: "a23f6252186e", strong_model: "strong-model", weak_models: ["weak-model"], margin: 0.1, trials: 1, n_cells: 8, arms: ["full", "strong_ref"] }];

const arm = (over: Record<string, unknown>) => ({
  arm: "", role: "", n_cases: 0, passes: 0, pass_rate: 0, pass_at_1: 0, complete: false, delta_vs_control: null, delta_pass_k: null,
  ci_low: null, ci_high: null, equivalence: null, fdr_significant: null, completion_tokens: 0, elapsed_ms: 0, model_calls: 0, verdict_counts: {}, ...over,
});
const REPORT = {
  name: "coding-fixture",
  meta: { config_fp: "a23f6252186e", margin: 0.1, _provenance: "verified" },
  report: {
    suite: "coding-firewalled", version: "0.1", primary_metric: "resolved-held-out", null_rule: "the headline is the TOST verdict",
    control_check: { state: "fail", detail: "control arm has no committed record (RunFinalised) for cases ['balanced']" },
    control_arm: "strong_ref", unpublishable: [],
    arms: [
      arm({ arm: "strong_ref", role: "baseline", n_cases: 4, passes: 3, pass_rate: 0.75, pass_at_1: 0.75, complete: true, completion_tokens: 1200, elapsed_ms: 4800, model_calls: 8, verdict_counts: { pass: 3, fail: 1 } }),
      arm({ arm: "weak_single", role: "ablation", verdict_counts: { not_run: 4 } }),
    ],
  },
};

function controller(body: unknown, ok = true) {
  const urls: string[] = [];
  const client = {
    fetchJson: (url: string) => { urls.push(url); return Promise.resolve((ok ? { ok: true, data: body } : { ok: false, status: 404, failureClass: "http_error", detail: "no assay" }) as FetchResult<unknown>); },
    streamRecord: () => () => undefined,
    streamRecordByPath: () => () => undefined,
  } as unknown as SubstrateClient;
  const ctl = new SessionController(client);
  const tags: { tag: string; payload: Record<string, unknown> }[] = [];
  ctl.onEvent((ev) => tags.push({ tag: ev.tag, payload: ev.payload }));
  return { ctl, urls, tags };
}

test("the listing maps substrate's fields and emits ASSAYS_LOADED", async () => {
  const { ctl, urls, tags } = controller(LISTING);
  const rows = await ctl.loadAssays();
  assert.deepStrictEqual(urls, ["/api/assays"]);
  assert.deepStrictEqual(rows, [{ name: "coding-fixture", fingerprint: "a23f6252186e", strongModel: "strong-model", weakModels: ["weak-model"], margin: 0.1, trials: 1, nCells: 8, arms: ["full", "strong_ref"] }]);
  assert.deepStrictEqual(tags.filter((t) => t.tag === "ASSAYS_LOADED").map((t) => t.payload), [{ count: 1 }]);
});

test("a report maps its arms, control check and provenance and emits ASSAY_REPORT_LOADED", async () => {
  const { ctl, urls, tags } = controller(REPORT);
  const r = await ctl.loadAssayReport("coding-fixture");
  assert.deepStrictEqual(urls, ["/api/assay/coding-fixture"]);
  assert.ok(r);
  assert.deepStrictEqual(r.controlCheck.state, "fail");
  assert.strictEqual(r.provenance, "verified");
  assert.strictEqual(r.margin, 0.1);
  assert.deepStrictEqual(r.arms.map((a) => [a.arm, a.role, a.passes, a.nCases, a.passRate, a.deltaPassK, a.verdictCounts]), [
    ["strong_ref", "baseline", 3, 4, 0.75, null, { pass: 3, fail: 1 }],
    ["weak_single", "ablation", 0, 0, 0, null, { not_run: 4 }],
  ]);
  assert.deepStrictEqual(tags.filter((t) => t.tag === "ASSAY_REPORT_LOADED").map((t) => t.payload), [{ name: "coding-fixture", arms: 2 }]);
});

test("a refused report is null, sets lastError and emits nothing", async () => {
  const { ctl, tags } = controller({ error: "no assay 'x'" }, false);
  assert.strictEqual(await ctl.loadAssayReport("x"), null);
  assert.match(ctl.snapshot().lastError ?? "", /^assay x: /);
  assert.strictEqual(tags.some((t) => t.tag.startsWith("ASSAY")), false);
});
