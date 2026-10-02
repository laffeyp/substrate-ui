// web/vm/types.ts — the Presentation Model's public shape.
//
// Every View (the classic shell today, the prototype's dc-runtime HTML next)
// reads its render input from `Snapshot` and calls the SessionController's
// actions. No DOM, no framework — just the vocabulary the two Views share.

/** One envelope on the SSE record stream, mirrored from substrate-side. */
export interface RecordEnvelope {
  seq: number;
  kind: string;
  payload: Record<string, unknown>;
  t?: number;
  schema?: string;
  producer?: { kind?: string; instance?: string } | null;
}

/** One row a View renders for the transcript. Derived from an envelope. */
export interface TranscriptRow {
  seq: number;
  kind: string;
  role: "user" | "model" | "system" | "tool" | "park" | "ended" | "warning" | "compacted";
  text: string;
  toolName?: string;
  toolOk?: boolean;
  // Phase 8 · 21a/21b: expandable tool card. A `ToolCall` row carries
  // its `call_id`, the full `args`, and the `step` from the envelope
  // payload. The matching `ToolResult` row carries the same call_id
  // plus the `output` (or `error`), so the client can pair them and
  // render one card. The row builder in `session_controller.ts`
  // populates these off `payload.args` / `payload.output`.
  callId?: string;
  /** UI sprint 101 — one tool call's identity within the session: `${callId}@${seq of its
   *  ToolCall}`. The kernel numbers call ids per turn (c0, c1, …), so a bare callId recurs
   *  across turns; pairing results, progress and open state by it mixed up calls. */
  callKey?: string;
  args?: string[];
  output?: string;
  error?: string;
  toolStep?: number;
}

/** One row a View renders in the session-rail sidebar. */
export interface SessionRow {
  sessionId: string;
  name: string;
  driver: string;
  status: "live" | "parked" | "interrupted" | "ended";
  workspacePath: string | null;
  workspaceShape: string | null;
  createdAt: number;
}

/** One row a View renders in the workspace-picker list. */
export interface WorkspaceRow {
  path: string;
  shape: string;
}

/** One row a View renders in the bundle-picker list. `/api/bundles`
 * returns these; the reveal shell's bundle picker binds to them. */
export interface BundleRow {
  name: string;
  description: string;
  slotCount: number;
}

/** One producer node inside the topology graph. */
export interface ProducerNode {
  kind: string;
  emits: string[];
  initial: boolean;
}

/** One trigger edge inside the topology graph. */
export interface TriggerEdge {
  id: string;
  onKind: string;
  starts: string;
}

/** The topology graph the reveal-view structure lens renders. */
export interface TopologyGraph {
  producers: ProducerNode[];
  triggers: TriggerEdge[];
}

/** The connection lifecycle the transcript reflects. */
export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

/** The full read-model. Every View pulls its fields from here. */
export interface Snapshot {
  sessionId: string | null;
  sessionName: string | null;
  driver: string | null;
  bundleSlug: string | null;
  workspacePath: string | null;
  workspaceShape: string | null;
  turnIndex: number;
  transcript: TranscriptRow[];
  parkReason: string | null;
  /** UI sprint 101 — a turn known to be over without a Park: the last turn request came back
   *  with an error (timeout, 500, refusal), or at attach the server said the session was not
   *  running while the record's last turn never parked. Any turn whose UserMessage was written
   *  before `atT` (epoch seconds) is over, not live. Cleared by the next turn. */
  turnFailure: { detail: string; atT: number } | null;
  endedReason: string | null;
  driverRoster: string[];
  driverDefault: string | null;
  /** Sprint 084 — grouped roster for the sectioned picker. Populated by
   *  loadDriverRoster from the server's cli / ollama_cloud / ollama_local
   *  live probes. Empty groups drop out. `driverRoster` above remains the
   *  flat legacy list for pickDriver and other consumers. */
  driverGroups: { label: string; entries: string[] }[];
  /** Sprint 087b — two-level per-CLI model tree. Server sends
   *  `cli_versions: {claude: {families:[{id,label,default_pin,pins:[{id,label}]}], default_family}, ...}`.
   *  Family row expands into its pins. A CLI without families has no
   *  version picker. Null when loadDriverRoster has not run yet. */
  cliVersions: Record<string, {
    families: { id: string; label: string; default_pin: string | null; pins: { id: string; label: string }[] }[];
    default_family: string | null;
  }> | null;
  /** Sprint 087 — the current pick per CLI. The value is either a
   *  family id or a pin id; the server resolves either shape.
   *  Absent key = default (server substitutes default_family →
   *  default_pin). pickDriverVersion writes here; openSession folds
   *  this into driver_params.driver_version. */
  driverVersion: Record<string, string>;
  liveSessions: SessionRow[];
  recentWorkspaces: WorkspaceRow[];
  bundleRoster: BundleRow[];
  connection: ConnectionState;
  lastError: string | null;
  topologyGraph: TopologyGraph | null;
  /** The raw envelope stream for the currently bound session, in seq
   * order. The transcript is a compact projection of this; the stream
   * lens renders it directly. */
  rawEnvelopes: RecordEnvelope[];
  /** Phase 8 item 8: streaming tool output keyed by call_id. Each
   * ToolProgress envelope for a call appends its `chunk` (or on eof,
   * marks the entry closed). The tool card renders `progressByCallId[cid]`
   * beneath the running row and seals when the paired ToolResult lands.
   * Empty for calls that never streamed (calculator, read_file, etc.). */
  progressByCallId: Record<string, { text: string; eof: boolean }>;
}
