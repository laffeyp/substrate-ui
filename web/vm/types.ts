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
  endedReason: string | null;
  driverRoster: string[];
  driverDefault: string | null;
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
}
