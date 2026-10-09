"""UI sprint 109: SIGTERM to a real server process ends every session and exits.

The shutdown tests call `_shutdown_all_sessions` directly; nothing sent the signal itself, so the
self-pipe handler, `_claim_shutdown` and the serve-loop exit had no test (lens audit F441).
*Twelve-Factor App*, IX: "Processes shut down gracefully when they receive a SIGTERM signal."
"""

from __future__ import annotations

import json
import os
import re
import signal
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen

from substrate import api

REPO = Path(__file__).resolve().parent.parent


def _post(base: str, path: str, body: dict) -> dict:
    req = Request(
        base + path,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def test_sigterm_ends_the_parked_session_and_the_process_exits(tmp_path: Path) -> None:
    home = tmp_path / "home"
    home.mkdir()
    env = {
        **os.environ,
        "SUBSTRATE_HOME": str(home),
        "SUBSTRATE_DAEMON_SOCK": str(tmp_path / "d.sock"),
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
        base = f"http://127.0.0.1:{port}"
        sid = _post(base, "/api/session", {"driver": "deterministic"})["session_id"]
        assert _post(base, f"/api/session/{sid}/turn", {"text": "hello"})["status"] == "parked"

        t0 = time.monotonic()
        proc.send_signal(signal.SIGTERM)
        code = proc.wait(timeout=20)
        elapsed = time.monotonic() - t0
        assert code == 0, f"exit code {code}"
        assert elapsed < 10, f"SIGTERM took {elapsed:.1f} s"

        manifest = json.loads((home / "sessions" / sid / "manifest.json").read_text())
        assert manifest["status"] == "ended"
        ended = [
            e for e in api.read_record(Path(manifest["record_root"])) if e["kind"] == "SessionEnded"
        ]
        assert ended and ended[-1]["payload"]["reason"] == "daemon_shutdown"
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=10)
        proc.stdout.close()
