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
    manifest_from_dict,
    scan_record_status,
)

# Sprint 057: private helpers used to leak through this shim's __all__.
# The two with legitimate public shape (scan_record_status,
# manifest_from_dict) are now public in substrate. The other two
# (_manifest_to_dict, _record_state) are test-fixture and test-assertion
# conveniences with no consumer-facing role — tests migrate off them in
# this same sprint, and they stay private on the substrate side.
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
    "manifest_from_dict",
    "scan_record_status",
]
