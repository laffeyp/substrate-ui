# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 225b — DELETE on a composite parent cascades to children.

Rule 12: every record dir stays on disk after the cascade. Only the
manifests + by-name entries drop.
"""

from __future__ import annotations

import sys
import threading
import uuid
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> tuple[str, Path]:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}", tmp_path
    srv.shutdown()


def _delete(url: str) -> int:
    req = Request(url, method="DELETE")
    with urlopen(req, timeout=15) as response:
        return response.status


def _create_pair(registry: SessionRegistry, base_path: Path) -> tuple[str, str]:
    builder_id = f"s_pair_builder_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=builder_id,
        name=f"del-builder-{uuid.uuid4().hex[:6]}",
        driver="deterministic",
        workspace=str(base_path / "ws"),
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    reviewer_id = f"s_pair_reviewer_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=reviewer_id,
        name=f"del-reviewer-{uuid.uuid4().hex[:6]}",
        driver="deterministic",
        workspace=str(base_path / "ws"),
        workspace_shape="flat",
        bundle=None,
        seed="",
        composite_of=builder_id,
    )
    return builder_id, reviewer_id


def test_delete_parent_cascades_to_child_and_preserves_records(
    base: tuple[str, Path],
) -> None:
    url, base_path = base
    from urllib.request import Request as _Req
    from urllib.request import urlopen as _urlopen

    builder_id, reviewer_id = _create_pair(server._SESSION_REGISTRY, base_path)
    # Give each a record on disk so the rule-12 preservation is real.
    for sid in (builder_id, reviewer_id):
        _urlopen(
            _Req(
                url + f"/api/session/{sid}/turn",
                data=b'{"text": "seed"}',
                headers={"Content-Type": "application/json"},
                method="POST",
            ),
            timeout=30,
        )
    builder_record = Path(server._SESSION_REGISTRY.get(builder_id).record_root)
    reviewer_record = Path(server._SESSION_REGISTRY.get(reviewer_id).record_root)

    assert _delete(url + f"/api/session/{builder_id}") == 204

    # Both manifests are gone from the registry.
    assert server._SESSION_REGISTRY.get(builder_id) is None
    assert server._SESSION_REGISTRY.get(reviewer_id) is None
    # Rule 12: both record dirs stay on disk.
    assert builder_record.is_dir()
    assert reviewer_record.is_dir()
