"""End-to-end tests for the substrate-ui read-API server — the seam, exercised for REAL.

Starts the actual server on an ephemeral port in a thread, hits it over HTTP with urllib, and
asserts the JSON it serves matches the runtime's own projections (the seam serves
`substrate.api` faithfully — no distortion, no invented data). This is the production data
contract under test; it runs in the substrate venv:

    cd substrate && uv run python -m pytest ../substrate-ui/test_server.py -q
"""

from __future__ import annotations

import json
import sys
import threading
import urllib.error
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import server  # noqa: E402  the module under test

from substrate import api  # noqa: E402
from substrate.topologies import bundled  # noqa: E402


@pytest.fixture(scope="module")
def base() -> object:
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def get(base: str, path: str) -> object:
    with urlopen(base + path, timeout=10) as r:
        return json.load(r)


def post(base: str, path: str) -> object:
    from urllib.request import Request

    with urlopen(Request(base + path, method="POST"), timeout=30) as r:
        return json.load(r)


def post_json(base: str, path: str, body: object) -> object:
    from urllib.request import Request

    req = Request(base + path, data=json.dumps(body).encode(), method="POST",
                  headers={"Content-Type": "application/json"})
    with urlopen(req, timeout=30) as r:
        return json.load(r)


_AUTHORED = {
    "name": "authored_review",
    "producers": [
        {"kind": "reviewer-a", "emits": ["Critique"], "initial": True},
        {"kind": "reviewer-b", "emits": ["Critique"], "initial": True},
        {"kind": "judge", "emits": ["Verdict"]},
    ],
    "views": [{"name": "crits", "kind": "KindCount", "of": "Critique"}],
    "triggers": [{"id": "adjudicate", "on": "Critique",
                  "predicate": {"view": "crits", "op": ">=", "n": 2}, "starts": "judge", "policy": "Once"}],
    "termination": {"kind": "any_of",
                    "members": [{"kind": "all_completed"}, {"kind": "quiescence_with_watchdog", "seconds": 1}]},
}


def test_records_index_carries_real_run_level_status(base: str) -> None:
    recs = get(base, "/api/records")
    names = {r["name"] for r in recs}
    assert {"code_review", "debate", "natural_conversation"} <= names
    cr = next(r for r in recs if r["name"] == "code_review")
    assert cr["status"] == "finalised"  # the REAL run-level status, not a guess
    assert cr["application_events"]["CritiquePosted"] == 3
    assert cr["producers_failed"] == 0


def test_run_graph_endpoint_matches_the_projection(base: str) -> None:
    served = get(base, "/api/records/code_review/run_graph")
    direct = api.run_graph(bundled.record_path("code_review"))
    assert served["status"] == direct.status == "finalised"
    assert len(served["instances"]) == len(direct.instances) == 6
    judge = next(i for i in served["instances"] if i["kind"] == "judge")
    # the firing anchor the run-as-graph renders on, served correctly:
    assert judge["fired_seq"] is not None and judge["fired_seq"] < judge["started_seq"]
    assert judge["trigger_id"] == "adjudicate"
    # cancel-others: exactly the 2 slow reviewers cancelled
    assert sum(1 for i in served["instances"] if i["status"] == "cancelled") == 2


def test_topology_graph_endpoint_nodes_and_edges(base: str) -> None:
    g = get(base, "/api/records/code_review/topology_graph")
    assert any(p["kind"] == "reviewer-security" and p["is_initial"] for p in g["producers"])
    assert any(p["kind"] == "judge" and not p["is_initial"] for p in g["producers"])
    adj = next(t for t in g["triggers"] if t["id"] == "adjudicate")
    assert adj["starts"] == "judge" and adj["on"] == ["CritiquePosted"]


def test_summary_endpoint_is_honest(base: str) -> None:
    s = get(base, "/api/records/code_review/summary")
    assert s["finalised"] is True and s["producers_failed"] == 0
    assert s["application_events"]["VerdictRendered"] == 1


def test_explain_endpoint_serves_provenance(base: str) -> None:
    rg = get(base, "/api/records/code_review/run_graph")
    judge = next(i for i in rg["instances"] if i["kind"] == "judge")
    prov = get(base, f"/api/records/code_review/explain/{judge['instance']}")
    assert prov["explanation"]["kind"] == "judge"
    assert prov["explanation"]["trigger_id"] == "adjudicate"
    assert any(a["kind"] == "judge" for a in prov["ancestry"])  # the chain includes the judge itself


