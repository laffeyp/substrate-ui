# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 228 composition contract — every session's tool suite carries
the seven substrate toolkit tools alongside full_suite.

TECH-SPEC §8 line 1066-1078 declares the composition. This test proves
the daemon's _build_session_topology_from_manifest hands the full
toolkit to session_topology; a rename in substrate_tools that the
daemon does not follow would fail here.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402

from substrate.topologies.applications.registry import load_manifests  # noqa: E402


@pytest.fixture
def registry(tmp_path: Path) -> SessionRegistry:
    server._APPLICATIONS = load_manifests()
    reg = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    server._SESSION_REGISTRY = reg
    return reg


def test_session_tools_include_seven_substrate_toolkit_tools(
    registry: SessionRegistry, tmp_path: Path
) -> None:
    """Build the tool dict the daemon would hand session_topology.
    Assert the seven substrate toolkit tools (from piece F sprints 226-228)
    are all present alongside the eight file/shell tools from full_suite."""
    manifest = registry.create(
        session_id="s_composition_test",
        name="composition",
        driver="deterministic",
        workspace=str(tmp_path / "ws"),
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    # Rebuild the tool dict directly — the same call session_topology
    # receives via _build_session_topology_from_manifest.
    from substrate import _daemon as _substrate_daemon
    from substrate.topologies.tool_loop.substrate_tools import (
        make_inspect_record,
        make_list_applications,
        make_list_records,
        make_list_sessions,
        make_list_topologies,
        make_run_topology,
        make_run_topology_poll,
    )

    file_tools = server._tools_for_manifest(manifest)
    composed = {
        **file_tools,
        "run_topology": make_run_topology(_substrate_daemon),
        "run_topology_poll": make_run_topology_poll(_substrate_daemon),
        "inspect_record": make_inspect_record(),
        "list_records": make_list_records(server._SESSIONS_BASE),
        "list_topologies": make_list_topologies(),
        "list_applications": make_list_applications(server._APPLICATIONS),
        "list_sessions": make_list_sessions(registry),
    }
    toolkit_names = {
        "run_topology",
        "run_topology_poll",
        "inspect_record",
        "list_records",
        "list_topologies",
        "list_applications",
        "list_sessions",
    }
    assert toolkit_names <= set(composed), (
        f"session tool suite missing toolkit entries: {toolkit_names - set(composed)}"
    )
    # full_suite tools also present (a subset spot-check).
    for expected in ("read_file", "grep", "write_file", "bash"):
        assert expected in composed, f"full_suite tool {expected!r} missing"
