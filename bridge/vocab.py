"""bridge/vocab.py — single-source lift for every string the bridge uses that
lives elsewhere in the tree.

Every constant here either (a) re-exports a substrate-owned enum so substrate
remains the authority, (b) reads a JSON file that both the Python bridge and
the TypeScript renderer share, or (c) declares a local StrEnum for a value
the bridge itself owns.

The rule: NO raw strings in bridge/main.py that name a vocabulary member. If
the code compares a value against `"deterministic"`, `"ollama"`, `"queue_full"`
or any other value that has a name in signals/0.1.json, substrate, or this
module, it compares against the enum member — never the literal.

This closes the drift class the 2026-09-11 code-style + fake-data review
flagged: retyped vocabulary in two languages.
"""

from __future__ import annotations

import json
import re
from enum import StrEnum
from pathlib import Path

# --- Substrate-owned session vocabulary ---------------------------------
# The bridge no longer duplicates "UserMessage" / "ModelReply" / etc.
# Rename in substrate → rename here for free.
from substrate.topologies.session.vocabulary import (  # type: ignore[import-not-found]
    USER_MESSAGE,
    MODEL_REPLY,
    PARK,
    SESSION_ENDED,
    SESSION_END_REQUESTED,
    SESSION_STARTED,
    SESSION_WARNING,
    TRANSCRIPT_COMPACTED,
    PROMPT_FRAGMENT,
    PROMPT_COMPOSED,
    ParkReason,
    SessionEndReason,
    SessionWarningKind,
)


# The tool-loop suite's `delegate` tool name. Sprint 020 needs this to
# route ToolCall envelopes with `payload.tool == "delegate"` through the
# specialized delegate row instead of the generic transcript row. Kept
# in the tool_loop tools module — the bridge imports it, no retype.
from substrate.topologies.tool_loop.tools import TOOL_NAME_DELEGATE  # type: ignore[import-not-found]


# --- Envelope kinds without a central substrate export ------------------
# Tool-loop kinds live in substrate.topologies.tool_loop's Struct decls;
# authoring-failure kinds live in substrate's kernel constants.
class OtherEnvelopeKind(StrEnum):
    """Envelope kinds substrate emits but does not centrally export as
    constants. Cited here so the bridge never retypes them inline."""

    TOOL_CALL = "ToolCall"                 # substrate.topologies.tool_loop
    TOOL_RESULT = "ToolResult"             # substrate.topologies.tool_loop
    RATE_LIMITED_WAITING = "RateLimitedWaiting"  # substrate.topologies.session (session_warning path)
    PRODUCER_FAILED = "ProducerFailed"     # substrate kernel
    PREDICATE_QUARANTINED = "PredicateQuarantined"  # substrate kernel
    PRODUCER_EMITTED_INVALID_EVENT = "ProducerEmittedInvalidEvent"  # substrate kernel


TOOL_CALL = OtherEnvelopeKind.TOOL_CALL.value
TOOL_RESULT = OtherEnvelopeKind.TOOL_RESULT.value
RATE_LIMITED_WAITING = OtherEnvelopeKind.RATE_LIMITED_WAITING.value
PRODUCER_FAILED = OtherEnvelopeKind.PRODUCER_FAILED.value
PREDICATE_QUARANTINED = OtherEnvelopeKind.PREDICATE_QUARANTINED.value
PRODUCER_EMITTED_INVALID_EVENT = OtherEnvelopeKind.PRODUCER_EMITTED_INVALID_EVENT.value


# The full set of user-visible envelope kinds the transcript renders.
VISIBLE_KINDS: frozenset[str] = frozenset({
    USER_MESSAGE, MODEL_REPLY, PARK, SESSION_ENDED, SESSION_WARNING,
    PROMPT_FRAGMENT, TRANSCRIPT_COMPACTED, RATE_LIMITED_WAITING,
    TOOL_CALL, TOOL_RESULT,
    PRODUCER_FAILED, PREDICATE_QUARANTINED, PRODUCER_EMITTED_INVALID_EVENT,
})


