"""Sprint 115: a one-shot application's CLI roles run in the run's folder, not the server's.

The CLI is a stand-in that prints its working directory. code_review's roles run in the repo under
review; best_of_n_verified's roles run in a folder the launcher makes for the run and removes when
the run ends. Before the sprint every role ran in the server's directory.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

import pytest
from _serving import call, serving  # noqa: E402
from substrate.topologies.applications.registry import load_manifests  # noqa: E402

import server  # noqa: E402

_PWD = [sys.executable, "-c", "import os; print(os.getcwd())"]


@pytest.fixture
def built(monkeypatch: pytest.MonkeyPatch) -> list[tuple[str, Any]]:
    """Every (driver name, responder) the launcher builds, through the real resolver."""
    monkeypatch.setattr(server, "_cli_command", lambda app, name, version=None: list(_PWD))
    real = server._daemon_driver_resolver
    seen: list[tuple[str, Any]] = []

    def spy(app: server.App, name: str, params: Any = None, **kw: Any) -> Any:
        responder = real(app, name, params, **kw)
        seen.append((name, responder))
        return responder

    monkeypatch.setattr(server, "_daemon_driver_resolver", spy)
    return seen


def test_code_review_roles_run_in_the_repo(
    app: server.App, tmp_path: Path, built: list[tuple[str, Any]], monkeypatch: pytest.MonkeyPatch
) -> None:
    repo = tmp_path / "repo"
    repo.mkdir()
    from substrate.topologies.applications import fanout_review
    from substrate.topologies.code_review import DEFAULT_ROLES

    # The topology reads the repo's diff at build time; the roles' folder is what is under test.
    monkeypatch.setattr(fanout_review, "fanout_review_topology", lambda **kw: None)

    inputs: dict[str, Any] = {"repo": str(repo), "judge_model": "claude"}
    inputs.update({f"{role}_model": "claude" for role in DEFAULT_ROLES})
    server._build_code_review_from_inputs(app, inputs, tmp_path / "unused")
    assert built
    assert {Path(r.respond("pwd")) for _, r in built} == {repo.resolve()}


def test_best_of_n_roles_run_in_a_run_folder_removed_after(
    app: server.App, tmp_path: Path, built: list[tuple[str, Any]], monkeypatch: pytest.MonkeyPatch
) -> None:
    sb = tmp_path / "sessions"
    monkeypatch.setattr(server, "_sessions_base", lambda: sb)
    sb.mkdir()
    app.install_registry(base=sb)
    app.applications = load_manifests()
    app.topology_runs = {}
    with serving(app) as base:
        status, body = call(
            "POST",
            base + "/api/topology/best_of_n_verified/run",
            {
                "inputs": {
                    "task": "say hi",
                    "drafter_model": "claude",
                    "verify_model": "claude",
                    "n": 1,
                    "max_rounds": 1,
                }
            },
            timeout=60,
        )
    assert status == 200, body
    folders = {Path(r._cwd) for _, r in built}
    assert len(folders) == 1, folders
    (folder,) = folders
    assert folder.resolve() != Path(os.getcwd()).resolve()
    assert not folder.exists(), "the run folder outlived the run"
