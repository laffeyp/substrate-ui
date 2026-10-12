"""UI sprint 159: a session opened before workspaces were expanded at open stores
`~/.substrate/sandbox` in its manifest. Its CLI driver must run in the sandbox that names, not in a
folder called `~` (which raised `FileNotFoundError(2, 'No such file or directory')` on every turn).
"""

from __future__ import annotations

import sys
from typing import Any

import pytest
from substrate import api
from substrate.topologies.session_registry import SessionManifest, SessionStatus

import server

# Prints its working directory as a Claude Code stream would end.
_PWD = [
    sys.executable,
    "-c",
    "import json, os; print(json.dumps({'type': 'result', 'result': os.getcwd(), 'usage': {}}))",
]


def test_a_tilde_workspace_runs_the_cli_in_the_sandbox(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(server, "_cli_command", lambda app, name, version=None: list(_PWD))
    built: list[Any] = []
    real = server._daemon_driver_resolver

    def spy(app: server.App, name: str, params: Any = None, **kw: Any) -> Any:
        responder = real(app, name, params, **kw)
        built.append(responder)
        return responder

    monkeypatch.setattr(server, "_daemon_driver_resolver", spy)
    sandbox = api.substrate_home() / "sandbox"
    sandbox.mkdir(parents=True, exist_ok=True)
    manifest = SessionManifest(
        session_id="s_tilde159",
        name=None,
        created_at=0.0,
        driver="claude",
        workspace="~/.substrate/sandbox",
        workspace_shape="flat",
        record_root=str(api.substrate_home() / "sessions" / "s_tilde159" / "record"),
        status=SessionStatus.PARKED,
        bundle="session",
        seed="",
        driver_params={"driver_version": "opus-4-5"},
    )
    server._build_session_topology_from_manifest(server.App(), manifest)
    assert built, "the turn builder resolved no driver"
    # macOS: $TMPDIR sits under /var, a link to /private/var; os.getcwd() reports the real path.
    assert built[0].respond("where are you?") == str(sandbox.resolve())