# --- Bridge-owned enums -------------------------------------------------
class DriverKind(StrEnum):
    """Classification of a driver name string. The bridge dispatches on
    this enum; no `if driver == "deterministic"` string comparison lives
    in bridge/main.py."""

    DETERMINISTIC = "deterministic"
    OLLAMA = "ollama"
    CLI = "cli"
    UNKNOWN = "unknown"


class SessionCreateFailedReason(StrEnum):
    WORKSPACE_INVALID = "workspace_invalid"
    NAME_COLLISION = "name_collision"
    REGISTRY_ERROR = "registry_error"
    TIMEOUT = "timeout"


class ProbeDriverFailedReason(StrEnum):
    NOT_INSTALLED = "not_installed"
    MODEL_MISSING = "model_missing"
    TIMEOUT = "timeout"


class SessionResumeFailedReason(StrEnum):
    NOT_FOUND = "not_found"
    SESSION_ENDED = "session_ended"


class SessionEndFailedReason(StrEnum):
    NOT_FOUND = "not_found"
    SESSION_ALREADY_ENDED = "session_already_ended"
    REGISTRY_ERROR = "registry_error"


class TurnSubmitFailedReason(StrEnum):
    """Layer 2 v0.1's `TURN_SUBMIT_FAILED.reason` enum verbatim (5 values)."""

    QUEUE_FULL = "queue_full"
    SESSION_ENDED = "session_ended"
    FRESH_SESSION_REQUIRES_USER_MESSAGE = "fresh_session_requires_user_message"
    TORN_RECORD_ON_RESUME = "torn_record_on_resume"
    TIMEOUT = "timeout"


class RecordReadFailedReason(StrEnum):
    NOT_FOUND = "not_found"
    READ_ERROR = "read_error"
    REGISTRY_ERROR = "registry_error"


class DriverChangeFailedReason(StrEnum):
    DRIVER_UNAVAILABLE = "driver_unavailable"
    REGISTRY_ERROR = "registry_error"
    TIMEOUT = "timeout"


class BridgeOp(StrEnum):
    """Every op name the bridge accepts on stdin. `handle_msg` dispatches
    on the enum; unknown ops surface a typed reason."""

    PING = "ping"
    HELLO = "hello"          # only emitted, never received
    HALT = "halt"            # only emitted, never received
    REPLY = "reply"          # only emitted, never received
    READ_RECENT_WORKSPACES = "read_recent_workspaces"
    LIST_SESSIONS = "list_sessions"
    SESSION_RESUME = "session_resume"
    PROBE_DRIVER = "probe_driver"
    RECORD_READ = "record_read"
    TURN_SUBMIT = "turn_submit"
    SESSION_END = "session_end"
    SESSION_CREATE = "session_create"
    LIST_ASSAYS = "list_assays"
    TOPOLOGY_VALIDATE = "topology_validate"
    TOPOLOGY_BUILD = "topology_build"
    DRIVER_CHANGE = "driver_change"


class ReplyOp(StrEnum):
    """The two op strings that appear in reply envelopes."""

    REPLY = "reply"
    PONG = "pong"


class HaltReason(StrEnum):
    SUBSTRATE_IMPORT_FAILED = "substrate_import_failed"


# --- Shared JSON companion ----------------------------------------------
_REASONS_PATH = Path(__file__).resolve().parent.parent / "signals" / "bridge-reasons.json"
_reasons_cache: dict | None = None


def _reasons_json() -> dict:
    global _reasons_cache
    if _reasons_cache is None:
        _reasons_cache = json.loads(_REASONS_PATH.read_text())
    return _reasons_cache


