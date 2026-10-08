"""One in-process console server per test (UI sprint 107).

32 test files carried the same four lines to serve `server.Handler` on an ephemeral port, and every
copy stopped the serve loop without closing the listening socket (`socketserver` documents both:
`shutdown()` stops `serve_forever`, `server_close()` releases the socket). This is the one copy.
"""

from __future__ import annotations

import json
import sys
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from http.server import ThreadingHTTPServer
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402


@contextmanager
def serving() -> Iterator[str]:
    """Serve the console on 127.0.0.1:<ephemeral>; yield its base URL; stop and close it."""
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
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
