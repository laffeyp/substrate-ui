// src/observability/envelope-kinds.ts — substrate envelope-kind names for the
// TypeScript side, sourced from signals/bridge-reasons.json §
// substrate_envelope_kinds.
//
// The Python bridge imports these strings directly from substrate.topologies.
// session.vocabulary via bridge/vocab.py. TypeScript can't import from Python
// at runtime, so the JSON mirror is the shared table. A rename in substrate
// gets propagated to both languages via that one JSON entry.

import bridgeReasons from "@/../signals/bridge-reasons.json";

interface EnvelopeKindsTable {
  substrate_envelope_kinds: Record<string, string>;
}

const table = (bridgeReasons as unknown as EnvelopeKindsTable).substrate_envelope_kinds;

export const SESSION_STARTED = table.session_started;
export const USER_MESSAGE = table.user_message;
export const MODEL_REPLY = table.model_reply;
export const PARK = table.park;
export const SESSION_ENDED = table.session_ended;
export const SESSION_END_REQUESTED = table.session_end_requested;
export const SESSION_WARNING = table.session_warning;
export const TRANSCRIPT_COMPACTED = table.transcript_compacted;
export const PROMPT_FRAGMENT = table.prompt_fragment;
export const PROMPT_COMPOSED = table.prompt_composed;
export const TOOL_CALL = table.tool_call;
export const TOOL_RESULT = table.tool_result;
export const RATE_LIMITED_WAITING = table.rate_limited_waiting;
export const PRODUCER_FAILED = table.producer_failed;
export const PREDICATE_QUARANTINED = table.predicate_quarantined;
export const PRODUCER_EMITTED_INVALID_EVENT = table.producer_emitted_invalid_event;
