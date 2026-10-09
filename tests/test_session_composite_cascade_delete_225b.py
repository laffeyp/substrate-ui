"""Sprint 225b — DELETE on a composite parent cascades to children.

Rule 12: every record dir stays on disk after the cascade. Only the
manifests + by-name entries drop.
"""

from __future__ import annotations

import uuid
from pathlib import Path

import pytest
from _serving import call_raw, serving  # noqa: E402
from substrate.topologies.session_registry import SessionRegistry  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> tuple[str, Path]:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base, tmp_path


def _delete(url: str) -> int:
    status, payload = call_raw("DELETE", url, timeout=15)
    assert status < 400, (status, payload)  # this helper used to raise on an error status
    return status


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
    app: server.App,
    base: tuple[str, Path],
) -> None:
    url, base_path = base
    from urllib.request import Request as _Req
    from urllib.request import urlopen as _urlopen

    builder_id, reviewer_id = _create_pair(app.registry, base_path)
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
    builder_record = Path(app.registry.get(builder_id).record_root)
    reviewer_record = Path(app.registry.get(reviewer_id).record_root)

    assert _delete(url + f"/api/session/{builder_id}") == 204

    # Both manifests are gone from the registry.
    assert app.registry.get(builder_id) is None
    assert app.registry.get(reviewer_id) is None
    # Rule 12: both record dirs stay on disk.
    assert builder_record.is_dir()
    assert reviewer_record.is_dir()
