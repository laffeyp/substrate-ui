"""End-to-end tests for the substrate-ui read-API server — the seam, exercised for REAL.

Starts the actual server on an ephemeral port in a thread, hits it over HTTP with urllib, and
asserts the JSON it serves matches the runtime's own projections (the seam serves
`substrate.api` faithfully — no distortion, no invented data). This is the production data
contract under test; it runs under `npm run test:py`.
"""

from __future__ import annotations

import json
from pathlib import Path
from urllib.request import urlopen

import pytest
from _serving import call, serving  # noqa: E402
from substrate import api  # noqa: E402
from substrate.topologies import bundled  # noqa: E402

import server  # noqa: E402  the module under test


@pytest.fixture
def base(app: server.App) -> object:
    """A server per test, serving the test's own App (UI sprint 111)."""
    with serving(app) as base:
        yield base


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
        cross["divergence"]["seq"] == 0 and cross["divergence"]["kind_a"] == "substrate.RunStarted"
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
    assert cr["input"] is None  # no runtime seed (parameterized at build), honestly null
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
    assert all("seq" in o for o in cr["outputs"])  # every artifact cites its producing seq


def test_unknown_record_is_404(base: str) -> None:
    assert call("GET", base + "/api/records/does_not_exist/run_graph")[0] == 404


def _finished(base: str, name: str) -> dict:
    """A launch is backgrounded (review #35) and returns once RunStarted is on the record; poll
    its run_graph until the run reaches a terminal. UI sprint 107: three tests read the status
    straight after the launch call and passed only when the run won the race (CI lost it)."""
    import time

    deadline = time.monotonic() + 30
    while True:
        g = get(base, f"/api/records/{name}/run_graph")
        if g["status"] != "incomplete" or time.monotonic() > deadline:
            return g
        time.sleep(0.05)


def _topology_run(app: server.App, base: str, await_completion: bool = True) -> dict:
    """One deterministic best_of_n_verified run through POST /api/topology/<name>/run, with the
    application catalog loaded into the test's App first."""
    from substrate.topologies.applications.registry import load_manifests

    app.applications = load_manifests()
    return post_json(
        base,
        "/api/topology/best_of_n_verified/run",
        {
            "inputs": {
                "task": "double 3",
                "drafter_model": "deterministic",
                "verify_model": "deterministic",
                "n": 2,
                "max_rounds": 1,
            },
            "await_completion": await_completion,
        },
    )


def test_run_graph_reports_server_authoritative_liveness(
    app: server.App, base: str, monkeypatch
) -> None:
    """review #36: the server spawned a topology run, so it knows whether it is still being
    written. run_graph carries `live`: True while the run's thread is alive, False once it is not.
    A static record and a torn record (no terminal, nothing writing it) are never live."""
    import threading

    done = _topology_run(app, base)
    name = Path(done["record_root"]).stem
    release = threading.Event()
    writer = threading.Thread(target=release.wait, daemon=True)
    writer.start()
    monkeypatch.setitem(
        app.topology_runs,
        name,
        {"thread": writer, "started_at": 0.0, "record_root": done["record_root"]},
    )
    assert get(base, f"/api/records/{name}/run_graph")["live"] is True
    release.set()
    writer.join(timeout=5)
    assert get(base, f"/api/records/{name}/run_graph")["live"] is False
    assert get(base, "/api/records/code_review/run_graph")["live"] is False
    torn = get(base, "/api/records/demo_torn/run_graph")
    assert torn["status"] == "incomplete" and torn["live"] is False


def test_topology_runs_are_records_with_their_real_status(app: server.App, base: str) -> None:
    """Lens audit F295/F296: a topology run is `<run_id>.record` under runs/, listed by
    /api/records and served by name; the response carries the run's own status."""
    done = _topology_run(app, base)
    name = Path(done["record_root"]).stem
    assert done["record_root"].endswith(".record")
    assert name in {r["name"] for r in get(base, "/api/records")}
    graph = get(base, f"/api/records/{name}/run_graph")
    assert done["status"] == graph["status"]


