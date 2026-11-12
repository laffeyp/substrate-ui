# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 497: a session's workspace can stay a plain folder (kernel K349).

`POST /api/session` with `make_repository: false` leaves a folder that is not inside a repository
without `.git`; the session runs a turn there. Absent, the folder is made a repository, as before.
"""

from __future__ import annotations

from pathlib import Path

import server
from _serving import call, serving


def _folder_of_repositories(tmp_path: Path) -> Path:
    root = tmp_path / "projects"
    (root / "one" / ".git").mkdir(parents=True)
    (root / "notes.md").write_text("loose material\n")
    return root


def test_a_plain_folder_stays_plain(app: server.App, tmp_path: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    root = _folder_of_repositories(tmp_path)
    with serving(app) as base:
        status, body = call(
            "POST",
            base + "/api/session",
            {"driver": "deterministic", "workspace": str(root), "make_repository": False},
        )
        assert status == 200, body
        sid = str(body["session_id"])
        status, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "hello"})
        assert status == 200, body
    assert not (root / ".git").exists()
    assert sorted(p.name for p in root.iterdir()) == ["notes.md", "one"]
    assert app.registry.get(sid).workspace == str(root.resolve())  # type: ignore[union-attr]


def test_the_default_still_makes_a_repository(app: server.App, tmp_path: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    root = tmp_path / "plain"
    root.mkdir()
    with serving(app) as base:
        status, body = call(
            "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(root)}
        )
        assert status == 200, body
    assert (root / ".git").is_dir()


def test_make_repository_must_be_a_bool(app: server.App, tmp_path: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    root = _folder_of_repositories(tmp_path)
    with serving(app) as base:
        status, body = call(
            "POST",
            base + "/api/session",
            {"driver": "deterministic", "workspace": str(root), "make_repository": "no"},
        )
    assert status == 400 and "make_repository must be a bool" in str(body)
    assert not (root / ".git").exists()
