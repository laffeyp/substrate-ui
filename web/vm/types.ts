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
  connection: ConnectionState;
  lastError: string | null;
}
