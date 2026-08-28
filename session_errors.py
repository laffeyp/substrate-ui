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


# Session state — the caller resolved a session name that has since
# ended (or ended between the resolve and the /turn call). Surfaced by
# turn_sync's SessionEndedMidTurn class AND by the delegate on the
# substrate side. Re-imported from substrate so the delegate and the
# daemon cannot drift on the tag string.
from substrate.topologies.tool_loop.delegate import (
    SESSION_ENDED_MID_DELEGATE as SESSION_ENDED_MID_DELEGATE,
)

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
    "SESSION_ENDED_MID_DELEGATE",
]
