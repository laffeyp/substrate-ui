"""UI sprint 106: a long SUBSTRATE_HOME no longer kills the daemon.

The Unix socket path is limited to sizeof(sun_path) (104 bytes on macOS). With a longer state
root the bind raised `OSError: AF_UNIX path too long` and the daemon died before serving. Now it
reports the socket unavailable and serves over TCP.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

REPO = Path(__file__).resolve().parent.parent


def test_daemon_serves_tcp_when_the_socket_path_is_too_long(tmp_path: Path) -> None:
    home = tmp_path / ("x" * 120)
    home.mkdir()
    env = {**os.environ, "SUBSTRATE_HOME": str(home)}
    env.pop("SUBSTRATE_DAEMON_SOCK", None)
    proc = subprocess.Popen(
        [sys.executable, str(REPO / "server.py"), "--port", "0"],
        cwd=REPO, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    try:
        port, summary, deadline = None, "", time.monotonic() + 30
        while time.monotonic() < deadline and (port is None or "UDS" not in summary):
            line = proc.stdout.readline()
            if not line:
                break
            m = re.match(r"substrate-ui port=(\d+)", line)
            if m:
                port = int(m.group(1))
            if "UDS" in line:
                summary = line
        assert port, "the daemon never reported its port"
        assert "UDS unavailable" in summary and "TCP only" in summary, summary
        with urlopen(f"http://127.0.0.1:{port}/", timeout=10) as r:
            assert r.status == 200
    finally:
        proc.terminate()
        proc.wait(timeout=30)
