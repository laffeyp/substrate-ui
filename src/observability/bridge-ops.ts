// src/observability/bridge-ops.ts — the bridge op-name table on the
// TS side. Reads signals/bridge-reasons.json § bridge_ops (single
// source; bridge/vocab.py's BridgeOp mirrors the same table with an
// import-time equality check). Every bridgeRequest call site names
// its op via BridgeOp.X — no raw op strings live in the code.
//
// Added 2026-09-12 per REVIEW-2026-09-11-checkpoint extension. Layer
// of the KIT_DIARY H23 discipline: hand-maintained copies of an
// identifier drift; a JSON single source with a runtime membership
// check closes the class.

import bridgeReasons from "@/../signals/bridge-reasons.json";

interface BridgeReasonsFile {
  bridge_ops: Record<string, string>;
}

const br = bridgeReasons as unknown as BridgeReasonsFile;

// Strip the `note` key — it names the file's contract for readers, not an op.
const raw: Record<string, string> = { ...br.bridge_ops };
delete raw.note;

export const BridgeOp = raw as Readonly<{
  ping: "ping"; hello: "hello"; halt: "halt"; reply: "reply";
  read_recent_workspaces: "read_recent_workspaces";
  list_sessions: "list_sessions";
  session_resume: "session_resume";
  probe_driver: "probe_driver";
  record_read: "record_read";
  turn_submit: "turn_submit";
  session_end: "session_end";
  session_create: "session_create";
  list_assays: "list_assays";
  topology_validate: "topology_validate";
  topology_build: "topology_build";
}>;

export type BridgeOpName = keyof typeof BridgeOp;

const KEYS: readonly string[] = Object.keys(BridgeOp);

// Load-time drift guard — the TS mirror and the JSON must agree on
// key count. bridge/vocab.py runs its own equality check against the
// same JSON at Python import time. A rename in one place fails loud
// in both.
const EXPECTED_KEYS = 15;
if (KEYS.length !== EXPECTED_KEYS) {
  throw new Error(
    `bridge-ops drift: bridge-reasons.json § bridge_ops holds ${KEYS.length} entries, ` +
    `TS mirror expects ${EXPECTED_KEYS}. Update both.`,
  );
}
for (const k of KEYS) {
  if (BridgeOp[k as BridgeOpName] !== k) {
    throw new Error(`bridge-ops drift: key "${k}" does not equal value "${BridgeOp[k as BridgeOpName]}"`);
  }
}
