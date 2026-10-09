"""Sprint 093c: temp-directory paths never enter the workspace list.

Regression for the 2026-10-01 finding: 61 of 64 rows in the user's
recent-workspaces.json were deleted pytest tmpdirs.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

from substrate import api  # noqa: E402

import server  # noqa: E402


def test_temp_paths_are_classified_by_shape() -> None:
    assert server._is_temp_workspace("/private/var/folders/zy/x/T/pytest-of-u/pytest-442/t0")
    assert server._is_temp_workspace("/tmp/scratch")
    assert server._is_temp_workspace(tempfile.gettempdir() + "/anything")
    assert server._is_temp_workspace("/Users/someone/work/pytest-of-someone/pytest-1/x")
    assert not server._is_temp_workspace("/Users/someone/Documents/project")


def test_state_root_paths_are_exempt() -> None:
    # The conftest points SUBSTRATE_HOME at a temp dir; its sandbox is real for the run.
    assert not server._is_temp_workspace(str(api.substrate_home() / "sandbox"))


def test_remember_workspace_refuses_temp_paths(tmp_path: Path) -> None:
    file = api.substrate_home() / "recent-workspaces.json"
    before = file.read_bytes() if file.exists() else None
    server._remember_workspace(str(tmp_path))
    after = file.read_bytes() if file.exists() else None
    assert before == after


def test_recent_workspaces_hides_stored_temp_rows(app: server.App, tmp_path: Path) -> None:
    real = Path(__file__).resolve().parent.parent  # the repo: exists, never a temp dir
    file = api.substrate_home() / "recent-workspaces.json"
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(
        json.dumps(
            [
                {"path": str(tmp_path), "shape": "path"},
                {"path": str(real), "shape": "path"},
            ]
        )
    )
    try:
        paths = [row["path"] for row in server._recent_workspaces(app)]
    finally:
        file.unlink()
    assert str(tmp_path) not in paths
    assert str(real) in paths


def test_relative_paths_are_refused_and_hidden(app: server.App, tmp_path: Path) -> None:
    file = api.substrate_home() / "recent-workspaces.json"
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps([{"path": ".", "shape": "path"}]))
    try:
        assert "." not in [row["path"] for row in server._recent_workspaces(app)]
        server._remember_workspace("relative/dir")
        assert "relative/dir" not in file.read_text()
    finally:
        file.unlink()