def test_full_record_endpoint_has_events_and_manifest(base: str) -> None:
    full = get(base, "/api/records/code_review")
    assert full["status"] == "finalised"
    assert full["events"][0]["kind"] == "substrate.RunStarted"
    assert full["manifest"] is not None and "producer_kinds" in full["manifest"]


def test_failure_statuses_serialize_over_the_wire(base: str) -> None:
    # review #32 finding 2: the §7.2 failure states must serialize correctly over HTTP, on REAL
    # records (the bundled set is all clean). gen_demo_records.py produces these by running topologies.
    failed = get(base, "/api/records/demo_failed/run_graph")
    assert failed["status"] == "failed" and failed["final_reason"] == "view_failure"
    paused = get(base, "/api/records/demo_paused/run_graph")
    assert paused["status"] == "paused" and paused["paused_on"] == "HumanApproval"
    # the finished-!=-worked case: the RUN finalised cleanly, but a Producer failed inside it.
    broken = get(base, "/api/records/demo_broken/run_graph")
    assert broken["status"] == "finalised"
    assert get(base, "/api/records/demo_broken/summary")["producers_failed"] == 1


def test_diff_endpoint_first_divergence(base: str) -> None:
    # the diff surface (#30 Q-E1: first_divergence / D-8). demo_diff_a/b are two runs of one
    # topology emitting [1,2,3] vs [1,2,9] -> equivalent to themselves, diverge at the 3rd event.
    assert get(base, "/api/diff?a=demo_diff_a&b=demo_diff_a")["equivalent"] is True
    div = get(base, "/api/diff?a=demo_diff_a&b=demo_diff_b")
    assert div["equivalent"] is False
    assert div["divergence"]["seq"] == 5 and div["divergence"]["kind_a"] == "Num"
    assert div["divergence"]["hash_a"] != div["divergence"]["hash_b"]
    # cross-topology: two unrelated topologies diverge immediately at the differing RunStarted
    # manifest (NOT a false "equivalent") — pin it so a change can't silently break it (review #34).
    cross = get(base, "/api/diff?a=code_review&b=debate")
    assert cross["equivalent"] is False
    assert cross["divergence"]["seq"] == 0 and cross["divergence"]["kind_a"] == "substrate.RunStarted"


def test_io_endpoint_derives_input_and_outputs(base: str) -> None:
    # the I/O surface, derived from the record (§7.1): a real seed -> Message out (demo_solo_chat);
    # a build-parameterized run has null input but rich application-event artifacts (code_review).
    solo = get(base, "/api/records/demo_solo_chat/io")
    assert solo["input"]["prompt"].startswith("Summarize")
    # the baseline channel (b.baseline) — the OTHER designated input, surfaced by io (review #34).
    assert solo["baseline"] == {"dataset": "q3_incidents", "seed": 42}
    assert [o["kind"] for o in solo["outputs"]] == ["Message"]
    cr = get(base, "/api/records/code_review/io")
    assert cr["input"] is None  # no runtime seed (parameterized at build), honestly null
    assert [o["kind"] for o in cr["outputs"]] == [
        "CritiquePosted", "CritiquePosted", "CritiquePosted", "VerdictRendered",
    ]
    assert all("seq" in o for o in cr["outputs"])  # every artifact cites its producing seq


def test_unknown_record_is_404(base: str) -> None:
    with pytest.raises(urllib.error.HTTPError) as exc:
        get(base, "/api/records/does_not_exist/run_graph")
    assert exc.value.code == 404


def test_launch_runs_a_topology_and_records_it(base: str) -> None:
    # the thin control layer (ruling C1: launch + resume only). POST runs a bundled topology to a
    # fresh record; the launch IS the recorded RunStarted (§7.7). It must be a REAL run, readable.
    res = post(base, "/api/launch?topology=code_review")
    assert res["status"] == "finalised" and res["launched"] == "code_review"
    name = res["name"]
    rg = get(base, f"/api/records/{name}/run_graph")
    assert rg["status"] == "finalised" and len(rg["instances"]) == 6  # a genuine code_review run
    assert get(base, f"/api/records/{name}/events")[0]["kind"] == "substrate.RunStarted"
    assert get(base, "/api/topologies")  # the launchable list is served


