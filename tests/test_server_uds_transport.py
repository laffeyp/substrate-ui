"""Sprint 217e — daemon binds a UDS listener alongside TCP.

TECH-SPEC §6 names `~/.substrate/daemon.sock` as the primary transport; TCP
`127.0.0.1:8765` is the fallback. This sprint adds the UDS listener. The
CLI tries UDS first and falls back to TCP.

These tests bind BOTH listeners and verify each independently. The UDS path
is overridden via `SUBSTRATE_DAEMON_SOCK` so the tests do not touch the real
`~/.substrate/daemon.sock`.

"""

from __future__ import annotations

import http.client
import json
import socket
import threading
from pathlib import Path

import pytest

import server  # noqa: E402


class _UnixHTTPConnection(http.client.HTTPConnection):
    """http.client over a Unix socket. Passes the socket path in place of a
    host; connects via socket.AF_UNIX instead of AF_INET."""

    def __init__(self, socket_path: str) -> None:
        super().__init__("localhost")
        self._socket_path = socket_path

    def connect(self) -> None:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.connect(self._socket_path)
        self.sock = s


@pytest.fixture
def dual_transport(app: server.App, tmp_path: Path) -> tuple[str, str]:
    """Bind TCP + UDS. Return (tcp_base_url, uds_socket_path). Uses `/tmp` for
    the socket path because macOS caps AF_UNIX paths at ~104 chars and
    `tmp_path` is longer than that. Registry base stays on `tmp_path`; only
    the socket file goes to a short path."""
    import uuid

    app.install_registry(base=tmp_path)
    tcp_srv = server.AppHTTPServer(("127.0.0.1", 0), app)
    threading.Thread(target=tcp_srv.serve_forever, daemon=True).start()
    uds_path = Path(f"/tmp/substrate-test-{uuid.uuid4().hex[:8]}.sock")
    try:
        uds_path.unlink()
    except FileNotFoundError:
        pass
    uds_srv = server._UnixHTTPServer(str(uds_path), app)
    threading.Thread(target=uds_srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{tcp_srv.server_address[1]}", str(uds_path)
    tcp_srv.shutdown()
    tcp_srv.server_close()
    uds_srv.shutdown()
    uds_srv.server_close()
    try:
        uds_path.unlink()
    except FileNotFoundError:
        pass


def _uds_post_json(socket_path: str, path: str, body: dict) -> tuple[int, dict]:
    conn = _UnixHTTPConnection(socket_path)
    try:
        conn.request(
            "POST",
            path,
            body=json.dumps(body),
            headers={"Content-Type": "application/json"},
        )
        resp = conn.getresponse()
        raw = resp.read()
        return resp.status, (json.loads(raw) if raw else {})
    finally:
        conn.close()


def _uds_get(socket_path: str, path: str) -> tuple[int, dict]:
    conn = _UnixHTTPConnection(socket_path)
    try:
        conn.request("GET", path)
        resp = conn.getresponse()
        raw = resp.read()
        return resp.status, (json.loads(raw) if raw else {})
    finally:
        conn.close()


def test_uds_socket_file_exists_after_bind(dual_transport: tuple[str, str]) -> None:
    _tcp, uds_path = dual_transport
    assert Path(uds_path).exists()
    # It's a socket, not a regular file.
    st = Path(uds_path).stat()
    assert (st.st_mode & 0o170000) == 0o140000  # S_IFSOCK


def test_uds_post_create_session_succeeds(dual_transport: tuple[str, str]) -> None:
    """Client posts to UDS; daemon creates the session through the same handler."""
    _tcp, uds_path = dual_transport
    status, body = _uds_post_json(uds_path, "/api/session", {"driver": "deterministic"})
    assert status == 200
    assert body["session_id"].startswith("s_")


def test_tcp_still_works_alongside_uds(dual_transport: tuple[str, str]) -> None:
    """Adding UDS does not disturb TCP. The list endpoint returns the same
    bucketed shape regardless of transport."""
    tcp_url, uds_path = dual_transport
    _uds_post_json(uds_path, "/api/session", {"driver": "deterministic", "name": "uds-created"})
    # Read back via TCP.
    from urllib.request import urlopen

    with urlopen(tcp_url + "/api/session", timeout=10) as r:
        body = json.loads(r.read())
    ids = [entry["session_id"] for entry in body["live"] + body["parked"]]
    assert any(sid.startswith("s_") for sid in ids)
    # Same catalog from UDS:
    _status, uds_body = _uds_get(uds_path, "/api/session")
    uds_ids = [entry["session_id"] for entry in uds_body["live"] + uds_body["parked"]]
    assert set(ids) == set(uds_ids)
