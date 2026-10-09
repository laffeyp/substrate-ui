"""Wire-error string constants for `/api/session/*` responses.

TECH-SPEC §7 defines the JSON error envelope carries an `error` field
whose value is a short lowercase-with-underscores tag. The tag is part
of the wire contract — clients switch on it. Sprint 224a extracts these
tags as importable constants so:

  - server.py writes the constant, not a literal.
  - tests assert against the constant, not a literal.
  - A rename fails at the symbol name (compile-time) instead of silently
    passing CI when both sides ship the same misspelling.

Add a new tag by adding a new constant here; both sides pick it up on
the next import. Do not embed these strings anywhere else in the tree.
"""

from __future__ import annotations


# A delegate's standing session vanished under it (the delegate tool's own error, raised in the
# kernel). Re-imported from substrate so the delegate and the daemon cannot drift on the string.
from substrate.topologies.tool_loop.delegate import (
    SESSION_ENDED_MID_DELEGATE as SESSION_ENDED_MID_DELEGATE,
)

# A /turn for a session that was DELETED: its manifest is gone, its record dir remains (SDD rule
# 12). 410, not 404: it existed. Until 2026-10-08 this answered `session_ended_mid_delegate`, a
# name for the delegate case only (lens audit F431).
SESSION_DELETED = "session_deleted"

# turn_sync found the session gone once it held the session's lock: a delete (or a cascade from a
# composite parent) landed between the caller's lookup and the turn.
SESSION_ENDED_MID_TURN = "session_ended_mid_turn"

# Sprint 220b: the session's record dir exists but api.read_record
# raised (RecordGapError, TornFrameError, CRCMismatchError, FsyncError).
# The daemon refuses to dispatch either Runtime.run (would double-head)
# or Runtime.resume (would inherit the torn tail). See
# session_registry.TornRecordOnResume.
RECORD_TORN = "record_torn"

# Sprint 217a: a POST /api/session/<id>/end on a fresh session whose
# record dir does not exist yet. The daemon flips the manifest to
# "ended" at the daemon layer (no record to write to) and echoes this
# tag so the caller can distinguish from an ordinary end.
FRESH_SESSION_NEVER_OPENED = "fresh_session_never_opened"


__all__ = [
    "FRESH_SESSION_NEVER_OPENED",
    "RECORD_TORN",
    "SESSION_DELETED",
    "SESSION_ENDED_MID_DELEGATE",
    "SESSION_ENDED_MID_TURN",
]
