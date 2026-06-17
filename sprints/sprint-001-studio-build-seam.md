# Sprint 001 — Studio build-and-launch seam, under test + made honest

```yaml
---
id: 001
status: closed
phase: 1
pass_kind: functional
---
```

*First sprint card under formal discipline for substrate-ui (review #39 retrofit). The build seam code (`builder.py`, `server.py` `/api/validate` + `/api/build`) was authored before this board existed; this card declares the dual + observation contract that code must satisfy and lands the tests + honesty fix that review #39 found missing. The visual canvas is a SEPARATE later sprint (≤2 files / one concept, hard rule 6).*

---

## scope

Put the Studio build-and-launch seam under real test and close its one honesty edge. (1) Author the two translator tests in `test_server.py` — `test_build_runs_an_authored_topology` (an authored spec POSTed to `/api/build` produces a REAL recorded run in which a triggered Producer actually emits, proving the wiring ran, not faked) and `test_validate_accepts_good_rejects_bad` (good spec → valid; missing-producers and unknown-starts-kind → clean typed invalid, no crash). (2) Close `builder.py`'s stub honesty edge: the deterministic stub emits each declared kind once, so a count Predicate above the producer count finalises green having fired nothing — surface that in the build result (an authored Trigger that never fired) and document it in the `build_from_spec` docstring.

---

## prerequisites

- The review-#39 retrofit (git home + the 3 core artifacts). Closed 2026-06-17.

---

## context_files

- `../sdd-kit-2/AGENTS.md`
- `WORKING_AGREEMENT.md` (canonical home registry: `builder.py` owns spec→topology; `server.py` owns the endpoints; `test_server.py` owns server tests)
- `builder.py` (the translator under test + the stub to make honest)
- `server.py` (`_build`/`_validate` handlers — the endpoints the tests drive)
- `test_server.py` (current state: `post_json` helper + `_AUTHORED` fixture already staged; the two test functions to add)
- `../.review-pipe/resp-039.txt` (review #39 — the exact behaviors to assert + the honesty edge)

---

## signal contract

### Emits

No NEW substrate vocabulary (the UI reads substrate's v0.2). The tests ASSERT on substrate-emitted events in the authored run's record: `substrate.RunStarted`, `substrate.TriggerFired`, `substrate.ProducerStarted`/`ProducerCompleted`, the authored application kinds (e.g. `Critique`, `Verdict`), `substrate.TerminationMatched`, `substrate.RunFinalised`.

### Invariants

- The UI imports only `substrate.api` (+ bundled/reference topologies for demo enumeration) — no kernel internals.
- The build seam runs a REAL `api.Runtime`; the test must prove execution (a triggered Producer's emitted event present), not just a finalised status.
- Eight-word tone canon holds (standing grep clean).

---

## artifact contract

### Files modified

- `test_server.py` (add the two test functions; `post_json` + `_AUTHORED` already present)
- `builder.py` (docstring + the build seam surfaces "trigger never fired")

### Content assertions

- `test_server.py` defines `def test_build_runs_an_authored_topology` and `def test_validate_accepts_good_rejects_bad`.
- `test_build_runs_an_authored_topology` asserts the resulting record contains the triggered Producer's emitted application kind (e.g. `Verdict`) — proof the authored Trigger fired, per review #39's decisive test.
- `test_validate_accepts_good_rejects_bad` asserts `{valid: true}` for `_AUTHORED`, and `{valid: false, ...}` with a clean message for (a) no producers and (b) a Trigger that starts an unknown Producer kind.
- `builder.py`'s `build_from_spec` docstring states the stub's emit-once → count-ceiling behavior.

### Command exit codes

- `cd ../substrate && uv run pytest ../substrate-ui/test_server.py -q` returns 0 (now 20 tests).
- `cd ../substrate && uv run ruff check ../substrate-ui/builder.py ../substrate-ui/test_server.py` returns 0.

---

## observation contract

`pass_kind: functional` — observation contract required (hard rule 9).

### Driving steps

- The two new tests spin a real server on an ephemeral port and drive `/api/build` + `/api/validate` over real HTTP against the real `substrate.api` (the existing `test_server.py` harness).
- Live console regression unaffected: `e2e_console.js` still passes (the Studio has no front-end yet; this sprint is backend-seam only).

### Expected runtime signals (in the authored build record)

- `/api/build` of `_AUTHORED` (2 reviewers → quorum `KindCount(Critique)>=2` starts judge → judge emits `Verdict`): the record's events include `Critique` ×2 then `Verdict`, with a `TriggerFired{adjudicate}` between — the quorum Trigger demonstrably fired.

### Expected build-result honesty (the edge fix)

- `/api/build` of a spec whose count Predicate exceeds the producer count (e.g. `KindCount(X)>=3` with one X-emitter): the build result names the authored Trigger(s) that never fired, rather than silently reporting a bare green finalise.

---

## done criteria

The Studio build seam has real coverage proving an authored topology EXECUTES (not just finalises), validation rejects bad wiring cleanly, and the stub's count-ceiling is no longer silently misleading. `pytest test_server.py` green at 20; ruff clean; the live E2E unaffected. Sent to the duplex-pipe reviewer.

---

## notes

Review #39 finding 2 (MED-HIGH, honesty-of-status): the seam was LIVE but untested — 18 green tests gave false confidence because the newest surface had zero coverage. This card is the concrete fix. Finding 3 (LOW, silent-no-op edge): the stub emit-once count-ceiling — disclose + surface. The visual canvas (the bigger Studio piece) is sprint 002, authored against this now-tested seam.
