"""Sprint 115: a one-shot application's CLI roles run in the run's folder, not the server's.

The CLI is a stand-in that prints its working directory. A reviewer (kernel K320) runs in its own
worktree of the repository under review; best_of_n_verified's roles run in a folder the launcher makes for the run and removes when
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

# Prints its working directory as a Claude Code stream would end (UI sprint 129: the claude
# profile reads `--output-format stream-json`, whose closing `result` event is the reply).
_PWD = [
    sys.executable,
    "-c",
    "import json, os; print(json.dumps({'type': 'result', 'result': os.getcwd(), 'usage': {}}))",
]


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


def test_each_reviewer_runs_in_its_own_worktree(
    app: server.App, tmp_path: Path, built: list[tuple[str, Any]], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Kernel K320 replaced the `code_review` application with Review: a session's reviewers each
    run on the session's model in a worktree of the session's repository at the target."""
    import subprocess
    import time
    from types import SimpleNamespace

    from substrate.app import run_hold, workspace

    sb = tmp_path / "sessions"
    monkeypatch.setattr(server, "_sessions_base", lambda: sb)
    repo = tmp_path / "repo"
    repo.mkdir()
    (repo / "a.py").write_text("x = 1\n")
    workspace.ensure_repository(repo)
    git = ["git", "-C", str(repo), "-c", "user.name=t", "-c", "user.email=t@t"]
    subprocess.run([*git, "checkout", "-qb", "feature"], check=True)
    (repo / "a.py").write_text("x = 2\n")
    subprocess.run([*git, "commit", "-qam", "feature"], check=True)
    subprocess.run([*git, "checkout", "-q", "-"], check=True)
    manifest = SimpleNamespace(
        driver="claude", driver_params=None, workspace=str(repo), session_id="s_rev_115"
    )
    run_ids = server._start_review(app, manifest, "feature", ["defects", "design"], "")
    deadline = time.monotonic() + 60
    while any(run_hold.TABLE.running("s_rev_115", rid) for rid in run_ids):
        assert time.monotonic() < deadline, "the reviews did not end"
        time.sleep(0.05)
    ended = {e.run_id: e for e in run_hold.TABLE.drain_ended("s_rev_115")}
    for rid in run_ids:
        wt = (sb / "wt" / rid).resolve()
        report = ended[rid].report
        assert Path(report.done.strip()).resolve() == wt  # the stand-in printed its cwd
        # K322: the stand-in also judges the review's statement, and a printed path answers none.
        (statement,) = report.checks
        assert ended[rid].outcome.value == "stuck" and statement.passed is False
        assert statement.note == "the judge's reply did not answer S1"
    assert {Path(r._cwd).resolve() for _, r in built} >= {
        (sb / "wt" / rid).resolve() for rid in run_ids
    }


def test_a_build_runs_in_its_own_worktree_on_its_own_branch(
    app: server.App, tmp_path: Path, built: list[tuple[str, Any]], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Kernel K321: a session's build works its card on the session's model in a new worktree and
    branch of the session's repository; the repository's own branch does not move."""
    import subprocess
    import time
    from types import SimpleNamespace

    from substrate.app import build, run_hold, workspace

    sb = tmp_path / "sessions"
    monkeypatch.setattr(server, "_sessions_base", lambda: sb)
    repo = tmp_path / "repo"
    repo.mkdir()
    (repo / "a.py").write_text("x = 1\n")
    workspace.ensure_repository(repo)
    manifest = SimpleNamespace(
        driver="claude",
        driver_params=None,
        workspace=str(repo),
        session_id="s_build_115",
        bundle=None,
    )
    card = build.card_from_form({"what": "look", "where": ["a.py"], "commands": ["true"]}, repo)
    run_id, branch = server._start_build(app, manifest, card)
    deadline = time.monotonic() + 60
    while run_hold.TABLE.running("s_build_115", run_id):
        assert time.monotonic() < deadline, "the build did not end"
        time.sleep(0.05)
    (ended,) = run_hold.TABLE.drain_ended("s_build_115")
    wt = (sb / "wt" / run_id).resolve()
    assert ended.outcome.value == "done" and ended.report.branch == branch
    assert Path(ended.report.done.strip()).resolve() == wt  # the stand-in printed its cwd
    assert wt in {Path(r._cwd).resolve() for _, r in built}
    git = ["git", "-C", str(repo)]
    branches = subprocess.run(
        [*git, "branch", "--format=%(refname:short)"], capture_output=True, text=True, check=True
    ).stdout.split()
    current = subprocess.run(
        [*git, "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, check=True
    ).stdout.strip()
    assert branch in branches and current != branch


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