# Compiled once. Pattern lives in signals/bridge-reasons.json alongside
# its TypeScript sibling; grep for the string in both trees returns
# exactly one hit each. Layer 7 constraint cite is in the JSON.
_SECRET_KEY_RX: re.Pattern[str] | None = None


def _assert_bridge_ops_match_json() -> None:
    """Import-time drift guard — BridgeOp members must equal the
    bridge_ops table in signals/bridge-reasons.json (the JSON is the
    single source read by both TS and Python). A rename in one place
    fails loud here."""
    raw = dict(_reasons_json().get("bridge_ops", {}))
    raw.pop("note", None)
    json_ops = set(raw.values())
    enum_ops = {m.value for m in BridgeOp}
    if enum_ops != json_ops:
        missing_from_enum = json_ops - enum_ops
        missing_from_json = enum_ops - json_ops
        raise RuntimeError(
            "bridge-ops drift: bridge-reasons.json § bridge_ops disagrees with "
            f"bridge/vocab.py's BridgeOp. In JSON only: {sorted(missing_from_enum)}; "
            f"in enum only: {sorted(missing_from_json)}."
        )


_assert_bridge_ops_match_json()


def strip_secrets(obj: object) -> object:
    """Strip any key at any depth matching the shared secret-key pattern
    from a nested dict; replace values with `"<stripped>"`."""
    global _SECRET_KEY_RX
    if _SECRET_KEY_RX is None:
        r = _reasons_json()
        flags = re.IGNORECASE if "i" in r["secret_key_pattern_flags"] else 0
        _SECRET_KEY_RX = re.compile(r["secret_key_pattern"], flags)
    if isinstance(obj, dict):
        return {
            k: ("<stripped>" if _SECRET_KEY_RX.search(k) else strip_secrets(v))
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [strip_secrets(v) for v in obj]
    return obj


def driver_kind(driver_name: str) -> DriverKind:
    """Classify a driver name string. Returns a DriverKind enum member —
    never a string. Callers compare against `DriverKind.OLLAMA` etc."""
    dk = _reasons_json()["driver_kinds"]
    if driver_name == dk["deterministic"]:
        return DriverKind.DETERMINISTIC
    if driver_name.startswith(dk["ollama_prefix"]):
        return DriverKind.OLLAMA
    if driver_name in dk["cli"]:
        return DriverKind.CLI
    return DriverKind.UNKNOWN


def ollama_model(driver_name: str) -> str:
    """Extract the Ollama model name from a driver string. Returns the
    part after the ollama-prefix. Empty string if the driver is not
    Ollama-shaped."""
    dk = _reasons_json()["driver_kinds"]
    prefix = dk["ollama_prefix"]
    if not driver_name.startswith(prefix):
        return ""
    return driver_name[len(prefix):]


__all__ = [
    # Substrate-owned session vocabulary
    "USER_MESSAGE", "MODEL_REPLY", "PARK", "SESSION_ENDED",
    "SESSION_END_REQUESTED", "SESSION_STARTED", "SESSION_WARNING",
    "TRANSCRIPT_COMPACTED", "PROMPT_FRAGMENT", "PROMPT_COMPOSED",
    "ParkReason", "SessionEndReason", "SessionWarningKind",
    # Envelope kinds without a central substrate export
    "OtherEnvelopeKind",
    "TOOL_CALL", "TOOL_RESULT", "RATE_LIMITED_WAITING",
    "PRODUCER_FAILED", "PREDICATE_QUARANTINED", "PRODUCER_EMITTED_INVALID_EVENT",
    "VISIBLE_KINDS",
    # Bridge-owned enums
    "DriverKind",
    "SessionCreateFailedReason",
    "ProbeDriverFailedReason",
    "SessionResumeFailedReason",
    "SessionEndFailedReason",
    "TurnSubmitFailedReason",
    "RecordReadFailedReason",
    "BridgeOp", "ReplyOp", "HaltReason",
    # Helpers
    "strip_secrets", "driver_kind", "ollama_model",
]