def test_session_worktree_isolates_a_session_on_a_branch(tmp_path, monkeypatch) -> None:
    # B: git-worktree-per-session. Driving against a repo puts the session in its OWN worktree — a
    # checkout on branch substrate/<session>, adjacent to the repo, so the agent works isolated from the
    # user's working tree and its changes are a diffable branch. Idempotent. (Base monkeypatched so it
    # doesn't pollute ~/.substrate.)
    import subprocess

    import server

    _sb = tmp_path / "sessions"
    monkeypatch.setattr(server, "_sessions_base", lambda: _sb)
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
    assert wt.is_dir() and (wt / "a.txt").read_text() == "hello"  # repo content, isolated copy
    head = subprocess.run(
        ["git", "-C", str(wt), "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True,
        text=True,
    ).stdout.strip()
    assert head == "substrate/sess-abc"  # on the session branch, not the repo's working tree
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


def test_models_endpoint_lists_drivers_with_a_default(
    base: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The model picker's roster: Ollama models + the CI stand-in under `models`, installed CLI
    drivers under `cli`, and a default drawn from them.

    UI sprint 107: the test ran against the host. `/api/models` asked the real Ollama for its
    tags and ran every installed CLI's model listing (`cursor-agent --list-models` rewrote
    ~/.cursor/cli-config.json on each run), so what it checked depended on the machine. It now
    fixes the machine: one CLI on PATH, two Ollama tags, a canned version tree. That also lets it
    check the default rule, which a host-dependent run could not."""
    import io
    import shutil
    import urllib.request

    real_urlopen = urllib.request.urlopen

    def fake_urlopen(req: object, *a: object, **k: object) -> object:
        url = req if isinstance(req, str) else getattr(req, "full_url", "")
        if str(url).startswith("http://localhost:11434/"):
            return io.BytesIO(b'{"models":[{"name":"llama3:8b"},{"name":"kimi-k2.7-code:cloud"}]}')
        return real_urlopen(req, *a, **k)  # type: ignore[arg-type]

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(
        shutil, "which", lambda cmd, *a, **k: "/bin/x" if cmd == "cursor-agent" else None
    )
    monkeypatch.setattr(
        server,
        "_probe_cli_versions",
        lambda app, name: {
            "families": [{"family": "auto", "models": ["auto"]}],
            "source": "curated",
        },
    )

    d = get(base, "/api/models")
    assert d["cli"] == ["cursor-agent"]
    assert d["models"] == ["kimi-k2.7-code:cloud", "llama3:8b", "cursor-agent", "deterministic"]
    assert (d["ollama_cloud"], d["ollama_local"]) == (["kimi-k2.7-code:cloud"], ["llama3:8b"])
    assert d["default"] == "kimi-k2.7-code:cloud", "a verified-agentic cloud tag wins the default"
    assert set(d["cli_versions"]) == {"cursor-agent"}


def test_ui_imports_only_sanctioned_substrate_surfaces() -> None:
    # review #43: protect the UI->substrate boundary MECHANICALLY. substrate enforces its own kernel/app
    # boundary with a CI gate (import-linter + an AST test); the UI's was convention + a grep. The UI may
    # import ONLY substrate's PUBLIC surfaces — substrate.api, substrate.app, the Responders in
    # substrate.adapters, the bundled topologies, and the assay PROJECTION readers — never a kernel
    # internal (runtime/sequencer/record/encoding/attach/...).
    #
    # C-3 (2026-08-03): this test used to scan `Path(__file__).parent` == tests/, which holds only this
    # file — so it opened NOTHING it was meant to check and stayed green over an empty scan (Addendum B4:
    # verify the verifier). It now scans the actual UI source at the REPO ROOT. That immediately surfaced
    # server.py's real dependency on `substrate.assay.cells`; `substrate.assay` is added to the sanctioned
    # set as a decision, not a workaround — its `cells` module is a READ-ONLY projection over committed
    # assay result files (read_meta / read_rows / report_from_cells), the same kind of public read surface
    # as records, and the assay VIEW (sprint 013/014) legitimately consumes it. Kernel internals stay out.
    import ast

    sanctioned = {
        "substrate.api",
        "substrate.app",
        "substrate.adapters",
        "substrate.topologies",
        "substrate.assay",
    }
    ui_root = Path(__file__).resolve().parent.parent  # the repo root, where the UI source lives
    # The repo-root modules and scripts/ (lens audit F420: scripts/gen_kinds.py imported
    # substrate.constants, unseen because only the root was scanned).
    sources = [
        p
        for p in [*sorted(ui_root.glob("*.py")), *sorted((ui_root / "scripts").glob("*.py"))]
        if not p.name.startswith("test_")
    ]
    assert sources, "no UI source files found to scan — the boundary test would be vacuous"
    offenders = []
    for py in sources:
        tree = ast.parse(py.read_text(), filename=str(py))
        for node in ast.walk(tree):
            mods: list[str] = []
            if isinstance(node, ast.ImportFrom) and node.module:
                mods = [node.module]
                # UI sprint 107: a private NAME is a kernel internal too, even from a sanctioned
                # module, and `from substrate import _x` passed the module check below
                # (`substrate._daemon`, `delegate._prefix_context_slice` both did).
                if node.module == "substrate" or node.module.startswith("substrate."):
                    offenders += [
                        f"{py.name}: {node.module}.{a.name}"
                        for a in node.names
                        if a.name.startswith("_")
                    ]
            elif isinstance(node, ast.Import):
                mods = [a.name for a in node.names]
            for m in mods:
                if (m == "substrate" or m.startswith("substrate.")) and m != "substrate":
                    top2 = ".".join(m.split(".")[:2])
                    if top2 not in sanctioned:
                        offenders.append(f"{py.name}: {m}")
    assert not offenders, (
        f"UI reached past substrate's public surfaces into kernel internals: {offenders}"
    )


def test_static_index_is_served(base: str) -> None:
    with urlopen(base + "/", timeout=10) as r:
        body = r.read().decode()
    # `/` serves the reveal shell (the classic "run console" retired to _deprecated/ on 2026-09-22).
    assert "<title>substrate · reveal</title>" in body


def test_clear_runs_prunes_generated_runs_but_keeps_demos_and_fixtures(
    app: server.App, base: str
) -> None:
    # the prune (sprint 012, item C2): POST /api/runs/clear deletes ONLY generated runs (s_topo_
    # topology runs; launch_/build_/resume_ records from before 2026-10-08); bundled demos and the
    # named demo_* fixtures are KEPT. An explicit user action, not a silent clobber.
    demos_before = {r["name"] for r in get(base, "/api/records") if r["source"] == "demo"}
    generated = Path(_topology_run(app, base)["record_root"]).stem
    assert generated.startswith("s_topo_")
    res = post(base, "/api/runs/clear")
    assert res["removed"] >= 1
    names_after = {r["name"] for r in get(base, "/api/records")}
    assert generated not in names_after
    assert demos_before <= names_after
    assert "demo_failed" in names_after and "game_of_life" in names_after
