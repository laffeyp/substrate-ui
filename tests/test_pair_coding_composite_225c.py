"""Sprint 225c — POST /api/topology/pair_coding/run opens the pair.

Two behaviors:
  1. The endpoint registers both sessions; the child's composite_of
     points at the parent's session_id.
  2. Sprint 225b's cascade ties both together — ending the parent
     ends both.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402
from substrate.topologies.session_registry import SessionStatus  # noqa: E402
from substrate.topologies.applications.registry import load_manifests  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> tuple[str, Path]:
    _sb = tmp_path / "sessions"
    monkeypatch.setattr(server, "_sessions_base", lambda: _sb)
    server._sessions_base().mkdir(parents=True)
    app.install_registry(base=server._sessions_base())
    app.applications = load_manifests()
    with serving(app) as base:
        yield base, tmp_path


def _post(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=30)
    assert status < 400, (status, payload)  # this helper used to raise on an error status
    return status, payload


def test_pair_coding_run_registers_both_sessions_with_composite_link(
    app: server.App,
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
    builder = app.registry.get(builder_id)
    reviewer = app.registry.get(reviewer_id)
    assert builder.composite_of is None
    assert reviewer.composite_of == builder_id
    assert reviewer.role == "reviewer"
    assert reviewer.tools == ("read_file", "grep", "list_dir", "web_fetch")
    assert builder.driver == "deterministic"
    assert reviewer.driver == "deterministic"


def test_pair_coding_cascade_end_ties_both_together(
    app: server.App,
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
    assert app.registry.get(builder_id).status == SessionStatus.ENDED
    assert app.registry.get(reviewer_id).status == SessionStatus.ENDED
