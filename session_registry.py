"""Re-export shim — Sprint 054 phase B.

The SessionRegistry primitive moved into substrate at
`substrate/src/substrate/session_registry.py`. This module keeps the
`session_registry` import path daemon-side code has always used
(`from session_registry import SessionRegistry, SessionManifest, ...`)
by re-exporting every public name plus every private helper any
substrate-ui test or server module reaches for.

Nothing else changes: `server.py` still writes
`SessionRegistry(base=…, session_topology_factory=…)` and every method
call resolves to the same code. The daemon-shaped concerns (HTTP
handling in `server.py`, SSE broadcast) were never inside this module
— this file was always just the registry primitive.

Phase D of sprint 054 moves the last standing-session live test to
the substrate side. Phase C tightens `delegate.py`'s typing now that
the registry is importable from substrate. This shim is the only
thing left on the substrate-ui side that names SessionRegistry.
"""

from __future__ import annotations

# Tests monkeypatch `session_registry.api.read_record` to inject torn-record
# behaviour. Re-export the `api` module handle so those patches still find
# their target after the file moved to substrate.
from substrate import api  # noqa: F401 — re-export for monkeypatch targets

from substrate.session_registry import (
    STATUS_ENDED,
    STATUS_INTERRUPTED,
    STATUS_PARKED,
    STATUS_RUNNING,
    FreshSessionRequiresUserMessage,
    NameCollision,
    SessionEndedMidTurn,
    SessionManifest,
    SessionRegistry,
    SessionStatus,
    TornRecordOnResume,
    TurnHandle,
    _manifest_from_dict,
    _manifest_to_dict,
    _record_state,
    _scan_record_status,
)

__all__ = [
    "STATUS_ENDED",
    "STATUS_INTERRUPTED",
    "STATUS_PARKED",
    "STATUS_RUNNING",
    "FreshSessionRequiresUserMessage",
    "NameCollision",
    "SessionEndedMidTurn",
    "SessionManifest",
    "SessionRegistry",
    "SessionStatus",
    "TornRecordOnResume",
    "TurnHandle",
    "_manifest_from_dict",
    "_manifest_to_dict",
    "_record_state",
    "_scan_record_status",
]
