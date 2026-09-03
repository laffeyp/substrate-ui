# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 225b — POST /end on a composite parent cascades to children.

Card's dual contract: end on parent → both records carry SessionEnded.
Standalone session ends alone. boot_scan preserves composite_of.
"""

from __future__ import annotations

import json
import sys
import threading
import uuid
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry, SessionStatus  # noqa: E402

from substrate import api  # noqa: E402


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


def _post(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=30) as response:
        return response.status, json.loads(response.read())


def _create_pair(registry: SessionRegistry) -> tuple[str, str]:
    """Register a builder + reviewer pair; the reviewer's composite_of
    points at the builder's session_id."""
    builder_id = f"s_pair_builder_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=builder_id,
        name=f"builder-{uuid.uuid4().hex[:6]}",
        driver="deterministic",
        workspace="/tmp/pair-composite-test",
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    reviewer_id = f"s_pair_reviewer_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=reviewer_id,
        name=f"reviewer-{uuid.uuid4().hex[:6]}",
        driver="deterministic",
        workspace="/tmp/pair-composite-test",
        workspace_shape="flat",
        bundle=None,
        seed="",
        composite_of=builder_id,
    )
    return builder_id, reviewer_id


def test_end_on_parent_cascades_to_child(base: tuple[str, Path]) -> None:
    url, _ = base
    builder_id, reviewer_id = _create_pair(server._SESSION_REGISTRY)
    # Drive one turn on each so records exist (POST /end on a fresh
    # session flips the manifest to ended without a record write).
    _post(url + f"/api/session/{builder_id}/turn", {"text": "seed"})
    _post(url + f"/api/session/{reviewer_id}/turn", {"text": "seed"})

    status, _body = _post(url + f"/api/session/{builder_id}/end", {"source": "user_end"})
    assert status == 200

    assert server._SESSION_REGISTRY.get(builder_id).status == SessionStatus.ENDED
    assert server._SESSION_REGISTRY.get(reviewer_id).status == SessionStatus.ENDED
    # Both records carry SessionEnded on the record.
    for sid in (builder_id, reviewer_id):
        record = Path(server._SESSION_REGISTRY.get(sid).record_root)
        kinds = [str(env.get("kind", "")) for env in api.read_record(record)]
        assert any("SessionEnded" in k for k in kinds), (
            f"session {sid!r} missing SessionEnded on the record: {kinds!r}"
        )


def test_standalone_session_end_does_not_cascade(base: tuple[str, Path]) -> None:
    """A session with composite_of=None ends alone; no other session's
    status changes."""
    url, _ = base
    registry = server._SESSION_REGISTRY
    solo_id = f"s_solo_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=solo_id,
        name="solo",
        driver="deterministic",
        workspace="/tmp/solo",
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    other_id = f"s_other_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=other_id,
        name="other",
        driver="deterministic",
        workspace="/tmp/other",
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    _post(url + f"/api/session/{solo_id}/turn", {"text": "seed"})
    _post(url + f"/api/session/{other_id}/turn", {"text": "seed"})

    _post(url + f"/api/session/{solo_id}/end", {"source": "user_end"})

    assert registry.get(solo_id).status == SessionStatus.ENDED
    assert registry.get(other_id).status != SessionStatus.ENDED


def test_composite_of_survives_boot_scan(base: tuple[str, Path], tmp_path: Path) -> None:
    _url, base_path = base
    _builder_id, reviewer_id = _create_pair(server._SESSION_REGISTRY)

    fresh = SessionRegistry(
        base=base_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    fresh.boot_scan()
    reloaded = fresh.get(reviewer_id)
    assert reloaded is not None
    assert reloaded.composite_of is not None
    assert reloaded.composite_of.startswith("s_pair_builder_")
