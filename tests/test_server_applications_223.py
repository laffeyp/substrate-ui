"""Sprint 223 observation contract — GET /api/applications end-to-end.

Card's observation contract: "Fire GET /api/applications against a
daemon with three fixture manifests; assert three entries returned with
correct fields." Also assert the empty-registry case (fresh install:
zero manifests → `[]`, not 500).
"""

from __future__ import annotations

import json
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402

from substrate.topologies.applications.registry import load_manifests  # noqa: E402


_FIXTURE_A = """
name = "code_review"
description = "fan-out review"
runs = "one-shot"

[inputs]
repo = {type = "string"}
"""

_FIXTURE_B = """
name = "best_of_n_verified"
description = "N drafts + verifier"
runs = "one-shot"

[inputs]
task = {type = "string"}
"""

_FIXTURE_C = """
name = "daily"
description = "session driver"
runs = "session"

[inputs]
model = {type = "string"}
"""


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def _get(url: str) -> tuple[int, object]:
    with urlopen(url, timeout=10) as response:
        return response.status, json.loads(response.read())


def test_empty_applications_returns_empty_list(base: str) -> None:
    """A fresh daemon with no manifests loaded returns []. This is the
    invariant that keeps a fresh install from 500-ing at the endpoint."""
    server._APPLICATIONS = {}
    status, body = _get(base + "/api/applications")
    assert status == 200
    assert body == []


def test_three_fixture_manifests_return_three_entries(
    base: str, tmp_path: Path
) -> None:
    fixture_root = tmp_path / "fixture-applications"
    fixture_root.mkdir()
    (fixture_root / "code_review.manifest.toml").write_text(_FIXTURE_A, encoding="utf-8")
    (fixture_root / "best_of_n.manifest.toml").write_text(_FIXTURE_B, encoding="utf-8")
    (fixture_root / "daily.manifest.toml").write_text(_FIXTURE_C, encoding="utf-8")
    server._APPLICATIONS = load_manifests(root=fixture_root)

    status, body = _get(base + "/api/applications")
    assert status == 200
    assert isinstance(body, list)
    names = {entry["name"] for entry in body}
    assert names == {"code_review", "best_of_n_verified", "daily"}
    for entry in body:
        assert set(entry) == {"name", "description", "runs", "inputs_schema", "output_kind"}


def test_wire_shape_excludes_slots_and_default_bundle(
    base: str, tmp_path: Path
) -> None:
    """§7.6 line 1044: wire response is 5 fields. `slots` + `default_bundle`
    are internal to the piece-H binding step, NOT visible to a caller
    browsing the app catalog."""
    fixture_root = tmp_path / "fixture-slots"
    fixture_root.mkdir()
    (fixture_root / "with_slots.manifest.toml").write_text(
        _FIXTURE_A + '\ndefault_bundle = "reviewer"\n\n[slots]\n'
        'methodology = {default = "bundle:methodology"}\n',
        encoding="utf-8",
    )
    server._APPLICATIONS = load_manifests(root=fixture_root)
    status, body = _get(base + "/api/applications")
    assert status == 200
    assert len(body) == 1
    assert "slots" not in body[0]
    assert "default_bundle" not in body[0]