def test_launch_records_are_durable_never_clobbered(base: str) -> None:
    # review #35: launched records are durable artifacts and must NEVER be silently deleted (the
    # record IS the product). Two launches -> two DISTINCT unique-id records, BOTH still readable —
    # this is the data-loss bug (in-memory counter + rmtree-on-collision) staying fixed.
    a = post(base, "/api/launch?topology=debate")["name"]
    b = post(base, "/api/launch?topology=debate")["name"]
    assert a != b  # unique-id naming never collides, so neither is clobbered
    assert get(base, f"/api/records/{a}/run_graph")["status"] == "finalised"  # the FIRST still exists
    assert get(base, f"/api/records/{b}/run_graph")["status"] == "finalised"


def test_launch_is_backgrounded_and_the_record_grows(base: str) -> None:
    # review #35 finding 3: a SLOW launch returns IMMEDIATELY (status incomplete), the run continues
    # in the background, and the record GROWS to a terminal — the enabler for live-attach.
    import time

    res = post(base, "/api/launch?topology=live_demo")  # ~3s run
    assert res["status"] == "incomplete"  # returned before the run finished -> backgrounded
    name = res["name"]
    final = None
    for _ in range(40):
        time.sleep(0.25)
        final = get(base, f"/api/records/{name}/run_graph")["status"]
        if final != "incomplete":
            break
    assert final == "finalised"  # the backgrounded run reached its terminal, readable over HTTP


def test_run_graph_reports_server_authoritative_liveness(base: str) -> None:
    # review #36: the server SPAWNED the run, so it knows if it's alive. run_graph carries `live`:
    # a running launch is incomplete + live=True (still writing); once done, live=False. This is the
    # signal the console uses to stop showing "● LIVE" for a torn run (incomplete + live=False).
    import time

    res = post(base, "/api/launch?topology=live_demo")
    name = res["name"]
    g = get(base, f"/api/records/{name}/run_graph")
    assert g["status"] == "incomplete" and g["live"] is True  # thread alive, mid-write
    for _ in range(40):
        time.sleep(0.25)
        g = get(base, f"/api/records/{name}/run_graph")
        if g["status"] != "incomplete":
            break
    assert g["status"] == "finalised" and g["live"] is False  # finished -> thread dead -> not live
    # a static (non-launch) record reports live=False (it isn't being written) — so the console
    # treats a static no-terminal record as torn/incomplete, never live.
    assert get(base, "/api/records/code_review/run_graph")["live"] is False
    # a TORN record (no terminal, not a live launch) -> incomplete + live=False -> the console
    # renders amber "INCOMPLETE" (broken/indeterminate), never "LIVE". §7.2 holds.
    torn = get(base, "/api/records/demo_torn/run_graph")
    assert torn["status"] == "incomplete" and torn["live"] is False


def test_launch_unknown_topology_is_404(base: str) -> None:
    with pytest.raises(urllib.error.HTTPError) as exc:
        post(base, "/api/launch?topology=does_not_exist")
    assert exc.value.code == 404


def test_resume_continues_a_paused_run(base: str) -> None:
    # the other control (ruling C1): demo_resumable PAUSES awaiting ApprovalGranted. Resume injects
    # the event -> the resume Trigger fires the continuation -> finalised, on a COPY so the template
    # stays paused and re-resumable. The continuation actually ran (Stage2Done on the bus).
    assert get(base, "/api/records/demo_resumable/run_graph")["status"] == "paused"
    res = post(base, "/api/resume?record=demo_resumable")
    assert res["status"] == "finalised" and res["resumed"] == "demo_resumable"
    kinds = {e["kind"] for e in get(base, f"/api/records/{res['name']}/events")}
    assert {"ApprovalGranted", "Stage2Done", "substrate.RunFinalised"} <= kinds  # the run continued
    assert get(base, "/api/records/demo_resumable/run_graph")["status"] == "paused"  # template untouched


def test_resume_non_resumable_is_404(base: str) -> None:
    with pytest.raises(urllib.error.HTTPError) as exc:
        post(base, "/api/resume?record=code_review")  # a finalised, non-resumable record
    assert exc.value.code == 404


