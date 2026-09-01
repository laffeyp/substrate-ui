# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""End-to-end tests for the substrate-ui read-API server — the seam, exercised for REAL.

Starts the actual server on an ephemeral port in a thread, hits it over HTTP with urllib, and
asserts the JSON it serves matches the runtime's own projections (the seam serves
`substrate.api` faithfully — no distortion, no invented data). This is the production data
contract under test; it runs in the substrate venv:

    cd substrate && uv run python -m pytest ../substrate-ui/test_server.py -q
"""

from __future__ import annotations

import json
import os
import sys
import threading
import urllib.error
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
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

    req = Request(
        base + path,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
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
    "triggers": [
        {
            "id": "adjudicate",
            "on": "Critique",
            "predicate": {"view": "crits", "op": ">=", "n": 2},
            "starts": "judge",
            "policy": "Once",
        }
    ],
    "termination": {
        "kind": "any_of",
        "members": [
            {"kind": "all_completed"},
            {"kind": "quiescence_with_watchdog", "seconds": 1},
        ],
    },
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
    assert any(
        p["kind"] == "reviewer-security" and p["is_initial"] for p in g["producers"]
    )
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
    assert any(
        a["kind"] == "judge" for a in prov["ancestry"]
    )  # the chain includes the judge itself


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
    assert (
        cross["divergence"]["seq"] == 0
        and cross["divergence"]["kind_a"] == "substrate.RunStarted"
    )


def test_io_endpoint_derives_input_and_outputs(base: str) -> None:
    # the I/O surface, derived from the record (§7.1): a real seed -> Message out (demo_solo_chat);
    # a build-parameterized run has null input but rich application-event artifacts (code_review).
    solo = get(base, "/api/records/demo_solo_chat/io")
    assert solo["input"]["prompt"].startswith("Summarize")
    # the baseline channel (b.baseline) — the OTHER designated input, surfaced by io (review #34).
    assert solo["baseline"] == {"dataset": "q3_incidents", "seed": 42}
    assert [o["kind"] for o in solo["outputs"]] == ["Message"]
    cr = get(base, "/api/records/code_review/io")
    assert (
        cr["input"] is None
    )  # no runtime seed (parameterized at build), honestly null
    # substrate review C-7 (2026-08-03): code_review now METERS each model call, so a ModelUsage precedes
    # each reviewer's critique and the judge's verdict on the record — the I/O outputs interleave them.
    assert [o["kind"] for o in cr["outputs"]] == [
        "ModelUsage",
        "CritiquePosted",
        "ModelUsage",
        "CritiquePosted",
        "ModelUsage",
        "CritiquePosted",
        "ModelUsage",
        "VerdictRendered",
    ]
    assert all(
        "seq" in o for o in cr["outputs"]
    )  # every artifact cites its producing seq


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
    assert (
        rg["status"] == "finalised" and len(rg["instances"]) == 6
    )  # a genuine code_review run
    assert get(base, f"/api/records/{name}/events")[0]["kind"] == "substrate.RunStarted"
    assert get(base, "/api/topologies")  # the launchable list is served


def test_launch_records_are_durable_never_clobbered(base: str) -> None:
    # review #35: launched records are durable artifacts and must NEVER be silently deleted (the
    # record IS the product). Two launches -> two DISTINCT unique-id records, BOTH still readable —
    # this is the data-loss bug (in-memory counter + rmtree-on-collision) staying fixed.
    a = post(base, "/api/launch?topology=debate")["name"]
    b = post(base, "/api/launch?topology=debate")["name"]
    assert a != b  # unique-id naming never collides, so neither is clobbered
    assert (
        get(base, f"/api/records/{a}/run_graph")["status"] == "finalised"
    )  # the FIRST still exists
    assert get(base, f"/api/records/{b}/run_graph")["status"] == "finalised"


def test_launch_is_backgrounded_and_the_record_grows(base: str) -> None:
    # review #35 finding 3: a SLOW launch returns IMMEDIATELY (status incomplete), the run continues
    # in the background, and the record GROWS to a terminal — the enabler for live-attach.
    import time

    res = post(base, "/api/launch?topology=live_demo")  # ~3s run
    assert (
        res["status"] == "incomplete"
    )  # returned before the run finished -> backgrounded
    name = res["name"]
    final = None
    for _ in range(40):
        time.sleep(0.25)
        final = get(base, f"/api/records/{name}/run_graph")["status"]
        if final != "incomplete":
            break
    assert (
        final == "finalised"
    )  # the backgrounded run reached its terminal, readable over HTTP


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
    assert (
        g["status"] == "finalised" and g["live"] is False
    )  # finished -> thread dead -> not live
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


def test_agent_endpoint_launches_a_live_tool_using_loop(base: str) -> None:
    # the interactive terminal POSTs a task and the server starts a LIVE tool-using agent run the
    # console follows. CI drives the DETERMINISTIC agent (model=deterministic) — no Ollama — proving
    # the endpoint wires a real tool_loop run to the record (the model -> tool -> model loop, ON THE
    # LOG). The ollama path is the SAME seam with a real Responder (walkthrough), exercised live, not
    # in CI. Observation contract for the interactive-agent sprint: the agent run is a real recorded
    # tool loop the console can follow; the terminal-driving half is the two-track E2E (Addendum A).
    res = post(base, "/api/agent?model=deterministic&legacy=true")
    assert res["agent"] == "deterministic"
    name = res["name"]
    assert name.startswith("launch_agent")  # a prunable session run (launch_ prefix)
    assert (
        res["status"] == "finalised"
    )  # the deterministic calculator loop finishes immediately
    events = get(base, f"/api/records/{name}/events")
    kinds = [e["kind"] for e in events]
    assert kinds[0] == "substrate.RunStarted"
    # the tool-using loop actually ran and is on the record: model -> tool -> model -> answer.
    assert "ToolCall" in kinds and "ToolResult" in kinds and "FinalAnswer" in kinds
    assert kinds[-1] == "substrate.RunFinalised"


def test_agent_endpoint_reports_the_per_conversation_workspace(
    base: str, tmp_path
) -> None:
    # per-session workspace: an ABSOLUTE path is a project the user picked (used + created as-is); a
    # BARE name is a dedicated session dir under ~/.substrate/sessions/ (the client passes the
    # conversation id, so turns share one dir); an UNSET workspace defaults to a fresh session dir —
    # NEVER the server's cwd (the scribble-in-the-repo footgun the cockpit hit live). Echoed back so
    # the terminal can show it.
    ws = str(tmp_path)
    res = post(base, f"/api/agent?model=deterministic&legacy=true&workspace={ws}")
    assert res["workspace"] == ws  # absolute path used as-is
    assert Path(ws).is_dir()  # and created if missing
    # a bare name resolves under the sessions base, not treated as a relative cwd path.
    named = post(base, "/api/agent?model=deterministic&legacy=true&workspace=mysession")[
        "workspace"
    ]
    assert named.endswith("/.substrate/sessions/mysession") and Path(named).is_dir()
    # unset -> a dedicated session dir, NOT the server's cwd (the footgun).
    default_ws = post(base, "/api/agent?model=deterministic&legacy=true")["workspace"]
    assert "/.substrate/sessions/" in default_ws and default_ws != os.getcwd()


def test_session_worktree_isolates_a_session_on_a_branch(tmp_path, monkeypatch) -> None:
    # B: git-worktree-per-session. Driving against a repo puts the session in its OWN worktree — a
    # checkout on branch substrate/<session>, adjacent to the repo, so the agent works isolated from the
    # user's working tree and its changes are a diffable branch. Idempotent. (Base monkeypatched so it
    # doesn't pollute ~/.substrate.)
    import subprocess

    import server

    monkeypatch.setattr(server, "_SESSIONS_BASE", tmp_path / "sessions")
    repo = tmp_path / "repo"
    repo.mkdir()
    for cmd in (
        ["git", "init", "-q", str(repo)],
        ["git", "-C", str(repo), "config", "user.email", "t@t"],
        ["git", "-C", str(repo), "config", "user.name", "t"],
    ):
        subprocess.run(cmd, check=True)
    (repo / "a.txt").write_text("hello")
    subprocess.run(["git", "-C", str(repo), "add", "-A"], check=True)
    subprocess.run(["git", "-C", str(repo), "commit", "-qm", "init"], check=True)

    wt, branch = server._session_worktree(repo, "sess-abc")
    assert branch == "substrate/sess-abc"
    assert (
        wt.is_dir() and (wt / "a.txt").read_text() == "hello"
    )  # repo content, isolated copy
    head = subprocess.run(
        ["git", "-C", str(wt), "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True,
        text=True,
    ).stdout.strip()
    assert (
        head == "substrate/sess-abc"
    )  # on the session branch, not the repo's working tree
    assert server._session_worktree(repo, "sess-abc")[0] == wt  # idempotent
    # the diff surface: what the agent changed in the worktree — an edit AND a new (write_file'd) file.
    (wt / "a.txt").write_text("changed")
    (wt / "new.py").write_text("print('hi')\n")
    d = server._worktree_diff(wt)
    assert "a.txt" in d["diff"] and "new.py" in d["diff"]  # both surface in the diff
    assert any("new.py" in f for f in d["files"])  # the new file is listed
    # a non-repo path is refused (falls back to a plain session dir at the handler).
    import pytest as _pytest

    with _pytest.raises(ValueError, match="not a git repo"):
        server._session_worktree(tmp_path / "notarepo", "s")


def test_agent_params_parse_and_echo(base: str) -> None:
    # sprint 015: the call parameters are explicit — parsed by _agent_params (unit) and echoed back
    # by /api/agent (contract), so the terminal shows what the server actually applied.
    assert server._agent_params({}) == (False, 0, 300.0)
    assert server._agent_params(
        {"think": ["true"], "max_tokens": ["4096"], "timeout": ["240"]}
    ) == (True, 4096, 240.0)
    assert server._agent_params({"think": ["on"]}) == (True, 0, 300.0)
    res = post(base, "/api/agent?model=deterministic&legacy=true&think=true&max_tokens=123&timeout=240")
    assert res["params"] == {"think": True, "max_tokens": 123, "timeout": 240.0}


def test_models_endpoint_lists_drivers_with_a_default(base: str) -> None:
    # the terminal's model picker: the drivers you can pick — Ollama models (live) + the CLI presets
    # (claude / gemini) + the CI stand-in — with a default (the biggest OSS model if present, else CI).
    d = get(base, "/api/models")
    assert (
        "claude" in d["models"]
        and "gemini" in d["models"]
        and "deterministic" in d["models"]
    )
    assert (
        d["default"] in d["models"]
    )  # the default is always one of the offered options


def test_resume_continues_a_paused_run(base: str) -> None:
    # the other control (ruling C1): demo_resumable PAUSES awaiting ApprovalGranted. Resume injects
    # the event -> the resume Trigger fires the continuation -> finalised, on a COPY so the template
    # stays paused and re-resumable. The continuation actually ran (Stage2Done on the bus).
    assert get(base, "/api/records/demo_resumable/run_graph")["status"] == "paused"
    res = post(base, "/api/resume?record=demo_resumable")
    assert res["status"] == "finalised" and res["resumed"] == "demo_resumable"
    kinds = {e["kind"] for e in get(base, f"/api/records/{res['name']}/events")}
    assert {
        "ApprovalGranted",
        "Stage2Done",
        "substrate.RunFinalised",
    } <= kinds  # the run continued
    assert (
        get(base, "/api/records/demo_resumable/run_graph")["status"] == "paused"
    )  # template untouched


def test_resume_non_resumable_is_404(base: str) -> None:
    with pytest.raises(urllib.error.HTTPError) as exc:
        post(
            base, "/api/resume?record=code_review"
        )  # a finalised, non-resumable record
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
    no_producers = post_json(
        base,
        "/api/validate",
        {"producers": [], "termination": {"kind": "all_completed"}},
    )
    assert no_producers["valid"] is False and "Producer" in no_producers["error"]
    unknown_starts = post_json(
        base,
        "/api/validate",
        {
            "producers": [{"kind": "a", "emits": ["X"], "initial": True}],
            "triggers": [{"id": "t", "on": "X", "starts": "ghost"}],
            "termination": {"kind": "all_completed"},
        },
    )
    assert unknown_starts["valid"] is False and "ghost" in unknown_starts["error"]


def test_build_surfaces_unfired_triggers(base: str) -> None:
    # review #39 finding 3 (honesty edge): the deterministic stub emits each kind ONCE, so a count
    # Predicate above the producer count is UNREACHABLE — the run finalises green having fired nothing
    # past the initials. That must not be silent: /api/build names the authored Trigger that never
    # fired, so the Studio can warn instead of implying the wiring worked.
    res = post_json(
        base,
        "/api/build",
        {
            "name": "unreachable",
            "producers": [
                {"kind": "a", "emits": ["X"], "initial": True},
                {"kind": "b", "emits": ["Y"]},
            ],
            "views": [{"name": "xs", "kind": "KindCount", "of": "X"}],
            "triggers": [
                {
                    "id": "needs_three",
                    "on": "X",
                    "predicate": {"view": "xs", "op": ">=", "n": 3},
                    "starts": "b",
                    "policy": "Once",
                }
            ],
            "termination": {
                "kind": "any_of",
                "members": [
                    {"kind": "all_completed"},
                    {"kind": "quiescence_with_watchdog", "seconds": 1},
                ],
            },
        },
    )
    assert res["status"] == "finalised"  # honestly finalised via quiescence...
    assert res.get("unfired_triggers") == [
        "needs_three"
    ]  # ...but the unfired Trigger is surfaced
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
        "producers": [
            {
                "kind": "rater",
                "emits": ["Verdict"],
                "initial": True,
                "model": True,
                "prompt": "rate this",
            }
        ],
        "termination": {
            "kind": "any_of",
            "members": [
                {"kind": "all_completed"},
                {"kind": "quiescence_with_watchdog", "seconds": 1},
            ],
        },
    }
    res = post_json(base, "/api/build", spec)
    assert res["status"] == "finalised"
    outs = get(base, f"/api/records/{res['name']}/io")["outputs"]
    verdicts = [o for o in outs if o["kind"] == "Verdict"]
    assert len(verdicts) == 1
    expected = DeterministicResponder(seed=0).respond("rate this")
    assert verdicts[0]["payload"]["note"] == expected  # the REAL responder's output...
    assert (
        expected != "rater"
    )  # ...not the stub's note=kind — the responder genuinely ran


def test_ui_imports_only_sanctioned_substrate_surfaces() -> None:
    # review #43: protect the UI->substrate boundary MECHANICALLY. substrate enforces its own kernel/app
    # boundary with a CI gate (import-linter + an AST test); the UI's was convention + a grep. The UI may
    # import ONLY substrate's PUBLIC surfaces — substrate.api, the public reference Responders, the
    # bundled topologies, and the assay PROJECTION readers — never a kernel internal
    # (runtime/sequencer/record/encoding/attach/...).
    #
    # C-3 (2026-08-03): this test used to scan `Path(__file__).parent` == tests/, which holds only this
    # file — so it opened NOTHING it was meant to check and stayed green over an empty scan (Addendum B4:
    # verify the verifier). It now scans the actual UI source at the REPO ROOT. That immediately surfaced
    # server.py's real dependency on `substrate.assay.cells`; `substrate.assay` is added to the sanctioned
    # set as a decision, not a workaround — its `cells` module is a READ-ONLY projection over committed
    # assay result files (read_meta / read_rows / report_from_cells), the same kind of public read surface
    # as records, and the assay VIEW (sprint 013/014) legitimately consumes it. Kernel internals stay out.
    import ast

    # Sprint 054: `substrate.session_registry` joins the sanctioned set. The
    # SessionRegistry primitive moved from substrate-ui into substrate (the
    # library owns the concept; the daemon wraps its process boundary). The
    # UI's session_registry.py is now a re-export shim; it legitimately
    # imports the substrate-side module. `substrate.bundles` is likewise
    # sanctioned — server.py reads bundle manifests through it, same public-
    # read shape as substrate.assay.
    sanctioned = {
        "substrate.api",
        "substrate.reference",
        "substrate.topologies",
        "substrate.assay",
        "substrate.session_registry",
        "substrate.bundles",
    }
    ui_root = Path(__file__).resolve().parent.parent  # the repo root, where the UI source lives
    sources = [p for p in sorted(ui_root.glob("*.py")) if not p.name.startswith("test_")]
    assert sources, "no UI source files found to scan — the boundary test would be vacuous"
    offenders = []
    for py in sources:
        tree = ast.parse(py.read_text(), filename=str(py))
        for node in ast.walk(tree):
            mods: list[str] = []
            if isinstance(node, ast.ImportFrom) and node.module:
                mods = [node.module]
            elif isinstance(node, ast.Import):
                mods = [a.name for a in node.names]
            for m in mods:
                if (
                    m == "substrate" or m.startswith("substrate.")
                ) and m != "substrate":
                    top2 = ".".join(m.split(".")[:2])
                    if top2 not in sanctioned:
                        offenders.append(f"{py.name}: {m}")
    assert not offenders, (
        f"UI reached past substrate's public surfaces into kernel internals: {offenders}"
    )


def test_static_index_is_served(base: str) -> None:
    with urlopen(base + "/", timeout=10) as r:
        body = r.read().decode()
    assert "run console" in body.lower()


def test_authored_route_feeds_a_reading_trigger(tmp_path) -> None:
    # ui-backend-6: a Route stages data into a slot; a Trigger that declares `reads: <slot>` feeds
    # that staged data into the Producer it starts — so an authored Route is CONSUMED, not inert.
    import asyncio  # noqa: PLC0415

    from builder import build_from_spec  # noqa: PLC0415

    from substrate.reference import DeterministicResponder  # noqa: PLC0415

    spec = {
        "name": "route_consumed",
        "producers": [
            {"kind": "Crit", "emits": ["Critique"], "initial": True, "model": False},
            {"kind": "Fixer", "emits": ["Patch"], "model": False},
        ],
        "routes": [{"id": "stage", "of": "Critique", "slot": "crits"}],
        "triggers": [
            {
                "id": "fix",
                "on": "Critique",
                "starts": "Fixer",
                "reads": "crits",
                "policy": "PerEvent",
            }
        ],
        "termination": {"kind": "quiescence_with_watchdog", "seconds": 1},
    }
    topo = build_from_spec(spec, DeterministicResponder(seed=0))
    asyncio.run(api.Runtime(tmp_path / "run").run(topo))

    patches = [
        e["payload"]["note"]
        for e in api.read_record(tmp_path / "run")
        if e["kind"] == "Patch"
    ]
    assert patches, "the Fixer ran on the routed Critique"
    assert (
        "staged" in patches[0]
    )  # the Fixer's input carried the Route's staged data, not just the event


def test_clear_runs_prunes_session_runs_but_keeps_demos_and_fixtures(base: str) -> None:
    # the prune (sprint 012, item C2): POST /api/runs/clear deletes ONLY the hash-suffixed session
    # runs (launch_/build_/resume_); bundled demos + the named demo_* fixtures are KEPT. An EXPLICIT
    # user action, not a silent clobber — so the #35 durability ruling (no SILENT deletion) holds.
    demos_before = {
        r["name"] for r in get(base, "/api/records") if r["source"] == "demo"
    }
    launched = post(base, "/api/launch?topology=game_of_life")["name"]
    assert launched.startswith("launch_")  # a hash-suffixed session run
    res = post(base, "/api/runs/clear")
    assert res["removed"] >= 1
    names_after = {r["name"] for r in get(base, "/api/records")}
    assert launched not in names_after  # the session run was pruned
    assert demos_before <= names_after  # every demo + fixture kept
    assert (
        "demo_failed" in names_after and "game_of_life" in names_after
    )  # fixture + bundled, explicitly
    assert (
        post(base, "/api/launch?topology=game_of_life")["status"] == "finalised"
    )  # launch still works
