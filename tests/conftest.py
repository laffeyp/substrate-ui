"""Test-session SUBSTRATE_HOME isolation.

Every test run gets its own temp state root so test-created sessions,
records, sockets, and config never land in the user's ~/.substrate/.

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
import tempfile

import pytest

_TEST_HOME = tempfile.mkdtemp(prefix="substrate-test-home-")
os.environ["SUBSTRATE_HOME"] = _TEST_HOME


@pytest.fixture(autouse=True, scope="session")
def _remove_test_substrate_home() -> object:
    yield
    shutil.rmtree(_TEST_HOME, ignore_errors=True)


@pytest.fixture(autouse=True, scope="session")
def _demo_records(_remove_test_substrate_home: object) -> None:
    """Fresh Fixture (Meszaros): the demo_* records the console tests read (failed, paused,
    broken, diff pair, solo chat, resumable, torn, delegate) are generated into this run's
    state root, by actually running their topologies. They used to come from an untracked
    `substrate-ui/runs/` folder on one machine (Sprint 097)."""
    import asyncio
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    import gen_demo_records

    asyncio.run(gen_demo_records.main(Path(_TEST_HOME) / "runs"))
