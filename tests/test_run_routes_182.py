"""UI sprint 182: the caller's runs over HTTP. `GET /api/session/<id>/runs` lists them and
`POST /api/session/<id>/runs/<run_id>/stop` stops one. The run here is a build whose model is a
stand-in CLI that sleeps, so the run is still working when the stop arrives."""

from __future__ import annotations

import sys
import time
from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402

import server  # noqa: E402

# A CLI that sleeps before it answers, so the build is still running when it is stopped.
_SLEEPS = [
    sys.executable,
    "-c",
    "import json, time; time.sleep(30); print(json.dumps({'type': 'result', 'result': 'late', 'usage': {}}))",
]


def test_the_caller_lists_and_stops_a_running_build(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from substrate.app import build, run_hold, workspace

    sb = tmp_path / "sessions"
    sb.mkdir()
    monkeypatch.setattr(server, "_sessions_base", lambda: sb)
    monkeypatch.setattr(server, "_cli_command", lambda app, name, version=None: list(_SLEEPS))
    app.install_registry(base=sb)
    repo = tmp_path / "repo"
    repo.mkdir()
    (repo / "a.py").write_text("x = 1\n")
    workspace.ensure_repository(repo)
    caller = app.registry.create(
        session_id="s_caller_182", name=None, driver="claude", workspace=str(repo),
        workspace_shape="flat", bundle=None, seed="",
    )
    run_id, _branch = server._start_build(app, caller, build.Card(task="look at a.py"))
    with serving(app) as base:
        status, body = call("GET", f"{base}/api/session/s_caller_182/runs")
        assert status == 200 and body["runs"][0]["run_id"] == run_id and body["runs"][0]["running"]
        status, body = call("POST", f"{base}/api/session/s_caller_182/runs/{run_id}/stop", {})
        assert status == 200, body
        deadline = time.monotonic() + 20
        while run_hold.TABLE.running("s_caller_182", run_id):
            assert time.monotonic() < deadline, "the stop did not end the build"
            time.sleep(0.05)
        status, body = call("GET", f"{base}/api/session/s_caller_182/runs")
        assert body["runs"][0]["outcome"] == "stopped"
        status, body = call("POST", f"{base}/api/session/s_caller_182/runs/r_none/stop", {})
        assert status == 404
    (ended,) = run_hold.TABLE.drain_ended("s_caller_182")
    assert ended.outcome.value == "stopped"
