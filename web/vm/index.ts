// web/vm/index.ts — barrel re-exports for the Presentation Model.
//
// Views import from `./vm` and never need to know which file holds
// which piece.

export type {
  ConnectionState,
  RecordEnvelope,
  SessionRow,
  Snapshot,
  TranscriptRow,
  WorkspaceRow,
} from "./types";
export type {
  FetchOpts,
  FetchResult,
  StreamHandlers,
  SubstrateClient,
  Unsubscribe,
} from "./client";
export { BrowserSubstrateClient } from "./client";
export type { OpenSessionRequest } from "./session_controller";
export { SessionController } from "./session_controller";
