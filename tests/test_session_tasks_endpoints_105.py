"""UI sprint 105: the app's view of a session's background tasks.

GET /api/session/<id>/tasks lists them; POST /api/session/<id>/tasks/<task_id>/stop stops one,
and the model hears about it (sprint 104's notice).
"""

from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402

from substrate.session_registry import SessionRegistry  # noqa: E402
from substrate.topologies.tool_loop.background import TABLE  # noqa: E402
from _serving import call, serving# noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(base=tmp_path / "sessions")
    for sid in ("s_00000000000105aa", "s_00000000000105bb"):
        server._SESSION_REGISTRY.create(
            session_id=sid, name=None, driver="deterministic", workspace=str(tmp_path),
            workspace_shape="flat", bundle=None, seed="",
        )
    with serving() as base:
        yield base
    for sid in ("s_00000000000105aa", "s_00000000000105bb"):
        TABLE.stop_owner(sid, "test teardown")


def _get(url: str) -> tuple[int, dict]:
    status, payload = call("GET", url, timeout=10)
    return status, payload


def _post(url: str, origin: str) -> tuple[int, dict]:
    status, payload = call("POST", url, headers={"Origin": origin}, timeout=10)
    return status, payload


def test_list_and_stop_a_sessions_task(base: str, tmp_path: Path) -> None:
    tools = server._tools_for_manifest(SimpleNamespace(session_id="s_00000000000105aa", workspace=str(tmp_path), tools=None))
    r = tools["bash"].run(["sleep 60", None, True])
    other = server._tools_for_manifest(SimpleNamespace(session_id="s_00000000000105bb", workspace=str(tmp_path), tools=None))
    other["bash"].run(["sleep 60", None, True])

    code, body = _get(f"{base}/api/session/s_00000000000105aa/tasks")
    assert code == 200
    assert [t["task_id"] for t in body["tasks"]] == [r["task_id"]], "only this session's tasks"
    assert body["tasks"][0]["status"] == "running"

    code, stopped = _post(f"{base}/api/session/s_00000000000105aa/tasks/{r['task_id']}/stop", base)
    assert code == 200 and stopped["status"] == "stopped"
    assert stopped["stopped_because"] == "stopped from the app"
    told = TABLE.drain_ended("s_00000000000105aa")
    assert [t["task_id"] for t in told] == [r["task_id"]], "the model hears about a stop from the app"


def test_unknown_session_or_task_is_404(base: str) -> None:
    assert _get(f"{base}/api/session/s_nope/tasks")[0] == 404
    assert _post(f"{base}/api/session/s_00000000000105aa/tasks/bg_nope/stop", base)[0] == 404
    assert _post(f"{base}/api/session/s_00000000000105bb/tasks/bg_nope/stop", base)[0] == 404
