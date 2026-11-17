# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 515: a backend whose parent pid is gone exits on its own.

The watchdog reads SUBSTRATE_PARENT_PID and polls os.kill(app_pid, 0). A dead
parent raises ProcessLookupError; the watchdog claims shutdown and the process
exits. The test starts a real server with a parent pid that is already dead
(a pid from a process that has been reaped) and asserts the process exits 0
within the deadline, without a SIGTERM.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def _dead_pid() -> int:
    """Return a pid that is not alive. Spawn a short-lived child and reap it,
    so the number is certain to be dead and not reused within the test."""
    p = subprocess.Popen([sys.executable, "-c", "pass"])
    p.wait()
    return p.pid


def test_backend_exits_when_parent_pid_is_dead(tmp_path: Path) -> None:
    home = tmp_path / "home"
    home.mkdir()
    env = {
        **os.environ,
        "SUBSTRATE_HOME": str(home),
        "SUBSTRATE_DAEMON_SOCK": str(tmp_path / "d.sock"),
        "SUBSTRATE_PARENT_PID": str(_dead_pid()),
    }
    proc = subprocess.Popen(
        [sys.executable, str(REPO / "server.py"), "--port", "0"],
        cwd=tmp_path,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    try:
        port = None
        deadline = time.monotonic() + 30
        while port is None and time.monotonic() < deadline:
            line = proc.stdout.readline()
            if not line:
                break
            m = re.match(r"substrate-ui port=(\d+)", line)
            if m:
                port = int(m.group(1))
        assert port, "the server never reported its port"

        # The watchdog polls once per second and must re-parent-detect the dead
        # parent, then exit. No SIGTERM is sent.
        code = proc.wait(timeout=90)
        assert code == 0, f"exit code {code}"
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=10)
        proc.stdout.close()
