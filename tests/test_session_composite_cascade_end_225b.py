"""Sprint 225b — POST /end on a composite parent cascades to children.

Card's dual contract: end on parent → both records carry SessionEnded.
Standalone session ends alone. boot_scan preserves composite_of.
"""

from __future__ import annotations

import functools

import uuid
from pathlib import Path

import pytest
from _serving import call, serving, scratch_ws  # noqa: E402
from substrate import api  # noqa: E402
from substrate.topologies.session_registry import SessionRegistry, SessionStatus  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> tuple[str, Path]:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base, tmp_path


def _post(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=30)
    assert status < 400, (status, payload)  # this helper used to raise on an error status
    return status, payload


def _create_pair(registry: SessionRegistry) -> tuple[str, str]:
    """Register a builder + reviewer pair; the reviewer's composite_of
    points at the builder's session_id."""
    builder_id = f"s_pair_builder_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=builder_id,
        name=f"builder-{uuid.uuid4().hex[:6]}",
        driver="deterministic",
        workspace=scratch_ws("pair-composite-test"),
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    reviewer_id = f"s_pair_reviewer_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=reviewer_id,
        name=f"reviewer-{uuid.uuid4().hex[:6]}",
        driver="deterministic",
        workspace=scratch_ws("pair-composite-test"),
        workspace_shape="flat",
        bundle=None,
        seed="",
        composite_of=builder_id,
    )
    return builder_id, reviewer_id


def test_end_on_parent_cascades_to_child(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    builder_id, reviewer_id = _create_pair(app.registry)
    # Drive one turn on each so records exist (POST /end on a fresh
    # session flips the manifest to ended without a record write).
    _post(url + f"/api/session/{builder_id}/turn", {"text": "seed"})
    _post(url + f"/api/session/{reviewer_id}/turn", {"text": "seed"})

    status, _body = _post(url + f"/api/session/{builder_id}/end", {"source": "user_end"})
    assert status == 200

    assert app.registry.get(builder_id).status == SessionStatus.ENDED
    assert app.registry.get(reviewer_id).status == SessionStatus.ENDED
    # Both records carry SessionEnded on the record.
    for sid in (builder_id, reviewer_id):
        record = Path(app.registry.get(sid).record_root)
        kinds = [str(env.get("kind", "")) for env in api.read_record(record)]
        assert any("SessionEnded" in k for k in kinds), (
            f"session {sid!r} missing SessionEnded on the record: {kinds!r}"
        )


def test_standalone_session_end_does_not_cascade(app: server.App, base: tuple[str, Path]) -> None:
    """A session with composite_of=None ends alone; no other session's
    status changes."""
    url, _ = base
    registry = app.registry
    solo_id = f"s_solo_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=solo_id,
        name="solo",
        driver="deterministic",
        workspace=scratch_ws("solo"),
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    other_id = f"s_other_{uuid.uuid4().hex[:12]}"
    registry.create(
        session_id=other_id,
        name="other",
        driver="deterministic",
        workspace=scratch_ws("other"),
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    _post(url + f"/api/session/{solo_id}/turn", {"text": "seed"})
    _post(url + f"/api/session/{other_id}/turn", {"text": "seed"})

    _post(url + f"/api/session/{solo_id}/end", {"source": "user_end"})

    assert registry.get(solo_id).status == SessionStatus.ENDED
    assert registry.get(other_id).status != SessionStatus.ENDED


def test_composite_of_survives_boot_scan(
    app: server.App, base: tuple[str, Path], tmp_path: Path
) -> None:
    _url, base_path = base
    _builder_id, reviewer_id = _create_pair(app.registry)

    fresh = SessionRegistry(
        base=base_path,
        session_topology_factory=functools.partial(
            server._build_session_topology_from_manifest, app
        ),
    )
    fresh.boot_scan()
    reloaded = fresh.get(reviewer_id)
    assert reloaded is not None
    assert reloaded.composite_of is not None
    assert reloaded.composite_of.startswith("s_pair_builder_")
