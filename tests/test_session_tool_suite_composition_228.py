"""Sprint 228 composition contract — every session's tool suite carries the eight substrate
toolkit tools (seven plus delegate) alongside full_suite.

The test captures the `tools` the daemon's `_build_session_topology_from_manifest` hands to
`session_topology`, so a rename in substrate_tools that the daemon does not follow, or a tool the
daemon stops passing, fails here (lens audit F462: the old test built the dict itself and asserted
its own construction).
"""

from __future__ import annotations

import functools

from pathlib import Path
from typing import Any

import pytest
import server
from substrate.topologies.session_registry import SessionRegistry
from substrate.topologies.applications.registry import load_manifests

TOOLKIT = {
    "run_topology",
    "run_topology_poll",
    "inspect_record",
    "list_records",
    "list_topologies",
    "list_applications",
    "list_sessions",
    "delegate",
}


def test_the_daemon_hands_session_topology_the_full_toolkit(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    setattr(app, "applications", load_manifests())
    reg = SessionRegistry(
        base=tmp_path,
        session_topology_factory=functools.partial(
            server._build_session_topology_from_manifest, app
        ),
    )
    setattr(app, "registry", reg)
    manifest = reg.create(
        session_id="s_composition_test",
        name="composition",
        driver="deterministic",
        workspace=str(tmp_path / "ws"),
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    captured: dict[str, Any] = {}

    def capture(**kwargs: Any) -> Any:
        captured.update(kwargs)
        return lambda b: None

    import substrate.topologies.session as session_pkg

    # the factory imports session_topology at call time, from the package
    monkeypatch.setattr(session_pkg, "session_topology", capture)
    server._build_session_topology_from_manifest(app, manifest)
    tools = set(captured["tools"])
    assert TOOLKIT <= tools, f"missing toolkit tools: {TOOLKIT - tools}"
    for expected in ("read_file", "grep", "write_file", "bash"):
        assert expected in tools, f"full_suite tool {expected!r} missing"
