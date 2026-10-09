"""Test-session isolation: state root, home, and the server's module state.

Every test run gets its own temp state root (SUBSTRATE_HOME) and its own temp HOME, so
test-created sessions, records, sockets, config, and anything that resolves `~` never land in the
user's real home (lens audit F410: HOME stayed real).

Every test also gets the server module's state back as it found it: the registry, the
application catalog, and every module-level table and cache (lens audit F411/F412/F454: 40 files
reassigned `server._SESSION_REGISTRY` and never restored it). Meszaros, *xUnit Test Patterns*,
Erratic Test: Singletons and Registries need "a mechanism to reinitialize their variables at the
beginning of each test".

Set at conftest import, not in a fixture. pytest imports this file before it
collects (imports) any test module in tests/, so the variable is in place
before `import server`. A session-scoped autouse fixture runs only after
collection, which is too late for anything that reads the state root while a
test module is being imported (Sprint 093; Sprint 092's fixture-only version
let one run write 30 session dirs and a run record into the real home).

Always a fresh root, even when the shell exports SUBSTRATE_HOME (a dev shell
points it at ~/.substrate-dev, which is real state too).
"""

from __future__ import annotations

import os
import shutil
import sys
import tempfile

import pytest

# The repo root (server.py, builder.py, scripts/) and this folder (_serving) on the import path,
# once, for every test module (lens audit F413: 50 files each inserted it).
_REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _REPO)
sys.path.insert(0, os.path.join(_REPO, "scripts"))

_TEST_HOME = tempfile.mkdtemp(prefix="substrate-test-home-")
os.environ["SUBSTRATE_HOME"] = _TEST_HOME
_USER_HOME = tempfile.mkdtemp(prefix="substrate-test-user-home-")
os.environ["HOME"] = _USER_HOME


@pytest.fixture(autouse=True, scope="session")
def _remove_test_substrate_home() -> object:
    yield
    shutil.rmtree(_TEST_HOME, ignore_errors=True)
    shutil.rmtree(_USER_HOME, ignore_errors=True)


def _server_state() -> dict[str, object]:
    """The server module's private module-level names, by binding (and, for tables, a copy)."""
    mod = sys.modules.get("server")
    if mod is None:
        return {}
    out: dict[str, object] = {}
    for name, value in vars(mod).items():
        private = name.startswith("_") and not name.startswith("__")
        if not private or callable(value):  # functions and classes are code, not state
            continue
        copy = (
            dict(value)
            if isinstance(value, dict)
            else list(value)
            if isinstance(value, list)
            else None
        )
        out[name] = (value, copy)
    return out


@pytest.fixture(autouse=True)
def _restore_server_state() -> object:
    """Put back every module-level name of `server` after each test: the binding, and the
    contents of a table a test mutated in place."""
    before = _server_state()
    yield
    mod = sys.modules.get("server")
    if mod is None:
        return
    for name, (obj, contents) in before.items():
        setattr(mod, name, obj)
        if isinstance(obj, dict) and isinstance(contents, dict):
            obj.clear()
            obj.update(contents)
        elif isinstance(obj, list) and isinstance(contents, list):
            obj[:] = contents


@pytest.fixture
def app() -> object:
    """This test's own console App (UI sprint 111). It has no session registry until the test
    installs one with `app.install_registry(base)`; serve it with `serving(app)`. Pytest hands
    the same App to the test and to every fixture of that test that asks for it."""
    import server

    return server.App()


@pytest.fixture(autouse=True, scope="session")
def _demo_records(_remove_test_substrate_home: object) -> None:
    """Fresh Fixture (Meszaros): the demo_* records the console tests read (failed, paused,
    broken, diff pair, solo chat, resumable, torn, delegate) are generated into this run's
    state root, by actually running their topologies. They used to come from an untracked
    `substrate-ui/runs/` folder on one machine (Sprint 097)."""
    import asyncio
    from pathlib import Path

    import gen_demo_records

    asyncio.run(gen_demo_records.main(Path(_TEST_HOME) / "runs"))
