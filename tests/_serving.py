"""One in-process console server per test (UI sprint 107).

32 test files carried the same four lines to serve `server.Handler` on an ephemeral port, and every
copy stopped the serve loop without closing the listening socket (`socketserver` documents both:
`shutdown()` stops `serve_forever`, `server_close()` releases the socket). This is the one copy.
"""

from __future__ import annotations

import json
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

import server  # noqa: E402


@contextmanager
def serving(app: server.App) -> Iterator[str]:
    """Serve `app` on 127.0.0.1:<ephemeral>; yield its base URL; stop and close it."""
    srv = server.AppHTTPServer(("127.0.0.1", 0), app)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        yield f"http://127.0.0.1:{srv.server_address[1]}"
    finally:
        srv.shutdown()
        srv.server_close()


def call_raw(
    method: str,
    url: str,
    body: object = None,
    *,
    headers: dict[str, str] | None = None,
    timeout: float = 30,
) -> tuple[int, bytes]:
    """One HTTP request; returns `(status, body bytes)` for any status, and closes the response
    either way. UI sprint 107: 37 copies of five helpers did this nine ways, and every one that
    caught `HTTPError` left the error's response open (ResourceWarning under `-W default`)."""
    from urllib.error import HTTPError
    from urllib.request import Request, urlopen

    hdrs = dict(headers or {})
    data: bytes | None = None
    if body is not None:
        data = json.dumps(body).encode()
        hdrs["Content-Type"] = "application/json"
    elif method in ("POST", "PATCH", "PUT"):
        data = b""
    try:
        with urlopen(Request(url, data=data, method=method, headers=hdrs), timeout=timeout) as r:
            return r.status, r.read()
    except HTTPError as exc:
        with exc:
            return exc.code, exc.read()


def call(
    method: str,
    url: str,
    body: object = None,
    *,
    headers: dict[str, str] | None = None,
    timeout: float = 30,
) -> tuple[int, Any]:
    """`call_raw`, with the body parsed as JSON: `{}` when empty, `{"raw": text}` when not JSON."""
    status, raw = call_raw(method, url, body, headers=headers, timeout=timeout)
    if not raw:
        return status, {}
    try:
        return status, json.loads(raw)
    except json.JSONDecodeError:
        return status, {"raw": raw.decode(errors="replace")}


def scratch_ws(name: str) -> str:
    """A workspace path inside this run's temporary HOME (tests/conftest.py), removed with it.
    Lens audit F426: tests named shared paths such as /tmp/w and /tmp/reviewer."""
    import os

    return os.path.join(os.environ["HOME"], "workspaces", name)


def record_tail_seq(record_root: Path) -> int:
    """The highest seq on a record, or -1 when it has none yet."""
    from substrate import api

    if not record_root.exists():
        return -1
    return max((int(e["seq"]) for e in api.read_record(record_root)), default=-1)


def wait_model_started(record_root: Path, after_seq: int = -1, timeout: float = 10.0) -> None:
    """Poll a session record until a model producer starts at a seq past `after_seq`: the turn
    is then inside its model call, the step an interrupt cancels. Pass the record's tail from
    before the turn, so an earlier turn's model start does not count. Stands in for the fixed
    sleeps the tests used (lens audit F437)."""
    import time

    from substrate import api

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            for env in api.read_record(record_root):
                producer = (env.get("payload") or {}).get("producer") or {}
                if (
                    env.get("kind") == api.PRODUCER_STARTED
                    and int(env.get("seq", -1)) > after_seq
                    and isinstance(producer, dict)
                    and producer.get("kind") == "model"
                ):
                    return
        except Exception:  # noqa: BLE001 — record not created yet or mid-write; poll again
            pass
        time.sleep(0.02)
    raise AssertionError(f"the model call never started in {record_root}")