def test_build_runs_an_authored_topology(base: str) -> None:
    # the Studio seam (ruling E2): an authored JSON spec -> a REAL TopologyBuilder topology -> a
    # recorded run. The decisive assertion (review #39): a TRIGGERED Producer actually emits, proving
    # the authored wiring EXECUTED, not a faked finalise. 2 reviewers -> KindCount(Critique)>=2 matures
    # -> adjudicate fires the judge -> judge emits Verdict.
    res = post_json(base, "/api/build", _AUTHORED)
    assert res["status"] == "finalised" and res["built"] == "authored_review"
    name = res["name"]
    kinds = [e["kind"] for e in get(base, f"/api/records/{name}/events")]
    assert kinds[0] == "substrate.RunStarted" and kinds[-1] == "substrate.RunFinalised"
    # Verdict exists ONLY because adjudicate fired the judge after the quorum of 2 Critiques:
    assert kinds.count("Critique") == 2 and "Verdict" in kinds
    # the read projection over the real run confirms the judge is anchored on the authored Trigger:
    rg = get(base, f"/api/records/{name}/run_graph")
    judge = next(i for i in rg["instances"] if i["kind"] == "judge")
    assert judge["status"] == "completed" and judge["trigger_id"] == "adjudicate"
    assert judge["fired_seq"] is not None  # it spawned from a firing, not an initial


def test_validate_accepts_good_rejects_bad(base: str) -> None:
    # the Studio's live validation (static TopologyBuilder.build() — the runtime's OWN "allowable
    # ways"): a good spec validates; bad wiring is rejected with a clean typed message, never a crash.
    assert post_json(base, "/api/validate", _AUTHORED) == {"valid": True}
    no_producers = post_json(base, "/api/validate", {"producers": [], "termination": {"kind": "all_completed"}})
    assert no_producers["valid"] is False and "Producer" in no_producers["error"]
    unknown_starts = post_json(base, "/api/validate", {
        "producers": [{"kind": "a", "emits": ["X"], "initial": True}],
        "triggers": [{"id": "t", "on": "X", "starts": "ghost"}],
        "termination": {"kind": "all_completed"},
    })
    assert unknown_starts["valid"] is False and "ghost" in unknown_starts["error"]


def test_build_surfaces_unfired_triggers(base: str) -> None:
    # review #39 finding 3 (honesty edge): the deterministic stub emits each kind ONCE, so a count
    # Predicate above the producer count is UNREACHABLE — the run finalises green having fired nothing
    # past the initials. That must not be silent: /api/build names the authored Trigger that never
    # fired, so the Studio can warn instead of implying the wiring worked.
    res = post_json(base, "/api/build", {
        "name": "unreachable",
        "producers": [{"kind": "a", "emits": ["X"], "initial": True},
                      {"kind": "b", "emits": ["Y"]}],
        "views": [{"name": "xs", "kind": "KindCount", "of": "X"}],
        "triggers": [{"id": "needs_three", "on": "X",
                      "predicate": {"view": "xs", "op": ">=", "n": 3}, "starts": "b", "policy": "Once"}],
        "termination": {"kind": "any_of",
                        "members": [{"kind": "all_completed"}, {"kind": "quiescence_with_watchdog", "seconds": 1}]},
    })
    assert res["status"] == "finalised"  # honestly finalised via quiescence...
    assert res.get("unfired_triggers") == ["needs_three"]  # ...but the unfired Trigger is surfaced
    # and indeed no Y was emitted (b never started) — the surfaced signal is true, not decorative:
    kinds = [e["kind"] for e in get(base, f"/api/records/{res['name']}/events")]
    assert "Y" not in kinds


def test_build_model_producer_runs_the_responder(base: str) -> None:
    # sprint 006: a MODEL-backed Producer calls the runtime's REAL Responder. Built with the default
    # DeterministicResponder (CI mode — pure, seeded), the emitted payload carries the responder's
    # deterministic output, proving the responder genuinely RAN (not the stub's note=kind).
    from substrate.reference import DeterministicResponder

    spec = {
        "name": "model_demo",
        "producers": [{"kind": "rater", "emits": ["Verdict"], "initial": True, "model": True, "prompt": "rate this"}],
        "termination": {"kind": "any_of",
                        "members": [{"kind": "all_completed"}, {"kind": "quiescence_with_watchdog", "seconds": 1}]},
    }
    res = post_json(base, "/api/build", spec)
    assert res["status"] == "finalised"
    outs = get(base, f"/api/records/{res['name']}/io")["outputs"]
    verdicts = [o for o in outs if o["kind"] == "Verdict"]
    assert len(verdicts) == 1
    expected = DeterministicResponder(seed=0).respond("rate this")
    assert verdicts[0]["payload"]["note"] == expected  # the REAL responder's output...
    assert expected != "rater"  # ...not the stub's note=kind — the responder genuinely ran


def test_static_index_is_served(base: str) -> None:
    with urlopen(base + "/", timeout=10) as r:
        body = r.read().decode()
    assert "run console" in body.lower()
