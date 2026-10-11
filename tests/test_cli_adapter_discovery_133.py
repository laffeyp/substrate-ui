"""Sprint 133: SUBSTRATE_CLI_ADAPTERS limits which CLIs `/api/models` discovers.

The offline Electron gates set it empty, with OLLAMA_BASE_URL on a closed port, so the roster
they bind from does not depend on what the machine has installed. Unset, every installed CLI is
discovered, as before.
"""

from __future__ import annotations

from typing import Any

import pytest

import server  # noqa: E402


@pytest.fixture
def every_cli_installed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("shutil.which", lambda cmd: f"/bin/{cmd}")
    monkeypatch.setattr(server, "_probe_cli_versions", lambda app, name: {})
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://127.0.0.1:9")


def _cli(app: Any = None) -> list[str]:
    return list(server._agent_models(app)["cli"])  # type: ignore[arg-type]


def test_unset_discovers_every_installed_cli(every_cli_installed: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SUBSTRATE_CLI_ADAPTERS", raising=False)
    assert _cli() == sorted(n for n, e in server.KNOWN_CLI_ADAPTERS.items() if e.get("command"))


def test_empty_discovers_none_and_leaves_deterministic(every_cli_installed: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUBSTRATE_CLI_ADAPTERS", "")
    roster = server._agent_models(None)  # type: ignore[arg-type]
    assert roster["cli"] == []
    assert roster["models"] == ["deterministic"]
    assert roster["default"] == "deterministic"


def test_named_list_discovers_only_those(every_cli_installed: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUBSTRATE_CLI_ADAPTERS", "codex, claude")
    assert _cli() == ["claude", "codex"]
