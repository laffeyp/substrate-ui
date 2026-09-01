# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 225c — POST /api/topology/pair_coding/run opens the pair.

Two behaviors:
  1. The endpoint registers both sessions; the child's composite_of
     points at the parent's session_id.
  2. Sprint 225b's cascade ties both together — ending the parent
     ends both.
"""

from __future__ import annotations

import json
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import STATUS_ENDED, SessionRegistry  # noqa: E402

from substrate.topologies.applications.registry import load_manifests  # noqa: E402


@pytest.fixture
def base(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> tuple[str, Path]:
    monkeypatch.setattr(server, "_SESSIONS_BASE", tmp_path / "sessions")
    server._SESSIONS_BASE.mkdir(parents=True)
    server._SESSION_REGISTRY = SessionRegistry(
        base=server._SESSIONS_BASE,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    server._APPLICATIONS = load_manifests()
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}", tmp_path
    srv.shutdown()


def _post(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=30) as response:
        return response.status, json.loads(response.read())


def test_pair_coding_run_registers_both_sessions_with_composite_link(
    base: tuple[str, Path],
) -> None:
    url, base_path = base
    workspace = base_path / "pair-ws"
    status, body = _post(
        url + "/api/topology/pair_coding/run",
        {
            "inputs": {
                "builder_driver_model": "deterministic",
                "reviewer_driver_model": "deterministic",
                "workspace": str(workspace),
            }
        },
    )
    assert status == 200, body
    builder_id = body["builder_session_id"]
    reviewer_id = body["reviewer_session_id"]
    assert builder_id.startswith("s_pair_")
    assert reviewer_id.startswith("s_pair_")
    builder = server._SESSION_REGISTRY.get(builder_id)
    reviewer = server._SESSION_REGISTRY.get(reviewer_id)
    assert builder.composite_of is None
    assert reviewer.composite_of == builder_id
    assert reviewer.role == "reviewer"
    assert reviewer.tools == ("read_file", "grep", "list_dir", "web_fetch")
    assert builder.driver == "deterministic"
    assert reviewer.driver == "deterministic"


def test_pair_coding_cascade_end_ties_both_together(
    base: tuple[str, Path],
) -> None:
    """225b + 225c integration: opening a pair, then ending the parent,
    lands SessionEnded on both records."""
    url, base_path = base
    workspace = base_path / "pair-ws"
    _, body = _post(
        url + "/api/topology/pair_coding/run",
        {
            "inputs": {
                "builder_driver_model": "deterministic",
                "reviewer_driver_model": "deterministic",
                "workspace": str(workspace),
            }
        },
    )
    builder_id = body["builder_session_id"]
    reviewer_id = body["reviewer_session_id"]
    # Prime each with a turn so a real record exists to end on.
    _post(url + f"/api/session/{builder_id}/turn", {"text": "seed"})
    _post(url + f"/api/session/{reviewer_id}/turn", {"text": "seed"})
    # End on parent cascades to child.
    _post(url + f"/api/session/{builder_id}/end", {"source": "user_end"})
    assert server._SESSION_REGISTRY.get(builder_id).status == STATUS_ENDED
    assert server._SESSION_REGISTRY.get(reviewer_id).status == STATUS_ENDED
