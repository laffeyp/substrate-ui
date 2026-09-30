"""Session-scoped SUBSTRATE_HOME isolation.

Every test session gets its own temp state root so test-created sessions,
sockets, and config never land in ~/.substrate/.
"""

from __future__ import annotations

import os

import pytest


@pytest.fixture(autouse=True, scope="session")
def _isolate_substrate_home(tmp_path_factory: pytest.TempPathFactory) -> None:
    root = tmp_path_factory.mktemp("substrate-test-home")
    os.environ["SUBSTRATE_HOME"] = str(root)
