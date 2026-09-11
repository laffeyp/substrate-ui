// src/observability/reasons.ts — single-source lift for every string the
// TypeScript side uses that names a vocabulary member.
//
// Every constant here reads from a JSON file — signals/0.1.json (the locked
// vocabulary) or signals/bridge-reasons.json (bridge-owned reasons shared
// with the Python bridge). Zero string literals declared inline.
//
// Layer 2's `enum` clauses on TRANSCRIPT_PARK_RENDERED.park_reason and
// TRANSCRIPT_SESSION_ENDED_RENDERED.end_reason ratify substrate's ParkReason
// and SessionEndReason values verbatim; the shell reads them from Layer 2's
// schema rather than duplicating substrate's Python enums.

import signalsV01 from "@/../signals/0.1.json";
import bridgeReasons from "@/../signals/bridge-reasons.json";

interface Schema { properties?: Record<string, { enum?: string[] }>; }
interface SignalsV01 {
  layer_2_payload: { payload_schemas: Record<string, Schema> };
}

const schemas = (signalsV01 as unknown as SignalsV01).layer_2_payload.payload_schemas;

function enumOf(schema: string, field: string): readonly string[] {
  return (schemas[schema]?.properties?.[field]?.enum ?? []) as readonly string[];
}

// --- Substrate-owned enums (read from Layer 2's ratified enums) ---------

export const PARK_REASONS = enumOf("TRANSCRIPT_PARK_RENDERED", "park_reason") as
  readonly ["final_answer", "model_error", "interrupt"];
export type ParkReason = typeof PARK_REASONS[number];
export const ParkReason = {
  FINAL_ANSWER: "final_answer",
  MODEL_ERROR: "model_error",
  INTERRUPT: "interrupt",
} as const satisfies Record<string, ParkReason>;
export function isParkReason(x: unknown): x is ParkReason {
  return typeof x === "string" && (PARK_REASONS as readonly string[]).includes(x);
}

export const END_REASONS = enumOf("TRANSCRIPT_SESSION_ENDED_RENDERED", "end_reason") as
  readonly ["user_exit", "user_end", "timeout", "daemon_shutdown"];
export type SessionEndReason = typeof END_REASONS[number];
export const SessionEndReason = {
  USER_EXIT: "user_exit",
  USER_END: "user_end",
  TIMEOUT: "timeout",
  DAEMON_SHUTDOWN: "daemon_shutdown",
} as const satisfies Record<string, SessionEndReason>;

export const TURN_SUBMIT_FAILED_REASONS = enumOf("TURN_SUBMIT_FAILED", "reason") as
  readonly ["queue_full", "session_ended", "fresh_session_requires_user_message", "torn_record_on_resume", "timeout"];
export type TurnSubmitFailedReason = typeof TURN_SUBMIT_FAILED_REASONS[number];

// --- Shell-owned unions --------------------------------------------------

export const PANE_STATUSES = ["unbound", "parked", "running", "interrupted", "ended"] as const;
export type PaneStatus = typeof PANE_STATUSES[number];
export const PaneStatus = {
  UNBOUND: "unbound", PARKED: "parked", RUNNING: "running",
  INTERRUPTED: "interrupted", ENDED: "ended",
} as const satisfies Record<string, PaneStatus>;
export function isPaneStatus(x: unknown): x is PaneStatus {
  return typeof x === "string" && (PANE_STATUSES as readonly string[]).includes(x);
}

export const WORKSPACE_SHAPES = ["flat", "worktree", "isolate"] as const;
export type WorkspaceShape = typeof WORKSPACE_SHAPES[number];
export const WorkspaceShape = {
  FLAT: "flat", WORKTREE: "worktree", ISOLATE: "isolate",
} as const satisfies Record<string, WorkspaceShape>;
export function isWorkspaceShape(x: unknown): x is WorkspaceShape {
  return typeof x === "string" && (WORKSPACE_SHAPES as readonly string[]).includes(x);
}

export const BRIDGE_STATUSES = ["pre", "alive", "dead"] as const;
export type BridgeStatus = typeof BRIDGE_STATUSES[number];
export const BridgeStatus = {
  PRE: "pre", ALIVE: "alive", DEAD: "dead",
} as const satisfies Record<string, BridgeStatus>;

export const REVEAL_STATES = ["terminal", "reveal"] as const;
export type RevealState = typeof REVEAL_STATES[number];
export const RevealState = {
  TERMINAL: "terminal", REVEAL: "reveal",
} as const satisfies Record<string, RevealState>;

// --- Bridge-invented reason enums (from bridge-reasons.json) ------------

interface BridgeReasons {
  bridge_reasons: {
    session_create_failed: string[];
    probe_driver_failed: string[];
    session_resume_failed: string[];
    session_end_failed: string[];
    session_rename_failed: string[];
    bundle_attach_failed: string[];
    record_read_failed: string[];
    generic: string[];
  };
  secret_key_pattern: string;
  secret_key_pattern_flags: string;
  driver_kinds: { deterministic: string; ollama_prefix: string; cli: string[] };
}

const br = bridgeReasons as unknown as BridgeReasons;

export const BRIDGE_REASONS = br.bridge_reasons;

// Single-source secret-strip pattern shared with the Python bridge.
export const SECRET_KEY_PATTERN = new RegExp(br.secret_key_pattern, br.secret_key_pattern_flags);

// Driver-kind classification. Callers switch on the enum, never on the string.
export const DriverKind = {
  DETERMINISTIC: "deterministic",
  OLLAMA: "ollama",
  CLI: "cli",
  UNKNOWN: "unknown",
} as const;
export type DriverKindT = typeof DriverKind[keyof typeof DriverKind];

export function driverKind(driverName: string): DriverKindT {
  if (driverName === br.driver_kinds.deterministic) return DriverKind.DETERMINISTIC;
  if (driverName.startsWith(br.driver_kinds.ollama_prefix)) return DriverKind.OLLAMA;
  if (br.driver_kinds.cli.includes(driverName)) return DriverKind.CLI;
  return DriverKind.UNKNOWN;
}
