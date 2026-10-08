"""UI sprint 110: the local server's security boundary.

The audit probed a private server (2026-10-08): a POST carrying `Host: evil.test` and `Origin:
http://evil.test`, the shape a DNS-rebound page sends, created a bash-capable session; a GET of
`/api/worktree_diff` changed an arbitrary repository's git index. Each probe is a test here.
Sources: Jackson et al., *Protecting Browsers from DNS Rebinding Attacks* (reject unexpected Host
headers); RFC 9110 §9.2.1 (GET is safe).
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest
from _serving import call, call_raw, serving  # noqa: E402
from substrate.session_registry import SessionRegistry  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> str:
    monkeypatch.setattr(
        server,
        "_SESSION_REGISTRY",
        SessionRegistry(
            base=tmp_path / "sessions",
            session_topology_factory=server._build_session_topology_from_manifest,
        ),
    )
    monkeypatch.setattr(server, "_sessions_base", lambda: tmp_path / "sessions")
    with serving() as url:
        yield url


def _port(url: str) -> str:
    return url.rsplit(":", 1)[1]


def test_a_foreign_host_is_refused_on_every_method(base: str) -> None:
    evil = {"Host": f"evil.test:{_port(base)}"}
    for method, path, body in (
        ("GET", "/api/models", None),
        ("POST", "/api/session", {"driver": "deterministic"}),
        ("PATCH", "/api/session/s_x", {"name": "x"}),
        ("DELETE", "/api/session/s_x", None),
    ):
        status, payload = call(method, base + path, body, headers=evil)
        assert status == 403, (method, status, payload)
        assert "Host" in payload["error"]


def test_the_dns_rebinding_shape_creates_no_session(base: str) -> None:
    port = _port(base)
    status, _ = call(
        "POST",
        base + "/api/session",
        {"driver": "deterministic"},
        headers={"Host": f"evil.test:{port}", "Origin": f"http://evil.test:{port}"},
    )
    assert status == 403
    assert server._SESSION_REGISTRY.list_all() == []


def test_loopback_hosts_on_the_bound_port_pass(base: str) -> None:
    port = _port(base)
    for host in (f"127.0.0.1:{port}", f"localhost:{port}"):
        assert call("GET", base + "/api/models", headers={"Host": host})[0] == 200


def test_a_foreign_origin_is_refused_and_a_same_origin_one_passes(base: str) -> None:
    port = _port(base)
    host = f"127.0.0.1:{port}"
    assert call("GET", base + "/api/models", headers={"Origin": "http://evil.test"})[0] == 403
    status, _ = call(
        "POST",
        base + "/api/session",
        {"driver": "deterministic"},
        headers={"Origin": "http://evil.test"},
    )
    assert status == 403
    status, body = call(
        "POST",
        base + "/api/session",
        {"driver": "deterministic"},
        headers={"Host": host, "Origin": f"http://{host}"},
    )
    assert status == 200, body


def test_a_body_over_the_cap_is_413(base: str) -> None:
    status, _ = call_raw(
        "POST",
        base + "/api/session",
        None,
        headers={"Content-Length": str(server._MAX_BODY_BYTES + 1)},
    )
    assert status == 413


def _git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), *args], check=True, capture_output=True, text=True
    ).stdout


def _repo(path: Path) -> Path:
    path.mkdir(parents=True)
    _git(path, "init", "-q")
    _git(path, "config", "user.email", "t@t")
    _git(path, "config", "user.name", "t")
    (path / "a.txt").write_text("a\n")
    _git(path, "add", "-A")
    _git(path, "commit", "-qm", "init")
    return path


def test_worktree_diff_refuses_a_repository_outside_the_session_worktrees(
    base: str, tmp_path: Path
) -> None:
    repo = _repo(tmp_path / "elsewhere")
    (repo / "untracked.txt").write_text("secret\n")
    before = _git(repo, "status", "--porcelain")
    status, body = call("GET", base + f"/api/worktree_diff?path={repo}")
    assert body["diff"] == "" and "not a session worktree" in body["error"]
    assert _git(repo, "status", "--porcelain") == before == "?? untracked.txt\n"


def test_worktree_diff_shows_new_files_without_writing_the_index(base: str, tmp_path: Path) -> None:
    repo = _repo(tmp_path / "repo")
    wt, _branch = server._session_worktree(repo, "s_sec")
    (wt / "new.py").write_text("print('hi')\n")
    (wt / "a.txt").write_text("changed\n")
    before = _git(wt, "status", "--porcelain")
    status, body = call("GET", base + f"/api/worktree_diff?path={wt}")
    assert status == 200
    assert "new.py" in body["diff"] and "a.txt" in body["diff"]
    assert _git(wt, "status", "--porcelain") == before  # ?? new.py stays untracked


def test_bundle_and_role_names_are_one_path_component(base: str) -> None:
    status, body = call(
        "POST", base + "/api/session", {"driver": "deterministic", "role": "../escape"}
    )
    assert status == 400, body
    status, created = call("POST", base + "/api/session", {"driver": "deterministic"})
    assert status == 200
    sid = created["session_id"]
    status, body = call("PATCH", base + f"/api/session/{sid}", {"bundle": "../../etc"})
    assert status == 400, body


def test_records_by_path_no_longer_serves_tmp(base: str, tmp_path: Path) -> None:
    rec = Path("/tmp") / f"substrate-sec-{tmp_path.name}.record"
    rec.mkdir(exist_ok=True)
    try:
        status, _ = call("GET", base + f"/api/records/by-path/events?path={rec}")
        assert status in (403, 404)
        assert status != 200
    finally:
        rec.rmdir()


def test_a_request_cannot_name_its_own_cli_argv(base: str) -> None:
    marker = Path("/tmp/pwned-110")
    marker.unlink(missing_ok=True)
    call("POST", base + f"/api/agent?legacy=true&model=cli&command=/usr/bin/touch%20{marker}")
    assert not marker.exists(), "the request's own argv ran"


def test_a_closed_login_pty_leaves_the_table() -> None:
    proc = subprocess.Popen(["sleep", "30"], start_new_session=True)
    sid = "pty_test_110"
    with server._CLI_PTY_LOCK:
        server._CLI_PTY_SESSIONS[sid] = {"proc": proc, "cli": "claude"}
    try:
        assert server._cli_pty_close(sid) is True
        assert sid not in server._CLI_PTY_SESSIONS
        assert server._cli_pty_close(sid) is False
        proc.wait(timeout=5)
    finally:
        if proc.poll() is None:
            proc.kill()
