# Sprint 249 — Route BENCH_RESULTS through `substrate_home()`

```yaml
---
id: 249
status: done
opened_at: 2026-09-29
phase: config-externalization
pass_kind: functional
---
```

## scope

Replace the `BENCH_RESULTS` module-level constant in `server.py` with a lazy `_bench_results()` function that returns `$BENCH_RESULTS` if set, else `substrate_home() / "bench_results"`. The prior fallback resolved to `../substrate/process/bench_results` relative to `server.py` — a sibling-checkout path that does not exist in the packaged `.app`.

## prerequisites

- sprint 090 (substrate-ui paths routed through `substrate_home()`)

## context_files

- `server.py` — lines 1738–1748 (the constant), 1751–1753 (`_assays_index`), 1783 (`_assay_report`)

## signal contract

### Emits

No new signals.

### Consumes

- `server.py`

### Invariants

- `BENCH_RESULTS` env var still overrides the default.
- Unset, the default resolves to `~/.substrate/bench_results` (or `$SUBSTRATE_HOME/bench_results`).
- The packaged `.app` resolves the same path as the source build when neither env var is set.

## artifact contract

### Files modified

- `server.py` — `BENCH_RESULTS` constant replaced with `_bench_results()` function; three call sites updated.

### Content assertions

- `grep -c 'BENCH_RESULTS' server.py` returns 0 (the module-level constant is gone).
- `grep -c '_bench_results()' server.py` returns 3.

### Command exit codes

- Server starts without error.

## done criteria

Both source and packaged builds resolve bench results under `substrate_home()`. The `BENCH_RESULTS` env var overrides the default. No module-level `Path` evaluation at import time.
