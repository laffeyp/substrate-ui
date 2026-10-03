"""UI sprint 103: the daemon's side of background commands.

A session's tools own their background tasks by session id; an allow-list naming `bash` brings
the three task tools with it; quitting the app stops every task.
"""

from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402

from substrate.session_registry import SessionRegistry  # noqa: E402
from substrate.topologies.tool_loop.background import TABLE  # noqa: E402


def _manifest(tmp_path: Path, sid: str, tools: tuple[str, ...] | None) -> SimpleNamespace:
    return SimpleNamespace(session_id=sid, workspace=str(tmp_path), tools=tools)


def test_allow_list_with_bash_brings_the_task_tools(tmp_path: Path) -> None:
    names = set(server._tools_for_manifest(_manifest(tmp_path, "s_x", ("bash", "read_file"))))
    assert names == {"bash", "bash_output", "bash_stop", "bash_tasks", "read_file"}
    assert "bash_output" not in server._tools_for_manifest(_manifest(tmp_path, "s_x", ("read_file",)))


def test_session_tools_own_tasks_by_session_id_and_quit_stops_them(tmp_path: Path) -> None:
    tools = server._tools_for_manifest(_manifest(tmp_path, "s_00000000000000aa", None))
    r = tools["bash"].run(["sleep 30", None, True])
    task = TABLE.get("s_00000000000000aa", r["task_id"])
    assert tools["bash_tasks"].run([])[0]["task_id"] == r["task_id"]
    server._SESSION_REGISTRY = SessionRegistry(base=tmp_path / "sessions")
    outcome = server._shutdown_all_sessions(per_session_timeout=5.0)
    assert outcome["background_stopped"] >= 1
    assert task.poll() == "stopped" and task.stopped_because == "the app quit"
