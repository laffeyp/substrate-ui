---
sprint: 013
slug: assay-projection
status: done
pass_kind: backend
cadence: plan-mode-per-sprint
context_files:
  - server.py
  - ../substrate/src/substrate/assay/report.py
  - ../substrate/src/substrate/assay/coding.py
  - process/BLACKBOARD.md
---

# Sprint 013 — the assay read-projection (backend)

## Why

The console reads ONE record at a time (rail → run-as-graph / stream / health-verdict). An **assay
run** is a different altitude: many records — arms × cases × trials — that only mean something
*aggregated and compared* (the firewalled coding A/B, code_evolution, the ablation ladder). The
console has no concept of it. This sprint adds the READ projection — the data seam — so the next
sprint (014) can render the arm matrix. Backend first, observable on its own via curl; the view is 014.

The assay's read is NOT the console's "verdict" (that word is run-HEALTH here — FINALISED / FAILED /
PAUSED). The assay's read is the **arm matrix**: per-arm reliable (pass^k) AND per-trial (pass@1) AND
flake, the harsher Δ-vs-control + McNemar, the pass@1 Δ + CI + margin-verdict, FDR. Both currencies,
never spliced — the review invariant, enforced at the data seam so the view can't relapse.

## Vocabulary (new terms; existing console terms — record, rail, projection — unchanged)

- **assay** — a results file (`process/bench_results/*.jsonl`) + its `.meta.json` config, read as one
  arm comparison. A new rail group, beside RUN RECORDS.
- **arm** — one configured way of doing a thing (from the assay vocabulary; e.g. `strong_ref`, `full`).
- **arm matrix** — the per-arm read: the two currencies + flake + Δ + margin-verdict + FDR + provenance.
- **margin-verdict** — the per-arm TOST read (`equivalent` / `inferior` / `superior` / `inconclusive`),
  distinct from the run-health verdict. Never abbreviated to "verdict" in this UI (collision).

## Scope

`../substrate/src/substrate/assay/cells.py` (NEW, canonical home for "a cells file → a Report" — so
the CLI `bench_coding.py report` and this server share ONE implementation, no drift): `read_meta`,
`caseresult_from_row`, `report_from_cells(path) -> (Report, meta)` — reconstructs CaseResults from the
JSONL rows (null compute → 0; the resume-guard's fingerprint carried) and the suite from the meta +
`coding_problem_bank`, then `build_report`.

`server.py`: two GET projections — `/api/assays` (scan `bench_results/` for `*.jsonl` + sidecar →
list: name, fingerprint, models, margin, trials, cell counts, control-ran) and `/api/assay/<name>`
(`report_from_cells` → arm-matrix JSON: per arm reliable passes/n + pass_at_1 + flake + delta_vs_control
+ p_value + delta_pass_k + ci + margin-verdict + fdr; plus the provenance header). Read-only, like the
record projections. A configurable `BENCH_RESULTS` dir (default `../substrate/process/bench_results`).

## Dual contract

**Artifact:** `report_from_cells(coding_cells.jsonl)` returns a Report with 4 arms, control-ran=pass;
`curl /api/assays` lists `coding_cells`; `curl /api/assay/coding_cells` returns the arm matrix with
both currencies present per non-control arm. mypy --strict + ruff clean on `cells.py`; existing server
tests + 432-test substrate suite stay green. **Signal:** none (read projection).

## Observation contract (backend — curl, the data seam)

- `curl -s localhost:8765/api/assays` lists an assay with `fingerprint`, `n_cells`, `control_ran`.
- `curl -s localhost:8765/api/assay/coding_cells` returns, for `full`: `reliable` (48/71), `pass_at_1`
  (~0.86), `flake` (~+0.18), `delta_vs_control` (~-0.25), `delta_pass_k` (~-0.12), `margin_verdict`
  (`inconclusive`), `fdr` (true) — i.e. BOTH currencies, the harsher one surfaced, the honest verdict.
  Verify against the numbers `bench_coding.py report` prints (the same `build_report`, same data).

## Close

Rubber Duck Pass; BLACKBOARD `## Built` + `## Sprint tail`; sprint 014 (the arm-matrix VIEW + the
harness perceptual capture) is the visual half — this sprint is the data it renders.
